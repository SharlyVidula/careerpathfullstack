import React from "react";
import { Link, useNavigate } from "react-router-dom";
import theme from "../theme";

function Navbar() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <nav style={styles.nav} className="card-animate">
      <div style={styles.brandRow}>
        <div style={styles.badge}>CP</div>
        <div>
          <h2 style={styles.logo}>CareerPath</h2>
          <p style={styles.subtle}>Future-forward guidance</p>
        </div>
      </div>

      <div style={styles.links}>
        {!user ? (
          <>
            <Link to="/register" style={styles.link} className="button-hover">
              Register
            </Link>
            <Link to="/login" style={styles.linkGhost} className="button-hover">
              Login
            </Link>
          </>
        ) : (
          <>
            <Link to="/dashboard" style={styles.link} className="button-hover">
              Dashboard
            </Link>
            <button onClick={handleLogout} style={styles.logoutBtn} className="button-hover">
              Logout
            </button>
          </>
        )}
      </div>
    </nav>
  );
}

const styles = {
  nav: {
    ...theme.glassPanel("14px 18px"),
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: theme.spacing.lg,
    position: "sticky",
    top: "12px",
    zIndex: 5,
    backdropFilter: `blur(${theme.blur.heavy})`,
    border: `1px solid ${theme.colors.border}`,
  },
  brandRow: {
    display: "flex",
    alignItems: "center",
    gap: theme.spacing.sm,
  },
  badge: {
    width: "40px",
    height: "40px",
    borderRadius: theme.radii.md,
    background: theme.gradients.primary,
    display: "grid",
    placeItems: "center",
    fontWeight: 800,
    color: "#0b1224",
    boxShadow: theme.shadows.glow,
  },
  logo: {
    margin: 0,
    fontSize: "18px",
    letterSpacing: "0.4px",
    fontWeight: 700,
  },
  subtle: {
    margin: 0,
    fontSize: "12px",
    color: theme.colors.textSecondary,
  },
  links: {
    display: "flex",
    alignItems: "center",
    gap: theme.spacing.sm,
  },
  link: {
    padding: "10px 14px",
    borderRadius: theme.radii.md,
    background: theme.gradients.secondary,
    color: "#0b1224",
    textDecoration: "none",
    fontWeight: 700,
    letterSpacing: theme.typography.letter,
    border: "none",
  },
  linkGhost: {
    padding: "10px 14px",
    borderRadius: theme.radii.md,
    border: `1px solid ${theme.colors.border}`,
    background: "rgba(255, 255, 255, 0.02)",
    color: theme.colors.textPrimary,
    textDecoration: "none",
    fontWeight: 700,
    letterSpacing: theme.typography.letter,
  },
  logoutBtn: {
    padding: "10px 14px",
    borderRadius: theme.radii.md,
    border: "none",
    background: theme.gradients.danger,
    color: "#0b1224",
    fontWeight: 700,
    letterSpacing: theme.typography.letter,
    cursor: "pointer",
  },
};

export default Navbar;
