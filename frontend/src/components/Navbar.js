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

  const getDashboardPath = () => {
    if (!user) return "/login";
    if (user.role === "admin" || user.role === "coordinator") return "/admin";
    if (user.role === "employer") return "/employer-dashboard";
    return "/user-dashboard";
  };

  return (
    <nav style={styles.nav} className="card-animate">
      <div style={styles.brandRow}>
        <img src="/lnbti-logo.png" style={{ width: "40px", height: "40px", borderRadius: "8px", objectFit: "contain" }} alt="LNBTI Logo" />
        <div>
          <h2 style={styles.logo}>LNBTI Progress Portal</h2>
          <p style={styles.subtle}>Lanka Nippon BizTech Institute</p>
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
            {user.role === "admin" && (
              <Link to="/admin/careers" style={styles.linkGhost} className="button-hover">
                Manage Careers
              </Link>
            )}
            <Link to={getDashboardPath()} style={styles.link} className="button-hover">
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
    color: "var(--btn-text)",
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
    color: "var(--btn-text)",
    textDecoration: "none",
    fontWeight: 700,
    letterSpacing: theme.typography.letter,
    border: "none",
  },
  linkGhost: {
    padding: "10px 14px",
    borderRadius: theme.radii.md,
    border: `1px solid ${theme.colors.border}`,
    background: "var(--card-item-bg)",
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
    color: "var(--btn-text)",
    fontWeight: 700,
    letterSpacing: theme.typography.letter,
    cursor: "pointer",
  },
};

export default Navbar;
