import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Backdrop, Bob, Captions, Card, Chip, Footage, TekoMark, Wordmark } from "../components/ui";
import { CAPTIONS, CLIPS, REPO_URL, TEAM_MEMBERS, TEAM_NAME } from "../config";
import { C, display, FPS, mono, pop, ramp, sans } from "../theme";

type SceneProps = { captions: boolean };

/** Phase 1 — the problem, acted out. Straight footage + captions. */
export const Phase1: React.FC<SceneProps> = ({ captions }) => {
  const { src, from } = CLIPS.p1;
  return (
    <AbsoluteFill style={{ background: C.ink }}>
      <Footage src={src} trimBefore={from} />
      {captions && <Captions cues={CAPTIONS.p1} offset={from} />}
    </AbsoluteFill>
  );
};

/** Title slide between the skit and the pitch. */
export const TitleCard: React.FC<Partial<SceneProps>> = () => {
  const f = useCurrentFrame();
  const t = f / FPS;
  const mark = pop(f, 0.15, { damping: 11 });
  const word = pop(f, 0.45);
  const tag = ramp(t, 0.9, 1.4);
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <Backdrop />
      <div style={{ position: "relative", transform: `scale(${0.4 + mark * 0.6})`, opacity: Math.min(1, mark * 1.4) }}>
        <Bob amp={10} sway={2.5}>
          <TekoMark size={300} />
        </Bob>
      </div>
      <div style={{ marginTop: 10, transform: `translateY(${(1 - word) * 40}px) scale(${0.92 + word * 0.08})`, opacity: word }}>
        <Wordmark size={150} />
      </div>
      <div
        style={{
          marginTop: 6,
          opacity: tag,
          transform: `translateY(${(1 - tag) * 14}px)`,
          fontFamily: sans,
          fontWeight: 500,
          fontSize: 40,
          color: C.inkSoft,
        }}
      >
        A shared pot for trips across countries
      </div>
    </AbsoluteFill>
  );
};

/** Three wisps of steam rising from the teko spout. */
export const Steam: React.FC<{ t: number; x: number; y: number; scale?: number }> = ({ t, x, y, scale = 1 }) => (
  <svg width={80 * scale} height={110 * scale} viewBox="0 0 80 110" style={{ position: "absolute", left: x - 40 * scale, top: y - 100 * scale }}>
    {[0, 1, 2].map((i) => {
      const p = ((t * 0.7 + i / 3) % 1 + 1) % 1;
      return (
        <path
          key={i}
          d={`M${22 + i * 18} 100 C${10 + i * 18} 75 ${36 + i * 18} 60 ${22 + i * 18} 30`}
          stroke={C.inkFaint}
          strokeWidth={5}
          strokeLinecap="round"
          fill="none"
          opacity={interpolate(p, [0, 0.3, 1], [0, 0.7, 0])}
          transform={`translate(0 ${-p * 22})`}
        />
      );
    })}
  </svg>
);

/** Phase 3 — the team. Footage with a team card. */
export const Phase3: React.FC<SceneProps> = ({ captions }) => {
  const { src, from } = CLIPS.p3;
  const f = useCurrentFrame();
  const card = pop(f, 2.7 - from);
  const chips = [
    { at: 6.0, text: "✈️  We travel a lot" },
    { at: 8.2, text: "🧳  Open trips, people from everywhere" },
    { at: 15.3, text: "🧾  Splitting costs, every single time" },
  ];
  return (
    <AbsoluteFill style={{ background: C.ink }}>
      <Footage src={src} trimBefore={from} />
      <div
        style={{
          position: "absolute",
          left: 64,
          top: 64,
          opacity: card,
          transform: `translateX(${(1 - card) * -40}px)`,
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          gap: 14,
        }}
      >
        <Card style={{ padding: "22px 30px", display: "flex", alignItems: "center", gap: 20 }}>
          <TekoMark size={70} />
          <div>
            <div style={{ fontFamily: mono, fontWeight: 700, fontSize: 18, letterSpacing: "0.14em", color: C.inkFaint }}>THE TEAM</div>
            <div style={{ fontFamily: sans, fontWeight: 800, fontSize: 52, letterSpacing: "-0.03em", color: C.ink, lineHeight: 1.05 }}>
              {TEAM_NAME}
            </div>
          </div>
        </Card>
        {TEAM_MEMBERS.length > 0 && (
          <div style={{ display: "flex", gap: 12 }}>
            {TEAM_MEMBERS.map((m) => (
              <Card key={m.name} style={{ padding: "14px 20px", borderRadius: 20 }}>
                <div style={{ fontFamily: sans, fontWeight: 800, fontSize: 26, color: C.ink }}>
                  {m.flag} {m.name}
                </div>
                <div style={{ fontFamily: sans, fontWeight: 500, fontSize: 20, color: C.inkSoft }}>{m.role}</div>
              </Card>
            ))}
          </div>
        )}
        {chips.map((c) => {
          const p = pop(f, c.at - from);
          return (
            <Chip key={c.text} style={{ opacity: p, transform: `translateX(${(1 - p) * -30}px)`, boxShadow: C.shadow }}>
              {c.text}
            </Chip>
          );
        })}
      </div>
      {captions && <Captions cues={CAPTIONS.p3} offset={from} />}
    </AbsoluteFill>
  );
};

/** Phase 5 — tagline. Footage shrinks to the left, end card slides in on the right. */
export const Phase5: React.FC<SceneProps> = ({ captions }) => {
  const { src, from } = CLIPS.p5;
  const f = useCurrentFrame();
  const t = f / FPS;
  const k = ramp(t, 6.1, 7.0);
  const left = interpolate(k, [0, 1], [0, 72]);
  const top = interpolate(k, [0, 1], [0, 200]);
  const w = interpolate(k, [0, 1], [1920, 1000]);
  const radius = interpolate(k, [0, 1], [0, 36]);
  const mark = pop(f, 6.6, { damping: 11 });
  const line = pop(f, 7.0);
  const sub = ramp(t, 7.6, 8.2);
  return (
    <AbsoluteFill>
      <Backdrop />
      <div style={{ position: "absolute", right: 72, top: 0, bottom: 0, width: 720, display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 22, opacity: mark, transform: `scale(${0.6 + mark * 0.4})`, transformOrigin: "left center" }}>
          <div style={{ position: "relative" }}>
            <Bob amp={6} sway={3}>
              <TekoMark size={160} />
            </Bob>
          </div>
          <Wordmark size={110} />
        </div>
        <div
          style={{
            marginTop: 36,
            opacity: line,
            transform: `translateY(${(1 - line) * 30}px)`,
            fontFamily: display,
            fontWeight: 800,
            fontSize: 74,
            lineHeight: 1.08,
            letterSpacing: "-0.03em",
            color: C.ink,
          }}
        >
          Stressless trip
          <br />
          with <span style={{ color: C.primary }}>Tekosue</span>.
        </div>
        <div style={{ marginTop: 34, opacity: sub, display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 14 }}>
          <Chip tone="primary">Add · Spend · Settle</Chip>
          <Chip tone="monad">◆ Built on Monad testnet</Chip>
          {REPO_URL && (
            <div style={{ fontFamily: mono, fontWeight: 500, fontSize: 28, color: C.inkSoft, marginTop: 6 }}>{REPO_URL}</div>
          )}
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          left,
          top,
          width: w,
          height: (w * 9) / 16,
          borderRadius: radius,
          overflow: "hidden",
          boxShadow: k > 0 ? C.shadow : undefined,
        }}
      >
        <Footage src={src} trimBefore={from} />
      </div>
      {captions && <Captions cues={CAPTIONS.p5} offset={from} />}
    </AbsoluteFill>
  );
};
