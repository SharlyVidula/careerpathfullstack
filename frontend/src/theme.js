const theme = {
  colors: {
    background: "var(--bg)",
    surface: "var(--surface)",
    surfaceAlt: "var(--surface-alt)",
    border: "var(--border)",
    textPrimary: "var(--text-primary)",
    textSecondary: "var(--text-secondary)",
    accent: "var(--accent)",
    accentStrong: "var(--accent-strong)",
    success: "var(--success)",
    danger: "var(--danger)",
  },
  gradients: {
    background: "var(--grad-bg)",
    glassEdge: "var(--grad-glass-edge)",
    primary: "var(--grad-primary)",
    secondary: "var(--grad-secondary)",
    danger: "var(--grad-danger)",
  },
  radii: {
    xl: "24px",
    lg: "18px",
    md: "14px",
    sm: "12px",
  },
  shadows: {
    soft: "0 18px 50px rgba(5, 12, 30, 0.45)",
    glow: "0 12px 40px rgba(103, 232, 249, 0.25)",
    inner: "inset 0 1px 0 rgba(255,255,255,0.06)",
  },
  blur: {
    heavy: "18px",
    medium: "12px",
  },
  spacing: {
    xs: "8px",
    sm: "12px",
    md: "16px",
    lg: "20px",
    xl: "28px",
  },
  typography: {
    fontFamily: "'Share Tech Mono', 'Space Grotesk', 'Inter', system-ui, -apple-system, sans-serif",
    headingWeight: 800,
    bodyWeight: 500,
    letter: "0.2px",
  },
  motion: {
    hover: "all 200ms ease",
    card: "transform 320ms ease, box-shadow 320ms ease",
  },
  glassPanel(padding = "20px") {
    return {
      background: "var(--glass-bg)",
      borderRadius: this.radii.xl,
      padding,
      border: "1px solid var(--glass-border)",
      borderTopColor: "var(--glass-border-top)",
      backdropFilter: "blur(var(--glass-blur))",
      WebkitBackdropFilter: "blur(var(--glass-blur))",
      boxShadow: "var(--glass-shadow)",
      transition: "box-shadow 0.32s ease, transform 0.32s ease, background 0.32s ease",
    };
  },
  button(kind = "primary") {
    // Gradient tokens are CSS variables — they flip automatically with light/dark mode
    const bgVar = {
      primary:   "var(--btn-grad-primary)",
      secondary: "var(--btn-grad-secondary)",
      danger:    "var(--btn-grad-danger)",
      ghost:     "transparent",
    };
    const textColor = {
      primary:   "var(--btn-text)",
      secondary: "var(--btn-text)",
      danger:    "var(--btn-text)",
      ghost:     "var(--accent)",
    };
    const border = {
      primary:   "none",
      secondary: "none",
      danger:    "none",
      ghost:     "1px solid var(--btn-grad-ghost-border)",
    };
    return {
      backgroundImage: bgVar[kind]   || bgVar.primary,
      color:           textColor[kind] || textColor.primary,
      border:          border[kind]    || "none",
      borderRadius:    this.radii.md,
      padding:         "12px 22px",
      fontWeight:      700,
      letterSpacing:   this.typography.letter,
      cursor:          "pointer",
      fontSize:        "13px",
      boxShadow:       "4px 4px 10px rgba(0,0,0,0.22), -2px -2px 8px rgba(255,255,255,0.04)",
    };
  },
  input() {
    return {
      width: "100%",
      padding: "14px 16px",
      borderRadius: this.radii.md,
      border: "1px solid var(--glass-border)",
      borderTopColor: "var(--glass-border-top)",
      background: "var(--glass-bg-alt)",
      color: "var(--text-primary)",
      backdropFilter: "blur(12px)",
      WebkitBackdropFilter: "blur(12px)",
      boxShadow: "var(--glass-inset)",
      outline: "none",
      fontSize: "14px",
    };
  },
};

export default theme;