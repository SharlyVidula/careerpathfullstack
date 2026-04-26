import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import apiClient from "./apiClient";
import theme from "./theme";

function Register() {
  const navigate = useNavigate();
  // NEW: Added 'role' to state
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "user" // Default role
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await apiClient.post("/users/register", formData);

      if (res.data && res.data.message.includes("Registered")) {
        alert("Registration successful! Please login.");
        navigate("/login");
      } else {
        alert(res.data.message || "Registration failed");
      }
    } catch (error) {
      alert(error.response?.data?.message || "Error registering user");
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card} className="card-animate">
        <div style={styles.cardHeader}>
          <p style={styles.badge}>Step one</p>
          <h2 style={styles.title}>Create an Account</h2>
          <p style={styles.lead}>Save your journey and unlock tailored recommendations.</p>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          <label style={styles.label}>
            Full Name
            <input
              name="name"
              placeholder="e.g., Alex Johnson"
              value={formData.name}
              onChange={handleChange}
              style={styles.input}
              required
            />
          </label>

          <label style={styles.label}>
            Email
            <input
              name="email"
              placeholder="you@example.com"
              value={formData.email}
              onChange={handleChange}
              style={styles.input}
              required
            />
          </label>

          <label style={styles.label}>
            Password
            <input
              name="password"
              type="password"
              placeholder="Create a secure password"
              value={formData.password}
              onChange={handleChange}
              style={styles.input}
              required
            />
          </label>

          {/* Role Selection Dropdown with Theme */}
          <label style={styles.label}>
            I am a:
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              style={styles.select}
            >
              <option value="user">Job Seeker (Student)</option>
              <option value="employer">Employer (Recruiter)</option>
            </select>
          </label>

          <button type="submit" style={styles.button} className="button-hover">
            Create account
          </button>
        </form>

        <p style={styles.text}>
          Already registered?{" "}
          <Link to="/login" style={styles.link} className="button-hover">
            Login here
          </Link>
        </p>
      </div>
    </div >
  );
}

const styles = {
  page: {
    display: "flex",
    justifyContent: "center",
    padding: "10px 0 40px",
  },
  card: {
    ...theme.glassPanel("28px"),
    width: "420px",
    color: theme.colors.textPrimary,
    position: "relative",
    overflow: "hidden",
  },
  cardHeader: {
    textAlign: "left",
    marginBottom: theme.spacing.md,
  },
  title: {
    color: theme.colors.textPrimary,
    margin: "6px 0 6px",
    fontSize: "24px",
    letterSpacing: "0.2px",
  },
  lead: {
    margin: 0,
    color: theme.colors.textSecondary,
    fontSize: "14px",
    lineHeight: 1.5,
  },
  badge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    padding: "6px 12px",
    borderRadius: theme.radii.md,
    background: theme.gradients.glassEdge,
    border: `1px solid ${theme.colors.border}`,
    color: theme.colors.textSecondary,
    fontSize: "12px",
    letterSpacing: "0.1em",
    textTransform: "uppercase",
  },
  form: {
    display: "grid",
    gap: theme.spacing.sm,
  },
  label: {
    display: "grid",
    gap: theme.spacing.xs,
    textAlign: "left",
    fontSize: "14px",
    color: theme.colors.textPrimary,
    letterSpacing: theme.typography.letter,
  },
  input: {
    ...theme.input(),
  },
  // NEW: Style for the Select Dropdown to match your Inputs
  select: {
    ...theme.input(),
    appearance: "none", // Removes default arrow (optional, keeps it cleaner)
    backgroundImage: `url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%22//www.w3.org/2000/svg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23FFFFFF%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22/%3E%3C/svg%3E")`,
    backgroundRepeat: "no-repeat",
    backgroundPosition: "right .7em top 50%",
    backgroundSize: ".65em auto",
    backgroundColor: "rgba(255, 255, 255, 0.05)", // Slight background to match input
    color: "white" // Ensure text is visible
  },
  button: {
    ...theme.button("secondary"),
    width: "100%",
    marginTop: theme.spacing.xs,
    color: "#041024",
  },
  text: {
    marginTop: theme.spacing.md,
    textAlign: "center",
    color: theme.colors.textSecondary,
  },
  link: {
    color: theme.colors.textPrimary,
    textDecoration: "none",
    fontWeight: 700,
    marginLeft: "6px",
    padding: "6px 10px",
    borderRadius: theme.radii.sm,
    border: `1px solid ${theme.colors.border}`,
    background: "rgba(255, 255, 255, 0.04)",
  },
};

export default Register;