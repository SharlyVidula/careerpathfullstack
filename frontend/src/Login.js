import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import theme from "./theme";

export default function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await axios.post("http://localhost:5000/api/users/login", formData);

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
        alert("Your email is unverified! Please register again or contact an administrator to get your code.");
      } else {
        alert(err.response?.data?.message || "Login failed");
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
  }
};