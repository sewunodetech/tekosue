import type { AppDeps } from "../../context";
import { formatAusd } from "../../lib/money";

/**
 * Event → push notification mapping. Copy is English like the app, and never uses crypto
 * terms (no wallet, gas, token, hash, transaction — NFR-07). Each plan links into the app
 * (`/trip/...` routes in apps/mobile). Fed by the Envio poller (ADR 0014) or the optional
 * Alchemy webhook; both go through `handleGroupEvent`.
 */

export interface DecodedGroupEvent {
  eventName: string;
  args: Record<string, unknown>;
}

export interface NotifyPlan {
  groupId: bigint;
  title: string;
  tag: string;
  url: string;
  /** Lowercase address → body. Bodies can differ per recipient (shares, names). */
  bodies: Map<string, string>;
}

const SOMEONE = "Someone";

function big(value: unknown, fallback = 0n): bigint {
  if (typeof value === "bigint") return value;
  if (typeof value === "number") return BigInt(Math.trunc(value));
  if (typeof value === "string" && value !== "") return BigInt(value);
  return fallback;
}

function addr(value: unknown): string {
  return String(value ?? "").toLowerCase();
}

function addresses(value: unknown): string[] {
  return Array.isArray(value) ? value.map(addr).filter(Boolean) : [];
}

/** Trip name as the app shows it: the creator's name from metadata, else the on-chain name. */
export async function resolveTripName(ctx: AppDeps, groupId: bigint): Promise<string> {
  try {
    const meta = await ctx.repos.groupMeta.get(Number(groupId));
    if (meta?.name) return meta.name;
  } catch {
    // fall through to the chain
  }
  try {
    const group = await ctx.chain.getGroup(groupId);
    return group.name || "Your trip";
  } catch {
    return "Your trip";
  }
}

export async function loadNames(ctx: AppDeps, members: string[]): Promise<Map<string, string>> {
  if (members.length === 0) return new Map();
  try {
    const rows = await ctx.repos.profiles.list([...new Set(members)]);
    return new Map(rows.map((row) => [row.address, row.displayName]));
  } catch {
    return new Map();
  }
}

export function displayName(names: Map<string, string>, address: string): string {
  return names.get(address) ?? SOMEONE;
}

/** Every member of the trip except `who` (lowercase). */
async function otherMembers(ctx: AppDeps, groupId: bigint, who: string): Promise<string[]> {
  return addresses(await ctx.chain.membersOf(groupId)).filter((member) => member !== who);
}

/** Build the per-recipient bodies for one event. Returns null when the event does not notify. */
export async function buildNotifyPlan(ctx: AppDeps, event: DecodedGroupEvent): Promise<NotifyPlan | null> {
  const groupId = big(event.args.groupId);
  const spendId = big(event.args.spendId, -1n);
  const trip = await resolveTripName(ctx, groupId);
  const bodies = new Map<string, string>();
  const tagParts = [event.eventName, groupId.toString()];
  const tripUrl = `/trip/${groupId}`;
  let url = tripUrl;

  switch (event.eventName) {
    case "SpendRequested": {
      // Everyone else hears about it; the people sharing the cost are asked to approve (any member may).
      const spender = addr(event.args.spender);
      const amount = big(event.args.amount);
      const others = await otherMembers(ctx, groupId, spender);
      const sharing = new Set(addresses(event.args.participants).filter((member) => member !== spender));
      const names = await loadNames(ctx, [spender]);
      const who = displayName(names, spender);
      for (const member of others) {
        bodies.set(
          member,
          sharing.size === 0 || sharing.has(member)
            ? `${who} wants to pay ${formatAusd(amount)} from the pot. Tap to approve.`
            : `${who} asked to pay ${formatAusd(amount)} from the pot. Waiting for a yes.`,
        );
      }
      if (spendId >= 0n) {
        tagParts.push(spendId.toString());
        url = `${tripUrl}/spend/${spendId}/approve`;
      }
      break;
    }

    case "SpendExecuted": {
      const spender = addr(event.args.spender);
      const amount = big(event.args.amount);
      const participants = addresses(event.args.participants);
      const shares = Array.isArray(event.args.shares) ? event.args.shares : [];
      const names = await loadNames(ctx, [spender]);
      const who = displayName(names, spender);
      for (const member of await otherMembers(ctx, groupId, spender)) {
        const index = participants.indexOf(member);
        const share = index >= 0 && participants.length === shares.length ? big(shares[index]) : null;
        bodies.set(
          member,
          share === null
            ? `${who} paid ${formatAusd(amount)} from the pot.`
            : `${who} paid ${formatAusd(amount)} from the pot. Your share is ${formatAusd(share)}.`,
        );
      }
      if (spendId >= 0n) {
        tagParts.push(spendId.toString());
        url = `${tripUrl}/spend/${spendId}`;
      }
      break;
    }

    case "SpendRejected": {
      const spend = await ctx.chain.getSpend(groupId, big(event.args.spendId));
      const spender = addr(spend.spender);
      const by = addr(event.args.by);
      const names = await loadNames(ctx, [spender, by]);
      for (const member of await otherMembers(ctx, groupId, by)) {
        bodies.set(
          member,
          member === spender
            ? `Your payment of ${formatAusd(spend.amount)} was declined.`
            : `${displayName(names, by)} declined ${displayName(names, spender)}'s payment of ${formatAusd(spend.amount)}.`,
        );
      }
      tagParts.push(big(event.args.spendId).toString());
      break;
    }

    case "ShareDisputed": {
      const spend = await ctx.chain.getSpend(groupId, big(event.args.spendId));
      const spender = addr(spend.spender);
      const participant = addr(event.args.participant);
      const names = await loadNames(ctx, [participant, spender]);
      const share = formatAusd(big(event.args.share));
      for (const member of await otherMembers(ctx, groupId, participant)) {
        bodies.set(
          member,
          member === spender
            ? `${displayName(names, participant)} wasn't part of a payment, so their ${share} moved to you.`
            : `${displayName(names, participant)} wasn't part of ${displayName(names, spender)}'s payment, so their ${share} moved to ${displayName(names, spender)}.`,
        );
      }
      tagParts.push(big(event.args.spendId).toString());
      url = `${tripUrl}/spend/${big(event.args.spendId)}`;
      break;
    }

    case "Deposited": {
      const member = addr(event.args.member);
      const names = await loadNames(ctx, [member]);
      const body = `${displayName(names, member)} put ${formatAusd(big(event.args.amount))} in the pot.`;
      for (const other of await otherMembers(ctx, groupId, member)) bodies.set(other, body);
      tagParts.push(member);
      break;
    }

    case "MemberJoined": {
      const member = addr(event.args.member);
      const names = await loadNames(ctx, [member]);
      const body = `${displayName(names, member)} joined the trip.`;
      for (const other of await otherMembers(ctx, groupId, member)) bodies.set(other, body);
      tagParts.push(member);
      url = `${tripUrl}/members`;
      break;
    }

    case "ReceiptAttached": {
      const by = addr(event.args.by);
      const names = await loadNames(ctx, [by]);
      const body = `${displayName(names, by)} added a receipt to a payment.`;
      for (const other of await otherMembers(ctx, groupId, by)) bodies.set(other, body);
      if (spendId >= 0n) {
        tagParts.push(spendId.toString());
        url = `${tripUrl}/spend/${spendId}`;
      }
      break;
    }

    case "Settled": {
      const members = addresses(await ctx.chain.membersOf(groupId));
      for (const member of members) bodies.set(member, "Settle-up is done. See how it evened out.");
      url = `${tripUrl}/settled`;
      break;
    }

    case "Pulled": {
      const member = addr(event.args.member);
      const amount = big(event.args.amount);
      const remaining = big(event.args.remainingDebt);
      bodies.set(
        member,
        remaining > 0n
          ? `Your safety net covered ${formatAusd(amount)}. You still owe ${formatAusd(remaining)}. Pay it to start your next trip.`
          : `Your safety net covered the ${formatAusd(amount)} you were short. You're all square.`,
      );
      tagParts.push(member);
      url = `${tripUrl}/invoice`;
      break;
    }

    case "Refunded": {
      const member = addr(event.args.member);
      const amount = big(event.args.amount);
      if (amount === 0n) break; // only the credit bookkeeping changed
      bodies.set(member, `You got ${formatAusd(amount)} back from the pot.`);
      tagParts.push(member);
      url = `${tripUrl}/invoice`;
      break;
    }

    default:
      return null;
  }

  if (bodies.size === 0) return null;

  return { groupId, title: trip, url, tag: tagParts.join(":"), bodies };
}

/**
 * "Nudge" from S2 Waiting: the spender reminds every other member that a payment still waits for a
 * yes. Same copy rules as the event plans (no crypto words); links straight to 10 Approval.
 */
export async function buildNudgePlan(
  ctx: AppDeps,
  groupId: bigint,
  spendId: bigint,
  spender: string,
  amount: bigint,
): Promise<NotifyPlan> {
  const from = addr(spender);
  const trip = await resolveTripName(ctx, groupId);
  const others = addresses(await ctx.chain.membersOf(groupId)).filter((member) => member !== from);
  // Ask the people sharing this payment; if the spender is the only one sharing it, ask everyone else.
  const shares = await ctx.envio.spendShares(groupId.toString(), spendId).catch(() => []);
  const sharing = others.filter((member) => shares.some((s) => s.participant.toLowerCase() === member));
  const recipients = sharing.length > 0 ? sharing : others;
  const names = await loadNames(ctx, [from]);
  const body = `${displayName(names, from)} is still waiting for a yes on ${formatAusd(amount)} from the pot. Tap to approve.`;
  const bodies = new Map(recipients.map((member) => [member, body] as const));
  return {
    groupId,
    title: trip,
    url: `/trip/${groupId}/spend/${spendId}/approve`,
    tag: ["Nudge", groupId.toString(), spendId.toString()].join(":"),
    bodies,
  };
}

/**
 * Deliver a plan to every recipient that has registered an Expo push token.
 * Never throws: one broken token must not stop the rest.
 */
export async function sendPlan(ctx: AppDeps, plan: NotifyPlan): Promise<number> {
  if (!ctx.push) return 0;

  const recipients = [...plan.bodies.keys()];
  if (recipients.length === 0) return 0;

  let subs;
  try {
    subs = await ctx.repos.pushSubs.listByAddresses(recipients);
  } catch (error) {
    ctx.logger.error({ err: error }, "could not load push tokens");
    return 0;
  }

  const messages = subs.flatMap((sub) => {
    const body = plan.bodies.get(sub.address);
    return body
      ? [{ to: sub.expoPushToken, title: plan.title, body, data: { url: plan.url, tag: plan.tag } }]
      : [];
  });
  const results = await ctx.push.sendMany(messages);

  let sent = 0;
  for (const [index, result] of results.entries()) {
    if (result === "sent") sent += 1;
    if (result === "gone") {
      const token = messages[index]!.to;
      await ctx.repos.pushSubs.deleteToken(token).catch((error: unknown) => {
        ctx.logger.warn({ err: error }, "could not remove dead push token");
      });
      ctx.logger.info("removed dead push token");
    }
  }

  ctx.logger.info(
    { groupId: plan.groupId.toString(), tag: plan.tag, recipients: recipients.length, sent },
    "push notifications dispatched",
  );
  return sent;
}
