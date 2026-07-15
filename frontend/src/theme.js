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
    btnText: "var(--btn-text)",
    cardItemBg: "var(--card-item-bg)",
    cardItemBorder: "var(--card-item-border)",
  },
  gradients: {
    background: "var(--grad-bg)",
    glassEdge: "var(--grad-glass-edge)",
    primary: "var(--grad-primary)",
    secondary: "var(--grad-secondary)",
    danger: "var(--grad-danger)",
  },
  radii: {
    xl: "16px",
    lg: "12px",
    md: "8px",
    sm: "6px",
  },
  shadows: {
    soft: "0 10px 30px rgba(0, 0, 0, 0.15)",
    glow: "0 8px 24px rgba(99, 102, 241, 0.12)",
    inner: "inset 0 1px 0 rgba(255,255,255,0.05)",
  },
  blur: {
    heavy: "20px",
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
    fontFamily: "'Plus Jakarta Sans', 'Inter', system-ui, -apple-system, sans-serif",
    headingWeight: 700,
    bodyWeight: 500,
    letter: "normal",
  },
  motion: {
    hover: "all 200ms ease",
    card: "transform 250ms ease, box-shadow 250ms ease",
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
      transition: "box-shadow 0.25s ease, transform 0.25s ease, background 0.25s ease",
    };
  },
  button(kind = "primary") {
    const bgVar = {
      primary:   "var(--btn-grad-primary)",
      secondary: "var(--btn-grad-secondary)",
      danger:    "var(--btn-grad-danger)",
      ghost:     "transparent",
      outline:   "transparent",
    };
    const textColor = {
      primary:   "var(--btn-text)",
      secondary: "var(--btn-text)",
      danger:    "var(--btn-text)",
      ghost:     "var(--accent)",
      outline:   "var(--accent)",
    };
    const border = {
      primary:   "none",
      secondary: "none",
      danger:    "none",
      ghost:     "1px solid var(--btn-grad-ghost-border)",
      outline:   "1px solid var(--btn-grad-ghost-border)",
    };
    return {
      backgroundImage: bgVar[kind]   || bgVar.primary,
      color:           textColor[kind] || textColor.primary,
      border:          border[kind]    || "none",
      borderRadius:    this.radii.md,
      padding:         "10px 20px",
      fontWeight:      600,
      letterSpacing:   this.typography.letter,
      cursor:          "pointer",
      fontSize:        "13px",
      transition:      "transform 0.18s ease, box-shadow 0.18s ease, filter 0.18s ease",
    };
  },
  input() {
    return {
      width: "100%",
      padding: "12px 16px",
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
      transition: "border-color 0.2s ease, box-shadow 0.2s ease",
    };
  },
};

export default theme;