import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import apiClient from "../apiClient";
import theme from "../theme";
import BentoCard from "../components/BentoCard";
import { useToast } from "../components/ToastContext";
import Skeleton from "../components/Skeleton";

export default function EmployerDashboard() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [candidates, setCandidates] = useState([]);
  const [user, setUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [myJobs, setMyJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  // 🆕 State for Job Form
  const [jobForm, setJobForm] = useState({ title: "", description: "", salary: "", location: "", opportunityType: "INTERNSHIP", targetStage: "YEAR_3_INTERN" });
  const [stageFilter, setStageFilter] = useState("ALL");
  const [deleteModal, setDeleteModal] = useState({ show: false, jobId: null });
  const [candidateModal, setCandidateModal] = useState({ show: false, candidate: null, loading: false, report: null });
  const [myInterns, setMyInterns] = useState([]);
  const [dualTelemetryModal, setDualTelemetryModal] = useState({ show: false, data: null, loading: false });

  const openCandidateModal = async (c) => {
    setCandidateModal({ show: true, candidate: c, loading: true, report: null });
    try {
      const res = await apiClient.post("/users/ai-background-check", { studentId: c._id || c.id });
      if (res.data?.ok) {
        setCandidateModal({ show: true, candidate: c, loading: false, report: res.data.report });
      } else {
        setCandidateModal({ show: true, candidate: c, loading: false, report: null });
      }
    } catch (err) {
      setCandidateModal({ show: true, candidate: c, loading: false, report: null });
    }
  };

  const fetchMyInterns = async (supervisorId) => {
    try {
      setLoading(true);
      const res = await apiClient.get(`/intern/supervisor/my-interns/${supervisorId}`);
      if (res.data?.ok) {
        setMyInterns(res.data.interns || []);
      }
    } catch (err) {
      console.error("Error fetching my interns:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDualTelemetry = async (studentId) => {
    setDualTelemetryModal({ show: true, data: null, loading: true });
    try {
      const res = await apiClient.get(`/intern/coordinator/dual-telemetry/${studentId}`);
      if (res.data?.ok) {
        setDualTelemetryModal({ show: true, data: res.data, loading: false });
      }
    } catch (err) {
      addToast("Failed to load logbook telemetry.", "error");
      setDualTelemetryModal({ show: false, data: null, loading: false });
    }
  };

  useEffect(() => {
    // 1. Check Login & Role Guard
    const data = localStorage.getItem("user");
    if (!data) {
      navigate("/login");
      return;
    }
    const parsed = JSON.parse(data);
    if (parsed.role !== "employer" && parsed.role !== "supervisor") {
      addToast("Access Denied: Recruiter & Supervisor portal only.", "error");
      if (parsed.role === "admin" || parsed.role === "coordinator") {
        navigate("/admin");
      } else {
        navigate("/user-dashboard");
      }
      return;
    }
    setUser(parsed);
    fetchMyJobs(parsed.id || parsed._id);

    // 2. Role-Based Data Fetching
    if (parsed.role === "supervisor") {
      fetchMyInterns(parsed.id || parsed._id);
    } else {
      fetchCandidates();
    }
  }, [navigate]);

  const fetchCandidates = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get("/users/students");
      setCandidates(res.data.students || []);
    } catch (err) {
      console.error("Error fetching candidates", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyJobs = async (employerId) => {
    try {
      const res = await apiClient.get(`/users/my-jobs/${employerId}`);
      setMyJobs(res.data.jobs || []);
    } catch (err) {
      console.error("Error fetching my jobs", err);
    }
  };

  const sendRequest = async (studentId) => {
    if (!user) {
      addToast("Please login first", "error");
      return;
    }
    try {
      await apiClient.post("/users/request-connection", {
        employerId: user.id || user._id,
        studentId
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

    const isSupervisor = user.role === "supervisor";
    const opportunityType = isSupervisor ? "INTERNSHIP" : "FULL_TIME";
    const targetStage = isSupervisor ? "YEAR_3_INTERN" : "FINAL_YEAR_JOB";

    try {
      await apiClient.post("/users/post-job", {
        ...jobForm,
        opportunityType,
        targetStage,
        employerId: user.id || user._id
      });
      addToast("✅ Vacancy posted! Pending Academic Coordinator review.", "success");
      setJobForm({ title: "", description: "", salary: "", location: "", workType: "On-site" }); // Clear form
      fetchMyJobs(user.id || user._id); // Refresh
    } catch (err) {
      addToast("Error posting vacancy: " + (err.response?.data?.message || err.message), "error");
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

  if (!user) return null;

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

      {/* Header Card - Spans 4 Columns */}
      <BentoCard colSpan={4} padding="32px">
        <h2 style={styles.title}>
          {user?.role === 'supervisor' ? "🎓 Intern Supervisor Portal" : "💼 Corporate HR & Employer Portal"}
        </h2>
        <p style={styles.subText}>
          Welcome, {user?.name} {user?.companyName && `(${user.companyName})`}. {user?.role === 'supervisor' ? "Supervise and mentor LNBTI 3rd-year interns." : "Recruit LNBTI 4th-year graduates & final-year talent."}
        </p>
        <div style={{ marginTop: "12px", padding: "12px 16px", background: user?.role === 'supervisor' ? "rgba(99, 102, 241, 0.12)" : "rgba(16, 185, 129, 0.12)", border: `1px solid ${user?.role === 'supervisor' ? "rgba(99, 102, 241, 0.3)" : "rgba(16, 185, 129, 0.3)"}`, borderRadius: "10px", fontSize: "13px", color: "var(--text-primary)" }}>
          {user?.role === 'supervisor' ? (
            <span>ℹ️ <strong>Internship Workflow:</strong> Internship vacancies you post are routed to the <strong>LNBTI Academic Coordinator Hub</strong>. Coordinators assign and match eligible 3rd-year intern students directly to your opportunities. Connection requests also go through Coordinator review.</span>
          ) : (
            <span>🚀 <strong>Direct Job Workflow:</strong> Full-time job vacancies you post are published <strong>directly to 4th-Year (Final Year) Student Dashboards</strong> for immediate student applications.</span>
          )}
        </div>
      </BentoCard>

      {/* 📢 POST VACANCY FORM - Spans 2 Columns */}
      <BentoCard colSpan={2} disableTilt={true}>
        <h3 style={{ ...styles.title, marginBottom: 14, color: "#34d399" }}>
          {user?.role === 'supervisor' ? "📢 Post Internship Vacancy" : "📢 Post Direct Job Opening"}
        </h3>

        {/* Target Candidate Badge */}
        <div style={{
          padding: "10px 14px",
          marginBottom: "16px",
          background: user?.role === 'supervisor' ? "rgba(99, 102, 241, 0.12)" : "rgba(16, 185, 129, 0.12)",
          border: `1px solid ${user?.role === 'supervisor' ? "rgba(99, 102, 241, 0.3)" : "rgba(16, 185, 129, 0.3)"}`,
          borderRadius: "10px",
          fontSize: "13px",
          color: "var(--text-primary)",
          display: "flex",
          alignItems: "center",
          gap: "8px"
        }}>
          <span>{user?.role === 'supervisor' ? "🎓" : "💼"}</span>
          <div>
            <strong>Target Audience:</strong> {user?.role === 'supervisor' ? "3rd-Year Intern Students (3rd Yr 2nd Sem — Routes via Coordinator)" : "4th-Year Graduates (Direct 4th-Year Dashboard Post)"}
          </div>
        </div>

        <form onSubmit={handlePostJob} style={styles.formGrid}>
          {/* Row 1: Position & Stipend */}
          <div style={{ display: 'flex', gap: '10px' }}>
            <input
              placeholder={user?.role === 'supervisor' ? "Position (e.g. Software Engineering Intern)" : "Position (e.g. Associate Software Engineer)"}
              value={jobForm.title}
              onChange={(e) => setJobForm({ ...jobForm, title: e.target.value })}
              style={{ ...styles.input, flex: 1 }}
              required
            />
            <input
              placeholder={user?.role === 'supervisor' ? "Stipend / Allowance (e.g. LKR 45,000/mo)" : "Salary Range (e.g. LKR 150,000/mo)"}
              value={jobForm.salary}
              onChange={(e) => setJobForm({ ...jobForm, salary: e.target.value })}
              style={{ ...styles.input, flex: 1 }}
              required
            />
          </div>

          {/* Row 2: Location & Work Arrangement */}
          <div style={{ display: 'flex', gap: '10px' }}>
            <input
              placeholder="Location (e.g. Colombo 03 / On-site)"
              value={jobForm.location}
              onChange={(e) => setJobForm({ ...jobForm, location: e.target.value })}
              style={{ ...styles.input, flex: 1 }}
              required
            />
            <select
              value={jobForm.workType || "On-site"}
              onChange={(e) => setJobForm({ ...jobForm, workType: e.target.value })}
              style={{ ...styles.input, flex: 1, cursor: "pointer" }}
            >
              <option value="On-site">🏢 On-site Office</option>
              <option value="Hybrid">🏠 Hybrid (Office + WFH)</option>
              <option value="Remote">🌐 Fully Remote</option>
            </select>
          </div>

          {/* Row 3: Official Contact Email & Phone Number */}
          <div style={{ display: 'flex', gap: '10px' }}>
            <input
              type="email"
              placeholder="Contact Email (e.g. supervisor@company.com)"
              value={jobForm.contactEmail || ""}
              onChange={(e) => setJobForm({ ...jobForm, contactEmail: e.target.value })}
              style={{ ...styles.input, flex: 1 }}
              required
            />
            <input
              type="tel"
              placeholder="Active Phone Number (e.g. +94 77 123 4567)"
              value={jobForm.contactPhone || ""}
              onChange={(e) => setJobForm({ ...jobForm, contactPhone: e.target.value })}
              style={{ ...styles.input, flex: 1 }}
              required
            />
          </div>

          {/* Row 3: Description */}
          <textarea
            placeholder="Job Description, Tech Stack & Requirements (e.g. React, Node.js, Spring Boot, SQL)..."
            value={jobForm.description}
            onChange={(e) => setJobForm({ ...jobForm, description: e.target.value })}
            style={{ ...styles.input, height: '90px', resize: 'none' }}
            required
          />

          <button type="submit" style={styles.postBtn} className="button-hover">
            {user?.role === 'supervisor' ? "Submit to Academic Coordinator ➔" : "Post Direct Job to 4th Year Dashboard ➔"}
          </button>
        </form>
      </BentoCard>

      {/* 📊 NEW SECTION: Your Posted Vacancies - Spans 2 Columns */}
      <BentoCard colSpan={2} disableTilt={true}>
        <h3 style={{ ...styles.title, marginBottom: 20 }}>📊 Your Posted Vacancies</h3>
        {myJobs.length === 0 ? (
          <p style={{ color: "#888" }}>You haven't posted any jobs yet.</p>
        ) : (
          <div style={styles.grid}>
            {myJobs.map(job => (
              <div key={job._id} style={styles.candidateCard}>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <h4 style={{ margin: "0 0 5px 0", color: "var(--text-primary)", paddingRight: "10px" }}>{job.title}</h4>
                    <button 
                      onClick={() => handleRemoveJob(job._id)} 
                      style={styles.deleteBtn} 
                      className="button-hover"
                      title="Remove Vacancy"
                    >
                      ✕
                    </button>
                  </div>
                  <span style={{ fontSize: "12px", color: job.status === "approved" ? "var(--success)" : "#e2b714", fontWeight: "bold", background: job.status === "approved" ? "rgba(16, 185, 129, 0.12)" : "rgba(226, 183, 20, 0.15)", padding: "2px 8px", borderRadius: "4px" }}>
                    {job.status.toUpperCase()}
                  </span>
                  <p style={{ color: "var(--text-secondary)", fontSize: "13px", marginTop: "10px" }}>
                    {job.location} • {job.salary}
                  </p>
                </div>
                <div style={{ marginTop: "15px", paddingTop: "15px", borderTop: "1px solid var(--border)" }}>
                  <strong style={{ color: "var(--success)", fontSize: "24px" }}>{job.applyClicks || 0}</strong>
                  <span style={{ color: "var(--text-secondary)", fontSize: "13px", marginLeft: "8px" }}>Applies / Clicks</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </BentoCard>

      {/* 👥 SUPERVISOR WORKFLOW: MY ASSIGNED INTERNS & TEAM TELEMETRY HUB */}
      {user?.role === 'supervisor' ? (
        <BentoCard colSpan={4} disableTilt={true}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "10px" }}>
            <div>
              <h3 style={{ ...styles.title, margin: 0, color: "var(--accent)" }}>
                👥 My Assigned Interns & Team Performance Monitoring Hub
              </h3>
              <p style={{ color: theme.colors.textSecondary, fontSize: "14px", margin: "4px 0 0" }}>
                Monitor your connected LNBTI intern students' daily logbook records, review student diaries, and inspect real-world AI task verdicts.
              </p>
            </div>
            <span style={{ fontSize: "13px", fontWeight: "bold", padding: "6px 14px", background: "rgba(16, 185, 129, 0.15)", color: "var(--success)", borderRadius: "8px", border: "1px solid rgba(16, 185, 129, 0.3)" }}>
              Assigned Team: {myInterns.length} Students
            </span>
          </div>

          {loading ? (
            <div style={{ padding: "20px", textAlign: "center", color: "var(--text-secondary)" }}>⌛ Loading assigned intern team telemetry...</div>
          ) : myInterns.length === 0 ? (
            <div style={{ padding: "32px", textAlign: "center", background: "var(--card-item-bg)", borderRadius: "14px", border: "1px solid var(--card-item-border)" }}>
              <span style={{ fontSize: "36px", display: "block", marginBottom: "10px" }}>🎓</span>
              <h4 style={{ margin: "0 0 6px 0", color: "var(--text-primary)", fontSize: "17px" }}>No Intern Students Assigned Yet</h4>
              <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: "14px", maxWidth: "600px", marginLeft: "auto", marginRight: "auto", lineHeight: "1.5" }}>
                3rd-year intern students are matched and assigned directly by the LNBTI Academic Coordinator. Once the coordinator matches a student to your posted vacancy, your intern team will appear here for daily performance monitoring.
              </p>
            </div>
          ) : (
            <div style={styles.grid}>
              {myInterns.map((st) => (
                <div key={st._id} style={{ ...styles.candidateCard, border: "1px solid rgba(16, 185, 129, 0.35)" }}>
                  <div>
                    <div style={{ display: "flex", gap: "12px", alignItems: "center", marginBottom: "12px" }}>
                      <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "var(--accent)", border: "2px solid var(--accent)", overflow: "hidden", display: "grid", placeItems: "center" }}>
                        {st.profilePic ? <img src={st.profilePic} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="Avatar" /> : st.name?.[0]}
                      </div>
                      <div>
                        <h4 style={{ margin: 0, color: "var(--text-primary)", fontSize: "15px" }}>{st.name}</h4>
                        <span style={{ fontSize: "11px", color: "var(--success)", fontWeight: "bold", display: "block", marginTop: "2px" }}>
                          ✓ Assigned Intern Student
                        </span>
                      </div>
                    </div>

                    <p style={{ margin: "4px 0 8px 0", color: "var(--text-secondary)", fontSize: "13px" }}>
                      📧 {st.email} • {st.degreeProgram || 'BSc Software Engineering'}
                    </p>

                    {/* Social Verification Badges */}
                    <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "14px" }}>
                      {st.githubUsername && (
                        <a href={`https://github.com/${st.githubUsername}`} target="_blank" rel="noreferrer" style={{ fontSize: "11px", padding: "3px 8px", background: "rgba(36, 41, 46, 0.4)", color: "#fff", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "4px", textDecoration: "none", fontWeight: "bold" }}>
                          🐙 @{st.githubUsername} ↗
                        </a>
                      )}
                      {st.linkedinProfileUrl && (
                        <a href={st.linkedinProfileUrl} target="_blank" rel="noreferrer" style={{ fontSize: "11px", padding: "3px 8px", background: "rgba(10, 102, 194, 0.2)", color: "#38bdf8", border: "1px solid rgba(10, 102, 194, 0.4)", borderRadius: "4px", textDecoration: "none", fontWeight: "bold" }}>
                          💼 LinkedIn Profile ↗
                        </a>
                      )}
                    </div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "12px" }}>
                    <button
                      onClick={() => handleViewDualTelemetry(st._id)}
                      style={{ ...theme.button("primary"), background: "linear-gradient(135deg, #10b981, #059669)", fontSize: "12px", padding: "8px" }}
                      className="button-hover"
                    >
                      📖 View Daily Logbook & AI Verdict
                    </button>
                    <button
                      onClick={() => openCandidateModal(st)}
                      style={{ ...theme.button("secondary"), fontSize: "11px", padding: "6px" }}
                      className="button-hover"
                    >
                      🤖 AI Background Check
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </BentoCard>
      ) : (
        /* 💼 CORPORATE HR WORKFLOW: 4TH-YEAR GRADUATE CANDIDATES (DIRECT HIRING HUB) */
        <BentoCard colSpan={4} disableTilt={true}>
          <h3 style={{ ...styles.title, marginBottom: 20 }}>
            💼 4th-Year Graduate Candidates (Direct Hiring Hub)
          </h3>

          {/* Search Input */}
          <div style={{ marginBottom: 20 }}>
            <input
              type="text"
              placeholder="🔍 Filter by Role (e.g., Software Engineer, Data Analyst)..."
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
                if (c.studentStage && c.studentStage !== "FINAL_YEAR_JOB") return false;
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
                      onClick={() => openCandidateModal(c)}
                      onMouseEnter={(e) => e.currentTarget.style.borderColor = "var(--accent)"}
                      onMouseLeave={(e) => e.currentTarget.style.borderColor = "transparent"}
                      title="View Full AI Candidate Background Check"
                    >
                      {c.profilePic ? <img src={c.profilePic} style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} alt="Profile" /> : c.name?.[0]}
                    </div>
                    <h4
                      style={{ margin: "10px 0 5px", color: theme.colors.textPrimary, cursor: "pointer" }}
                      onClick={() => openCandidateModal(c)}
                      title="View Full AI Candidate Background Check"
                    >
                      {c.name}
                    </h4>

                    <div style={{ display: "flex", gap: "5px", flexWrap: "wrap", marginBottom: "8px" }}>
                      {c.seekingRole ? (
                        <span style={styles.roleTag}>{c.seekingRole}</span>
                      ) : (
                        <span style={{ ...styles.roleTag, background: "var(--card-item-bg)", color: "var(--text-secondary)" }}>General Applicant</span>
                      )}
                      {c.atsScore > 0 && <span style={{ ...styles.roleTag, background: "rgba(16, 185, 129, 0.12)", color: "var(--success)", border: "1px solid rgba(16, 185, 129, 0.25)" }}>ATS: {c.atsScore}%</span>}
                    </div>

                    <p style={{ margin: "10px 0 0", color: theme.colors.textSecondary, fontSize: 13 }}>📧 {c.email}</p>

                    {/* Skills and bio snippet */}
                    {c.skills && c.skills.length > 0 && (
                      <div style={{ marginTop: "12px" }}>
                        <strong style={{ fontSize: "12px", color: theme.colors.textPrimary }}>Key Skills:</strong>
                        <div style={{ display: "flex", gap: "4px", flexWrap: "wrap", marginTop: "4px" }}>
                          {c.skills.slice(0, 4).map((skill, idx) => (
                            <span key={idx} style={{ fontSize: "11px", color: "var(--text-secondary)", background: "var(--card-item-bg)", border: "1px solid var(--card-item-border)", borderRadius: "4px", padding: "2px 6px" }}>{skill}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Connected Accounts Badges (GitHub & LinkedIn) */}
                    <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginTop: "10px" }}>
                      {c.githubUsername && (
                        <a
                          href={`https://github.com/${c.githubUsername}`}
                          target="_blank"
                          rel="noreferrer"
                          style={{ fontSize: "11px", padding: "3px 8px", background: "rgba(36, 41, 46, 0.4)", color: "#fff", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "4px", textDecoration: "none", fontWeight: "bold" }}
                        >
                          🐙 @{c.githubUsername} ↗
                        </a>
                      )}
                      {c.linkedinProfileUrl && (
                        <a
                          href={c.linkedinProfileUrl}
                          target="_blank"
                          rel="noreferrer"
                          style={{ fontSize: "11px", padding: "3px 8px", background: "rgba(10, 102, 194, 0.2)", color: "#38bdf8", border: "1px solid rgba(10, 102, 194, 0.4)", borderRadius: "4px", textDecoration: "none", fontWeight: "bold" }}
                        >
                          💼 LinkedIn Profile ↗
                        </a>
                      )}
                    </div>
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
        </BentoCard>
      )}

      {/* 🤖 AI CANDIDATE MULTI-SOURCE BACKGROUND CHECK & TELEMETRY MODAL */}
      {candidateModal.show && candidateModal.candidate && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10000, padding: "20px" }}>
          <div style={{ background: "var(--surface)", border: "1px solid var(--accent)", borderRadius: "20px", width: "100%", maxWidth: "680px", maxHeight: "90vh", overflowY: "auto", padding: "28px", boxShadow: "0 20px 60px rgba(0,0,0,0.6)" }}>
            
            {/* MODAL HEADER */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
              <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
                <div style={{ width: "64px", height: "64px", borderRadius: "50%", background: "var(--accent)", border: "3px solid var(--accent)", overflow: "hidden", display: "grid", placeItems: "center" }}>
                  {candidateModal.candidate.profilePic ? (
                    <img src={candidateModal.candidate.profilePic} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="Avatar" />
                  ) : (
                    <span style={{ fontSize: "24px", color: "#fff", fontWeight: "bold" }}>{candidateModal.candidate.name?.[0]}</span>
                  )}
                </div>
                <div>
                  <h3 style={{ margin: 0, color: "var(--text-primary)", fontSize: "20px" }}>{candidateModal.candidate.name}</h3>
                  <p style={{ margin: "2px 0 0", color: "var(--text-secondary)", fontSize: "13px" }}>
                    📧 {candidateModal.candidate.email} • {candidateModal.candidate.degreeProgram || 'Software Engineering'}
                  </p>
                  <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginTop: "6px" }}>
                    <span style={{ fontSize: "11px", padding: "3px 8px", background: "rgba(99, 102, 241, 0.15)", color: "var(--accent)", borderRadius: "4px", fontWeight: "bold" }}>
                      {candidateModal.candidate.seekingRole || "Software Engineering Applicant"}
                    </span>
                    {candidateModal.candidate.atsScore > 0 && (
                      <span style={{ fontSize: "11px", padding: "3px 8px", background: "rgba(16, 185, 129, 0.15)", color: "var(--success)", borderRadius: "4px", fontWeight: "bold" }}>
                        ATS: {candidateModal.candidate.atsScore}%
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setCandidateModal({ show: false, candidate: null, loading: false, report: null })}
                style={{ background: "transparent", border: "none", color: "var(--text-secondary)", fontSize: "22px", cursor: "pointer" }}
              >
                ✕
              </button>
            </div>

            {/* AI MULTI-SOURCE TELEMETRY VERIFICATION BADGES */}
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "20px", padding: "12px 16px", background: "var(--card-item-bg)", borderRadius: "12px", border: "1px solid var(--card-item-border)" }}>
              <span style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: "bold", width: "100%", marginBottom: "4px" }}>
                🔍 Multi-Source Background Authenticity Verification:
              </span>
              <span style={{ fontSize: "11px", padding: "4px 10px", background: candidateModal.candidate.githubUsername ? "rgba(16, 185, 129, 0.15)" : "rgba(255,255,255,0.06)", color: candidateModal.candidate.githubUsername ? "#10b981" : "#aaa", borderRadius: "20px", fontWeight: "bold" }}>
                🐙 GitHub Verified: {candidateModal.candidate.githubUsername ? `@${candidateModal.candidate.githubUsername}` : "Unlinked"}
              </span>
              <span style={{ fontSize: "11px", padding: "4px 10px", background: candidateModal.candidate.linkedinProfileUrl ? "rgba(10, 102, 194, 0.2)" : "rgba(255,255,255,0.06)", color: candidateModal.candidate.linkedinProfileUrl ? "#38bdf8" : "#aaa", borderRadius: "20px", fontWeight: "bold" }}>
                💼 LinkedIn Verified: {candidateModal.candidate.linkedinProfileUrl ? "Connected" : "Unlinked"}
              </span>
              <span style={{ fontSize: "11px", padding: "4px 10px", background: "rgba(16, 185, 129, 0.15)", color: "#10b981", borderRadius: "20px", fontWeight: "bold" }}>
                🎓 Academic Record: Verified Student
              </span>
            </div>

            {/* 🤖 AI SYNTHESIS & BACKGROUND REPORT */}
            <div style={{ padding: "18px", background: "rgba(99, 102, 241, 0.08)", border: "1px solid rgba(99, 102, 241, 0.3)", borderRadius: "14px", marginBottom: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                <h4 style={{ margin: 0, color: "var(--accent)", fontSize: "15px", display: "flex", alignItems: "center", gap: "8px" }}>
                  🤖 AI Candidate Background Check & Talent Rating
                </h4>
                {candidateModal.report && (
                  <span style={{ fontSize: "14px", color: "var(--success)", fontWeight: "bold", background: "rgba(16, 185, 129, 0.15)", padding: "4px 12px", borderRadius: "8px" }}>
                    Score: {candidateModal.report.overallRating} / 100
                  </span>
                )}
              </div>

              {candidateModal.loading ? (
                <div style={{ padding: "20px", textAlign: "center", color: "var(--text-secondary)" }}>
                  ⌛ Running AI Multi-Source Background Check & Telemetry Analysis...
                </div>
              ) : candidateModal.report ? (
                <div>
                  <p style={{ margin: "0 0 12px 0", color: "var(--text-primary)", fontSize: "13px", lineHeight: "1.6" }}>
                    {candidateModal.report.aiSynthesisVerdict}
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    {candidateModal.report.highlights.map((item, idx) => (
                      <div key={idx} style={{ fontSize: "12px", color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "6px" }}>
                        <span>•</span> <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: "13px" }}>
                  Candidate telemetry verification ready. Verified university credentials and social profiles parsed.
                </p>
              )}
            </div>

            {/* ACTION BUTTONS */}
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", justifyContent: "flex-end" }}>
              {candidateModal.candidate.githubUsername && (
                <a
                  href={`https://github.com/${candidateModal.candidate.githubUsername}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{ ...theme.button("secondary"), padding: "8px 14px", fontSize: "12px", textDecoration: "none" }}
                >
                  🐙 Open GitHub ↗
                </a>
              )}
              {candidateModal.candidate.linkedinProfileUrl && (
                <a
                  href={candidateModal.candidate.linkedinProfileUrl}
                  target="_blank"
                  rel="noreferrer"
                  style={{ ...theme.button("secondary"), background: "#0a66c2", color: "#fff", padding: "8px 14px", fontSize: "12px", textDecoration: "none" }}
                >
                  💼 Open LinkedIn ↗
                </a>
              )}
              <button
                onClick={() => {
                  sendRequest(candidateModal.candidate._id);
                  setCandidateModal({ show: false, candidate: null, loading: false, report: null });
                }}
                style={{ ...theme.button("primary"), padding: "8px 16px", fontSize: "12px" }}
                className="button-hover"
              >
                📩 Request Recruiting Connection
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 📖 DUAL LOGBOOK TELEMETRY & AI TASK EVALUATION MODAL */}
      {dualTelemetryModal.show && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(5, 10, 25, 0.88)", backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)", zIndex: 50000,
          display: "flex", justifyContent: "center", alignItems: "center", padding: "60px 20px 30px"
        }}>
          <div style={{
            background: "var(--card-bg, #0f172a)", border: "1px solid rgba(16, 185, 129, 0.4)",
            borderRadius: "16px", padding: "24px", maxWidth: "860px", width: "100%", maxHeight: "85vh",
            overflowY: "auto", boxShadow: "0 25px 60px rgba(0,0,0,0.8)", position: "relative", zIndex: 1000000
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: "12px" }}>
              <h3 style={{ margin: 0, color: "#10b981", fontSize: "18px" }}>
                📖 Dual Logbook Telemetry & AI Task Evaluation Verdict
              </h3>
              <button
                onClick={() => setDualTelemetryModal({ show: false, data: null, loading: false })}
                style={{ background: "transparent", border: "none", color: "var(--text-secondary)", fontSize: "24px", cursor: "pointer" }}
              >
                ✕
              </button>
            </div>

            {dualTelemetryModal.loading ? (
              <p style={{ color: "var(--text-secondary)", padding: "20px" }}>Loading logbook records and generating AI verdict...</p>
            ) : dualTelemetryModal.data ? (
              <div>
                {/* 🤖 AI VERDICT BANNER */}
                <div style={{
                  padding: "16px", background: "linear-gradient(135deg, rgba(99,102,241,0.15), rgba(16,185,129,0.15))",
                  border: "1px solid rgba(99,102,241,0.3)", borderRadius: "12px", marginBottom: "20px"
                }}>
                  <h4 style={{ margin: "0 0 6px 0", color: "#6366f1", fontSize: "14px" }}>🤖 AI Performance & Real-World Task Verdict</h4>
                  <p style={{ margin: 0, fontSize: "13px", color: "var(--text-primary)", lineHeight: 1.6, whiteSpace: "pre-line" }}>
                    {dualTelemetryModal.data.aiVerdict}
                  </p>
                </div>

                {/* 👔 SUPERVISOR & STUDENT SUMMARY */}
                <div style={{ display: "flex", gap: "20px", marginBottom: "20px", flexWrap: "wrap" }}>
                  <div style={{ flex: 1, minWidth: "240px", padding: "12px", background: "rgba(0,0,0,0.25)", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <h5 style={{ margin: "0 0 6px 0", color: "var(--accent)" }}>🎓 Student Placement Profile</h5>
                    <div style={{ fontSize: "14px", fontWeight: "bold", color: "var(--text-primary)" }}>{dualTelemetryModal.data.student?.name}</div>
                    <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "2px" }}>Index: {dualTelemetryModal.data.student?.indexNumber || "UGC0323021"} • Batch: {dualTelemetryModal.data.student?.batchNumber || "SE3"}</div>
                    <div style={{ fontSize: "12px", color: "#34d399", marginTop: "6px" }}>Logged Entries: {dualTelemetryModal.data.submittedDaysCount} Days ({dualTelemetryModal.data.totalHoursLogged} Hrs)</div>
                  </div>

                  <div style={{ flex: 1, minWidth: "240px", padding: "12px", background: "rgba(0,0,0,0.25)", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <h5 style={{ margin: "0 0 6px 0", color: "#34d399" }}>👔 Industry Supervisor & Enterprise</h5>
                    <div style={{ fontSize: "14px", fontWeight: "bold", color: "var(--text-primary)" }}>{dualTelemetryModal.data.supervisor?.name || "Assigned Supervisor"}</div>
                    <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "2px" }}>Company: {dualTelemetryModal.data.supervisor?.companyName || "LNBTI Partner Enterprise"}</div>
                    <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "4px" }}>📧 {dualTelemetryModal.data.supervisor?.email || "N/A"} | 📞 {dualTelemetryModal.data.supervisor?.phone || "N/A"}</div>
                  </div>
                </div>

                {/* 📖 DAILY DIARY LOGBOOK ENTRIES TABLE */}
                <h4 style={{ color: "var(--text-primary)", fontSize: "14px", marginBottom: "10px" }}>
                  📖 Daily Diary Logbook Records ({dualTelemetryModal.data.diaryEntries?.length || 0})
                </h4>

                {dualTelemetryModal.data.diaryEntries?.length === 0 ? (
                  <div style={{ padding: "14px", background: "rgba(255,255,255,0.03)", borderRadius: "8px", fontSize: "13px", color: "var(--text-secondary)" }}>
                    ℹ️ Student has not submitted daily diary logs yet. Automated Outlook reminders are sent daily.
                  </div>
                ) : (
                  <div style={{ maxHeight: "250px", overflowY: "auto", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.1)" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px", textAlign: "left" }}>
                      <thead>
                        <tr style={{ background: "rgba(255,255,255,0.05)", color: "var(--text-secondary)" }}>
                          <th style={{ padding: "10px" }}>Day</th>
                          <th style={{ padding: "10px" }}>Date</th>
                          <th style={{ padding: "10px" }}>Activities & Real-World Tasks</th>
                          <th style={{ padding: "10px" }}>Hours</th>
                          <th style={{ padding: "10px" }}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dualTelemetryModal.data.diaryEntries.map((e) => (
                          <tr key={e._id} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", color: "var(--text-primary)" }}>
                            <td style={{ padding: "10px", fontWeight: "bold" }}>Day {e.dayNumber}</td>
                            <td style={{ padding: "10px", color: "var(--text-secondary)" }}>{e.date}</td>
                            <td style={{ padding: "10px" }}>{e.activities}</td>
                            <td style={{ padding: "10px" }}>{e.hoursWorked || 8} hrs</td>
                            <td style={{ padding: "10px" }}>
                              <span style={{ color: "#34d399", fontWeight: "bold" }}>✓ Verified</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      )}
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
    background: "var(--card-item-bg)",
    borderRadius: "999px",
    border: "1px solid var(--card-item-border)",
    color: "var(--text-secondary)",
    fontSize: "12px",
    fontWeight: 700,
  },
  searchInput: {
    ...theme.input(),
    maxWidth: "400px",
  },
  input: {
    ...theme.input(),
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
    background: "var(--card-item-bg)",
    border: `1px solid var(--card-item-border)`,
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
    color: "var(--btn-text)"
  },
  roleTag: {
    display: "inline-block",
    fontSize: "11px",
    background: "rgba(99, 102, 241, 0.12)",
    color: "var(--accent)",
    border: "1px solid rgba(99, 102, 241, 0.25)",
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
    ...theme.button("secondary"),
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
    ...theme.button("outline"),
  },
  confirmDeleteBtn: {
    ...theme.button("danger"),
  }
};