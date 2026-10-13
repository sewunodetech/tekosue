import { loadFont as loadBricolage } from "@remotion/google-fonts/BricolageGrotesque";
import { loadFont as loadCaveat } from "@remotion/google-fonts/Caveat";
import { loadFont as loadMono } from "@remotion/google-fonts/JetBrainsMono";
import { loadFont as loadSans } from "@remotion/google-fonts/Manrope";
import { Easing, interpolate, spring, type SpringConfig } from "remotion";

export const sans = loadSans("normal", { weights: ["400", "500", "600", "700", "800"], subsets: ["latin"] }).fontFamily;
export const display = loadBricolage("normal", { weights: ["600", "700", "800"], subsets: ["latin"] }).fontFamily;
export const mono = loadMono("normal", { weights: ["500", "700"], subsets: ["latin"] }).fontFamily;
export const hand = loadCaveat("normal", { weights: ["600", "700"], subsets: ["latin"] }).fontFamily;

export const FPS = 30;
export const W = 1920;
export const H = 1080;

/** Seconds → frames. */
export const sec = (t: number) => Math.round(t * FPS);

export const C = {
  bg: "#F6F6F4",
  bgDeep: "#ECEAE2",
  paper: "#FFFFFF",
  ink: "#1D2426",
  inkSoft: "#5F6B6D",
  inkFaint: "#7C8789",
  line: "#E6E2D8",
  primary: "#1F7A6E",
  primarySoft: "#DCF0EA",
  mint: "#9FE0CF",
  orange: "#FF9A62",
  peach: "#FFE8DA",
  green: "#1C7A4F",
  greenSoft: "#CDEEDD",
  monad: "#836EF9",
  monadSoft: "#ECE8FF",
  danger: "#C2410C",
  shadow: "0 24px 60px rgba(29, 36, 38, 0.12), 0 4px 14px rgba(29, 36, 38, 0.06)",
};

export const MEMBERS = [
  { id: "rina", name: "Rina", flag: "🇮🇩", color: "#E8743B" },
  { id: "wei", name: "Wei", flag: "🇸🇬", color: "#2F7DE1" },
  { id: "jake", name: "Jake", flag: "🇦🇺", color: "#1F9D6B" },
] as const;

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const smooth = Easing.bezier(0.33, 0, 0.2, 1);

/** Eased 0→1 (or from→to) between seconds a and b. */
export const ramp = (t: number, a: number, b: number, from = 0, to = 1) =>
  interpolate(t, [a, b], [from, to], { ...clamp, easing: smooth });

/** Visible window with soft edges: fades in at `a`, out at `b`. */
export const windowed = (t: number, a: number, b: number, edge = 0.3) =>
  ramp(t, a - edge / 2, a + edge / 2) * (1 - ramp(t, b - edge / 2, b + edge / 2));

/** Springy 0→1 starting at second `at`. */
export const pop = (frame: number, at: number, config?: Partial<SpringConfig>) =>
  spring({ frame: frame - sec(at), fps: FPS, config: { damping: 14, stiffness: 170, mass: 0.8, ...config } });

/** Point on a quadratic arc from a→b that bulges upward by `lift` px. */
export const arc = (p: number, a: [number, number], b: [number, number], lift = 140): [number, number] => {
  const cx = (a[0] + b[0]) / 2;
  const cy = Math.min(a[1], b[1]) - lift;
  const q = 1 - p;
  return [q * q * a[0] + 2 * q * p * cx + p * p * b[0], q * q * a[1] + 2 * q * p * cy + p * p * b[1]];
};

export const money = (n: number) => n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
