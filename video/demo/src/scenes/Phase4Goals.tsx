import type { ReactNode } from "react";
import { AbsoluteFill, Html5Audio, OffthreadVideo, Sequence, staticFile, useCurrentFrame } from "remotion";
import { Backdrop, Bob, Captions, Chip, TekoMark } from "../components/ui";
import { CAPTIONS, CLIPS } from "../config";
import { C, display, FPS, hand, mono, pop, sans, sec, windowed } from "../theme";
import { StepTracker } from "./StepTracker";

/*
 * Goal windows (Phase 4 clip seconds, from word timestamps):
 *  0.0  "We built Tekosue around four goals"
 *  3.2  One   — invite link → trip member, just a passkey     (passkey @11.4)
 * 12.1  Two   — spend from the pot, record who it was for     (who @18.9)
 * 20.9  Three — every dollar in AUSD, final within seconds    (final @24.5)
 * 26.2  Four  — settle on the end date, matches math by hand  (matches @30.5)
 *
 * NFR-07: no "seed phrase" / "gas token" anywhere on screen.
 */

const GOALS = [
  { a: 3.0, b: 12.0, label: "Join in one step" },
  { a: 12.0, b: 20.8, label: "Spend freely" },
  { a: 20.8, b: 25.95, label: "Dollars in seconds" },
  { a: 25.95, b: 99, label: "Settle on its own" },
];

const TEXT_X = 150;
const TEXT_W = 900;
/** Real app screen recording (TekosoeDemo.mp4), cropped to the phone(s) and muted — narration comes from phase 4. */
const STAGE = { x: 1080, y: 160, w: 740, scale: 0.84, cropX: 900, cropY: 40, cropW: 880, cropH: 885 };
/** Source start (seconds in the app recording) for each goal's window. */
const APP_SRC = [81.0, 105.5, 119.0, 137.3];

export const Phase4Goals: React.FC<{ captions: boolean }> = ({ captions }) => {
  const { src, from } = CLIPS.p4;
  const f = useCurrentFrame();
  const t = f / FPS + from;
  const active = GOALS.findIndex((g) => t >= g.a && t < g.b);
  const reveal = GOALS.map((_, i) => pop(f, 1.3 + i * 0.28));
  const phoneIn = pop(f, 0.4, { damping: 16 });

  return (
    <AbsoluteFill>
      <Backdrop />
      {/* Narration only — the speaker is not shown in this phase. */}
      <Html5Audio src={staticFile(src)} trimBefore={sec(from)} />

      <StepTracker x={TEXT_X} y={72} width={1620} labels={GOALS.map((g) => g.label)} active={active} reveal={reveal} />

      {/* Intro copy */}
      <GoalText t={t} a={0} b={3.0} n="" title="Four goals" sub="What we built Tekosue to do." />

      <GoalText t={t} a={GOALS[0].a} b={GOALS[0].b} n="01" title="Join in one step" sub="From invite link to trip member in a single flow.">
        <Bullet f={f} at={6.9}>One flow, start to finish</Bullet>
        <Bullet f={f} at={11.3}>Just a passkey</Bullet>
      </GoalText>

      <GoalText t={t} a={GOALS[1].a} b={GOALS[1].b} n="02" title="Spend freely" sub="Any member pays from the pot while it has money.">
        <Bullet f={f} at={14.7}>No fronting, no IOUs</Bullet>
        <Bullet f={f} at={18.9}>Only record who it was for</Bullet>
      </GoalText>

      <GoalText t={t} a={GOALS[2].a} b={GOALS[2].b} n="03" title="Dollars in seconds" sub="Every dollar moves in AUSD.">
        <Bullet f={f} at={23.2}>Same currency for everyone</Bullet>
        <Bullet f={f} at={24.5}>Final within seconds</Bullet>
      </GoalText>

      <GoalText t={t} a={GOALS[3].a} b={GOALS[3].b} n="04" title="Settle on its own" sub="On the end date, the pot settles up by itself.">
        <HandNote f={f} t={t} />
      </GoalText>

      <Mascot f={f} t={t} />

      <AppStage f={f} t={t} phoneIn={phoneIn} />

      {captions && <Captions cues={CAPTIONS.p4} offset={from} />}
    </AbsoluteFill>
  );
};

const AppStage: React.FC<{ f: number; t: number; phoneIn: number }> = ({ f, t, phoneIn }) => {
  const { scale, cropX, cropY, cropW, cropH } = STAGE;
  const w = cropW * scale;
  const h = cropH * scale;
  return (
    <div
      style={{
        position: "absolute",
        left: STAGE.x,
        top: STAGE.y,
        width: w,
        height: h,
        borderRadius: 44,
        overflow: "hidden",
        background: "#FAF8F3",
        boxShadow: C.shadow,
        border: `1px solid ${C.line}`,
        opacity: phoneIn,
        transform: `translateY(${(1 - phoneIn) * 120 + Math.sin(f / 30) * 6}px) rotate(${(1 - phoneIn) * 3}deg)`,
      }}
    >
      {GOALS.map((g, i) => {
        const end = Math.min(g.b, 32.8);
        const o = windowed(t, g.a, end, 0.4);
        const from = Math.max(0, g.a - 0.3);
        const dur = end + 0.3 - from;
        return (
          <Sequence key={g.label} from={sec(from)} durationInFrames={sec(dur)} layout="none">
            <OffthreadVideo
              src={staticFile("footage/appdemo.mp4")}
              trimBefore={sec(APP_SRC[i] - (g.a - from))}
              muted
              style={{
                position: "absolute",
                width: 1920 * scale,
                height: 1080 * scale,
                left: -cropX * scale,
                top: -cropY * scale,
                opacity: o,
              }}
            />
          </Sequence>
        );
      })}
    </div>
  );
};

/** Teko waves in at the bottom-left and hops each time the goal changes. */
const Mascot: React.FC<{ f: number; t: number }> = ({ f, t }) => {
  const p = pop(f, 1.0, { damping: 11 }) * (t > 29.9 ? 1 - Math.min(1, (t - 29.9) / 0.4) : 1);
  const hop = GOALS.reduce((m, g) => {
    const d = t - g.a;
    return d >= 0 && d < 0.7 ? Math.max(m, Math.sin((d / 0.7) * Math.PI)) : m;
  }, 0);
  return (
    <div style={{ position: "absolute", left: 150, top: 690, opacity: p, transform: `scale(${0.4 + p * 0.6}) translateY(${-hop * 36}px)`, transformOrigin: "50% 100%" }}>
      <Bob amp={7} sway={3}>
        <TekoMark size={230} />
      </Bob>
    </div>
  );
};

/* ───────────────────────── left column ───────────────────────── */

const GoalText: React.FC<{ t: number; a: number; b: number; n: string; title: string; sub: string; children?: ReactNode }> = ({
  t,
  a,
  b,
  n,
  title,
  sub,
  children,
}) => {
  const o = windowed(t, a + 0.15, b, 0.35);
  if (o <= 0) return null;
  return (
    <div style={{ position: "absolute", left: TEXT_X, top: 230, width: TEXT_W, opacity: o, transform: `translateX(${(1 - o) * -60}px)` }}>
      {n && <div style={{ fontFamily: mono, fontWeight: 700, fontSize: 30, color: C.orange, letterSpacing: "0.1em" }}>GOAL {n}</div>}
      <div style={{ fontFamily: display, fontWeight: 800, fontSize: 110, lineHeight: 1.0, letterSpacing: "-0.03em", color: C.ink, marginTop: 10 }}>
        {title}
      </div>
      <div style={{ fontFamily: sans, fontWeight: 500, fontSize: 40, lineHeight: 1.3, color: C.inkSoft, marginTop: 24, maxWidth: 760 }}>{sub}</div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 14, marginTop: 34 }}>{children}</div>
    </div>
  );
};

const Bullet: React.FC<{ f: number; at: number; children: ReactNode }> = ({ f, at, children }) => {
  const p = pop(f, at);
  return (
    <Chip tone="green" style={{ opacity: p, transform: `translateX(${(1 - p) * -24}px)`, fontSize: 28 }}>
      ✓ {children}
    </Chip>
  );
};

/** Goal 4: the hand-done math that the automatic result matches. */
const HandNote: React.FC<{ f: number; t: number }> = ({ f }) => {
  const p = pop(f, 30.4, { damping: 12 });
  const rows = [
    { who: "Rina", calc: "100 − 40 − 45", res: "15" },
    { who: "Wei", calc: "100 − 40 − 45", res: "15" },
    { who: "Jake", calc: "100 − 40 − 30", res: "30" },
  ];
  return (
    <div
      style={{
        opacity: p,
        transform: `rotate(-2.5deg) scale(${0.85 + p * 0.15})`,
        transformOrigin: "left top",
        background: "#FFFBE8",
        border: "1px solid #EFE2B0",
        borderRadius: 10,
        padding: "18px 28px 20px",
        boxShadow: C.shadow,
        backgroundImage: "repeating-linear-gradient(transparent 0 47px, #E9DDB0 47px 48px)",
      }}
    >
      <div style={{ fontFamily: hand, fontWeight: 700, fontSize: 34, color: C.inkSoft, lineHeight: "48px" }}>by hand:</div>
      {rows.map((r) => (
        <div key={r.who} style={{ fontFamily: hand, fontWeight: 600, fontSize: 40, color: "#2B3A67", lineHeight: "48px", whiteSpace: "nowrap" }}>
          {r.who}: {r.calc} = {r.res} <span style={{ color: C.green }}>✓</span>
        </div>
      ))}
    </div>
  );
};
