import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import theme from "../theme";
import CareerForm from "../CareerForm";
import ResumeEnhancer from "../components/ResumeEnhancer";
import { useToast } from "../components/ToastContext";
import useTilt from "../hooks/useTilt";
import BentoCard from "../components/BentoCard";


function UserDashboard() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [user, setUser] = useState(null);
  const [requests, setRequests] = useState([]);
  const [saved, setSaved] = useState([]);
  const [jobs, setJobs] = useState([]); // 🆕 State for Jobs
  const [uploading, setUploading] = useState(false);
  const [appliedJobs, setAppliedJobs] = useState(() => JSON.parse(localStorage.getItem("appliedJobs") || "[]"));
  const [enlargedAvatar, setEnlargedAvatar] = useState(false);

  useEffect(() => {
    // 1. Check Login
    const data = localStorage.getItem("user");
    if (!data) {
      navigate("/login");
      return;
    }
    const parsedUser = JSON.parse(data);
    setUser(parsedUser);

    // 2. Fetch Data
    fetchDashboardData(parsedUser.id);
  }, [navigate]);

  const fetchDashboardData = async (userId) => {
    try {
      // Fetch Requests
      const reqRes = await axios.get(`http://localhost:5000/api/users/my-requests?userId=${userId}`);
      setRequests(reqRes.data.requests || []);

      // Fetch Saved Careers
      const savedRes = await axios.get(`http://localhost:5000/api/users/saved?userId=${userId}`);
      setSaved(savedRes.data.saved || []);

      // 🆕 Fetch Approved Jobs
      const jobsRes = await axios.get("http://localhost:5000/api/users/jobs");
      setJobs(jobsRes.data.jobs || []);

    } catch (e) {
      console.error("Error loading dashboard data:", e);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("resume", file);
    formData.append("userId", user.id);

    try {
      const res = await axios.post("http://localhost:5000/api/users/upload-resume", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      const updatedUser = { ...user, seekingRole: res.data.role, atsScore: res.data.atsScore };
      if (res.data.profilePic) updatedUser.profilePic = res.data.profilePic;
      if (res.data.extractedName) updatedUser.extractedName = res.data.extractedName;
      if (res.data.resumeText) updatedUser.resumeText = res.data.resumeText; // 🆕 Store text to avoid manual pasting
      setUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));
      addToast("Resume uploaded successfully!", "success");
    } catch (err) {
      addToast("Upload failed.", "error");
    } finally {
      setUploading(false);
    }
  };

  const handleDecision = async (requestId, decision) => {
    try {
      const status = decision === 'accept' ? 'ACCEPTED' : 'DENIED';
      await axios.put(`http://localhost:5000/api/users/requests/${requestId}`, { status });
      fetchDashboardData(user.id);
      addToast(`Request ${decision}ed!`, "success");
    } catch (e) {
      addToast("Failed to update request.", "error");
    }
  };

  if (!user) return null;

  const displayJobs = jobs.filter(job => !appliedJobs.includes(job._id));

  return (
    <div className="bento-grid" style={styles.page}>
      {/* 🖼 MODAL FOR ENLARGED AVATAR */}
      {enlargedAvatar && user.profilePic && (
        <div
          onClick={() => setEnlargedAvatar(false)}
          style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.85)", zIndex: 9999, display: "flex", justifyContent: "center", alignItems: "center", cursor: "pointer", backdropFilter: "blur(5px)" }}
        >
          <img src={user.profilePic} style={{ maxWidth: "80%", maxHeight: "80%", borderRadius: "20px", objectFit: "contain", border: "4px solid rgba(255,255,255,0.1)", boxShadow: "0 10px 40px rgba(0,0,0,0.5)" }} alt="Enlarged Avatar" />
        </div>
      )}

      {/* 1. PROFILE CARD - SPANS FULL 4 COLUMNS ON DESKTOP */}
      <BentoCard colSpan={4} padding="32px">
        <div style={styles.profileHeader}>
          <div style={styles.profileLeft}>
            <div style={{ ...styles.avatar, cursor: user.profilePic ? "pointer" : "default" }} onClick={() => user.profilePic && setEnlargedAvatar(true)}>
              {user.profilePic ? <img src={user.profilePic} style={{ width: "100%", height: "100%", borderRadius: "14px", objectFit: "cover" }} alt="Profile" /> : user.name?.[0]}
            </div>
            <div>
              <h2 style={styles.title}>Welcome back, {user.extractedName || user.name}</h2>
              <p style={styles.subText}>{user.email}</p>
            </div>
          </div>

          <div style={styles.actionRow}>
            <button onClick={() => navigate("/growth")} style={styles.growthBtn} className="button-hover">
              🚀 Growth Tracker
            </button>
            <button onClick={() => navigate("/jd-match")} style={styles.growthBtn} className="button-hover">
              📑 Job Match
            </button>
          </div>
        </div>

        <div style={styles.pillRow}>
          <span style={styles.pill}>Student Account</span>
          <span style={styles.pillSecondary}>Profile synced</span>
          <span style={styles.pillSuccess}>AI Growth Tracking Active</span>
        </div>
      </BentoCard>

      {/* 2. AI RESUME PARSER - SPANS 2 COLUMNS */}
      <BentoCard colSpan={2}>
        <h3 style={{ ...styles.title, color: "#a78bfa", marginBottom: 15 }}>
          🧠 AI Resume Analyzer
        </h3>

        {user.seekingRole && user.seekingRole !== "General Applicant" && (
          <div style={{ padding: "15px", background: "rgba(167, 139, 250, 0.15)", border: "1px solid rgba(167, 139, 250, 0.4)", borderRadius: "10px", marginBottom: "20px" }}>
            🎉 You're selected as a <strong style={{ color: "#fff" }}>{user.seekingRole}</strong>
            <br />
            and this is your ATS score to be that job role: <strong style={{ fontSize: "16px", color: "#34d399", marginLeft: "4px" }}>{user.atsScore || 85}%</strong>
          </div>
        )}

        <p style={{ color: theme.colors.textSecondary, marginBottom: 20 }}>
          Upload your resume (PDF). Our AI will scan it and automatically match you with recruiters looking for your skills.
        </p>

        <input
          type="file"
          accept=".pdf"
          onChange={handleFileUpload}
          style={{ color: "white" }}
        />

        {uploading && <p style={{ color: "#a78bfa", marginTop: 10 }}>✨ AI is analyzing your resume...</p>}
      </BentoCard>

      {/* 📢 NEW: AVAILABLE JOBS SECTION - SPANS 2 COLUMNS */}
      <BentoCard colSpan={2}>
        <h3 style={{ ...styles.title, color: "#34d399", marginBottom: 20 }}>
          🔥 Available Job Vacancies
        </h3>
        {displayJobs.length === 0 ? (
          <p style={{ color: "#888" }}>No active job postings available.</p>
        ) : (
          <div style={styles.grid}>
            {displayJobs.map(job => (
              <div key={job._id} style={styles.jobCard}>
                <div>
                  <h4 style={{ margin: "0 0 5px 0", fontSize: "18px", color: "white" }}>{job.title}</h4>
                  <span style={{ fontSize: "12px", color: "#34d399", fontWeight: "bold", background: "rgba(52, 211, 153, 0.1)", padding: "2px 8px", borderRadius: "4px" }}>
                    {job.salary}
                  </span>
                  <p style={{ color: "#aaa", fontSize: "13px", marginTop: "10px" }}>
                    {job.employerId?.name} • {job.location}
                  </p>
                  <p style={{ color: "#ddd", fontSize: "14px", marginTop: "10px", lineHeight: "1.4" }}>
                    {job.description}
                  </p>
                </div>
                <button
                  style={styles.applyBtn}
                  className="button-hover"
                  onClick={() => {
                    if (job.employerId?.email) {
                      window.location.href = `mailto:${job.employerId.email}?subject=Application for ${encodeURIComponent(job.title)}`;

                      axios.put(`http://localhost:5000/api/users/jobs/${job._id}/click`).catch(err => console.error(err));

                      const newApplied = [...appliedJobs, job._id];
                      setAppliedJobs(newApplied);
                      localStorage.setItem("appliedJobs", JSON.stringify(newApplied));
                    } else {
                      alert("Employer email not available.");
                    }
                  }}
                >
                  Apply Now
                </button>
              </div>
            ))}
          </div>
        )}
      </BentoCard>

      {/* 3. PENDING REQUESTS */}
      {requests.filter(r => r.status === 'PENDING_EMPLOYEE').length > 0 && (
        <BentoCard colSpan={2}>
          <h3 style={{ ...styles.title, color: theme.colors.accent, marginBottom: 20 }}>
            🔔 New Job Inquiries
          </h3>
          <div style={{ display: "grid", gap: 15 }}>
            {requests.filter(r => r.status === 'PENDING_EMPLOYEE').map((req) => (
              <div key={req._id} style={styles.requestCard}>
                <div>
                  <h4 style={{ margin: "0 0 5px 0", color: "#fff" }}>
                    {req.employerId?.name || "A Recruiter"}
                  </h4>
                  <p style={{ margin: 0, color: theme.colors.textSecondary, fontSize: 14 }}>
                    from {req.employerId?.email} has invited you to connect.
                  </p>
                </div>
                <div style={styles.btnGroup}>
                  <button onClick={() => handleDecision(req._id, 'accept')} style={styles.acceptBtn}>Accept</button>
                  <button onClick={() => handleDecision(req._id, 'deny')} style={styles.denyBtn}>Decline</button>
                </div>
              </div>
            ))}
          </div>
        </BentoCard>
      )}

      {/* 4. ACTIVE CONNECTIONS */}
      {requests.filter(r => r.status === 'ACCEPTED').length > 0 && (
        <BentoCard colSpan={2}>
          <h3 style={{ ...styles.title, color: "#22c55e", marginBottom: 20 }}>
            ✅ Active Connections
          </h3>
          <div style={{ display: "grid", gap: 15 }}>
            {requests.filter(r => r.status === 'ACCEPTED').map((req) => (
              <div key={req._id} style={styles.connectedCard}>
                <div>
                  <h4 style={{ margin: "0 0 5px 0", color: "#fff" }}>
                    {req.employerId?.name || "Company"}
                  </h4>
                  <p style={{ margin: "4px 0 0", color: theme.colors.textSecondary, fontSize: 14 }}>
                    Contact:{" "}
                    <a
                      href={`mailto:${req.employerId?.email}`}
                      style={{ color: theme.colors.accent, textDecoration: "underline" }}
                    >
                      {req.employerId?.email}
                    </a>
                  </p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <span style={styles.pillSuccess}>Connected</span>
                  <div style={{ fontSize: "11px", color: theme.colors.textSecondary, marginTop: "5px" }}>
                    {new Date(req.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </BentoCard>
      )}

      {/* 5. SAVED CAREERS */}
      {saved.length > 0 && (
        <BentoCard colSpan={2}>
          <h3 style={{ ...styles.title, marginBottom: 20 }}>Your Saved Paths</h3>
          <div style={{ display: "grid", gap: 10 }}>
            {saved.map((s, i) => (
              <div key={i} style={styles.savedCard}>
                <strong>{s.careerTitle}</strong>
                <span style={{ fontSize: 12, color: theme.colors.textSecondary }}>
                  {new Date(s.createdAt).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </BentoCard>
      )}

      {/* 6. TOOLS */}
      <BentoCard colSpan={2}>
        <CareerForm fullWidth />
      </BentoCard>
      <BentoCard colSpan={2}>
        <ResumeEnhancer />
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
  profileHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.sm,
    gap: 16,
    flexWrap: "wrap"
  },
  profileLeft: {
    display: "flex",
    alignItems: "center",
    gap: theme.spacing.sm,
  },
  actionRow: {
    display: "flex",
    gap: 10,
    alignItems: "center",
  },
  avatar: {
    width: "58px",
    height: "58px",
    borderRadius: theme.radii.lg,
    background: theme.gradients.secondary,
    display: "grid",
    placeItems: "center",
    fontSize: "24px",
    fontWeight: 800,
    color: "#041024",
    boxShadow: theme.shadows.glow,
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
    gap: "10px",
    marginTop: theme.spacing.sm,
    flexWrap: "wrap"
  },
  pill: {
    padding: "8px 12px",
    background: "rgba(99,102,241,0.16)",
    borderRadius: "999px",
    border: "1px solid rgba(99,102,241,0.3)",
    color: "#c7d2fe",
    fontSize: "12px",
    fontWeight: 700,
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
  pillSuccess: {
    padding: "8px 12px",
    background: "rgba(34,197,94,0.16)",
    borderRadius: "999px",
    border: "1px solid rgba(34,197,94,0.35)",
    color: "#bbf7d0",
    fontSize: "12px",
    fontWeight: 700,
  },
  growthBtn: {
    ...theme.button("primary"),
    whiteSpace: "nowrap",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
    gap: 20
  },
  jobCard: {
    background: "rgba(255, 255, 255, 0.03)",
    border: `1px solid ${theme.colors.border}`,
    borderRadius: theme.radii.lg,
    padding: "20px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    minHeight: "200px"
  },
  applyBtn: {
    ...theme.button("primary"),
    width: "100%",
    marginTop: 15,
    background: "#34d399",
    color: "#000"
  },
  requestCard: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "16px",
    background: "rgba(255, 255, 255, 0.03)",
    border: `1px solid ${theme.colors.border}`,
    borderRadius: theme.radii.md
  },
  connectedCard: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "16px",
    background: "rgba(34, 197, 94, 0.05)",
    border: `1px solid rgba(34, 197, 94, 0.2)`,
    borderRadius: theme.radii.md
  },
  btnGroup: {
    display: "flex",
    gap: 10
  },
  acceptBtn: {
    ...theme.button("success"),
    backgroundColor: "#22c55e",
    backgroundImage: "none",
  },
  denyBtn: {
    ...theme.button("danger"),
    backgroundColor: "#ef4444",
    backgroundImage: "none",
  },
  savedCard: {
    padding: "12px",
    background: "rgba(255,255,255,0.03)",
    border: `1px solid ${theme.colors.border}`,
    borderRadius: theme.radii.sm,
    display: "flex",
    justifyContent: "space-between",
    color: theme.colors.textPrimary
  }
};

export default UserDashboard;