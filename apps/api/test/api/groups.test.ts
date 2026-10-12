import request from "supertest";
import { describe, expect, it } from "vitest";
import { computeNoteHash } from "@tekosue/shared";
import type { Address } from "viem";
import {
  authHeader,
  createFakeChain,
  defaultGroup,
  makeApp,
  OTHER_ADDRESS,
  TEST_ADDRESS,
  THIRD_ADDRESS,
} from "../helpers/fakes";

const note = { title: "Dinner at Jimbaran", category: "food", note: "seafood", receiptHash: null };

function appWithSpend(noteHash = computeNoteHash(note)) {
  const chain = createFakeChain({
    async getGroup() {
      return defaultGroup();
    },
    async getSpend() {
      return {
        spender: TEST_ADDRESS as Address,
        to: OTHER_ADDRESS as Address,
        amount: 30_000_000n,
        executedAt: 0,
        status: 1,
        noteHash,
      };
    },
  });
  return makeApp({ chain });
}

describe("group meta", () => {
  it("lets only the on-chain creator write it", async () => {
    const { app } = appWithSpend();

    const notCreator = await request(app)
      .put("/api/groups/7/meta")
      .set(await authHeader(OTHER_ADDRESS))
      .send({ name: "Bali" });
    expect(notCreator.status).toBe(403);

    const ok = await request(app)
      .put("/api/groups/7/meta")
      .set(await authHeader(TEST_ADDRESS))
      .send({ name: " Bali " });
    expect(ok.status).toBe(201);

    const same = await request(app)
      .put("/api/groups/7/meta")
      .set(await authHeader(TEST_ADDRESS))
      .send({ name: "Bali" });
    expect(same.status).toBe(200);

    const changed = await request(app)
      .put("/api/groups/7/meta")
      .set(await authHeader(TEST_ADDRESS))
      .send({ name: "Lombok" });
    expect(changed.status).toBe(409);

    const pub = await request(app).get("/api/groups/7/meta");
    expect(pub.body).toMatchObject({ groupId: "7", name: "Bali" });
  });
});

describe("spend meta", () => {
  it("accepts details whose computeNoteHash equals the on-chain noteHash", async () => {
    const { app } = appWithSpend();
    const headers = await authHeader(TEST_ADDRESS);

    const put = await request(app).put("/api/groups/7/spends/3/meta").set(headers).send(note);
    expect(put.status).toBe(201);
    expect(put.body).toMatchObject({ spendId: "3", title: note.title, noteHash: computeNoteHash(note) });

    const again = await request(app).put("/api/groups/7/spends/3/meta").set(headers).send(note);
    expect(again.status).toBe(200);

    const list = await request(app).get("/api/groups/7/spends/meta").set(await authHeader(OTHER_ADDRESS));
    expect(list.body.spends).toHaveLength(1);
  });

  it("rejects details that do not match the on-chain noteHash", async () => {
    const { app } = appWithSpend();
    const res = await request(app)
      .put("/api/groups/7/spends/3/meta")
      .set(await authHeader(TEST_ADDRESS))
      .send({ ...note, title: "Something else" });
    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe("NOTE_HASH_MISMATCH");
  });

  it("rejects writes from members who did not pay, and from non-members", async () => {
    const { app } = appWithSpend();
    const other = await request(app)
      .put("/api/groups/7/spends/3/meta")
      .set(await authHeader(OTHER_ADDRESS))
      .send(note);
    expect(other.status).toBe(403);

    const outsider = await request(app)
      .get("/api/groups/7/spends/meta")
      .set(await authHeader(THIRD_ADDRESS));
    expect(outsider.status).toBe(403);
  });
});

describe("spend reviews", () => {
  it("keeps the first seen time and the reviewer's note", async () => {
    const { app } = appWithSpend();
    const headers = await authHeader(OTHER_ADDRESS);

    const seen = await request(app).put("/api/groups/7/spends/3/review").set(headers).send({ seen: true });
    expect(seen.status).toBe(200);
    const firstSeen = seen.body.seenAt;
    expect(firstSeen).toBeTruthy();

    const noted = await request(app)
      .put("/api/groups/7/spends/3/review")
      .set(headers)
      .send({ seen: true, decisionNote: "Too expensive" });
    expect(noted.body).toMatchObject({ seenAt: firstSeen, decisionNote: "Too expensive" });

    const list = await request(app).get("/api/groups/7/spends/reviews").set(headers);
    expect(list.body.reviews).toHaveLength(1);
  });
});

describe("nudge", () => {
  const TOKEN_SPENDER = "ExponentPushToken[spenderspenderspender1]";
  const TOKEN_FRIEND = "ExponentPushToken[friendfriendfriendfr1]";

  function appWithPendingSpend(status = 0) {
    const chain = createFakeChain({
      async getSpend() {
        return {
          spender: TEST_ADDRESS as Address,
          to: OTHER_ADDRESS as Address,
          amount: 90_000_000n,
          executedAt: 0,
          status,
          noteHash: computeNoteHash(note),
        };
      },
    });
    return makeApp({ chain });
  }

  async function subscribeBoth(repos: ReturnType<typeof makeApp>["repos"]) {
    await repos.pushSubs.upsert({ address: TEST_ADDRESS, expoPushToken: TOKEN_SPENDER, platform: "android" });
    await repos.pushSubs.upsert({ address: OTHER_ADDRESS, expoPushToken: TOKEN_FRIEND, platform: "android" });
    await repos.profiles.upsert({ address: TEST_ADDRESS, displayName: "Kyy", countryCode: "ID", city: null, avatarColor: null });
  }

  it("pushes to the other members, never to the person who asked", async () => {
    const { app, repos, push } = appWithPendingSpend();
    await subscribeBoth(repos);

    const res = await request(app).post("/api/groups/7/spends/2/nudge").set(await authHeader(TEST_ADDRESS));
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ recipients: 1, sent: 1 });
    expect(push.sent.map((m) => m.to)).toEqual([TOKEN_FRIEND]);
    expect(push.sent[0]).toMatchObject({
      body: "Kyy is still waiting for a yes on $90.00 from the pot. Tap to approve.",
      data: { url: "/trip/7/spend/2/approve" },
    });
  });

  it("nudges only the people sharing the payment", async () => {
    const { app, repos, push, chain, envio } = appWithPendingSpend();
    chain.membersOf = async () => [TEST_ADDRESS, OTHER_ADDRESS, THIRD_ADDRESS] as never;
    envio.shares.set("7-2", [
      { participant: TEST_ADDRESS, share: 45_000_000n },
      { participant: THIRD_ADDRESS, share: 45_000_000n },
    ]);
    await subscribeBoth(repos);
    await repos.pushSubs.upsert({ address: THIRD_ADDRESS, expoPushToken: "ExponentPushToken[thirdthirdthirdthird1]", platform: "android" });

    const res = await request(app).post("/api/groups/7/spends/2/nudge").set(await authHeader(TEST_ADDRESS));
    expect(res.body).toEqual({ recipients: 1, sent: 1 });
    expect(push.sent.map((m) => m.to)).toEqual(["ExponentPushToken[thirdthirdthirdthird1]"]);
  });

  it("only lets the spender nudge, and only while the payment is pending", async () => {
    const pending = appWithPendingSpend();
    const notSpender = await request(pending.app)
      .post("/api/groups/7/spends/2/nudge")
      .set(await authHeader(OTHER_ADDRESS));
    expect(notSpender.status).toBe(403);

    const executed = appWithPendingSpend(1);
    const done = await request(executed.app).post("/api/groups/7/spends/2/nudge").set(await authHeader(TEST_ADDRESS));
    expect(done.status).toBe(409);
    expect(executed.push.sent).toHaveLength(0);
  });

  it("limits nudges per payment", async () => {
    const { app } = appWithPendingSpend();
    const headers = await authHeader(TEST_ADDRESS);
    for (let i = 0; i < 3; i++) {
      expect((await request(app).post("/api/groups/7/spends/2/nudge").set(headers)).status).toBe(200);
    }
    expect((await request(app).post("/api/groups/7/spends/2/nudge").set(headers)).status).toBe(429);
  });
});
