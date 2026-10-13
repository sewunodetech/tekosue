import { C, sans } from "../theme";

/** Row of numbered pills; `active` lights one up, earlier ones show as done. -1 = none yet. */
export const StepTracker: React.FC<{
  x: number;
  y: number;
  width: number;
  labels: string[];
  active: number;
  /** 0→1 entrance per pill, defaults to fully shown. */
  reveal?: number[];
}> = ({ x, y, width, labels, active, reveal }) => (
  <div style={{ position: "absolute", left: x, top: y, width, display: "flex", gap: 14 }}>
    {labels.map((label, i) => {
      const on = i === active;
      const done = active > i;
      const r = reveal?.[i] ?? 1;
      return (
        <div
          key={label}
          style={{
            flex: 1,
            height: 64,
            borderRadius: 999,
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "0 10px",
            background: on ? C.primary : C.paper,
            border: `2px solid ${on ? C.primary : done ? C.green : C.line}`,
            color: on ? "#fff" : C.ink,
            fontFamily: sans,
            fontWeight: 700,
            fontSize: 24,
            opacity: r,
            transform: `translateY(${(1 - r) * 16}px) scale(${on ? 1.03 : 1})`,
            boxShadow: on ? "0 12px 30px rgba(242, 101, 46, 0.35)" : "none",
            whiteSpace: "nowrap",
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              flexShrink: 0,
              borderRadius: 44,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: on ? "rgba(255,255,255,0.22)" : done ? C.green : C.bgDeep,
              color: on || done ? "#fff" : C.inkSoft,
              fontSize: 22,
            }}
          >
            {done ? "✓" : i + 1}
          </div>
          {label}
        </div>
      );
    })}
  </div>
);
