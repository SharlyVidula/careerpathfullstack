import { useEffect, useRef } from "react";

/**
 * useTilt — 3D card tilt + specular glass sheen
 * Returns { cardRef, sheenRef }
 * Mount cardRef on the card wrapper, sheenRef on an absolutely-positioned overlay div.
 */
export default function useTilt(options = {}) {
  const cardRef = useRef(null);
  const sheenRef = useRef(null);

  useEffect(() => {
    const el = cardRef.current;
    const sheen = sheenRef.current;
    if (!el) return;

    const maxTilt = options.maxTilt ?? 8;
    const scale   = options.scale   ?? 1.02;

    el.style.transformStyle = "preserve-3d";

    let isOver = false;
    let rafId  = null;

    const onMove = (e) => {
      if (!isOver) return;
      if (rafId) cancelAnimationFrame(rafId);

      rafId = requestAnimationFrame(() => {
        const rect = el.getBoundingClientRect();
        const ax   = e.clientX - rect.left;
        const ay   = e.clientY - rect.top;
        const nx   = (ax - rect.width  / 2) / (rect.width  / 2); // -1 → 1
        const ny   = (ay - rect.height / 2) / (rect.height / 2); // -1 → 1

        const rX = ny * -maxTilt;
        const rY = nx *  maxTilt;

        el.style.transform =
          `perspective(1000px) rotateX(${rX}deg) rotateY(${rY}deg) scale3d(${scale},${scale},${scale})`;

        // Specular sheen — radial gradient that chases the cursor
        if (sheen) {
          const pctX = (ax / rect.width)  * 100;
          const pctY = (ay / rect.height) * 100;
          sheen.style.background =
            `radial-gradient(circle at ${pctX}% ${pctY}%, ` +
            `rgba(255,255,255,0.14) 0%, ` +
            `rgba(0,243,255,0.04) 40%, ` +
            `transparent 70%)`;
          sheen.style.opacity = "1";
        }
      });
    };

    const onEnter = () => {
      isOver = true;
      el.style.transition = "transform 0.08s cubic-bezier(0.2,0.8,0.2,1)";
      if (sheen) sheen.style.transition = "opacity 0.25s ease";
    };

    const onLeave = () => {
      isOver = false;
      if (rafId) cancelAnimationFrame(rafId);
      el.style.transition = "transform 0.55s cubic-bezier(0.2,0.8,0.2,1)";
      el.style.transform   = "perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1,1,1)";
      if (sheen) {
        sheen.style.transition = "opacity 0.4s ease";
        sheen.style.opacity    = "0";
      }
    };

    el.addEventListener("mouseenter", onEnter);
    el.addEventListener("mousemove",  onMove);
    el.addEventListener("mouseleave", onLeave);

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      el.removeEventListener("mouseenter", onEnter);
      el.removeEventListener("mousemove",  onMove);
      el.removeEventListener("mouseleave", onLeave);
    };
  }, [options.maxTilt, options.scale]);

  return { cardRef, sheenRef };
}
