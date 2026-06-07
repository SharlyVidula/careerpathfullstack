import React, { useEffect, useState } from "react";
import apiClient from "../apiClient";
import theme from "../theme";
import BentoCard from "../components/BentoCard";
import { useToast } from "../components/ToastContext";
import Skeleton from "../components/Skeleton";

export default function EmployerDashboard() {
  const { addToast } = useToast();
  const [candidates, setCandidates] = useState([]);
  const [user, setUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [myJobs, setMyJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  // 🆕 State for Job Form
  const [jobForm, setJobForm] = useState({ title: "", description: "", salary: "", location: "" });
  const [deleteModal, setDeleteModal] = useState({ show: false, jobId: null });
  const [candidateModal, setCandidateModal] = useState({ show: false, candidate: null });

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

  const fetchCandidates = async () => {
    try {
      const res = await apiClient.get("/users/candidates");
      setCandidates(res.data.candidates || []);
    } catch (err) {
      console.error("Error fetching candidates", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyJobs = async (employerId) => {
    try {
      const res = await apiClient.get(`/users/employer-jobs?employerId=${employerId}`);
      setMyJobs(res.data.jobs || []);
    } catch (err) {
      console.error("Error fetching my jobs", err);
    }
  };

  // Moved fetchCandidates to useEffect hook directly or define above useEffect

  const sendRequest = async (employeeId) => {
    if (!user) {
      addToast("Please login first", "error");
      return;
    }
    try {
      await apiClient.post("/users/request-connection", {
        employerId: user.id,
        employeeId: employeeId
      });
      addToast("Request sent! Admin will review it shortly.", "success");
    } catch (err) {
      addToast("Error: " + (err.response?.data?.message || "Could not send request"), "error");
    }
  };

  // 🆕 Function to Post Job
  const handlePostJob = async (e) => {
    e.preventDefault();
    if (!user) {
      addToast("Please login first", "error");
      return;
    }

    try {
      await apiClient.post("/users/post-job", {
        ...jobForm,
        employerId: user.id
      });
      addToast("✅ Job Posted! It is now pending Admin approval.", "success");
      setJobForm({ title: "", description: "", salary: "", location: "" }); // Clear form
      fetchMyJobs(user.id); // Refresh
    } catch (err) {
      addToast("Error posting job: " + err.message, "error");
    }
  };

  const handleRemoveJob = (jobId) => {
    setDeleteModal({ show: true, jobId });
  };

  const confirmRemoveJob = async () => {
    const jobId = deleteModal.jobId;
    setDeleteModal({ show: false, jobId: null });
    try {
      await apiClient.delete(`/users/jobs/${jobId}`);
      addToast("Vacancy removed successfully", "success");
      setMyJobs(myJobs.filter(job => job._id !== jobId));
    } catch (err) {
      addToast("Failed to remove vacancy", "error");
    }
  };

  return (
    <div className="bento-grid" style={styles.page}>
      {/* 🛑 DELETE CONFIRMATION MODAL */}
      {deleteModal.show && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent} className="card-animate">
            <h3 style={{ margin: "0 0 10px 0", color: "var(--text-primary)" }}>Remove Vacancy</h3>
            <p style={{ color: "var(--text-secondary)", marginBottom: "20px", fontSize: "14px" }}>
              Are you sure you want to remove this vacancy? This action cannot be undone.
            </p>
            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <button 
                onClick={() => setDeleteModal({ show: false, jobId: null })} 
                style={styles.cancelBtn}
                className="button-hover"
              >
                Cancel
              </button>
              <button 
                onClick={confirmRemoveJob} 
                style={styles.confirmDeleteBtn}
                className="button-hover"
              >
                Yes, Remove
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 📄 CANDIDATE DETAILS MODAL */}
      {candidateModal.show && candidateModal.candidate && (
        <div style={styles.modalOverlay} onClick={() => setCandidateModal({ show: false, candidate: null })}>
          <div style={{...styles.modalContent, maxWidth: "600px", maxHeight: "85vh", overflowY: "auto"}} onClick={e => e.stopPropagation()} className="card-animate">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
              <div style={{ display: "flex", gap: "15px", alignItems: "center" }}>
                <div style={{ ...styles.avatar, width: "60px", height: "60px", fontSize: "20px" }}>
                  {candidateModal.candidate.profilePic ? <img src={candidateModal.candidate.profilePic} style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} alt="Profile" /> : candidateModal.candidate.name?.[0]}
                </div>
                <div>
                  <h2 style={{ margin: "0", color: "var(--text-primary)" }}>{candidateModal.candidate.name}</h2>
                  <p style={{ margin: "2px 0 0", color: "var(--text-secondary)" }}>{candidateModal.candidate.email}</p>
                </div>
              </div>
              <button 
                onClick={() => setCandidateModal({ show: false, candidate: null })}
                style={{ background: "transparent", border: "none", color: "var(--text-secondary)", fontSize: "24px", cursor: "pointer" }}
              >
                ✕
              </button>
            </div>
            
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "20px" }}>
              {candidateModal.candidate.seekingRole ? (
                <span style={{...styles.roleTag, fontSize: "14px", padding: "6px 12px"}}>{candidateModal.candidate.seekingRole}</span>
              ) : (
                <span style={{...styles.roleTag, background: "#333", color: "#888", fontSize: "14px", padding: "6px 12px"}}>General Applicant</span>
              )}
              {candidateModal.candidate.atsScore > 0 && (
                <span style={{...styles.roleTag, background: "#10b981", color: "#000", fontSize: "14px", padding: "6px 12px"}}>ATS: {candidateModal.candidate.atsScore}%</span>
              )}
            </div>

            {candidateModal.candidate.skills && candidateModal.candidate.skills.length > 0 && (
              <div style={{ marginBottom: "20px" }}>
                <h4 style={{ margin: "0 0 10px 0", color: "var(--text-primary)" }}>Key Skills</h4>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  {candidateModal.candidate.skills.map((skill, idx) => (
                    <span key={idx} style={{ fontSize: "13px", color: "var(--text-primary)", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "6px", padding: "6px 12px" }}>{skill}</span>
                  ))}
                </div>
              </div>
            )}

            {candidateModal.candidate.bioSnippet && (
              <div style={{ marginBottom: "20px" }}>
                <h4 style={{ margin: "0 0 10px 0", color: "var(--text-primary)" }}>Bio Snippet</h4>
                <p style={{ color: "var(--text-secondary)", fontSize: "14px", lineHeight: "1.5", margin: 0 }}>
                  "{candidateModal.candidate.bioSnippet}"
                </p>
              </div>
            )}

            {candidateModal.candidate.resumeText && (
              <div style={{ marginBottom: "20px" }}>
                <h4 style={{ margin: "0 0 10px 0", color: "var(--text-primary)" }}>Resume Extracted Text</h4>
                <div style={{ background: "rgba(0,0,0,0.3)", padding: "15px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.1)", maxHeight: "200px", overflowY: "auto", fontSize: "13px", color: "var(--text-secondary)", whiteSpace: "pre-wrap", lineHeight: "1.5" }}>
                  {candidateModal.candidate.resumeText}
                </div>
              </div>
            )}

            <button 
              onClick={() => {
                sendRequest(candidateModal.candidate._id);
                setCandidateModal({ show: false, candidate: null });
              }} 
              style={{ ...styles.connectBtn, marginTop: "10px", width: "100%" }}
              className="button-hover"
            >
              Request Connection
            </button>
          </div>
        </div>
      )}

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
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <h4 style={{ margin: "0 0 5px 0", color: "white", paddingRight: "10px" }}>{job.title}</h4>
                    <button 
                      onClick={() => handleRemoveJob(job._id)} 
                      style={styles.deleteBtn} 
                      className="button-hover"
                      title="Remove Vacancy"
                    >
                      ✕
                    </button>
                  </div>
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
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} style={styles.candidateCard}>
                <div style={{ display: "flex", gap: "15px", alignItems: "center", marginBottom: "15px" }}>
                  <Skeleton width="48px" height="48px" borderRadius="50%" />
                  <div>
                    <Skeleton width="120px" height="18px" style={{ marginBottom: "5px" }} />
                    <Skeleton width="80px" height="14px" />
                  </div>
                </div>
                <Skeleton width="100%" height="40px" style={{ marginBottom: "8px" }} />
                <Skeleton width="90%" height="40px" />
              </div>
            ))
          ) : (
            candidates
            .filter((c) => {
              if (!searchTerm) return true;
              const role = c.seekingRole || "";
              return role.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (c.name || "").toLowerCase().includes(searchTerm.toLowerCase());
            })
            .map((c) => (
              <div key={c._id} style={styles.candidateCard}>
                <div>
                  <div 
                    style={{ ...styles.avatar, cursor: "pointer", border: "2px solid transparent", transition: "border-color 0.2s" }}
                    onClick={() => setCandidateModal({ show: true, candidate: c })}
                    onMouseEnter={(e) => e.currentTarget.style.borderColor = "#a78bfa"}
                    onMouseLeave={(e) => e.currentTarget.style.borderColor = "transparent"}
                    title="View Full Profile"
                  >
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
            ))
          )}
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
  },
  deleteBtn: {
    background: "rgba(239, 68, 68, 0.15)",
    border: "1px solid rgba(239, 68, 68, 0.4)",
    color: "#ef4444",
    borderRadius: "50%",
    width: "28px",
    height: "28px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    transition: "all 0.2s",
    flexShrink: 0,
    fontSize: "12px",
    padding: 0
  },
  modalOverlay: {
    position: "fixed",
    top: 0, left: 0, right: 0, bottom: 0,
    background: "rgba(0,0,0,0.7)",
    backdropFilter: "blur(4px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999
  },
  modalContent: {
    background: "var(--surface)",
    border: `1px solid var(--border)`,
    borderRadius: theme.radii.lg,
    padding: "24px",
    width: "90%",
    maxWidth: "400px",
    boxShadow: "0 10px 40px rgba(0,0,0,0.5)"
  },
  cancelBtn: {
    ...theme.button("ghost"),
    background: "rgba(255,255,255,0.05)",
    color: "var(--text-primary)"
  },
  confirmDeleteBtn: {
    ...theme.button("danger"),
    background: "#ef4444",
    color: "#fff",
    backgroundImage: "none"
  }
};