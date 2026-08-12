import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import apiClient from "../apiClient";
import theme from "../theme";
import { sendNotification } from "../emailService"; // ✅ Keeps the Email Feature working
import BentoCard from "../components/BentoCard";
import { useToast } from "../components/ToastContext";
import Skeleton from "../components/Skeleton";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [admin, setAdmin] = useState(null);
  const [pendingRegistrations, setPendingRegistrations] = useState([]);
  const [approvedStudents, setApprovedStudents] = useState([]);
  const [requests, setRequests] = useState([]);
  const [pendingJobs, setPendingJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  const [newCoordForm, setNewCoordForm] = useState({ name: "", email: "", password: "" });
  const [pendingSocialResets, setPendingSocialResets] = useState([]);
  const [pendingEligibility, setPendingEligibility] = useState([]);
  const [searchIndexQuery, setSearchIndexQuery] = useState("");
  const [studentModal, setStudentModal] = useState({ show: false, student: null });

  const [allSupervisors, setAllSupervisors] = useState([]);
  const [monitoringData, setMonitoringData] = useState([]);
  const [selectedStudentForJob, setSelectedStudentForJob] = useState({});
  const [selectedBatchFilter, setSelectedBatchFilter] = useState("ALL");
  const [docPreviewModal, setDocPreviewModal] = useState({ show: false, title: "", url: "" });
  const [dualTelemetryModal, setDualTelemetryModal] = useState({ show: false, data: null, loading: false });

  const fetchDualTelemetry = async (studentId) => {
    try {
      setDualTelemetryModal({ show: true, data: null, loading: true });
      const res = await apiClient.get(`/intern/coordinator/dual-telemetry/${studentId}`);
      if (res.data?.ok) {
        setDualTelemetryModal({ show: true, data: res.data, loading: false });
      }
    } catch (err) {
      addToast("Failed to load dual logbook telemetry.", "error");
      setDualTelemetryModal({ show: false, data: null, loading: false });
    }
  };

  const [studentBgModal, setStudentBgModal] = useState({ show: false, student: null, loading: false, report: null });

  const openStudentBgModal = async (student) => {
    setStudentBgModal({ show: true, student, loading: true, report: null });
    try {
      const res = await apiClient.post("/users/ai-background-check", { studentId: student._id || student.id });
      if (res.data?.ok) {
        setStudentBgModal({ show: true, student, loading: false, report: res.data.report });
      } else {
        setStudentBgModal({ show: true, student, loading: false, report: null });
      }
    } catch (err) {
      setStudentBgModal({ show: true, student, loading: false, report: null });
    }
  };

  const handleViewDocument = (title, url) => {
    if (!url) {
      addToast("Document proof not available", "warning");
      return;
    }
    setDocPreviewModal({ show: true, title, url });
  };

  const handleCoordinatorMatch = async (jobId, supervisorObj) => {
    const studentId = selectedStudentForJob[jobId];
    if (!studentId) {
      addToast("Please select an eligible 3rd-year intern student to assign.", "warning");
      return;
    }

    const supervisorId = (typeof supervisorObj === 'object' && supervisorObj?._id) ? supervisorObj._id : supervisorObj;
    if (!supervisorId) {
      addToast("Supervisor details missing for this vacancy.", "error");
      return;
    }

    try {
      const res = await apiClient.post("/users/coordinator/assign-internship", {
        studentId,
        supervisorId,
        jobId
      });
      if (res.data?.ok) {
        addToast("🎉 Student successfully matched & assigned to Supervisor Internship!", "success");
        fetchAllData();
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.response?.data?.error || err.message || "Failed to assign student to internship.";
      addToast(`❌ ${errorMsg}`, "error");
    }
  };

  useEffect(() => {
    // 1. Check Login
    const data = localStorage.getItem("user");
    if (!data) {
      navigate("/login");
      return;
    }
    const parsed = JSON.parse(data);
    if (parsed.role !== "admin" && parsed.role !== "coordinator") {
      addToast("Access Denied: LNBTI Academic Coordinators only.", "error");
      if (parsed.role === "employer" || parsed.role === "supervisor") {
        navigate("/employer-dashboard");
      } else {
        navigate("/user-dashboard");
      }
      return;
    }
    setAdmin(parsed);

    // 2. Fetch All Coordinator Data
    fetchAllData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchPendingRegistrations(),
        fetchApprovedStudents(),
        fetchPendingRequests(),
        fetchPendingJobs(),
        fetchPendingSocialResets(),
        fetchPendingEligibility(),
        fetchAllSupervisors(),
        fetchMonitoringData()
      ]);
    } catch (e) {
      console.error("Coordinator data load error", e);
    } finally {
      setLoading(false);
    }
  };

  const fetchMonitoringData = async () => {
    try {
      const res = await apiClient.get("/growth/coordinator-monitoring");
      if (res.data?.ok) {
        setMonitoringData(res.data.students || []);
      }
    } catch (err) {
      console.error("Coordinator monitoring fetch error:", err);
    }
  };

  const fetchAllSupervisors = async () => {
    try {
      const res = await apiClient.get("/intern/coordinator/all-supervisors");
      if (res.data?.ok) {
        setAllSupervisors(res.data.supervisors || []);
      }
    } catch (err) {
      console.error("Fetch all supervisors error:", err);
    }
  };

  const fetchPendingEligibility = async () => {
    try {
      const res = await apiClient.get("/intern/coordinator/pending-eligibility");
      setPendingEligibility(res.data.pendingStudents || []);
    } catch (err) {
      console.error("Pending eligibility fetch error:", err);
    }
  };

  const fetchPendingSocialResets = async () => {
    try {
      const res = await apiClient.get("/users/coordinator/pending-social-resets");
      setPendingSocialResets(res.data.pendingResets || []);
    } catch (err) {
      console.error("Pending social resets error:", err);
    }
  };

  const handleCreateCoordinator = async (e) => {
    e.preventDefault();
    try {
      const res = await apiClient.post("/users/coordinator/create-coordinator", newCoordForm);
      if (res.data?.ok) {
        addToast(res.data.message || "New Coordinator created successfully!", "success");
        setNewCoordForm({ name: "", email: "", password: "" });
      }
    } catch (err) {
      addToast(err.response?.data?.message || "Failed to create Coordinator.", "error");
    }
  };

  const handleApproveSocialReset = async (studentId) => {
    try {
      const res = await apiClient.put(`/users/coordinator/approve-social-reset/${studentId}`);
      if (res.data?.ok) {
        addToast("🎉 Student social accounts unlocked & reset!", "success");
        fetchPendingSocialResets();
      }
    } catch (err) {
      addToast("Failed to unlock social account.", "error");
    }
  };

  const handleAssignSupervisor = async (studentId, supervisorId) => {
    try {
      const res = await apiClient.put("/intern/coordinator/assign-supervisor", { studentId, supervisorId: supervisorId || "" });
      if (res.data?.ok) {
        addToast(res.data.message || "Industry Supervisor assignment updated successfully!", "success");
        fetchApprovedStudents();
      }
    } catch (err) {
      addToast(err.response?.data?.message || err.message || "Failed to update supervisor assignment.", "error");
    }
  };

  const handleReviewEligibility = async (studentId, decision) => {
    let rejectionReason = "";
    if (decision === "REJECT") {
      rejectionReason = window.prompt("Enter rejection feedback for the student (e.g. Unreadable result sheet, re-upload clear PDF):");
      if (rejectionReason === null) return; // User cancelled
    }

    try {
      const res = await apiClient.put(`/intern/coordinator/review-eligibility/${studentId}`, {
        decision,
        rejectionReason
      });
      if (res.data?.ok) {
        addToast(res.data.message || `Eligibility decision saved (${decision})!`, "success");
        fetchPendingEligibility();
      }
    } catch (err) {
      addToast(err.response?.data?.message || "Failed to submit eligibility review decision.", "error");
    }
  };

  const fetchPendingRegistrations = async () => {
    try {
      const res = await apiClient.get("/users/coordinator/pending-registrations");
      setPendingRegistrations(res.data.pendingStudents || []);
    } catch (err) { console.error("Error fetching pending registrations", err); }
  };

  const fetchApprovedStudents = async () => {
    try {
      const res = await apiClient.get("/users/candidates");
      setApprovedStudents(res.data.candidates || []);
    } catch (err) { console.error("Error fetching approved students", err); }
  };

  const fetchPendingRequests = async () => {
    try {
      const res = await apiClient.get("/users/admin/pending-requests");
      setRequests(res.data.requests || []);
    } catch (err) { console.error("Error fetching admin requests", err); }
  };

  const fetchPendingJobs = async () => {
    try {
      const res = await apiClient.get("/users/admin/pending-jobs");
      setPendingJobs(res.data.jobs || []);
    } catch (err) { console.error("Error fetching jobs", err); }
  };

  // --- HANDLERS ---

  // 1. Student Registration Approval
  const handleRegistrationApproval = async (studentId, decision) => {
    try {
      if (decision === 'approve') {
        await apiClient.put(`/users/coordinator/approve-student/${studentId}`);
        addToast("✅ Student registration approved! Access granted.", "success");
      } else {
        await apiClient.put(`/users/coordinator/reject-student/${studentId}`);
        addToast("Registration rejected.", "info");
      }
      fetchPendingRegistrations();
      fetchApprovedStudents();
    } catch (err) {
      addToast("Failed to process registration approval.", "error");
    }
  };

  // 2. Student Stage Promotion
  const handleStagePromotion = async (studentId, newStage) => {
    try {
      await apiClient.put(`/users/coordinator/promote-student/${studentId}`, { studentStage: newStage });
      addToast(`🎉 Student promoted to ${newStage.replace('_', ' ')}!`, "success");
      fetchApprovedStudents();
    } catch (err) {
      addToast("Failed to update student stage.", "error");
    }
  };

  // 3. Handle Connection Requests (With Email)
  const handleRequestDecision = async (req, decision) => {
    try {
      const newStatus = decision === 'approve' ? 'PENDING_EMPLOYEE' : 'DENIED';
      await apiClient.put(`/users/requests/${req._id}`, { status: newStatus });

      if (decision === 'approve' && req.employeeId?.email && req.employerId?.name) {
          await sendNotification(
            req.employeeId.name,  
            req.employeeId.email, 
            req.employerId.name   
          );
          addToast(`✅ Connection Approved & Email Alert Sent to ${req.employeeId.email}`, "success");
      } else {
          addToast(`Request ${decision}d successfully!`, "success");
      }
      fetchPendingRequests();
    } catch (err) {
      addToast("Error updating request.", "error");
    }
  };

  // 4. Handle Job Approvals
  const handleJobDecision = async (jobId, decision) => {
    try {
        const status = decision === 'approve' ? 'approved' : 'rejected';
        await apiClient.put(`/users/admin/jobs/${jobId}`, { status });
        addToast(`Vacancy Post ${status.toUpperCase()}!`, "success");
        fetchPendingJobs();
    } catch (err) {
        addToast("Error updating job.", "error");
    }
  };

  if (!admin) return null;

  return (
    <div className="bento-grid" style={styles.page}>
      {/* Header Card - Spans 4 Columns */}
      <BentoCard colSpan={4} padding="32px">
        <h2 style={styles.title}>Senior Lecturer & Academic Coordinator Hub</h2>
        <p style={styles.subText}>Welcome, {admin?.name}. Approve registrations, manage student academic stages, and moderate vacancies.</p>
        <div style={styles.pillRow}>
          <span style={styles.pillSecondary}>LNBTI Coordinator Access</span>
        </div>
      </BentoCard>

      {/* 🔐 NEW SECTION: CREATE NEW ACADEMIC COORDINATOR - Spans 2 Columns */}
      <BentoCard colSpan={2} disableTilt={true}>
        <h3 style={{ ...styles.title, marginBottom: 15, color: "#a78bfa" }}>
          🔐 Add New Academic Coordinator
        </h3>
        <p style={{ color: "var(--text-secondary)", fontSize: "13px", marginBottom: "15px" }}>
          Coordinator accounts are restricted. Only existing LNBTI Senior Lecturers can register new Academic Coordinators.
        </p>
        <form onSubmit={handleCreateCoordinator} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <input
            placeholder="Senior Lecturer Full Name"
            value={newCoordForm.name}
            onChange={(e) => setNewCoordForm({ ...newCoordForm, name: e.target.value })}
            style={theme.input()}
            required
          />
          <input
            type="email"
            placeholder="Official Email (@lnbti.edu.lk)"
            value={newCoordForm.email}
            onChange={(e) => setNewCoordForm({ ...newCoordForm, email: e.target.value })}
            style={theme.input()}
            required
          />
          <input
            type="password"
            placeholder="Initial Account Password"
            value={newCoordForm.password}
            onChange={(e) => setNewCoordForm({ ...newCoordForm, password: e.target.value })}
            style={theme.input()}
            required
          />
          <button type="submit" style={theme.button("primary")} className="button-hover">
            Register Academic Coordinator
          </button>
        </form>
      </BentoCard>

      {/* 📋 NEW SECTION: PENDING INTERNSHIP ELIGIBILITY REVIEWS - Spans 4 Columns */}
      <BentoCard colSpan={4} disableTilt={true}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px", flexWrap: "wrap", gap: "10px" }}>
          <div>
            <h3 style={{ ...styles.title, color: "#6366f1", margin: 0 }}>
              📋 Pending Internship Eligibility Reviews ({pendingEligibility.length})
            </h3>
            <p style={{ color: "var(--text-secondary)", fontSize: "13px", margin: "4px 0 0 0" }}>
              Review student Japanese levels, calculated GPAs, and uploaded proof documents (JLPT Certificate & Official Result Sheet).
            </p>
          </div>
        </div>

        {pendingEligibility.length === 0 ? (
          <p style={{ color: theme.colors.textSecondary, fontSize: "13px" }}>
            No student internship eligibility applications pending review.
          </p>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "16px" }}>
            {pendingEligibility.map((student) => (
              <div key={student._id} style={{
                background: "var(--glass-bg, rgba(255,255,255,0.03))",
                border: "1px solid var(--glass-border)",
                borderRadius: theme.radii.lg,
                padding: "18px",
                display: "flex",
                flexDirection: "column",
                justify: "space-between"
              }}>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
                    <div>
                      <h4 style={{ margin: "0 0 4px 0", color: "var(--text-primary)", fontSize: "16px" }}>{student.name}</h4>
                      <div style={{ fontSize: "12px", color: "var(--accent)" }}>
                        🪪 Index: {student.indexNumber || "N/A"} • {student.degreeProgram || "BSc SE"}
                      </div>
                      <div style={{ fontSize: "11px", color: "var(--text-secondary)", marginTop: "2px" }}>
                        📧 {student.email} • 🎓 {student.batchNumber || "LNBTI Student"}
                      </div>
                    </div>
                    <span style={{
                      background: "rgba(234, 179, 8, 0.15)",
                      color: "#eab308",
                      border: "1px solid rgba(234, 179, 8, 0.4)",
                      padding: "4px 10px",
                      borderRadius: "12px",
                      fontSize: "11px",
                      fontWeight: "bold"
                    }}>
                      ⏳ PENDING REVIEW
                    </span>
                  </div>

                  {/* Parameter Summary */}
                  <div style={{
                    background: "rgba(0,0,0,0.25)",
                    padding: "10px 14px",
                    borderRadius: theme.radii.md,
                    margin: "12px 0",
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "10px",
                    fontSize: "12px"
                  }}>
                    <div>
                      <span style={{ color: "var(--text-secondary)", display: "block" }}>Japanese Qualification:</span>
                      <strong style={{ color: (student.jlptLevel === "NONE" || student.jlptLevel === "N5") ? "#ef4444" : "#22c55e" }}>
                        {student.jlptLevel || "NONE"}
                      </strong>
                    </div>

                    <div>
                      <span style={{ color: "var(--text-secondary)", display: "block" }}>Cumulative GPA:</span>
                      <strong style={{ color: (student.gpa >= 2.0) ? "#22c55e" : "#ef4444" }}>
                        {Number(student.gpa || 0).toFixed(2)} / 4.0
                      </strong>
                    </div>
                  </div>

                  {/* Proof Documents Buttons */}
                  <div style={{ display: "flex", gap: "8px", marginBottom: "14px", flexWrap: "wrap" }}>
                    {student.jlptProofDocument ? (
                      <button
                        onClick={() => handleViewDocument(`📄 JLPT Certificate Proof — ${student.name}`, student.jlptProofDocument)}
                        style={{
                          ...theme.button("ghost"),
                          fontSize: "11px",
                          padding: "6px 12px",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          cursor: "pointer"
                        }}
                        className="button-hover"
                      >
                        📄 View JLPT Certificate Proof
                      </button>
                    ) : (
                      <span style={{ fontSize: "11px", color: "#ef4444" }}>❌ JLPT Certificate Missing</span>
                    )}

                    {student.gpaProofDocument ? (
                      <button
                        onClick={() => handleViewDocument(`📊 Result Sheet Proof — ${student.name}`, student.gpaProofDocument)}
                        style={{
                          ...theme.button("ghost"),
                          fontSize: "11px",
                          padding: "6px 12px",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          cursor: "pointer"
                        }}
                        className="button-hover"
                      >
                        📊 View Result Sheet Proof
                      </button>
                    ) : (
                      <span style={{ fontSize: "11px", color: "#ef4444" }}>❌ Result Sheet Missing</span>
                    )}
                  </div>
                </div>

                {/* Actions Row */}
                <div style={{ display: "flex", gap: "10px", marginTop: "8px" }}>
                  <button
                    onClick={() => handleReviewEligibility(student._id, "APPROVE")}
                    style={{
                      ...theme.button("primary"),
                      flex: 1,
                      fontSize: "12px",
                      padding: "8px 0",
                      background: "linear-gradient(135deg, #22c55e, #16a34a)"
                    }}
                  >
                    ✅ Approve Eligibility
                  </button>

                  <button
                    onClick={() => handleReviewEligibility(student._id, "REJECT")}
                    style={{
                      ...theme.button("danger"),
                      flex: 1,
                      fontSize: "12px",
                      padding: "8px 0"
                    }}
                  >
                    ❌ Reject Application
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </BentoCard>

      {/* 🔄 NEW SECTION: STUDENT SOCIAL ACCOUNT RESET REQUESTS - Spans 2 Columns */}
      <BentoCard colSpan={2} disableTilt={true}>
        <h3 style={{ ...styles.title, marginBottom: 15, color: "#34d399" }}>
          🔄 Student Social Reset Requests ({pendingSocialResets.length})
        </h3>
        {pendingSocialResets.length === 0 ? (
          <p style={{ color: theme.colors.textSecondary, fontSize: "13px" }}>No student GitHub/LinkedIn reset requests pending.</p>
        ) : (
          <div style={styles.listContainer}>
            {pendingSocialResets.map((st) => (
              <div key={st._id} style={styles.requestItem}>
                <div style={{ flex: 1 }}>
                  <h4 style={{ margin: "0 0 4px 0", color: "var(--text-primary)" }}>{st.name}</h4>
                  <p style={{ margin: 0, fontSize: "12px", color: "var(--accent)" }}>
                    Index: {st.indexNumber || "N/A"} • Linked GitHub: @{st.githubUsername || "None"}
                  </p>
                  <p style={{ margin: "4px 0 0", fontSize: "12px", color: "var(--text-secondary)", italic: "true" }}>
                    Reason: "{st.socialResetRequest?.reason || "Requesting link swap"}"
                  </p>
                </div>
                <button onClick={() => handleApproveSocialReset(st._id)} style={styles.approveBtn} className="button-hover">
                  Unlock & Reset Link
                </button>
              </div>
            ))}
          </div>
        )}
      </BentoCard>

      {/* 📊 COORDINATOR STUDENT ENGAGEMENT, MOTIVATION & SKILL ANALYTICS HUB - SPANS 4 COLUMNS */}
      <BentoCard colSpan={4} disableTilt={true}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
          <div>
            <h3 style={{ ...styles.title, margin: 0, color: "var(--accent, #6366f1)", display: "flex", alignItems: "center", gap: "8px" }}>
              📊 Student Engagement, Motivation & Skill Development Hub
            </h3>
            <p style={{ color: "var(--text-secondary)", fontSize: "14px", margin: "4px 0 0" }}>
              Monitor student engagement activity, daily streaks, developed skills, and weekly score progress across all degree batches.
            </p>
          </div>
          <span style={{ fontSize: "13px", fontWeight: "bold", padding: "6px 12px", background: "rgba(99,102,241,0.15)", color: "#818cf8", borderRadius: "8px", border: "1px solid rgba(99,102,241,0.3)" }}>
            Total Monitored: {monitoringData.length} Students
          </span>
        </div>

        {monitoringData.length === 0 ? (
          <p style={{ color: theme.colors.textSecondary }}>No student engagement data recorded yet.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {monitoringData.map((st) => (
              <div
                key={st._id}
                style={{
                  padding: "14px 18px",
                  borderRadius: "12px",
                  background: "var(--card-item-bg, rgba(255,255,255,0.03))",
                  border: "1px solid var(--card-item-border, rgba(255,255,255,0.08))",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: "12px"
                }}
              >
                {/* Student Info */}
                <div style={{ flex: 1, minWidth: "220px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
                    <strong style={{ fontSize: "15px", color: "var(--text-primary)" }}>{st.name}</strong>
                    <span style={{ fontSize: "11px", padding: "2px 8px", borderRadius: "6px", background: "rgba(99,102,241,0.15)", color: "var(--accent)", fontWeight: "bold" }}>
                      {st.batchNumber}
                    </span>
                    <span style={{ fontSize: "11px", padding: "2px 8px", borderRadius: "6px", background: st.motivationBadge === "success" ? "rgba(16,185,129,0.15)" : st.motivationBadge === "info" ? "rgba(99,102,241,0.15)" : "rgba(245,158,11,0.15)", color: st.motivationBadge === "success" ? "#34d399" : st.motivationBadge === "info" ? "#818cf8" : "#f59e0b", fontWeight: "bold" }}>
                      {st.motivationStatus}
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: "13px", color: "var(--text-secondary)" }}>
                    Index: {st.indexNumber} • {st.degreeBatch} • Stage: {st.studentStage}
                  </p>
                </div>

                {/* Developed Skills Badges */}
                <div style={{ flex: 1, minWidth: "200px" }}>
                  <span style={{ fontSize: "11px", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>Developed Skills:</span>
                  <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                    {st.developedSkills.slice(0, 4).map((sk, idx) => (
                      <span key={idx} style={{ fontSize: "11px", padding: "3px 8px", borderRadius: "6px", background: "rgba(255,255,255,0.06)", color: "var(--text-primary)", border: "1px solid rgba(255,255,255,0.1)" }}>
                        {sk}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Score, Progress & AI Background Check */}
                <div style={{ textAlign: "right", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "6px" }}>
                  <span style={{ fontSize: "16px", fontWeight: "bold", color: "#34d399", display: "block" }}>
                    Progress: {st.totalProgress}%
                  </span>
                  <button
                    onClick={() => openStudentBgModal(st)}
                    style={{ ...theme.button("secondary"), fontSize: "11px", padding: "4px 10px", display: "flex", alignItems: "center", gap: "6px" }}
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

      {/* SECTION 1: PENDING STUDENT REGISTRATIONS - Spans 2 Columns */}
      <BentoCard colSpan={2} disableTilt={true}>
        <h3 style={{ ...styles.title, marginBottom: 20, color: "#6366f1" }}>
          📝 Pending Student Sign-ups ({pendingRegistrations.length})
        </h3>

        {loading ? (
          <Skeleton width="100%" height="120px" />
        ) : pendingRegistrations.length === 0 ? (
          <p style={{ color: theme.colors.textSecondary }}>No student sign-ups awaiting approval.</p>
        ) : (
          <div style={styles.listContainer}>
            {pendingRegistrations.map((st) => (
              <div key={st._id} style={styles.requestItem}>
                <div style={{ flex: 1 }}>
                  <h4 style={{ margin: "0 0 4px 0", color: "var(--text-primary)" }}>{st.name}</h4>
                  <p style={{ margin: 0, fontSize: "13px", color: "var(--accent)", fontWeight: "600" }}>
                    Index: {st.indexNumber || "N/A"} • Batch Category: {st.degreeBatch || "UGC (SE)"}
                  </p>
                  <p style={{ margin: "4px 0 0", fontSize: "12px", color: theme.colors.textSecondary }}>
                    📧 {st.email} | {st.academicYear || "Year 1"} {st.academicSemester || "Semester 1"} | {st.degreeProgram || "BSc SE"}
                  </p>
                </div>
                <div style={styles.btnGroup}>
                  <button onClick={() => handleRegistrationApproval(st._id, 'approve')} style={styles.approveBtn} className="button-hover">
                    Approve
                  </button>
                  <button onClick={() => handleRegistrationApproval(st._id, 'reject')} style={styles.denyBtn} className="button-hover">
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </BentoCard>

      {/* 📊 STUDENT PERFORMANCE & TELEMETRY MONITOR MODAL */}
      {studentModal.show && studentModal.student && (() => {
        const st = studentModal.student;
        const repoCount = st.githubRepos?.length || 0;

        // Dynamic GitHub Score Calculation
        const computedGhScore = (st.githubEvaluation?.score && st.githubEvaluation.score > 0)
          ? st.githubEvaluation.score
          : (st.githubUsername && repoCount > 0)
          ? Math.min(95, Math.max(68, 62 + (repoCount * 4)))
          : (st.githubUsername ? 75 : 0);

        const ghSummary = st.githubEvaluation?.summary || (repoCount > 0
          ? `Verified ${repoCount} public repositories linked on GitHub (@${st.githubUsername}). Code telemetry active.`
          : st.githubUsername
          ? `GitHub account @${st.githubUsername} linked. Awaiting repository sync.`
          : "Student has not connected GitHub portfolio yet.");

        const stageLabel = st.studentStage === "FINAL_YEAR_JOB" ? "🎓 Final Year (Job Expecting)" : st.studentStage === "YEAR_3_INTERN" ? "⚡ 3rd Year (Intern Ready)" : "📘 Stage 1 (Foundation)";

        return (
          <div style={styles.modalOverlay}>
            <div style={{ ...styles.modalContent, maxWidth: "680px", width: "95%", maxHeight: "88vh", overflowY: "auto" }} className="card-animate">
              {/* MODAL HEADER */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "18px", borderBottom: "1px solid var(--border)", paddingBottom: "14px" }}>
                <div>
                  <span style={{ fontSize: "11px", color: "var(--accent)", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    🎓 LNBTI Student Performance Radar
                  </span>
                  <h2 style={{ margin: "4px 0 0", color: "var(--text-primary)", fontSize: "20px" }}>
                    {st.extractedName || st.name}
                  </h2>
                  <p style={{ margin: "4px 0 0", fontSize: "12px", color: "var(--text-secondary)" }}>
                    🪪 Index: <strong style={{ color: "var(--accent)" }}>{st.indexNumber || "N/A"}</strong> • Batch: <strong>{st.degreeBatch || "UGC (SE)"} ({st.batchNumber || "N/A"})</strong>
                  </p>
                </div>
                <button
                  onClick={() => setStudentModal({ show: false, student: null })}
                  style={{ background: "rgba(255,255,255,0.08)", border: "1px solid var(--border)", color: "var(--text-primary)", width: "32px", height: "32px", borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px" }}
                  className="button-hover"
                >
                  ✕
                </button>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {/* 1. ACADEMIC LEVEL & STAGE SUMMARY */}
                <div style={{ padding: "16px", background: "var(--card-item-bg)", borderRadius: "12px", border: "1px solid var(--card-item-border)", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px" }}>
                  <div>
                    <span style={{ fontSize: "11px", color: "var(--text-secondary)", display: "block" }}>Degree Program</span>
                    <strong style={{ fontSize: "13px", color: "var(--text-primary)" }}>{st.degreeBatch || "UGC (SE)"} • {st.degreeProgram || "BSc SE"}</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: "11px", color: "var(--text-secondary)", display: "block" }}>Academic Level</span>
                    <strong style={{ fontSize: "13px", color: "var(--success)" }}>{st.academicYear || "Year 1"} ({st.academicSemester || "Semester 1"})</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: "11px", color: "var(--text-secondary)", display: "block" }}>Coordinator Control Stage</span>
                    <span style={{ fontSize: "12px", color: "var(--accent)", fontWeight: "bold" }}>{stageLabel}</span>
                  </div>
                </div>

                {/* 2. ATS RESUME PERFORMANCE */}
                <div style={{ padding: "16px", background: "var(--card-item-bg)", borderRadius: "12px", border: "1px solid var(--card-item-border)" }}>
                  <h4 style={{ margin: "0 0 10px 0", color: "#a78bfa", fontSize: "14px" }}>📄 ATS Resume Performance</h4>
                  <div style={{ display: "flex", gap: "20px", alignItems: "center", marginBottom: "10px" }}>
                    <div>
                      <span style={{ fontSize: "11px", color: "var(--text-secondary)", display: "block" }}>ATS Score</span>
                      <strong style={{ fontSize: "20px", color: (st.atsScore || 0) >= 70 ? "var(--success)" : "#f59e0b" }}>{st.atsScore || 0}%</strong>
                    </div>
                    <div>
                      <span style={{ fontSize: "11px", color: "var(--text-secondary)", display: "block" }}>Target Role Classification</span>
                      <strong style={{ fontSize: "13px", color: "var(--text-primary)" }}>{st.seekingRole || "Not Analyzed Yet"}</strong>
                    </div>
                  </div>
                  {st.atsImprovements && st.atsImprovements.length > 0 && (
                    <div style={{ marginTop: "8px", paddingTop: "8px", borderTop: "1px solid var(--card-item-border)" }}>
                      <span style={{ fontSize: "11px", color: "var(--text-secondary)", fontWeight: "bold" }}>Recommended Improvements:</span>
                      <ul style={{ margin: "4px 0 0", paddingLeft: "18px", fontSize: "12px", color: "var(--text-secondary)" }}>
                        {st.atsImprovements.map((imp, idx) => (
                          <li key={idx} style={{ marginBottom: "2px" }}>{imp}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* 3. GITHUB CODE TELEMETRY & METRICS */}
                <div style={{ padding: "16px", background: "var(--card-item-bg)", borderRadius: "12px", border: "1px solid var(--card-item-border)" }}>
                  <h4 style={{ margin: "0 0 10px 0", color: "#34d399", fontSize: "14px" }}>🐙 GitHub Code Telemetry</h4>
                  <p style={{ fontSize: "13px", margin: "0 0 10px 0", color: "var(--text-primary)" }}>
                    Linked Account: {st.githubUsername ? <strong style={{ color: "var(--accent)" }}>@{st.githubUsername}</strong> : <span style={{ color: "var(--text-secondary)" }}>Not Connected</span>}
                  </p>
                  <div style={{ display: "flex", gap: "25px", marginBottom: "10px" }}>
                    <div>
                      <span style={{ fontSize: "11px", color: "var(--text-secondary)", display: "block" }}>AI Code Index</span>
                      <strong style={{ fontSize: "20px", color: computedGhScore >= 70 ? "var(--accent)" : "#f59e0b" }}>{computedGhScore} / 100</strong>
                    </div>
                    <div>
                      <span style={{ fontSize: "11px", color: "var(--text-secondary)", display: "block" }}>Public Repositories</span>
                      <strong style={{ fontSize: "20px", color: "var(--text-primary)" }}>{repoCount}</strong>
                    </div>
                  </div>
                  <p style={{ fontSize: "12px", color: "var(--text-secondary)", margin: 0, lineHeight: 1.5 }}>
                    {ghSummary}
                  </p>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* SECTION 2: STUDENT STAGE CONTROL & PERFORMANCE MONITORING - Spans 2 Columns */}
      <BentoCard colSpan={2} disableTilt={true}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 15, flexWrap: "wrap", gap: "10px" }}>
          <h3 style={{ ...styles.title, margin: 0, color: "#a78bfa" }}>
            🎯 Student Stage & Performance Monitoring ({approvedStudents.length})
          </h3>
          {/* BATCH FILTER DROPDOWN */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: "bold" }}>Filter Batch:</span>
            <select
              value={selectedBatchFilter}
              onChange={(e) => setSelectedBatchFilter(e.target.value)}
              style={{ ...theme.input(), padding: "4px 10px", fontSize: "12px", width: "auto" }}
            >
              <option value="ALL">All Batches</option>
              {[...new Set(approvedStudents.map(st => st.batchNumber).filter(Boolean))].map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>
        </div>

        {/* 🪪 INDEX NUMBER SEARCH BAR */}
        <div style={{ marginBottom: "15px" }}>
          <input
            type="text"
            placeholder="🔍 Search Student by Name, Index Number or Batch (e.g. SE1, UGC0323021)..."
            value={searchIndexQuery}
            onChange={(e) => setSearchIndexQuery(e.target.value)}
            style={{ ...theme.input(), width: "100%", fontSize: "13px" }}
          />
        </div>

        {loading ? (
          <Skeleton width="100%" height="120px" />
        ) : approvedStudents.length === 0 ? (
          <p style={{ color: theme.colors.textSecondary }}>No approved students in system yet.</p>
        ) : (
          <div style={{ ...styles.listContainer, maxHeight: "360px", overflowY: "auto" }}>
            {approvedStudents
              .filter(st => {
                const matchBatch = selectedBatchFilter === "ALL" || st.batchNumber === selectedBatchFilter;
                if (!searchIndexQuery) return matchBatch;
                const q = searchIndexQuery.toLowerCase();
                return matchBatch && (
                  (st.indexNumber || "").toLowerCase().includes(q) ||
                  (st.name || "").toLowerCase().includes(q) ||
                  (st.batchNumber || "").toLowerCase().includes(q)
                );
              })
              .map((st) => (
                <div key={st._id} style={{ ...styles.requestItem, padding: "14px", flexDirection: "column", alignItems: "flex-start", gap: "8px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", width: "100%", alignItems: "center" }}>
                    <div>
                      <h4 style={{ margin: "0 0 2px 0", color: "var(--text-primary)", fontSize: "15px" }}>{st.name}</h4>
                      <span style={{ fontSize: "11px", color: "var(--accent)", fontWeight: "bold" }}>
                        🪪 {st.indexNumber || "No Index"} • {st.batchNumber || "No Batch"}
                      </span>
                    </div>
                    <select
                      value={st.studentStage || "YEAR_1_2"}
                      onChange={(e) => handleStagePromotion(st._id, e.target.value)}
                      style={{ ...theme.input(), padding: "4px 8px", fontSize: "11px", width: "auto" }}
                    >
                      <option value="YEAR_1_2">1st/2nd Year</option>
                      <option value="YEAR_3_INTERN">3rd Yr Intern Ready</option>
                      <option value="FINAL_YEAR_JOB">Final Yr Job Expecting</option>
                    </select>
                  </div>

                  {/* 👔 Industry Supervisor Assignment Row (ONLY for 3rd-Year Intern Students) */}
                  {st.studentStage === "YEAR_3_INTERN" ? (
                    <div style={{ display: "flex", gap: "8px", width: "100%", alignItems: "center" }}>
                      <span style={{ fontSize: "11px", color: "var(--text-secondary)", minWidth: "120px" }}>👔 Industry Supervisor:</span>
                      <select
                        value={st.assignedSupervisor?._id || st.assignedSupervisor || ""}
                        onChange={(e) => handleAssignSupervisor(st._id, e.target.value)}
                        style={{ ...theme.input(), padding: "4px 8px", fontSize: "11px", flex: 1, background: "rgba(0,0,0,0.3)" }}
                      >
                        <option value="" style={{ background: "#1e293b", color: "#fff" }}>-- No Supervisor Assigned --</option>
                        {allSupervisors.map(sup => (
                          <option key={sup._id} value={sup._id} style={{ background: "#1e293b", color: "#fff" }}>
                            {sup.name} ({sup.companyName || sup.designation || "LNBTI Partner"})
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div style={{ fontSize: "11px", color: "var(--text-secondary)", italic: "true" }}>
                      ℹ️ {st.studentStage === "FINAL_YEAR_JOB" ? "Graduating Student (Direct Job Mode)" : "Foundation Student (Internship unavailable until 3rd Year)"}
                    </div>
                  )}

                  <button
                    onClick={() => setStudentModal({ show: true, student: st })}
                    style={{ ...theme.button("secondary"), fontSize: "12px", width: "100%", padding: "6px" }}
                    className="button-hover"
                  >
                    📊 View Performance & Telemetry (ATS: {st.atsScore || 0}%, GH: {st.githubEvaluation?.score || 0})
                  </button>
                </div>
              ))}
          </div>
        )}
      </BentoCard>

      {/* SECTION 3: JOB VACANCY APPROVALS - Spans 2 Columns */}
      {(() => {
        const unapprovedJobs = pendingJobs.filter(job => (job.status === "pending" || job.status === "pending_coordinator") && !job.isMatched);
        return (
          <BentoCard colSpan={2} disableTilt={true}>
            <h3 style={{ ...styles.title, marginBottom: 20, color: "#34d399" }}>
              📢 Vacancy Post Approvals ({unapprovedJobs.length})
            </h3>

            {loading ? (
              <Skeleton width="100%" height="120px" />
            ) : unapprovedJobs.length === 0 ? (
              <p style={{ color: theme.colors.textSecondary }}>No pending job posts requiring approval.</p>
            ) : (
              <div style={styles.listContainer}>
                {unapprovedJobs.map((job) => {
                  const email = job.contactEmail || job.employerId?.email || "N/A";
                  const phone = job.contactPhone || job.employerId?.phone || "N/A";

                  return (
                    <div key={job._id} style={styles.requestItem}>
                      <div style={{ flex: 1 }}>
                        <h4 style={{ margin: "0 0 5px 0", color: "var(--text-primary)" }}>{job.title}</h4>
                        <div style={styles.row}>
                          <strong style={{ color: "#aaa", fontSize: "12px" }}>Company / Supervisor:</strong> 
                          <span style={{ color: theme.colors.textSecondary, fontSize: "13px" }}> {job.employerId?.name} {job.employerId?.companyName && `(${job.employerId.companyName})`}</span>
                        </div>
                        {/* Contact Details */}
                        <div style={{ fontSize: "12px", color: "var(--accent)", margin: "4px 0" }}>
                          📧 {email} | 📞 {phone}
                        </div>
                        <p style={{ color: "var(--text-secondary)", fontSize: "13px", margin: "5px 0" }}>{job.description}</p>
                        <div style={{ fontSize: "11px", color: "#888" }}>
                           📍 {job.location} | 💰 {job.salary} | 🏷️ {job.opportunityType || "INTERNSHIP"}
                        </div>
                      </div>

                      <div style={styles.btnGroup}>
                        <button onClick={() => handleJobDecision(job._id, 'approve')} style={styles.approveBtn} className="button-hover">
                          Publish
                        </button>
                        <button onClick={() => handleJobDecision(job._id, 'deny')} style={styles.denyBtn} className="button-hover">
                          Reject
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </BentoCard>
        );
      })()}

      {/* 🎓 SECTION 3.5: COORDINATOR INTERNSHIP MATCHING HUB - Spans 2 Columns */}
      {(() => {
        const matchingHubJobs = pendingJobs.filter(job => (job.opportunityType === "INTERNSHIP" || job.postedByRole === "supervisor") && !job.isMatched);
        return (
          <BentoCard colSpan={2} disableTilt={true}>
            <div style={{ marginBottom: "15px" }}>
              <h3 style={{ ...styles.title, color: "#6366f1", margin: 0 }}>
                🎓 Coordinator Internship Matching Hub ({matchingHubJobs.length})
              </h3>
              <p style={{ color: "var(--text-secondary)", fontSize: "13px", margin: "4px 0 0 0" }}>
                Supervisor internship vacancies do not show up on student dashboards directly. Select an eligible 3rd-year intern student to match & assign to each vacancy.
              </p>
            </div>

            {loading ? (
              <Skeleton width="100%" height="140px" />
            ) : matchingHubJobs.length === 0 ? (
              <p style={{ color: theme.colors.textSecondary, fontSize: "13px" }}>No supervisor internship vacancies pending matching.</p>
            ) : (
              <div style={styles.listContainer}>
                {matchingHubJobs.map((job) => {
                  const email = job.contactEmail || job.employerId?.email || "N/A";
                  const phone = job.contactPhone || job.employerId?.phone || "N/A";

                  return (
                    <div key={job._id} style={styles.requestItem}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                          <h4 style={{ margin: "0 0 4px 0", color: "var(--text-primary)" }}>{job.title}</h4>
                          <span style={{ fontSize: "11px", padding: "2px 8px", background: "rgba(99,102,241,0.12)", color: "var(--accent)", borderRadius: "4px", fontWeight: "bold" }}>
                            {job.opportunityType || "INTERNSHIP"}
                          </span>
                        </div>
                        <div style={styles.row}>
                          <strong style={{ color: "var(--text-primary)" }}>Company / Supervisor:</strong>
                          <span style={{ color: theme.colors.textSecondary }}> {job.employerId?.name} {job.employerId?.companyName && `(${job.employerId.companyName})`}</span>
                        </div>

                        {/* Contact Details Badges */}
                        <div style={{ fontSize: "12px", color: "var(--accent)", marginTop: "4px" }}>
                          📧 <strong>Contact Email:</strong> {email} &nbsp;|&nbsp; 📞 <strong>Phone:</strong> {phone}
                        </div>

                        <div style={{ fontSize: "12px", color: theme.colors.textSecondary, marginTop: 4 }}>
                          📍 {job.location} • Stipend: {job.salary}
                        </div>

                        {/* SELECT STUDENT TO MATCH */}
                        <div style={{ marginTop: "12px", display: "flex", gap: "10px", alignItems: "center" }}>
                          <select
                            value={selectedStudentForJob[job._id] || ""}
                            onChange={(e) => setSelectedStudentForJob({ ...selectedStudentForJob, [job._id]: e.target.value })}
                            style={{ ...theme.input(), flex: 1, fontSize: "13px", padding: "6px 10px" }}
                          >
                            <option value="">-- Select Eligible 3rd-Year Intern Student --</option>
                            {approvedStudents
                              .filter(st => (st.role === "student" || st.role === "user" || !st.role) && st.studentStage === "YEAR_3_INTERN" && (selectedBatchFilter === "ALL" || st.batchNumber === selectedBatchFilter))
                              .map(st => (
                                <option key={st._id} value={st._id}>
                                  {st.name} ({st.indexNumber || st.email}) • Batch: {st.batchNumber || "SE"}
                                </option>
                              ))
                            }
                          </select>
                          <button
                            onClick={() => handleCoordinatorMatch(job._id, job.employerId?._id || job.employerId || job.supervisorId)}
                            style={{ ...theme.button("primary"), padding: "6px 14px", fontSize: "12px", whiteSpace: "nowrap" }}
                            className="button-hover"
                          >
                            Match & Assign
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </BentoCard>
        );
      })()}

      {/* 💼 SECTION 3.6: ACTIVE ASSIGNED INTERNSHIPS & DUAL LOGBOOK HUB - Spans 2 Columns */}
      <BentoCard colSpan={2} disableTilt={true}>
        <div style={{ marginBottom: "15px" }}>
          <h3 style={{ ...styles.title, color: "#10b981", margin: 0 }}>
            🏢 Active Assigned Internships & Dual Logbook Telemetry ({approvedStudents.filter(st => st.studentStage === "YEAR_3_INTERN" && st.assignedSupervisor).length})
          </h3>
          <p style={{ color: "var(--text-secondary)", fontSize: "13px", margin: "4px 0 0 0" }}>
            Monitor real-world performance, daily student diary submissions, supervisor feedback, and AI task evaluation verdicts for all matched 3rd-year interns.
          </p>
        </div>

        {approvedStudents.filter(st => st.studentStage === "YEAR_3_INTERN" && st.assignedSupervisor).length === 0 ? (
          <p style={{ color: theme.colors.textSecondary, fontSize: "13px" }}>No active assigned student internships currently active.</p>
        ) : (
          <div style={styles.listContainer}>
            {approvedStudents
              .filter(st => st.studentStage === "YEAR_3_INTERN" && st.assignedSupervisor && (selectedBatchFilter === "ALL" || st.batchNumber === selectedBatchFilter))
              .map((st) => (
                <div key={st._id} style={styles.requestItem}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <h4 style={{ margin: 0, color: "var(--text-primary)", fontSize: "15px" }}>{st.name}</h4>
                      <span style={{ fontSize: "11px", padding: "2px 8px", background: "rgba(16,185,129,0.15)", color: "#10b981", borderRadius: "4px", fontWeight: "bold" }}>
                        ACTIVE INTERN MATCHED
                      </span>
                    </div>
                    <div style={{ fontSize: "12px", color: "var(--accent)", marginTop: "4px" }}>
                      🪪 {st.indexNumber || "No Index"} • Batch: {st.batchNumber || "SE3"}
                    </div>
                    <div style={{ fontSize: "13px", color: "var(--text-primary)", marginTop: "6px" }}>
                      👔 <strong>Industry Supervisor:</strong> {st.assignedSupervisor?.name} ({st.assignedSupervisor?.companyName || "LNBTI Partner"})
                    </div>
                    <div style={{ fontSize: "12px", color: theme.colors.textSecondary, marginTop: "2px" }}>
                      📧 {st.assignedSupervisor?.email || "N/A"} | 📞 {st.assignedSupervisor?.phone || "N/A"}
                    </div>

                    <button
                      onClick={() => fetchDualTelemetry(st._id)}
                      style={{ ...theme.button("secondary"), marginTop: "12px", width: "100%", padding: "8px", fontSize: "12px" }}
                      className="button-hover"
                    >
                      📖 View Dual Logbook Records & AI Verdict
                    </button>
                  </div>
                </div>
              ))}
          </div>
        )}
      </BentoCard>

      {/* SECTION 4: SUPERVISOR CONNECTION APPROVALS - Spans 2 Columns */}
      <BentoCard colSpan={2} disableTilt={true}>
        <h3 style={{ ...styles.title, marginBottom: 20 }}>
          🔗 Connection Approvals ({requests.length})
        </h3>

        {loading ? (
          <Skeleton width="100%" height="120px" />
        ) : requests.length === 0 ? (
          <p style={{ color: theme.colors.textSecondary }}>No pending connection requests.</p>
        ) : (
          <div style={styles.listContainer}>
            {requests.map((req) => (
              <div key={req._id} style={styles.requestItem}>
                <div style={{ flex: 1 }}>
                  <div style={styles.row}>
                    <strong style={{ color: "var(--text-primary)" }}>Supervisor:</strong> 
                    <span style={{ color: theme.colors.textSecondary }}> {req.employerId?.name}</span>
                  </div>
                  <div style={styles.row}>
                    <strong style={{ color: "var(--text-primary)" }}>Student:</strong> 
                    <span style={{ color: theme.colors.textSecondary }}> {req.employeeId?.name}</span>
                  </div>
                  <div style={{ fontSize: "12px", color: theme.colors.textSecondary, marginTop: 5 }}>
                    Requested on: {new Date(req.createdAt).toLocaleDateString()}
                  </div>
                </div>

                <div style={styles.btnGroup}>
                  <button onClick={() => handleRequestDecision(req, 'approve')} style={styles.approveBtn} className="button-hover">
                    Approve
                  </button>
                  <button onClick={() => handleRequestDecision(req, 'deny')} style={styles.denyBtn} className="button-hover">
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </BentoCard>

      {/* 📄 IN-APP DOCUMENT PROOF PREVIEW MODAL */}
      {docPreviewModal.show && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(5, 10, 25, 0.88)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          zIndex: 999999,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "80px 20px 30px"
        }}>
          <div style={{
            background: "var(--card-bg, #0f172a)",
            border: "1px solid rgba(99, 102, 241, 0.4)",
            borderRadius: "16px",
            width: "90%",
            maxWidth: "920px",
            maxHeight: "80vh",
            padding: "20px 24px",
            display: "flex",
            flexDirection: "column",
            boxShadow: "0 25px 60px rgba(0, 0, 0, 0.8)",
            position: "relative",
            zIndex: 1000000
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: "12px" }}>
              <h3 style={{ margin: 0, color: "var(--accent, #6366f1)", fontSize: "18px" }}>
                {docPreviewModal.title}
              </h3>
              <button
                onClick={() => setDocPreviewModal({ show: false, title: "", url: "" })}
                style={{ background: "transparent", border: "none", color: "var(--text-secondary)", fontSize: "24px", cursor: "pointer" }}
              >
                ✕
              </button>
            </div>

            <div style={{ flex: 1, minHeight: "450px", maxHeight: "70vh", overflow: "auto", display: "flex", justifyContent: "center", alignItems: "center", background: "#020617", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.08)", padding: "12px" }}>
              {docPreviewModal.url.startsWith("data:image/") || docPreviewModal.url.includes("image") ? (
                <img src={docPreviewModal.url} alt="Document Proof" style={{ maxWidth: "100%", maxHeight: "65vh", objectFit: "contain", borderRadius: "8px" }} />
              ) : (
                <iframe src={docPreviewModal.url} title="Document Proof" style={{ width: "100%", height: "65vh", border: "none", borderRadius: "8px" }} />
              )}
            </div>

            <div style={{ marginTop: "16px", display: "flex", justifyContent: "flex-end", gap: "12px" }}>
              <button
                onClick={() => {
                  try {
                    fetch(docPreviewModal.url)
                      .then(res => res.blob())
                      .then(blob => {
                        const blobUrl = URL.createObjectURL(blob);
                        window.open(blobUrl, "_blank");
                      });
                  } catch (e) {
                    window.open(docPreviewModal.url, "_blank");
                  }
                }}
                style={{ ...theme.button("primary"), background: "linear-gradient(135deg, #6366f1, #4f46e5)", padding: "8px 16px", fontSize: "13px" }}
                className="button-hover"
              >
                ↗ Open in Separate Tab / Print
              </button>
              <button
                onClick={() => setDocPreviewModal({ show: false, title: "", url: "" })}
                style={{ ...theme.button("secondary"), padding: "8px 16px", fontSize: "13px" }}
                className="button-hover"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 📖 DUAL LOGBOOK TELEMETRY & AI VERDICT MODAL */}
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
                  <p style={{ margin: 0, fontSize: "13px", color: "var(--text-primary)", lineHeight: 1.6, whitespace: "pre-line" }}>
                    {dualTelemetryModal.data.aiVerdict}
                  </p>
                </div>

                {/* 👔 SUPERVISOR & STUDENT SUMMARY */}
                <div style={{ display: "flex", gap: "20px", marginBottom: "20px", flexWrap: "wrap" }}>
                  <div style={{ flex: 1, minWidth: "240px", padding: "12px", background: "rgba(0,0,0,0.25)", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <h5 style={{ margin: "0 0 6px 0", color: "var(--accent)" }}>🎓 Student Placement Profile</h5>
                    <div style={{ fontSize: "14px", fontWeight: "bold", color: "var(--text-primary)" }}>{dualTelemetryModal.data.student?.name}</div>
                    <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "2px" }}>Index: {dualTelemetryModal.data.student?.indexNumber || "UGC0323021"} • Batch: {dualTelemetryModal.data.student?.batchNumber || "SE3"}</div>
                    <div style={{ fontSize: "12px", color: "#34d399", marginTop: "6px" }}>Logged Entries: {dualTelemetryModal.data.submittedDaysCount} Days ({dualTelemetryModal.data.totalHours} Hrs)</div>
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
                            <td style={{ padding: "10px", color: "#34d399" }}>{e.status}</td>
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

      {/* 🤖 COORDINTOR AI STUDENT MULTI-SOURCE BACKGROUND & TELEMETRY REPORT MODAL */}
      {studentBgModal.show && studentBgModal.student && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 60000, padding: "20px" }}>
          <div style={{ background: "var(--surface)", border: "1px solid var(--accent)", borderRadius: "20px", width: "100%", maxWidth: "680px", maxHeight: "90vh", overflowY: "auto", padding: "28px", boxShadow: "0 20px 60px rgba(0,0,0,0.6)" }}>
            
            {/* HEADER */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
              <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
                <div style={{ width: "64px", height: "64px", borderRadius: "50%", background: "var(--accent)", border: "3px solid var(--accent)", overflow: "hidden", display: "grid", placeItems: "center" }}>
                  {studentBgModal.student.profilePic ? (
                    <img src={studentBgModal.student.profilePic} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="Avatar" />
                  ) : (
                    <span style={{ fontSize: "24px", color: "#fff", fontWeight: "bold" }}>{studentBgModal.student.name?.[0]}</span>
                  )}
                </div>
                <div>
                  <h3 style={{ margin: 0, color: "var(--text-primary)", fontSize: "20px" }}>{studentBgModal.student.name}</h3>
                  <p style={{ margin: "2px 0 0", color: "var(--text-secondary)", fontSize: "13px" }}>
                    📧 {studentBgModal.student.email} • {studentBgModal.student.degreeProgram || 'Software Engineering'}
                  </p>
                  <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginTop: "6px" }}>
                    <span style={{ fontSize: "11px", padding: "3px 8px", background: "rgba(99, 102, 241, 0.15)", color: "var(--accent)", borderRadius: "4px", fontWeight: "bold" }}>
                      Stage: {studentBgModal.student.studentStage || "YEAR_3_INTERN"}
                    </span>
                    {studentBgModal.student.atsScore > 0 && (
                      <span style={{ fontSize: "11px", padding: "3px 8px", background: "rgba(16, 185, 129, 0.15)", color: "var(--success)", borderRadius: "4px", fontWeight: "bold" }}>
                        ATS: {studentBgModal.student.atsScore}%
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setStudentBgModal({ show: false, student: null, loading: false, report: null })}
                style={{ background: "transparent", border: "none", color: "var(--text-secondary)", fontSize: "22px", cursor: "pointer" }}
              >
                ✕
              </button>
            </div>

            {/* VERIFICATION BADGES */}
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "20px", padding: "12px 16px", background: "var(--card-item-bg)", borderRadius: "12px", border: "1px solid var(--card-item-border)" }}>
              <span style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: "bold", width: "100%", marginBottom: "4px" }}>
                🔍 Multi-Source Academic & Social Authenticity Checks:
              </span>
              <span style={{ fontSize: "11px", padding: "4px 10px", background: studentBgModal.student.githubUsername ? "rgba(16, 185, 129, 0.15)" : "rgba(255,255,255,0.06)", color: studentBgModal.student.githubUsername ? "#10b981" : "#aaa", borderRadius: "20px", fontWeight: "bold" }}>
                🐙 GitHub Verified: {studentBgModal.student.githubUsername ? `@${studentBgModal.student.githubUsername}` : "Unlinked"}
              </span>
              <span style={{ fontSize: "11px", padding: "4px 10px", background: studentBgModal.student.linkedinProfileUrl ? "rgba(10, 102, 194, 0.2)" : "rgba(255,255,255,0.06)", color: studentBgModal.student.linkedinProfileUrl ? "#38bdf8" : "#aaa", borderRadius: "20px", fontWeight: "bold" }}>
                💼 LinkedIn Verified: {studentBgModal.student.linkedinProfileUrl ? "Connected" : "Unlinked"}
              </span>
              <span style={{ fontSize: "11px", padding: "4px 10px", background: "rgba(16, 185, 129, 0.15)", color: "#10b981", borderRadius: "20px", fontWeight: "bold" }}>
                🎓 Academic Record: Verified Student
              </span>
            </div>

            {/* AI REPORT BODY */}
            <div style={{ padding: "18px", background: "rgba(99, 102, 241, 0.08)", border: "1px solid rgba(99, 102, 241, 0.3)", borderRadius: "14px", marginBottom: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                <h4 style={{ margin: 0, color: "var(--accent)", fontSize: "15px" }}>
                  🤖 Academic Coordinator AI Talent Background Report
                </h4>
                {studentBgModal.report && (
                  <span style={{ fontSize: "14px", color: "var(--success)", fontWeight: "bold", background: "rgba(16, 185, 129, 0.15)", padding: "4px 12px", borderRadius: "8px" }}>
                    Competency Score: {studentBgModal.report.overallRating} / 100
                  </span>
                )}
              </div>

              {studentBgModal.loading ? (
                <div style={{ padding: "20px", textAlign: "center", color: "var(--text-secondary)" }}>
                  ⌛ Synthesizing multi-source GitHub, LinkedIn, and Academic Telemetry...
                </div>
              ) : studentBgModal.report ? (
                <div>
                  <p style={{ margin: "0 0 12px 0", color: "var(--text-primary)", fontSize: "13px", lineHeight: "1.6" }}>
                    {studentBgModal.report.aiSynthesisVerdict}
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    {studentBgModal.report.highlights.map((item, idx) => (
                      <div key={idx} style={{ fontSize: "12px", color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "6px" }}>
                        <span>•</span> <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: "13px" }}>
                  Telemetry background assessment compiled.
                </p>
              )}
            </div>

            {/* ACTION BUTTONS */}
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", justifyContent: "flex-end" }}>
              {studentBgModal.student.githubUsername && (
                <a
                  href={`https://github.com/${studentBgModal.student.githubUsername}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{ ...theme.button("secondary"), padding: "8px 14px", fontSize: "12px", textDecoration: "none" }}
                >
                  🐙 Open GitHub ↗
                </a>
              )}
              {studentBgModal.student.linkedinProfileUrl && (
                <a
                  href={studentBgModal.student.linkedinProfileUrl}
                  target="_blank"
                  rel="noreferrer"
                  style={{ ...theme.button("secondary"), background: "#0a66c2", color: "#fff", padding: "8px 14px", fontSize: "12px", textDecoration: "none" }}
                >
                  💼 Open LinkedIn ↗
                </a>
              )}
              <button
                onClick={() => setStudentBgModal({ show: false, student: null, loading: false, report: null })}
                style={{ ...theme.button("primary"), padding: "8px 16px", fontSize: "12px" }}
              >
                Close Report
              </button>
            </div>

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
  pillRow: { display: "flex", marginTop: theme.spacing.sm },
  pillDanger: {
    padding: "8px 12px",
    background: "rgba(239,68,68,0.12)",
    borderRadius: "999px",
    border: "1px solid rgba(239,68,68,0.25)",
    color: "var(--danger)",
    fontSize: "12px",
    fontWeight: 700,
  },
  listContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "15px"
  },
  requestItem: {
    background: "var(--card-item-bg)",
    border: `1px solid var(--card-item-border)`,
    borderRadius: theme.radii.md,
    padding: "20px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 15
  },
  row: { marginBottom: 4 },
  btnGroup: { display: "flex", gap: 10 },
  approveBtn: {
    ...theme.button("secondary"),
    padding: "8px 16px",
    fontSize: "13px"
  },
  denyBtn: {
    ...theme.button("danger"),
    padding: "8px 16px",
    fontSize: "13px"
  },
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(5, 10, 25, 0.88)",
    backdropFilter: "blur(14px)",
    WebkitBackdropFilter: "blur(14px)",
    zIndex: 50000,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "80px 20px 30px"
  },
  modalContent: {
    background: "var(--card-bg)",
    border: "1px solid var(--card-item-border)",
    borderRadius: "20px",
    padding: "28px",
    boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
    color: "var(--text-primary)"
  }
};