import React from "react";
import theme from "../theme";
import useTilt from "../hooks/useTilt";

export default function BentoCard({ children, colSpan = 1, padding = "40px", className = "", ...props }) {
  // Automatically calculate 3D tilt bounds based on width/span
  const tiltRef = useTilt({ maxTilt: Math.max(2, 6 / colSpan), scale: 1.01 });
  return (
    <div ref={tiltRef} style={{
      ...theme.glassPanel(padding),
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-between"
    }} className={`card-animate span-${colSpan} ${className}`} {...props}>
      {children}
    </div>
  );
}
