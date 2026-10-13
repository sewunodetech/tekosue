import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Avatar, Backdrop, Captions, Card, Chip, Coin, SpeakerCard, TekoMark } from "../components/ui";
import { CAPTIONS, CLIPS } from "../config";
import { arc, C, FPS, MEMBERS, mono, money, pop, ramp, sans, windowed } from "../theme";
import { StepTracker } from "./StepTracker";

/*
 * Beats (Phase 2 clip seconds, from word timestamps):
 *  0.0  "That's what splitting costs across countries feels like"  → receipt chaos
 *  5.44 "Tekosue is a pot for friends and family…"                 → pot + members
 * 12.1  "everyone puts digital dollars, AUSD, into one pot"        → deposits (Add)
 * 15.8  "spends from it"                                            → dinner payment (Spend)
 * 17.0  "when the trip ends, the pot settles up by itself"         → auto-settle (Settle)
 * 21.0  "works on Monad testnet"                                    → network badge
 */

const STAGE_X = 700;
const STAGE_W = 1148;
const CX = STAGE_X + STAGE_W / 2;
const POT: [number, number] = [CX, 650];
const SEATS: [number, number][] = [
  [CX - 380, 400],
  [CX, 330],
  [CX + 380, 400],
];
const RECEIPT: [number, number] = [CX + 400, 760];

const MESSY = [
  { text: "¥ 12,400", sub: "hotel — who paid?", x: -330, y: -170, r: -8 },
  { text: "A$ 85.00", sub: "taxi", x: 250, y: -230, r: 6 },
  { text: "Rp 350.000", sub: "dinner??", x: -80, y: 30, r: 4 },
  { text: "S$ 42.10", sub: "tickets", x: 340, y: 60, r: -5 },
  { text: "$ 60 → ¥ ?", sub: "exchange rate", x: -360, y: 170, r: 7 },
  { text: "💬 128 unread", sub: "group chat", x: 120, y: 230, r: -3 },
];

export const Phase2Pot: React.FC<{ captions: boolean }> = ({ captions }) => {
  const { src, from } = CLIPS.p2;
  const f = useCurrentFrame();
  const t = f / FPS + from;

  const potIn = pop(f, 5.45, { damping: 12 });
  const balance =
    300 * ramp(t, 12.5, 14.8) - 90 * ramp(t, 16.05, 16.6) - 210 * ramp(t, 19.0, 19.9);
  const settled = pop(f, 19.9);
  const step = t < 10.9 ? -1 : t < 15.7 ? 0 : t < 16.9 ? 1 : 2;

  const headlines = [
    { a: 0.2, b: 5.3, text: "Splitting costs across countries…" },
    { a: 5.45, b: 10.85, text: "One shared pot for the whole trip" },
    { a: 10.9, b: 15.75, text: "Everyone chips in digital dollars" },
    { a: 15.75, b: 16.95, text: "Anyone spends from the pot" },
    { a: 16.95, b: 30, text: "The pot settles up by itself" },
  ];

  return (
    <AbsoluteFill>
      <Backdrop />
      <SpeakerCard src={src} trimBefore={from} objectPosition="47% 45%" />

      <StepTracker x={STAGE_X + 40} y={72} width={STAGE_W - 80} active={step} labels={["Add", "Spend", "Settle"]} />

      {headlines.map((h) => {
        const o = windowed(t, h.a, h.b, 0.35);
        if (o <= 0) return null;
        return (
          <div
            key={h.text}
            style={{
              position: "absolute",
              left: STAGE_X,
              width: STAGE_W,
              top: 172,
              textAlign: "center",
              opacity: o,
              transform: `translateY(${(1 - o) * 14}px)`,
              fontFamily: sans,
              fontWeight: 800,
              fontSize: 60,
              letterSpacing: "-0.03em",
              color: C.ink,
            }}
          >
            {h.text}
          </div>
        );
      })}

      {/* Beat 0: the mess, sucked into the pot when it appears */}
      {MESSY.map((m, i) => {
        const inP = pop(f, 0.3 + i * 0.45);
        const suck = ramp(t, 5.0 + i * 0.05, 5.9 + i * 0.05);
        if (suck >= 1) return null;
        const drift = Math.sin(t * 1.3 + i) * 10;
        const x = interpolate(suck, [0, 1], [CX + m.x, POT[0]]);
        const y = interpolate(suck, [0, 1], [610 + m.y + drift, POT[1]]);
        return (
          <Card
            key={m.text}
            style={{
              position: "absolute",
              left: x,
              top: y,
              padding: "16px 24px",
              borderRadius: 20,
              transform: `translate(-50%, -50%) rotate(${m.r * (1 - suck) + suck * 180}deg) scale(${inP * (1 - suck)})`,
            }}
          >
            <div style={{ fontFamily: mono, fontWeight: 700, fontSize: 34, color: C.ink }}>{m.text}</div>
            <div style={{ fontFamily: sans, fontWeight: 600, fontSize: 20, color: C.danger }}>{m.sub}</div>
          </Card>
        );
      })}

      {/* Members around the pot */}
      {MEMBERS.map((m, i) => {
        const p = pop(f, 7.6 + i * 0.4);
        const [x, y] = SEATS[i];
        const bump = 1 + 0.12 * Math.sin(Math.PI * ramp(t, 19.55 + i * 0.15, 19.95 + i * 0.15));
        return (
          <div
            key={m.id}
            style={{
              position: "absolute",
              left: x,
              top: y,
              transform: `translate(-50%, -50%) scale(${p * bump})`,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 10,
            }}
          >
            <Avatar m={m} size={104} />
            <div style={{ fontFamily: sans, fontWeight: 700, fontSize: 26, color: C.ink }}>{m.name}</div>
          </div>
        );
      })}

      {/* The pot */}
      <div
        style={{
          position: "absolute",
          left: POT[0],
          top: POT[1],
          transform: `translate(-50%, -42%) scale(${potIn})`,
        }}
      >
        <TekoMark size={400} />
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 205,
            textAlign: "center",
            color: "#fff",
          }}
        >
          <div style={{ fontFamily: mono, fontWeight: 700, fontSize: 50, letterSpacing: "-0.02em" }}>{money(Math.max(0, balance))}</div>
          <div style={{ fontFamily: mono, fontWeight: 700, fontSize: 22, opacity: 0.85, letterSpacing: "0.12em" }}>AUSD</div>
        </div>
      </div>

      {/* Deposits: three coins from each member */}
      {MEMBERS.flatMap((m, i) =>
        [0, 1, 2].map((j) => {
          const a = 12.1 + i * 0.4 + j * 0.14;
          const p = ramp(t, a, a + 0.75);
          if (p <= 0 || p >= 1) return null;
          const [x, y] = arc(p, SEATS[i], [POT[0], POT[1] - 10], 120);
          return <Coin key={`${m.id}-${j}`} style={{ position: "absolute", left: x - 23, top: y - 23 }} />;
        }),
      )}

      {/* AUSD explainer chip */}
      {(() => {
        const p = pop(f, 13.86);
        const o = 1 - ramp(t, 15.5, 15.8);
        return (
          <div style={{ position: "absolute", left: CX - 520, top: 760, opacity: o, transform: `scale(${p})`, transformOrigin: "left center" }}>
            <Chip tone="green" style={{ boxShadow: C.shadow }}>
              <Coin size={34} /> AUSD = digital dollars
            </Chip>
          </div>
        );
      })()}

      {/* Spend: dinner receipt */}
      {(() => {
        const p = pop(f, 15.8);
        const o = 1 - ramp(t, 18.6, 19.0);
        const coinP = ramp(t, 15.95, 16.6);
        const [x, y] = arc(coinP, [POT[0], POT[1] - 20], [RECEIPT[0] - 120, RECEIPT[1]], 80);
        return (
          <>
            {coinP > 0 && coinP < 1 && <Coin style={{ position: "absolute", left: x - 23, top: y - 23 }} />}
            <Card
              style={{
                position: "absolute",
                left: RECEIPT[0],
                top: RECEIPT[1],
                padding: "20px 26px",
                borderRadius: 22,
                opacity: o,
                transform: `translate(-50%, -50%) scale(${p})`,
                minWidth: 290,
              }}
            >
              <div style={{ fontFamily: sans, fontWeight: 700, fontSize: 22, color: C.inkFaint }}>🍜 Dinner · Shinjuku</div>
              <div style={{ fontFamily: mono, fontWeight: 700, fontSize: 36, color: C.ink }}>−90.00 AUSD</div>
              <div style={{ fontFamily: sans, fontWeight: 600, fontSize: 20, color: C.inkSoft }}>paid by Wei · from pot</div>
            </Card>
          </>
        );
      })()}

      {/* Settle: trip-end chip, coins flow back to everyone */}
      {(() => {
        const p = pop(f, 17.38);
        return (
          <div style={{ position: "absolute", left: CX - 540, top: 740, transform: `scale(${p})`, transformOrigin: "left center" }}>
            <Chip tone="primary" style={{ boxShadow: C.shadow }}>
              📅 Trip ends · auto-settle
            </Chip>
          </div>
        );
      })()}
      {MEMBERS.flatMap((m, i) =>
        [0, 1].map((j) => {
          const a = 18.95 + i * 0.15 + j * 0.16;
          const p = ramp(t, a, a + 0.7);
          if (p <= 0 || p >= 1) return null;
          const [x, y] = arc(p, [POT[0], POT[1] - 20], SEATS[i], 60);
          return <Coin key={`back-${m.id}-${j}`} style={{ position: "absolute", left: x - 23, top: y - 23 }} />;
        }),
      )}
      <div
        style={{
          position: "absolute",
          left: CX + 210,
          top: 560,
          opacity: settled,
          transform: `scale(${settled}) rotate(-6deg)`,
        }}
      >
        <Chip tone="green" style={{ boxShadow: C.shadow, fontSize: 30 }}>
          ✓ Settled
        </Chip>
      </div>

      {/* Network */}
      {(() => {
        const p = pop(f, 21.3);
        return (
          <div style={{ position: "absolute", left: CX, top: 925, transform: `translate(-50%, -50%) scale(${p})` }}>
            <Chip tone="monad" style={{ boxShadow: C.shadow, fontSize: 28 }}>
              ◆ Runs on Monad testnet
            </Chip>
          </div>
        );
      })()}

      {captions && <Captions cues={CAPTIONS.p2} offset={from} />}
    </AbsoluteFill>
  );
};
