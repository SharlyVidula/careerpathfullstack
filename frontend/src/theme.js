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
    fontFamily: "'Inter', 'Space Grotesk', system-ui, -apple-system, sans-serif",
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
      background: this.colors.surface,
      borderRadius: this.radii.xl,
      padding,
      border: `1px solid ${this.colors.border}`,
      backdropFilter: `blur(${this.blur.heavy})`,
      boxShadow: `${this.shadows.soft}, ${this.shadows.inner}`,
    };
  },
  button(kind = "primary") {
    const palette = {
      primary: this.gradients.primary,
      secondary: this.gradients.secondary,
      danger: this.gradients.danger,
    };
    return {
      backgroundImage: palette[kind] || palette.primary,
      color: "var(--btn-text)",
      border: "none",
      borderRadius: this.radii.md,
      padding: "14px 16px",
      fontWeight: 700,
      letterSpacing: this.typography.letter,
      cursor: "pointer",
      boxShadow: this.shadows.glow,
      transition: this.motion.hover,
    };
  },
  input() {
    return {
      width: "100%",
      padding: "12px 14px",
      borderRadius: this.radii.md,
      border: `1px solid ${this.colors.border}`,
      background: this.colors.surfaceAlt,
      color: this.colors.textPrimary,
      outline: "none",
      transition: this.motion.hover,
    };
  },
};

export default theme;