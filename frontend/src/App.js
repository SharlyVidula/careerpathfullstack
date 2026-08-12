import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import theme from "./theme";
import { ToastProvider } from "./components/ToastContext";
import FloatingAI from "./components/FloatingAI";
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
  return (
    <ToastProvider>
      <Router>
        <div style={styles.viewport}>

          {/* ── Depth layer 0: particle network canvas ── */}
          <ParticleCanvas />

          {/* ── Depth layer 1: app content ── */}
          <div className="glow-shell">
            <ThemeToggle />
            <Navbar />

            <header style={styles.header}>
              <div style={styles.badge}>Lanka Nippon BizTech Institute</div>
              <h1 style={styles.title}>LNBTI Progress Portal</h1>
              <p style={styles.subtitle}>
                Official University Platform for Academic Guidance, Portfolio Telemetry, and Internship Placement matching.
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