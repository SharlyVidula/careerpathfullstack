import React, { useEffect, useRef } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import theme from "./theme";
import { ToastProvider } from "./components/ToastContext";
import FloatingAI from "./components/FloatingAI";
import RetroBootSequence from "./components/RetroBootSequence";
import ParticleCanvas from "./components/ParticleCanvas";
// Import Pages
import Register from "./Register";
import Login from "./Login";
import JDMatch from "./pages/JDMatch";
import GrowthTracker from "./pages/GrowthTracker";
import ThemeToggle from "./components/ThemeToggle";
import OAuthCallback from "./OAuthCallback";
// Import Dashboards
import AdminDashboard from "./pages/AdminDashboard";
import AdminCareers from "./pages/AdminCareers";
import UserDashboard from "./pages/UserDashboard";
import EmployerDashboard from "./pages/EmployerDashboard";

function App() {
  const orbOneRef = useRef(null);
  const orbTwoRef = useRef(null);

  /* ── Mouse-parallax + ambient drift on background orbs ── */
  useEffect(() => {
    let t = 0;
    let animId;
    let mouseX = window.innerWidth  / 2;
    let mouseY = window.innerHeight / 2;

    const onMove = (e) => { mouseX = e.clientX; mouseY = e.clientY; };
    window.addEventListener("mousemove", onMove, { passive: true });

    const animate = () => {
      t += 0.006;

      const px = (mouseX / window.innerWidth  - 0.5);  // -0.5 → 0.5
      const py = (mouseY / window.innerHeight - 0.5);

      // Orb 1: gentle sine drift + forward parallax
      if (orbOneRef.current) {
        const dx = Math.sin(t)       * 18 + px * 55;
        const dy = Math.cos(t * 0.7) * 14 + py * 40;
        orbOneRef.current.style.transform = `translate(${dx}px, ${dy}px)`;
      }
      // Orb 2: counter-drift — opposite direction for depth illusion
      if (orbTwoRef.current) {
        const dx = Math.cos(t * 0.85) * 14 - px * 38;
        const dy = Math.sin(t * 0.6)  * 20 - py * 28;
        orbTwoRef.current.style.transform = `translate(${dx}px, ${dy}px)`;
      }

      animId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("mousemove", onMove);
    };
  }, []);

  return (
    <ToastProvider>
      <RetroBootSequence />
      <Router>
        <div style={styles.viewport}>

          {/* ── Depth layer 0: particle network canvas ── */}
          <ParticleCanvas />

          {/* ── Depth layer 1: scanlines + perspective grid ── */}
          <div className="scanlines" aria-hidden />
          <div className="neon-grid" aria-hidden />
          <div className="neon-grid-perspective" aria-hidden />

          {/* ── Depth layer 2: parallax neon orbs ── */}
          <div ref={orbOneRef} className="float-orb one" aria-hidden />
          <div ref={orbTwoRef} className="float-orb two" aria-hidden />

          {/* ── Depth layer 3: app content ── */}
          <div className="glow-shell">
            <ThemeToggle />
            <Navbar />

            <header style={styles.header}>
              <div style={styles.badge}>Career navigation</div>
              <h1 style={styles.title}>Design your next move</h1>
              <p style={styles.subtitle}>
                A futuristic, calm space to create an account, log in, and uncover tailored
                career recommendations crafted around your strengths.
              </p>
            </header>

            <main style={styles.content}>
              <Routes>
                {/* Public Routes */}
                <Route path="/"          element={<Register />} />
                <Route path="/register"  element={<Register />} />
                <Route path="/login"     element={<Login />} />
                <Route path="/oauth/callback" element={<OAuthCallback />} />

                {/* Feature Routes */}
                <Route path="/growth"    element={<GrowthTracker />} />
                <Route path="/jd-match"  element={<JDMatch />} />

                {/* Role-based Dashboards */}
                <Route path="/user-dashboard"     element={<UserDashboard />} />
                <Route path="/employer-dashboard" element={<EmployerDashboard />} />
                <Route path="/admin"              element={<AdminDashboard />} />
                <Route path="/admin/careers"      element={<AdminCareers />} />

                {/* Fallback */}
                <Route path="/dashboard" element={<UserDashboard />} />
              </Routes>
            </main>
          </div>

          <FloatingAI />
        </div>
      </Router>
    </ToastProvider>
  );
}

const styles = {
  viewport: {
    minHeight: "100vh",
    background: theme.gradients.background,
    position: "relative",
    isolation: "isolate", // new stacking context so z-layers behave correctly
  },
  header: {
    ...theme.glassPanel("26px"),
    marginTop:    theme.spacing.sm,
    marginBottom: theme.spacing.lg,
    textAlign:    "center",
    position:     "relative",
    zIndex:       1,
    overflow:     "hidden",
  },
  badge: {
    display:         "inline-flex",
    alignItems:      "center",
    gap:             "8px",
    padding:         "8px 14px",
    borderRadius:    theme.radii.md,
    background:      theme.gradients.glassEdge,
    border:          `1px solid ${theme.colors.border}`,
    color:           theme.colors.textSecondary,
    letterSpacing:   "0.18em",
    textTransform:   "uppercase",
    fontSize:        "11px",
    fontWeight:      700,
  },
  title: {
    margin:      "14px 0 8px",
    fontSize:    "32px",
    letterSpacing: "0.2px",
    color:       theme.colors.textPrimary,
    fontWeight:  theme.typography.headingWeight,
  },
  subtitle: {
    margin:       0,
    color:        theme.colors.textSecondary,
    fontSize:     "16px",
    maxWidth:     "760px",
    marginLeft:   "auto",
    marginRight:  "auto",
    lineHeight:   1.6,
  },
  content: {
    position: "relative",
    zIndex:   1,
  },
};

export default App;