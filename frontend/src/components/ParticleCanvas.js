import React, { useEffect, useRef } from "react";

const DARK_COLORS  = ["0,243,255",  "255,0,127",  "57,255,20"];   // cyan/magenta/green
const LIGHT_COLORS = ["79,70,229",  "14,165,233", "5,150,105"];    // indigo/sky/emerald

const isLightMode = () => document.body.classList.contains("light-mode");

function mkParticle(W, H) {
  const colors = isLightMode() ? LIGHT_COLORS : DARK_COLORS;
  return {
    x:  Math.random() * W,
    y:  Math.random() * H,
    vx: (Math.random() - 0.5) * 0.55,
    vy: (Math.random() - 0.5) * 0.55,
    r:  Math.random() * 1.4 + 0.5,
    color: colors[Math.floor(Math.random() * colors.length)],
    opacity: Math.random() * 0.45 + 0.18,
  };
}

/**
 * ParticleCanvas — full-viewport interactive particle network.
 * Particles slowly drift; they gently attract to the cursor.
 * Nearby particles are connected with translucent neon lines.
 */
export default function ParticleCanvas() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    let W = window.innerWidth;
    let H = window.innerHeight;
    let animId;
    const mouse = { x: -9999, y: -9999 };

    const resize = () => {
      W = canvas.width  = window.innerWidth;
      H = canvas.height = window.innerHeight;
    };
    resize();

    const COUNT = 70;
    let particles = Array.from({ length: COUNT }, () => mkParticle(W, H));

    const LINK  = 135;   // max px for line drawing
    const ATTRACT = 110; // mouse attraction radius

    const tick = () => {
      ctx.clearRect(0, 0, W, H);
      const light = isLightMode();
      const lineAlphaBase = light ? 0.18 : 0.28;
      const lineColor = light ? "99,102,241" : "0,243,255";

      // ── Update positions ──────────────────────────────────────────
      for (const p of particles) {
        const dx   = mouse.x - p.x;
        const dy   = mouse.y - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < ATTRACT && dist > 1) {
          p.vx += (dx / dist) * 0.025;
          p.vy += (dy / dist) * 0.025;
        }

        // Speed cap
        const spd = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
        if (spd > 1.4) { p.vx = (p.vx / spd) * 1.4; p.vy = (p.vy / spd) * 1.4; }

        p.x += p.vx;
        p.y += p.vy;

        // Wrap around edges instead of bouncing — more fluid
        if (p.x < -5)  p.x = W + 5;
        if (p.x > W+5) p.x = -5;
        if (p.y < -5)  p.y = H + 5;
        if (p.y > H+5) p.y = -5;
      }

      // ── Draw connection lines ─────────────────────────────────────
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const a = particles[i], b = particles[j];
          const dx = a.x - b.x, dy = a.y - b.y;
          const d  = Math.sqrt(dx * dx + dy * dy);
          if (d < LINK) {
            const alpha = (1 - d / LINK) * lineAlphaBase;
            ctx.beginPath();
            ctx.strokeStyle = `rgba(${lineColor},${alpha})`;
            ctx.lineWidth   = 0.6;
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      // ── Draw particles ────────────────────────────────────────────
      for (const p of particles) {
        // Soft glow halo
        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 4);
        grad.addColorStop(0,   `rgba(${p.color},${p.opacity})`);
        grad.addColorStop(0.4, `rgba(${p.color},${p.opacity * 0.3})`);
        grad.addColorStop(1,   `rgba(${p.color},0)`);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * 4, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();

        // Solid core
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.color},${Math.min(p.opacity + 0.3, 1)})`;
        ctx.fill();
      }

      animId = requestAnimationFrame(tick);
    };

    const onMove  = (e) => { mouse.x = e.clientX; mouse.y = e.clientY; };
    const onLeave = ()  => { mouse.x = -9999; mouse.y = -9999; };

    // Re-color particles live when theme toggles
    const observer = new MutationObserver(() => {
      const colors = isLightMode() ? LIGHT_COLORS : DARK_COLORS;
      particles.forEach(p => {
        p.color = colors[Math.floor(Math.random() * colors.length)];
      });
    });
    observer.observe(document.body, { attributes: true, attributeFilter: ["class"] });

    window.addEventListener("resize",     resize,  { passive: true });
    window.addEventListener("mousemove",  onMove,  { passive: true });
    window.addEventListener("mouseleave", onLeave, { passive: true });

    tick();

    return () => {
      cancelAnimationFrame(animId);
      observer.disconnect();
      window.removeEventListener("resize",     resize);
      window.removeEventListener("mousemove",  onMove);
      window.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      style={{
        position:      "fixed",
        inset:         0,
        zIndex:        0,
        pointerEvents: "none",
        opacity:       isLightMode() ? 0.45 : 0.65,
      }}
    />
  );
}
