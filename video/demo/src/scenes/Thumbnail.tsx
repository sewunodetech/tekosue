import { AbsoluteFill, OffthreadVideo, staticFile } from "remotion";
import { Backdrop, Chip, TekoMark, Wordmark } from "../components/ui";
import { C, display, sans, sec } from "../theme";

/** YouTube / submission thumbnail (render with `npm run thumb`). */
export const Thumbnail: React.FC = () => (
  <AbsoluteFill>
    <Backdrop />
    <div style={{ position: "absolute", left: 90, top: 80 }}>
      <Wordmark size={84} />
    </div>
    <div style={{ position: "absolute", left: 90, top: 250, width: 960 }}>
      <div style={{ fontFamily: display, fontWeight: 800, fontSize: 150, lineHeight: 0.98, letterSpacing: "-0.035em", color: C.ink }}>
        One pot for
        <br />
        the whole <span style={{ color: C.primary }}>trip.</span>
      </div>
      <div style={{ marginTop: 34, fontFamily: sans, fontWeight: 600, fontSize: 44, color: C.inkSoft }}>Settles itself on the last day.</div>
      <div style={{ marginTop: 34, display: "flex", gap: 14 }}>
        <Chip tone="primary" style={{ fontSize: 30 }}>Face ID only</Chip>
        <Chip tone="monad" style={{ fontSize: 30 }}>◆ Monad Metropolis</Chip>
      </div>
    </div>
    <div
      style={{
        position: "absolute",
        left: 1090,
        top: 90,
        width: 740,
        height: 744,
        borderRadius: 48,
        overflow: "hidden",
        background: "#FAF8F3",
        boxShadow: C.shadow,
        border: `1px solid ${C.line}`,
        transform: "rotate(2.5deg)",
      }}
    >
      <OffthreadVideo
        src={staticFile("footage/appdemo.mp4")}
        trimBefore={sec(111)}
        muted
        style={{ position: "absolute", width: 1920 * 0.84, height: 1080 * 0.84, left: -900 * 0.84, top: -40 * 0.84 }}
      />
    </div>
    <div style={{ position: "absolute", left: 1010, top: 690, transform: "rotate(-6deg)" }}>
      <TekoMark size={330} />
    </div>
  </AbsoluteFill>
);
