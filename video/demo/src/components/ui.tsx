import type { CSSProperties, ReactNode } from "react";
import { AbsoluteFill, OffthreadVideo, staticFile, useCurrentFrame } from "remotion";
import type { Cue } from "../config";
import { C, display, FPS, MEMBERS, mono, ramp, sans, sec } from "../theme";

export const Footage: React.FC<{
  src: string;
  trimBefore: number;
  objectPosition?: string;
  style?: CSSProperties;
}> = ({ src, trimBefore, objectPosition = "50% 50%", style }) => (
  <OffthreadVideo
    src={staticFile(src)}
    trimBefore={sec(trimBefore)}
    style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition, ...style }}
  />
);

/** Bottom captions. `offset` is the clip's trimBefore so cues can use source-clip seconds. */
export const Captions: React.FC<{ cues: Cue[]; offset?: number }> = ({ cues, offset = 0 }) => {
  const t = useCurrentFrame() / FPS + offset;
  const cue = cues.find((c) => t >= c.from && t < c.to);
  if (!cue) return null;
  const o = ramp(t, cue.from, cue.from + 0.15) * (1 - ramp(t, cue.to - 0.15, cue.to));
  return (
    <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center", paddingBottom: 34, pointerEvents: "none" }}>
      <div
        style={{
          opacity: o,
          transform: `translateY(${(1 - o) * 8}px)`,
          maxWidth: 1480,
          padding: "12px 26px",
          borderRadius: 14,
          background: "rgba(22, 19, 15, 0.8)",
          color: "#FFF8EE",
          fontFamily: sans,
          fontWeight: 600,
          fontSize: 34,
          lineHeight: 1.3,
          textAlign: "center",
        }}
      >
        {cue.text}
      </div>
    </AbsoluteFill>
  );
};

/** Teko mascot — same drawing as the website's TekoMark. Height equals `size`. */
export const TekoMark: React.FC<{ size: number; style?: CSSProperties }> = ({ size, style }) => (
  <svg width={size} height={size} viewBox="9 28 180 180" style={style}>
    <path d="M56 118 Q30 114 25 88" fill="none" stroke="#2a3436" strokeWidth="24" strokeLinecap="round" />
    <path d="M56 118 Q30 114 25 88" fill="none" stroke="#9fe0cf" strokeWidth="15" strokeLinecap="round" />
    <path d="M146 104 C180 98 182 152 146 152" fill="none" stroke="#2a3436" strokeWidth="14" strokeLinecap="round" />
    <path d="M146 104 C180 98 182 152 146 152" fill="none" stroke="#9fe0cf" strokeWidth="5" strokeLinecap="round" />
    <ellipse cx="76" cy="174" rx="13" ry="8" fill="#86d2bf" stroke="#2a3436" strokeWidth="4" />
    <ellipse cx="124" cy="174" rx="13" ry="8" fill="#86d2bf" stroke="#2a3436" strokeWidth="4" />
    <path d="M42 134 C42 94 68 80 100 80 C132 80 158 94 158 134 C158 166 134 178 100 178 C66 178 42 166 42 134 Z" fill="#9fe0cf" stroke="#2a3436" strokeWidth="4.5" />
    <ellipse cx="100" cy="162" rx="34" ry="11" fill="#c9f0e4" />
    <path d="M56 114 Q60 98 74 91" fill="none" stroke="#ffffff" strokeWidth="5" strokeLinecap="round" opacity="0.75" />
    <path d="M68 86 C68 66 132 66 132 86 Z" fill="#9fe0cf" stroke="#2a3436" strokeWidth="4.5" strokeLinejoin="round" />
    <rect x="62" y="82" width="76" height="9" rx="4.5" fill="#86d2bf" stroke="#2a3436" strokeWidth="4.5" />
    <circle cx="100" cy="62" r="9" fill="#ff9a62" stroke="#2a3436" strokeWidth="4" />
    <circle cx="97" cy="59" r="2.5" fill="#ffffff" />
    <ellipse cx="80" cy="128" rx="7" ry="8.5" fill="#2a3436" />
    <ellipse cx="120" cy="128" rx="7" ry="8.5" fill="#2a3436" />
    <circle cx="82.5" cy="124.5" r="2.6" fill="#ffffff" />
    <circle cx="122.5" cy="124.5" r="2.6" fill="#ffffff" />
    <ellipse cx="64" cy="142" rx="9" ry="5.5" fill="#ffb3a1" opacity="0.85" />
    <ellipse cx="136" cy="142" rx="9" ry="5.5" fill="#ffb3a1" opacity="0.85" />
    <path d="M93 140 Q96.5 145 100 140 Q103.5 145 107 140" fill="none" stroke="#2a3436" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/** Teal wordmark with the orange dot, as on the website. */
export const Wordmark: React.FC<{ size: number; color?: string }> = ({ size, color = C.primary }) => (
  <span style={{ display: "inline-flex", alignItems: "center", gap: size * 0.06 }}>
    <span style={{ fontFamily: display, fontWeight: 700, fontSize: size, lineHeight: 1.1, letterSpacing: -size / 48, color }}>tekosue</span>
    <span style={{ width: Math.max(6, size / 3), height: Math.max(6, size / 3), borderRadius: 999, background: C.orange, marginTop: size * 0.25 }} />
  </span>
);

/** Gentle floating motion for any child. */
export const Bob: React.FC<{ children: ReactNode; amp?: number; speed?: number; phase?: number; sway?: number; style?: CSSProperties }> = ({
  children,
  amp = 10,
  speed = 1,
  phase = 0,
  sway = 0,
  style,
}) => {
  const t = (useCurrentFrame() / FPS) * speed * Math.PI * 2 * 0.35 + phase;
  return <div style={{ transform: `translateY(${Math.sin(t) * amp}px) rotate(${Math.sin(t * 0.8) * sway}deg)`, ...style }}>{children}</div>;
};

/** Website-style backdrop: ivory, dot grid and slowly drifting mint / peach / lilac blobs. */
export const Backdrop: React.FC = () => {
  const t = useCurrentFrame() / FPS;
  const blob = (color: string, size: number, x: number, y: number, ax: number, ay: number, ph: number) => (
    <div
      style={{
        position: "absolute",
        left: x + Math.sin(t * 0.35 + ph) * ax,
        top: y + Math.cos(t * 0.3 + ph) * ay,
        width: size,
        height: size,
        borderRadius: size,
        background: color,
        filter: "blur(90px)",
        opacity: 0.7,
      }}
    />
  );
  return (
    <AbsoluteFill style={{ background: C.bg, overflow: "hidden" }}>
      {blob("#CFE9E1", 700, -150, -200, 80, 50, 0)}
      {blob("#FFE0CC", 620, 1400, 600, 70, 60, 2)}
      {blob("#E3DDFF", 520, 1000, -220, 60, 40, 4)}
      <AbsoluteFill
        style={{
          backgroundImage: "radial-gradient(rgba(29,36,38,0.13) 1.6px, transparent 1.6px)",
          backgroundSize: "36px 36px",
          backgroundPosition: `${t * 6}px ${t * 4}px`,
          opacity: 0.5,
        }}
      />
    </AbsoluteFill>
  );
};

type Member = (typeof MEMBERS)[number];

export const Avatar: React.FC<{ m: Member; size: number; flag?: boolean; dim?: boolean; style?: CSSProperties }> = ({
  m,
  size,
  flag = true,
  dim = false,
  style,
}) => (
  <div style={{ position: "relative", width: size, height: size, ...style }}>
    <div
      style={{
        width: size,
        height: size,
        borderRadius: size,
        background: dim ? C.line : m.color,
        color: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: sans,
        fontWeight: 800,
        fontSize: size * 0.42,
      }}
    >
      {m.name[0]}
    </div>
    {flag && (
      <div
        style={{
          position: "absolute",
          right: -size * 0.08,
          bottom: -size * 0.06,
          fontSize: size * 0.36,
          lineHeight: 1,
          filter: "drop-shadow(0 2px 3px rgba(0,0,0,0.2))",
        }}
      >
        {m.flag}
      </div>
    )}
  </div>
);

export const Coin: React.FC<{ size?: number; style?: CSSProperties }> = ({ size = 46, style }) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: size,
      background: `radial-gradient(circle at 35% 30%, #4ED19B, ${C.green})`,
      border: `3px solid #17805A`,
      boxShadow: "0 6px 14px rgba(20, 90, 60, 0.3)",
      color: "#fff",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: mono,
      fontWeight: 700,
      fontSize: size * 0.46,
      ...style,
    }}
  >
    $
  </div>
);

export const Card: React.FC<{ children: ReactNode; style?: CSSProperties }> = ({ children, style }) => (
  <div style={{ background: C.paper, borderRadius: 28, boxShadow: C.shadow, border: `1px solid ${C.line}`, ...style }}>
    {children}
  </div>
);

export const Chip: React.FC<{ children: ReactNode; tone?: "green" | "primary" | "monad" | "plain"; style?: CSSProperties }> = ({
  children,
  tone = "plain",
  style,
}) => {
  const tones = {
    green: { background: C.greenSoft, color: C.green },
    primary: { background: C.primarySoft, color: C.primary },
    monad: { background: C.monadSoft, color: "#4B36C9" },
    plain: { background: C.paper, color: C.ink, border: `1px solid ${C.line}` },
  };
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 10,
        padding: "12px 20px",
        borderRadius: 999,
        fontFamily: sans,
        fontWeight: 700,
        fontSize: 26,
        ...tones[tone],
        ...style,
      }}
    >
      {children}
    </div>
  );
};

/** Rounded card holding the speaker footage on the designed scenes. */
export const SpeakerCard: React.FC<{ src: string; trimBefore: number; objectPosition: string; style?: CSSProperties }> = ({
  src,
  trimBefore,
  objectPosition,
  style,
}) => (
  <div
    style={{
      position: "absolute",
      left: 72,
      top: 72,
      width: 560,
      height: 898,
      borderRadius: 36,
      overflow: "hidden",
      boxShadow: C.shadow,
      background: C.ink,
      ...style,
    }}
  >
    <Footage src={src} trimBefore={trimBefore} objectPosition={objectPosition} />
  </div>
);

export const Phone: React.FC<{ children: ReactNode; style?: CSSProperties }> = ({ children, style }) => (
  <div
    style={{
      position: "absolute",
      width: 420,
      height: 800,
      borderRadius: 64,
      background: C.ink,
      padding: 12,
      boxShadow: "0 40px 90px rgba(29, 36, 38, 0.28)",
      ...style,
    }}
  >
    <div style={{ position: "relative", width: "100%", height: "100%", borderRadius: 52, overflow: "hidden", background: "#FBFAF6" }}>
      <div
        style={{
          height: 54,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 34px",
          fontFamily: sans,
          fontWeight: 700,
          fontSize: 18,
          color: C.ink,
        }}
      >
        <span>9:41</span>
        <div style={{ width: 110, height: 30, borderRadius: 20, background: C.ink }} />
        <span style={{ fontSize: 14 }}>●●● ▮</span>
      </div>
      {children}
    </div>
  </div>
);
