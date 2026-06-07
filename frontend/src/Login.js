import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import apiClient, { BACKEND_URL } from "./apiClient";
import theme from "./theme";
import { useToast } from "./components/ToastContext";
import { FaGoogle, FaGithub, FaLinkedin } from "react-icons/fa";

export default function Login() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await apiClient.post("/users/login", formData);

      // 1. Save User Data
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));

      // 2. ⭐ REDIRECTION LOGIC (The Fix) ⭐
      const role = res.data.user.role; // Get role from backend

      if (role === "admin") {
        navigate("/admin");
      } else if (role === "employer") {
        navigate("/employer-dashboard"); // ✅ Now Employers go here
      } else {
        navigate("/user-dashboard"); // Students go here
      }

    } catch (err) {
      if (err.response?.data?.unverified) {
        addToast("Your email is unverified! Please register again or contact an administrator to get your code.", "warning");
      } else {
        addToast(err.response?.data?.message || "Login failed", "error");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card} className="card-animate">
        <h2 style={styles.title}>Login</h2>
        <p style={styles.subtitle}>Welcome back to CareerClusteryoyo</p>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Email</label>
            <input
              name="email"
              type="email"
              placeholder="Enter your email"
              onChange={handleChange}
              style={styles.input}
              required
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Password</label>
            <input
              name="password"
              type="password"
              placeholder="••••••••"
              onChange={handleChange}
              style={styles.input}
              required
            />
          </div>

          <button type="submit" style={styles.button} disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <div style={styles.oauthContainer}>
          <p style={styles.oauthText}>Or login with</p>
          <div style={styles.oauthButtons}>
            <a href={`${BACKEND_URL}/api/auth/google`} style={styles.oauthBtn}>
              <FaGoogle style={styles.oauthIcon} /> Google
            </a>
            <a href={`${BACKEND_URL}/api/auth/github`} style={styles.oauthBtn}>
              <FaGithub style={styles.oauthIcon} /> GitHub
            </a>
            <a href={`${BACKEND_URL}/api/auth/linkedin`} style={styles.oauthBtn}>
              <FaLinkedin style={styles.oauthIcon} /> LinkedIn
            </a>
          </div>
        </div>

        <p style={styles.footerText}>
          Don't have an account? <Link to="/register" style={styles.link}>Sign up</Link>
        </p>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px"
  },
  card: {
    ...theme.glassPanel("24px"),
    width: "100%",
    maxWidth: "400px",
    padding: "40px",
    textAlign: "center"
  },
  title: {
    fontSize: "28px",
    fontWeight: "700",
    color: theme.colors.textPrimary,
    marginBottom: "10px"
  },
  subtitle: {
    color: theme.colors.textSecondary,
    marginBottom: "30px",
    fontSize: "14px"
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "20px"
  },
  inputGroup: {
    textAlign: "left"
  },
  label: {
    display: "block",
    color: theme.colors.textSecondary,
    fontSize: "12px",
    marginBottom: "8px",
    fontWeight: "600"
  },
  input: {
    width: "100%",
    padding: "12px 16px",
    background: "rgba(255, 255, 255, 0.05)",
    border: `1px solid ${theme.colors.border}`,
    borderRadius: theme.radii.md,
    color: "white",
    fontSize: "14px",
    outline: "none",
    transition: "border-color 0.2s"
  },
  button: {
    ...theme.button("primary"),
    width: "100%",
    marginTop: "10px"
  },
  footerText: {
    marginTop: "20px",
    color: theme.colors.textSecondary,
    fontSize: "14px"
  },
  link: {
    color: theme.colors.accent,
    textDecoration: "none",
    fontWeight: "600"
  },
  oauthContainer: {
    marginTop: "20px",
    paddingTop: "20px",
    borderTop: `1px solid ${theme.colors.border}`
  },
  oauthText: {
    color: theme.colors.textSecondary,
    fontSize: "12px",
    marginBottom: "15px"
  },
  oauthButtons: {
    display: "flex",
    gap: "10px",
    justifyContent: "center"
  },
  oauthBtn: {
    ...theme.button("outline"),
    flex: 1,
    padding: "8px",
    fontSize: "13px",
    textDecoration: "none",
    textAlign: "center",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px"
  },
  oauthIcon: {
    fontSize: "16px"
  }
};