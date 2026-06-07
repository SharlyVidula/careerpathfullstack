import React from "react";
import theme from "../theme";
import useTilt from "../hooks/useTilt";

export default function BentoCard({
  children,
  colSpan = 1,
  padding  = "40px",
  className = "",
  style = {},
  ...props
}) {
  const { cardRef, sheenRef } = useTilt({
    maxTilt: Math.max(2, 7 / colSpan),
    scale:   1.012,
  });

  return (
    <div
      ref={cardRef}
      style={{
        ...theme.glassPanel(padding),
        display:       "flex",
        flexDirection: "column",
        justifyContent:"space-between",
        position:      "relative",
        ...style,
      }}
      className={`card-animate span-${colSpan} ${className}`}
      {...props}
    >
      {/* ── Specular glass sheen layer (follows cursor via useTilt) ── */}
      <div
        ref={sheenRef}
        aria-hidden
        style={{
          position:      "absolute",
          inset:         0,
          borderRadius:  "inherit",
          opacity:       0,
          pointerEvents: "none",
          zIndex:        1,
          mixBlendMode:  "screen",
        }}
      />

      {/* ── Top-edge highlight (static glass rim light) ── */}
      <div
        aria-hidden
        style={{
          position:      "absolute",
          top:           0,
          left:          "10%",
          right:         "10%",
          height:        "1px",
          background:    "linear-gradient(90deg, transparent, rgba(255,255,255,0.35), transparent)",
          borderRadius:  "100%",
          pointerEvents: "none",
          zIndex:        2,
        }}
      />

      {/* ── Actual card content ── */}
      <div style={{ position: "relative", zIndex: 3, display: "flex", flexDirection: "column", flex: 1 }}>
        {children}
      </div>
    </div>
  );
}
