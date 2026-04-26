import React, { useEffect, useState } from "react";
import axios from "axios";
import theme from "../theme";
import BentoCard from "../components/BentoCard";

export default function EmployerDashboard() {
  const [candidates, setCandidates] = useState([]);
  const [user, setUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [myJobs, setMyJobs] = useState([]);

  // 🆕 State for Job Form
  const [jobForm, setJobForm] = useState({ title: "", description: "", salary: "", location: "" });

  useEffect(() => {
    // 1. Check Login
    const data = localStorage.getItem("user");
    if (data) {
      const parsed = JSON.parse(data);
      setUser(parsed);
      fetchMyJobs(parsed.id);
    }
    // 2. Fetch Candidates
    fetchCandidates();
  }, []);

  const fetchMyJobs = async (employerId) => {
    try {
      const res = await axios.get(`http://localhost:5000/api/users/employer-jobs?employerId=${employerId}`);
      setMyJobs(res.data.jobs || []);
    } catch (err) {
      console.error("Error fetching my jobs", err);
    }
  };

  const fetchCandidates = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/users/candidates");
      setCandidates(res.data.candidates || []);
    } catch (err) {
      console.error("Error fetching candidates", err);
    }
  };

  const sendRequest = async (employeeId) => {
    if (!user) return alert("Please login first");
    try {
      await axios.post("http://localhost:5000/api/users/request-connection", {
        employerId: user.id,
        employeeId: employeeId
      });
      alert("Request sent! Admin will review it shortly.");
    } catch (err) {
      alert("Error: " + (err.response?.data?.message || "Could not send request"));
    }
  };

  // 🆕 Function to Post Job
  const handlePostJob = async (e) => {
    e.preventDefault();
    if (!user) return alert("Please login first");

    try {
      await axios.post("http://localhost:5000/api/users/post-job", {
        ...jobForm,
        employerId: user.id
      });
      alert("✅ Job Posted! It is now pending Admin approval.");
      setJobForm({ title: "", description: "", salary: "", location: "" }); // Clear form
    } catch (err) {
      alert("Error posting job: " + err.message);
    }
  };

  return (
    <div className="bento-grid" style={styles.page}>
      {/* Header Card - Spans 4 Columns */}
      <BentoCard colSpan={4} padding="32px">
        <h2 style={styles.title}>Employer Portal</h2>
        <p style={styles.subText}>Welcome, {user?.name}. Manage recruitment and vacancies.</p>
        <div style={styles.pillRow}>
          <span style={styles.pillSecondary}>Recruiter Access</span>
        </div>
      </BentoCard>

      {/* 📢 NEW SECTION: Post a Job Vacancy - Spans 2 Columns */}
      <BentoCard colSpan={2}>
        <h3 style={{ ...styles.title, marginBottom: 20, color: "#34d399" }}>📢 Post a New Vacancy</h3>
        <form onSubmit={handlePostJob} style={styles.formGrid}>
          <div style={{ display: 'flex', gap: '10px' }}>
            <input
              placeholder="Job Title (e.g. Head Chef)"
              value={jobForm.title}
              onChange={(e) => setJobForm({ ...jobForm, title: e.target.value })}
              style={styles.input}
              required
            />
            <input
              placeholder="Salary (e.g. $4000/mo)"
              value={jobForm.salary}
              onChange={(e) => setJobForm({ ...jobForm, salary: e.target.value })}
              style={styles.input}
              required
            />
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <input
              placeholder="Location (e.g. Colombo / Remote)"
              value={jobForm.location}
              onChange={(e) => setJobForm({ ...jobForm, location: e.target.value })}
              style={styles.input}
              required
            />
          </div>
          <textarea
            placeholder="Job Description & Requirements..."
            value={jobForm.description}
            onChange={(e) => setJobForm({ ...jobForm, description: e.target.value })}
            style={{ ...styles.input, height: '80px', resize: 'none' }}
            required
          />
          <button type="submit" style={styles.postBtn} className="button-hover">Submit for Approval</button>
        </form>
      </BentoCard>

      {/* 📊 NEW SECTION: Your Posted Vacancies - Spans 2 Columns */}
      <BentoCard colSpan={2}>
        <h3 style={{ ...styles.title, marginBottom: 20 }}>📊 Your Posted Vacancies</h3>
        {myJobs.length === 0 ? (
          <p style={{ color: "#888" }}>You haven't posted any jobs yet.</p>
        ) : (
          <div style={styles.grid}>
            {myJobs.map(job => (
              <div key={job._id} style={styles.candidateCard}>
                <div>
                  <h4 style={{ margin: "0 0 5px 0", color: "white" }}>{job.title}</h4>
                  <span style={{ fontSize: "12px", color: job.status === "approved" ? "#34d399" : "#fbbf24", fontWeight: "bold", background: job.status === "approved" ? "rgba(52, 211, 153, 0.1)" : "rgba(251, 191, 36, 0.2)", padding: "2px 8px", borderRadius: "4px" }}>
                    {job.status.toUpperCase()}
                  </span>
                  <p style={{ color: "#aaa", fontSize: "13px", marginTop: "10px" }}>
                    {job.location} • {job.salary}
                  </p>
                </div>
                <div style={{ marginTop: "15px", paddingTop: "15px", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
                  <strong style={{ color: "#34d399", fontSize: "24px" }}>{job.applyClicks || 0}</strong>
                  <span style={{ color: "#888", fontSize: "13px", marginLeft: "8px" }}>Applies / Clicks</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </BentoCard>

      {/* Candidates Grid - Spans 4 Columns */}
      <BentoCard colSpan={4}>
        <h3 style={{ ...styles.title, marginBottom: 20 }}>Available Candidates</h3>

        {/* Search Input */}
        <div style={{ marginBottom: 20 }}>
          <input
            type="text"
            placeholder="🔍 Filter by Role (e.g., UI Engineer, Data Scientist)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={styles.searchInput}
          />
        </div>

        <div style={styles.grid}>
          {candidates
            .filter((c) => {
              if (!searchTerm) return true;
              const role = c.seekingRole || "";
              return role.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (c.name || "").toLowerCase().includes(searchTerm.toLowerCase());
            })
            .map((c) => (
              <div key={c._id} style={styles.candidateCard}>
                <div>
                  <div style={styles.avatar}>
                    {c.profilePic ? <img src={c.profilePic} style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} alt="Profile" /> : c.name?.[0]}
                  </div>
                  <h4 style={{ margin: "10px 0 5px", color: theme.colors.textPrimary }}>{c.name}</h4>

                  <div style={{ display: "flex", gap: "5px", flexWrap: "wrap", marginBottom: "8px" }}>
                    {c.seekingRole ? (
                      <span style={styles.roleTag}>{c.seekingRole}</span>
                    ) : (
                      <span style={{ ...styles.roleTag, background: "#333", color: "#888" }}>General Applicant</span>
                    )}
                    {c.atsScore > 0 && <span style={{ ...styles.roleTag, background: "#10b981", color: "#000" }}>ATS: {c.atsScore}%</span>}
                  </div>

                  <p style={{ margin: "10px 0 0", color: theme.colors.textSecondary, fontSize: 13 }}>📧 {c.email}</p>

                  {/* Skills and bio snippet */}
                  {c.skills && c.skills.length > 0 && (
                    <div style={{ marginTop: "12px" }}>
                      <strong style={{ fontSize: "12px", color: theme.colors.textPrimary }}>Key Skills:</strong>
                      <div style={{ display: "flex", gap: "4px", flexWrap: "wrap", marginTop: "4px" }}>
                        {c.skills.slice(0, 4).map((skill, idx) => (
                          <span key={idx} style={{ fontSize: "11px", color: theme.colors.textSecondary, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "4px", padding: "2px 6px" }}>{skill}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {c.bioSnippet && (
                    <div style={{ marginTop: "12px" }}>
                      <strong style={{ fontSize: "12px", color: theme.colors.textPrimary }}>Bio Snippet:</strong>
                      <p style={{ fontSize: "12px", color: theme.colors.textSecondary, marginTop: "4px", lineHeight: "1.4" }}>"{c.bioSnippet}"</p>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => sendRequest(c._id)}
                  style={styles.connectBtn}
                  className="button-hover"
                >
                  Request Connection
                </button>
              </div>
            ))}
        </div>

        {candidates.length > 0 && candidates.filter(c =>
          (c.seekingRole || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
          (c.name || "").toLowerCase().includes(searchTerm.toLowerCase())
        ).length === 0 && (
            <p style={{ color: "#888", textAlign: "center" }}>No candidates found matching "{searchTerm}"</p>
          )}

      </BentoCard>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    padding: "24px 18px 60px",
    maxWidth: "1600px", margin: "0 auto"
  },
  title: {
    fontSize: "22px",
    margin: 0,
    fontWeight: 700,
    color: theme.colors.textPrimary
  },
  subText: {
    fontSize: "14px",
    color: theme.colors.textSecondary,
    margin: "4px 0 0",
  },
  pillRow: {
    display: "flex",
    marginTop: theme.spacing.sm,
  },
  pillSecondary: {
    padding: "8px 12px",
    background: "rgba(14,165,233,0.14)",
    borderRadius: "999px",
    border: "1px solid rgba(14,165,233,0.3)",
    color: "#bae6fd",
    fontSize: "12px",
    fontWeight: 700,
  },
  searchInput: {
    padding: "12px 16px",
    width: "100%",
    maxWidth: "400px",
    borderRadius: "8px",
    border: "1px solid rgba(255,255,255,0.2)",
    background: "rgba(0,0,0,0.3)",
    color: "white",
    outline: "none",
    fontSize: "15px",
    transition: "all 0.2s ease"
  },
  input: {
    padding: "12px",
    width: "100%",
    borderRadius: "8px",
    border: "1px solid rgba(255,255,255,0.1)",
    background: "rgba(255,255,255,0.05)",
    color: "white",
    outline: "none",
    fontSize: "14px",
    transition: "all 0.2s ease"
  },
  formGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
    width: '100%'
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
    gap: 20
  },
  candidateCard: {
    background: "rgba(255, 255, 255, 0.03)",
    border: `1px solid ${theme.colors.border}`,
    borderRadius: theme.radii.lg,
    padding: "20px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    minHeight: "200px",
    transition: "transform 320ms ease, box-shadow 320ms ease"
  },
  avatar: {
    width: "48px",
    height: "48px",
    borderRadius: "50%",
    background: theme.gradients.primary || "linear-gradient(to right, #4c00ff, #0ea5e9)",
    display: "grid",
    placeItems: "center",
    fontWeight: 700,
    color: "#0b1224"
  },
  roleTag: {
    display: "inline-block",
    fontSize: "11px",
    background: "#a78bfa",
    color: "#000",
    padding: "4px 8px",
    borderRadius: "4px",
    fontWeight: "bold",
    marginTop: "5px"
  },
  connectBtn: {
    ...theme.button("primary"),
    width: "100%",
    marginTop: 15
  },
  postBtn: {
    ...theme.button("primary"),
    background: "#34d399", // Green for posting
    width: "100%",
    marginTop: 10
  }
};