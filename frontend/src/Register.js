import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import apiClient from "./apiClient";
import theme from "./theme";
import { useToast } from "./components/ToastContext";

function Register() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "student",
    indexNumber: "",
    degreeBatch: "UGC (SE)",
    batchNumber: "SE1",
    academicYear: "Year 1",
    academicSemester: "Semester 1",
    degreeProgram: "BSc (Hons) Software Engineering",
    studentStage: "YEAR_1_2",
    companyName: "",
    designation: ""
  });
  const [pendingNotice, setPendingNotice] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "degreeBatch") {
      const defaultBatch = value === "UOG" ? "UOG1" : "SE1";
      setFormData({ ...formData, degreeBatch: value, batchNumber: defaultBatch });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await apiClient.post("/users/register", formData);

      if (res.data?.pendingApproval) {
        setPendingNotice(true);
        addToast("Registration submitted! Awaiting Coordinator approval.", "info");
      } else if (res.data?.ok) {
        addToast("Registration successful! Please login.", "success");
        navigate("/login");
      } else {
        addToast(res.data?.message || "Registration failed", "error");
      }
    } catch (error) {
      addToast(error.response?.data?.message || "Error registering user", "error");
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card} className="card-animate">
        <div style={{ ...styles.cardHeader, display: "flex", flexDirection: "column", alignItems: "center" }}>
          <img src="/lnbti-logo.png" style={{ width: "65px", height: "65px", objectFit: "contain", marginBottom: "8px" }} alt="LNBTI Logo" />
          <h2 style={styles.title}>LNBTI Progress Portal</h2>
          <p style={styles.lead}>Official University Registration & Career Guidance Ecosystem.</p>
        </div>

        {pendingNotice ? (
          <div style={{ padding: "20px", background: "rgba(99, 102, 241, 0.1)", borderRadius: "12px", border: "1px solid rgba(99, 102, 241, 0.3)", textAlign: "center" }}>
            <h3 style={{ color: "var(--accent)", margin: "0 0 10px 0" }}>🎉 Registration Submitted</h3>
            <p style={{ color: "var(--text-secondary)", fontSize: "14px", lineHeight: "1.5" }}>
              Your student registration has been routed to your <strong>LNBTI Academic Coordinator (Senior Lecturer)</strong>.
            </p>
            <p style={{ color: "var(--text-primary)", fontSize: "13px", marginTop: "10px", fontWeight: "600" }}>
              Once your coordinator approves your registration, you will be granted access to log in.
            </p>
            <button onClick={() => navigate("/login")} style={{ ...styles.button, marginTop: "15px" }} className="button-hover">
              Return to Login
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={styles.form}>
            <label style={styles.label}>
              Account Role
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                style={styles.select}
              >
                <option value="student" style={{ backgroundColor: "var(--bg)", color: "var(--text-primary)" }}>LNBTI Student</option>
                <option value="supervisor" style={{ backgroundColor: "var(--bg)", color: "var(--text-primary)" }}>Intern Company Supervisor (Recruiter)</option>
              </select>
            </label>

            <label style={styles.label}>
              Full Name
              <input
                name="name"
                placeholder="e.g., Kasun Perera"
                value={formData.name}
                onChange={handleChange}
                style={styles.input}
                required
              />
            </label>

            <label style={styles.label}>
              {formData.role === "student" ? "University Email" : "Email Address"}
              <input
                name="email"
                type="email"
                placeholder={formData.role === "student" ? "student@lnbti.edu.lk" : "you@company.com"}
                value={formData.email}
                onChange={handleChange}
                style={styles.input}
                required
              />
            </label>

            {formData.role === "student" && (
              <>
                <div style={{ display: "flex", gap: "10px" }}>
                  <label style={{ ...styles.label, flex: 1 }}>
                    Student Index Number
                    <input
                      name="indexNumber"
                      placeholder="e.g., UGC0323021"
                      value={formData.indexNumber}
                      onChange={handleChange}
                      style={styles.input}
                      required
                    />
                  </label>

                  <label style={{ ...styles.label, flex: 1 }}>
                    Degree Batch Category
                    <select
                      name="degreeBatch"
                      value={formData.degreeBatch}
                      onChange={handleChange}
                      style={styles.select}
                    >
                      <option value="UGC (SE)" style={{ backgroundColor: "var(--bg)", color: "var(--text-primary)" }}>UGC (SE)</option>
                      <option value="UOG" style={{ backgroundColor: "var(--bg)", color: "var(--text-primary)" }}>UOG (University of Greenwich)</option>
                    </select>
                  </label>
                </div>

                <div style={{ display: "flex", gap: "10px" }}>
                  <label style={{ ...styles.label, flex: 1 }}>
                    Academic Year (1 - 4)
                    <select
                      name="academicYear"
                      value={formData.academicYear}
                      onChange={handleChange}
                      style={styles.select}
                    >
                      <option value="Year 1" style={{ backgroundColor: "var(--bg)", color: "var(--text-primary)" }}>Year 1</option>
                      <option value="Year 2" style={{ backgroundColor: "var(--bg)", color: "var(--text-primary)" }}>Year 2</option>
                      <option value="Year 3" style={{ backgroundColor: "var(--bg)", color: "var(--text-primary)" }}>Year 3</option>
                      <option value="Year 4" style={{ backgroundColor: "var(--bg)", color: "var(--text-primary)" }}>Year 4</option>
                    </select>
                  </label>

                  <label style={{ ...styles.label, flex: 1 }}>
                    Semester
                    <select
                      name="academicSemester"
                      value={formData.academicSemester}
                      onChange={handleChange}
                      style={styles.select}
                    >
                      <option value="Semester 1" style={{ backgroundColor: "var(--bg)", color: "var(--text-primary)" }}>Semester 1</option>
                      <option value="Semester 2" style={{ backgroundColor: "var(--bg)", color: "var(--text-primary)" }}>Semester 2</option>
                    </select>
                  </label>
                </div>

                <div style={{ display: "flex", gap: "10px" }}>
                  <label style={{ ...styles.label, flex: 1 }}>
                    Batch Number
                    <select
                      name="batchNumber"
                      value={formData.batchNumber}
                      onChange={handleChange}
                      style={styles.select}
                    >
                      {formData.degreeBatch === "UOG" ? (
                        <>
                          <option value="UOG1" style={{ backgroundColor: "var(--bg)", color: "var(--text-primary)" }}>UOG1</option>
                          <option value="UOG2" style={{ backgroundColor: "var(--bg)", color: "var(--text-primary)" }}>UOG2</option>
                          <option value="UOG3" style={{ backgroundColor: "var(--bg)", color: "var(--text-primary)" }}>UOG3</option>
                          <option value="UOG4" style={{ backgroundColor: "var(--bg)", color: "var(--text-primary)" }}>UOG4</option>
                          <option value="UOG5" style={{ backgroundColor: "var(--bg)", color: "var(--text-primary)" }}>UOG5</option>
                          <option value="UOG6" style={{ backgroundColor: "var(--bg)", color: "var(--text-primary)" }}>UOG6</option>
                          <option value="UOG7" style={{ backgroundColor: "var(--bg)", color: "var(--text-primary)" }}>UOG7</option>
                          <option value="UOG8" style={{ backgroundColor: "var(--bg)", color: "var(--text-primary)" }}>UOG8</option>
                        </>
                      ) : (
                        <>
                          <option value="SE1" style={{ backgroundColor: "var(--bg)", color: "var(--text-primary)" }}>SE1</option>
                          <option value="SE2" style={{ backgroundColor: "var(--bg)", color: "var(--text-primary)" }}>SE2</option>
                          <option value="SE3" style={{ backgroundColor: "var(--bg)", color: "var(--text-primary)" }}>SE3</option>
                          <option value="SE4" style={{ backgroundColor: "var(--bg)", color: "var(--text-primary)" }}>SE4</option>
                          <option value="SE5" style={{ backgroundColor: "var(--bg)", color: "var(--text-primary)" }}>SE5</option>
                          <option value="SE6" style={{ backgroundColor: "var(--bg)", color: "var(--text-primary)" }}>SE6</option>
                          <option value="SE7" style={{ backgroundColor: "var(--bg)", color: "var(--text-primary)" }}>SE7</option>
                          <option value="SE8" style={{ backgroundColor: "var(--bg)", color: "var(--text-primary)" }}>SE8</option>
                        </>
                      )}
                    </select>
                  </label>

                  <label style={{ ...styles.label, flex: 1 }}>
                    Initial Academic Stage
                    <select
                      name="studentStage"
                      value={formData.studentStage}
                      onChange={handleChange}
                      style={styles.select}
                    >
                      <option value="YEAR_1_2" style={{ backgroundColor: "var(--bg)", color: "var(--text-primary)" }}>1st / 2nd Year</option>
                      <option value="YEAR_3_INTERN" style={{ backgroundColor: "var(--bg)", color: "var(--text-primary)" }}>3rd Year Intern Ready</option>
                      <option value="FINAL_YEAR_JOB" style={{ backgroundColor: "var(--bg)", color: "var(--text-primary)" }}>Final Year Job Expecting</option>
                    </select>
                  </label>
                </div>

                <label style={styles.label}>
                  Degree Program
                  <input
                    name="degreeProgram"
                    placeholder="e.g., BSc (Hons) Software Engineering"
                    value={formData.degreeProgram}
                    onChange={handleChange}
                    style={styles.input}
                  />
                </label>
              </>
            )}

            {formData.role === "supervisor" && (
              <>
                <label style={styles.label}>
                  Company / Organization Name
                  <input
                    name="companyName"
                    placeholder="e.g., IFS / Virtusa / 99x"
                    value={formData.companyName}
                    onChange={handleChange}
                    style={styles.input}
                    required
                  />
                </label>
                <label style={styles.label}>
                  Designation / Role
                  <input
                    name="designation"
                    placeholder="e.g., Senior Tech Lead / HR Lead"
                    value={formData.designation}
                    onChange={handleChange}
                    style={styles.input}
                  />
                </label>
              </>
            )}

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

            <button type="submit" style={styles.button} className="button-hover">
              Submit Registration
            </button>
          </form>
        )}

        <p style={styles.text}>
          Already registered?{" "}
          <Link to="/login" style={styles.link} className="button-hover">
            Login here
          </Link>
        </p>
      </div>
    </div>
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
    backgroundColor: "var(--glass-bg-alt)", // Slight background to match input
    color: "var(--text-primary)" // Ensure text is visible
  },
  button: {
    ...theme.button("secondary"),
    width: "100%",
    marginTop: theme.spacing.xs,
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