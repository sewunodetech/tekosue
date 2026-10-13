import type { ReactNode } from "react";
import { AbsoluteFill, Html5Audio, Img, interpolate, OffthreadVideo, Sequence, staticFile, useCurrentFrame } from "remotion";
import { Backdrop, Bob, Chip, TekoMark, Wordmark } from "../components/ui";
import data from "../pow-data.json";
import { C, display, FPS, mono, pop, ramp, sans, sec } from "../theme";

/*
 * Proof-of-work clip (~43 s) for YouTube / X: the live website, the app sending transactions,
 * the GroupVault contract on the Monad explorer (screen recording from appdemo.mp4), and real
 * transaction receipts read from Monad testnet RPC (src/pow-data.json, fetched 13 Oct 2026).
 */

const S = {
  intro: { at: 0, len: 4.2 },
  web: { at: 4.2, len: 6.3 },
  app: { at: 10.5, len: 7.0 },
  explorer: { at: 17.5, len: 8.5 },
  receipts: { at: 26.0, len: 11.0 },
  end: { at: 37.0, len: 6.0 },
};
export const POW_SECONDS = S.end.at + S.end.len;

const short = (h: string) => `${h.slice(0, 10)}…${h.slice(-6)}`;
const LABELS: Record<string, string> = {
  GroupCreated: "createGroup",
  MemberJoined: "joinGroupWithPermit",
  Deposited: "depositWithPermit",
  SpendExecuted: "spend",
  ReceiptAttached: "attachReceipt",
  Settled: "settle",
};
const TXS = data.current.filter((r, i, all) => all.findIndex((x) => x.hash === r.hash) === i);

export const ProofOfWork: React.FC = () => (
  <AbsoluteFill style={{ background: C.bg }}>
    <Sequence from={sec(S.intro.at)} durationInFrames={sec(S.intro.len)}>
      <Intro />
    </Sequence>
    <Sequence from={sec(S.web.at)} durationInFrames={sec(S.web.len)}>
      <Website />
    </Sequence>
    <Sequence from={sec(S.app.at)} durationInFrames={sec(S.app.len)}>
      <AppToChain />
    </Sequence>
    <Sequence from={sec(S.explorer.at)} durationInFrames={sec(S.explorer.len)}>
      <Explorer />
    </Sequence>
    <Sequence from={sec(S.receipts.at)} durationInFrames={sec(S.receipts.len)}>
      <Receipts />
    </Sequence>
    <Sequence from={sec(S.end.at)} durationInFrames={sec(S.end.len)}>
      <End />
    </Sequence>
    <Soundtrack />
  </AbsoluteFill>
);

/** [seconds, file, volume] */
const CUES: [number, string, number][] = [
  [S.intro.at + 0.4, "pow-vo1", 1],
  [S.web.at + 0.4, "pow-vo2", 1],
  [S.app.at + 0.4, "pow-vo3", 1],
  [S.explorer.at + 0.4, "pow-vo4", 1],
  [S.receipts.at + 0.4, "pow-vo5", 1],
  [S.end.at + 0.4, "pow-vo6", 1],
  ...[S.web.at, S.app.at, S.explorer.at, S.receipts.at, S.end.at].map((at): [number, string, number] => [at - 0.2, "whoosh", 0.3]),
  ...TXS.map((_, i): [number, string, number] => [S.receipts.at + 1.0 + i * 0.55, "pop", 0.3]),
  [S.receipts.at + 1.0 + TXS.length * 0.55, "coin", 0.35],
  [S.intro.at + 0.1, "chime", 0.35],
  [S.end.at + 0.1, "chime", 0.35],
];

const Soundtrack: React.FC = () => (
  <>
    <Html5Audio src={staticFile("audio/music.wav")} volume={0.25} />
    {CUES.map(([at, file, volume], i) => (
      <Sequence key={`${file}-${i}`} from={sec(at)} layout="none">
        <Html5Audio src={staticFile(`audio/${file}.wav`)} volume={volume} />
      </Sequence>
    ))}
  </>
);

const Shell: React.FC<{ len: number; children: ReactNode }> = ({ len, children }) => {
  const t = useCurrentFrame() / FPS;
  const o = ramp(t, 0, 0.2) * (1 - ramp(t, len - 0.2, len));
  return (
    <AbsoluteFill style={{ opacity: o }}>
      <Backdrop />
      {children}
    </AbsoluteFill>
  );
};

/** Section label at the top-left. */
const Kicker: React.FC<{ n: string; title: string; sub?: string }> = ({ n, title, sub }) => {
  const f = useCurrentFrame();
  const p = pop(f, 0.1);
  return (
    <div style={{ position: "absolute", left: 110, top: 70, opacity: p, transform: `translateX(${(1 - p) * -40}px)` }}>
      <div style={{ fontFamily: mono, fontWeight: 700, fontSize: 24, letterSpacing: "0.14em", color: C.orange }}>STEP {n}</div>
      <div style={{ fontFamily: display, fontWeight: 800, fontSize: 64, letterSpacing: "-0.03em", color: C.ink, lineHeight: 1.05 }}>{title}</div>
      {sub && <div style={{ fontFamily: sans, fontWeight: 600, fontSize: 30, color: C.inkSoft, marginTop: 6 }}>{sub}</div>}
    </div>
  );
};

const Browser: React.FC<{ url: string; style?: React.CSSProperties; children: ReactNode }> = ({ url, style, children }) => (
  <div style={{ position: "absolute", borderRadius: 22, overflow: "hidden", background: C.paper, boxShadow: C.shadow, border: `1px solid ${C.line}`, ...style }}>
    <div style={{ height: 54, display: "flex", alignItems: "center", gap: 10, padding: "0 20px", background: "#F1EFEA", borderBottom: `1px solid ${C.line}` }}>
      {["#FF6B5F", "#FFBE2F", "#2ACB42"].map((c) => (
        <div key={c} style={{ width: 14, height: 14, borderRadius: 14, background: c }} />
      ))}
      <div style={{ marginLeft: 16, flex: 1, height: 34, borderRadius: 10, background: C.paper, display: "flex", alignItems: "center", padding: "0 16px", fontFamily: sans, fontWeight: 600, fontSize: 20, color: C.inkSoft }}>
        🔒 {url}
      </div>
    </div>
    <div style={{ position: "relative", width: "100%", height: "calc(100% - 54px)", overflow: "hidden" }}>{children}</div>
  </div>
);

const Intro: React.FC = () => {
  const f = useCurrentFrame();
  const t = f / FPS;
  const mark = pop(f, 0.1, { damping: 10 });
  const title = pop(f, 0.4);
  const chips = ramp(t, 1.0, 1.4);
  return (
    <Shell len={S.intro.len}>
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 24, transform: `scale(${mark})` }}>
          <Bob amp={6} sway={3}>
            <TekoMark size={150} />
          </Bob>
          <Wordmark size={130} />
        </div>
        <div style={{ marginTop: 20, opacity: title, transform: `translateY(${(1 - title) * 30}px)`, fontFamily: display, fontWeight: 800, fontSize: 96, letterSpacing: "-0.035em", color: C.ink }}>
          Proof of work on <span style={{ color: C.monad }}>Monad</span>
        </div>
        <div style={{ marginTop: 26, display: "flex", gap: 14, opacity: chips }}>
          <Chip tone="monad">◆ Monad testnet · chain {data.chainId}</Chip>
          <Chip tone="primary">GroupVault {short(data.vault)}</Chip>
        </div>
      </AbsoluteFill>
    </Shell>
  );
};

const Website: React.FC = () => {
  const f = useCurrentFrame();
  const t = f / FPS;
  const p = pop(f, 0.15, { damping: 15 });
  const swap = ramp(t, 3.0, 3.5);
  const zoom = interpolate(t, [0, S.web.len], [1, 1.06]);
  return (
    <Shell len={S.web.len}>
      <Kicker n="1" title="The live website" sub="www.tekosue.xyz" />
      <Browser url={swap < 0.5 ? "www.tekosue.xyz" : "www.tekosue.xyz/get-app"} style={{ left: 330, top: 250, width: 1260, height: 762, opacity: p, transform: `translateY(${(1 - p) * 80}px)` }}>
        <Img src={staticFile("pow/web-home.png")} style={{ position: "absolute", width: "100%", opacity: 1 - swap, transform: `scale(${zoom})`, transformOrigin: "50% 0%" }} />
        <Img src={staticFile("pow/web-getapp.png")} style={{ position: "absolute", width: "100%", opacity: swap, transform: `scale(${zoom})`, transformOrigin: "30% 30%" }} />
      </Browser>
    </Shell>
  );
};

const AppToChain: React.FC = () => {
  const f = useCurrentFrame();
  const t = f / FPS;
  const p = pop(f, 0.15, { damping: 15 });
  const tag = pop(f, 3.2);
  const scale = 0.84;
  return (
    <Shell len={S.app.len}>
      <Kicker n="2" title="The app sends real transactions" sub="Pay from the pot → spend() on GroupVault" />
      <div
        style={{
          position: "absolute",
          left: 220,
          top: 270,
          width: 880 * scale,
          height: 790 * scale,
          borderRadius: 40,
          overflow: "hidden",
          background: "#FAF8F3",
          boxShadow: C.shadow,
          border: `1px solid ${C.line}`,
          opacity: p,
          transform: `translateY(${(1 - p) * 100}px)`,
        }}
      >
        <OffthreadVideo
          src={staticFile("footage/appdemo.mp4")}
          trimBefore={sec(109)}
          muted
          style={{ position: "absolute", width: 1920 * scale, height: 1080 * scale, left: -900 * scale, top: -40 * scale }}
        />
      </div>
      {/* tap → transaction */}
      <div style={{ position: "absolute", left: 1000, top: 560, width: 180, height: 6, borderRadius: 6, background: C.line, overflow: "hidden" }}>
        <div style={{ width: `${ramp(t, 2.4, 3.2) * 100}%`, height: "100%", background: C.monad }} />
      </div>
      <div style={{ position: "absolute", left: 1210, top: 420, opacity: tag, transform: `scale(${0.85 + tag * 0.15})`, transformOrigin: "left center" }}>
        <div style={{ background: "#14121F", borderRadius: 26, padding: "28px 34px", boxShadow: C.shadow, width: 560 }}>
          <div style={{ fontFamily: mono, fontWeight: 700, fontSize: 22, color: "#A99CFF" }}>MONAD TESTNET · TX</div>
          <div style={{ fontFamily: mono, fontWeight: 700, fontSize: 36, color: "#fff", marginTop: 10 }}>GroupVault.spend()</div>
          <div style={{ fontFamily: mono, fontWeight: 500, fontSize: 22, color: "#C9C4E8", marginTop: 12 }}>to {short(data.vault)}</div>
          <div style={{ marginTop: 18, display: "inline-flex", alignItems: "center", gap: 10, padding: "8px 16px", borderRadius: 999, background: "#173B2C", color: "#5BE3A4", fontFamily: sans, fontWeight: 700, fontSize: 22 }}>
            ✓ Success · final in seconds
          </div>
        </div>
      </div>
    </Shell>
  );
};

const Explorer: React.FC = () => {
  const f = useCurrentFrame();
  const t = f / FPS;
  const p = pop(f, 0.15, { damping: 15 });
  // crop of the explorer window inside the recording (x 903–1797, y 304–808 at 1080p)
  const crop = { x: 903, y: 304, w: 894, h: 504 };
  const width = 1300;
  const scale = width / crop.w;
  const pan = interpolate(t, [0, S.explorer.len], [1, 1.04]);
  return (
    <Shell len={S.explorer.len}>
      <Kicker n="3" title="The contract on the Monad explorer" sub={`testnet.monadvision.com/address/${data.vault}`} />
      <Browser
        url={`testnet.monadvision.com/address/${short(data.vault)}`}
        style={{ left: (1920 - width) / 2, top: 240, width, height: crop.h * scale + 54, opacity: p, transform: `translateY(${(1 - p) * 80}px)` }}
      >
        <div style={{ position: "absolute", inset: 0, background: "#0E0D14", transform: `scale(${pan})` }}>
          <OffthreadVideo
            src={staticFile("footage/appdemo.mp4")}
            trimBefore={sec(150.6)}
            muted
            style={{ position: "absolute", width: 1920 * scale, height: 1080 * scale, left: -crop.x * scale, top: -crop.y * scale }}
          />
        </div>
      </Browser>
    </Shell>
  );
};

const Receipts: React.FC = () => {
  const f = useCurrentFrame();
  const t = f / FPS;
  const head = ramp(t, 0.2, 0.6);
  const done = pop(f, 1.0 + TXS.length * 0.55);
  return (
    <Shell len={S.receipts.len}>
      <Kicker n="4" title="Real transactions, read from Monad" sub={`eth_getTransactionReceipt · testnet-rpc.monad.xyz · ${data.fetchedAt}`} />
      <div style={{ position: "absolute", left: 110, right: 110, top: 290, background: "#14121F", borderRadius: 28, padding: "26px 34px", boxShadow: C.shadow }}>
        <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1.3fr 2fr 1fr 1.1fr", gap: 18, fontFamily: mono, fontWeight: 700, fontSize: 20, color: "#8F87C0", letterSpacing: "0.08em", opacity: head, paddingBottom: 14, borderBottom: "1px solid #2B2840" }}>
          <div>STEP</div>
          <div>METHOD</div>
          <div>TX HASH</div>
          <div>BLOCK</div>
          <div>STATUS</div>
        </div>
        {TXS.map((r, i) => {
          const p = pop(f, 1.0 + i * 0.55);
          return (
            <div
              key={r.hash}
              style={{
                display: "grid",
                gridTemplateColumns: "1.5fr 1.3fr 2fr 1fr 1.1fr",
                gap: 18,
                alignItems: "center",
                padding: "16px 0",
                borderBottom: i < TXS.length - 1 ? "1px solid #24213A" : "none",
                opacity: p,
                transform: `translateX(${(1 - p) * 40}px)`,
              }}
            >
              <div style={{ fontFamily: sans, fontWeight: 700, fontSize: 28, color: "#fff" }}>{r.label}</div>
              <div style={{ fontFamily: mono, fontWeight: 700, fontSize: 24, color: "#C9BFFF" }}>{LABELS[r.event] ?? r.event}</div>
              <div style={{ fontFamily: mono, fontWeight: 500, fontSize: 24, color: "#D7D3EC" }}>{short(r.hash)}</div>
              <div style={{ fontFamily: mono, fontWeight: 500, fontSize: 24, color: "#D7D3EC" }}>{r.block.toLocaleString("en-US")}</div>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 8, fontFamily: sans, fontWeight: 800, fontSize: 24, color: "#5BE3A4" }}>✓ {r.status}</div>
            </div>
          );
        })}
      </div>
      <div style={{ position: "absolute", left: 110, bottom: 60, opacity: done, transform: `translateY(${(1 - done) * 20}px)` }}>
        <Chip tone="green" style={{ fontSize: 28 }}>
          ✓ {TXS.length} of {TXS.length} succeeded on GroupVault {short(data.vault)}
        </Chip>
      </div>
    </Shell>
  );
};

const End: React.FC = () => {
  const f = useCurrentFrame();
  const t = f / FPS;
  const mark = pop(f, 0.1, { damping: 10 });
  const rows = ramp(t, 0.6, 1.1);
  const line = (k: string, v: string) => (
    <div style={{ display: "flex", gap: 20, fontSize: 32, alignItems: "baseline" }}>
      <div style={{ width: 230, fontFamily: sans, fontWeight: 700, color: C.inkSoft }}>{k}</div>
      <div style={{ fontFamily: mono, fontWeight: 700, color: C.ink }}>{v}</div>
    </div>
  );
  return (
    <Shell len={S.end.len}>
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 22, transform: `scale(${mark})` }}>
          <Bob amp={6} sway={3}>
            <TekoMark size={130} />
          </Bob>
          <div style={{ fontFamily: display, fontWeight: 800, fontSize: 84, letterSpacing: "-0.035em", color: C.ink }}>Verifiable by anyone.</div>
        </div>
        <div style={{ marginTop: 44, display: "flex", flexDirection: "column", gap: 18, opacity: rows, transform: `translateY(${(1 - rows) * 20}px)` }}>
          {line("Contract", data.vault)}
          {line("Network", `Monad testnet · chain ${data.chainId}`)}
          {line("Website", "www.tekosue.xyz")}
          {line("Code", "github.com/sewunodetech/tekosue")}
        </div>
      </AbsoluteFill>
    </Shell>
  );
};
