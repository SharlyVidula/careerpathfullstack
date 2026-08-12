import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import apiClient from "../apiClient";
import theme from "../theme";
import CareerForm from "../CareerForm";
import ResumeEnhancer from "../components/ResumeEnhancer";
import { useToast } from "../components/ToastContext";
import BentoCard from "../components/BentoCard";
import InternProgramModal from "../components/InternProgramModal";
import InternEligibilityPortalModal from "../components/InternEligibilityPortalModal";
import StudentLeaderboard from "../components/StudentLeaderboard";


function UserDashboard() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [user, setUser] = useState(null);
  const [requests, setRequests] = useState([]);
  const [saved, setSaved] = useState([]);
  const [jobs, setJobs] = useState([]); // 🆕 State for Jobs
  const [appliedJobs, setAppliedJobs] = useState(() => JSON.parse(localStorage.getItem("appliedJobs") || "[]"));
  const [enlargedAvatar, setEnlargedAvatar] = useState(false);
  const [showInternModal, setShowInternModal] = useState(false);
  const [showEligibilityModal, setShowEligibilityModal] = useState(false);

  const [ghUsername, setGhUsername] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [linkedinData, setLinkedinData] = useState(null);
  const [linkedinInput, setLinkedinInput] = useState("");
  const [linkingLinkedin, setLinkingLinkedin] = useState(false);
  const [ghRepos, setGhRepos] = useState([]);
  const [ghEval, setGhEval] = useState(null);
  const [syncingGh, setSyncingGh] = useState(false);
  const [manualTodoChecked, setManualTodoChecked] = useState(false);

  const handleConnectLinkedin = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!linkedinInput) {
      addToast("Please enter a valid LinkedIn Profile URL", "warning");
      return;
    }
    setLinkingLinkedin(true);
    try {
      const res = await apiClient.post("/github/connect-linkedin", {
        userId: user.id || user._id,
        linkedinProfileUrl: linkedinInput
      });
      if (res.data?.ok) {
        addToast(res.data.message, "success");
        setLinkedinUrl(res.data.linkedinProfileUrl);
        setLinkedinData(res.data.linkedinData);
        setLinkedinInput("");
        fetchDashboardData(user.id || user._id);
      }
    } catch (err) {
      addToast(err.response?.data?.message || "Failed to connect LinkedIn", "error");
    } finally {
      setLinkingLinkedin(false);
    }
  };

  useEffect(() => {
    // 1. Check Login
    const data = localStorage.getItem("user");
    if (!data) {
      navigate("/login");
      return;
    }
    const parsedUser = JSON.parse(data);
    if (parsedUser.role === "employer" || parsedUser.role === "supervisor") {
      navigate("/employer-dashboard");
      return;
    }
    if (parsedUser.role === "admin" || parsedUser.role === "coordinator") {
      navigate("/admin");
      return;
    }
    setUser(parsedUser);

    // OAuth Callback Notifications
    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.get("status") === "github_connected") {
      addToast("🎉 Official GitHub account authenticated & connected successfully!", "success");
    } else if (searchParams.get("status") === "linkedin_connected") {
      addToast("🎉 Official LinkedIn account authenticated & connected successfully!", "success");
    }

    // 2. Fetch Data
    fetchDashboardData(parsedUser.id || parsedUser._id);
  }, [navigate]);

  const fetchDashboardData = async (userId) => {
    try {
      // Fetch Requests
      const reqRes = await apiClient.get(`/users/my-requests?userId=${userId}`);
      setRequests(reqRes.data.requests || []);

      // Fetch Saved Careers
      const savedRes = await apiClient.get(`/users/saved?userId=${userId}`);
      setSaved(savedRes.data.saved || []);

      // Fetch Approved Jobs
      const jobsRes = await apiClient.get("/users/jobs");
      setJobs(jobsRes.data.jobs || []);

      // 🎓 Fetch Internship Eligibility, Stage & Assigned Supervisor from Backend database
      try {
        const eligRes = await apiClient.get(`/intern/eligibility/${userId}`);
        if (eligRes.data?.ok) {
          const backendStatus = eligRes.data.eligibility?.eligibilityStatus || "NOT_SUBMITTED";
          const backendStage = eligRes.data.userStage || "YEAR_1_2";
          const backendSupervisor = eligRes.data.assignedSupervisor || null;

          setUser(prevUser => {
            if (!prevUser) return prevUser;
            const updatedUser = {
              ...prevUser,
              eligibilityStatus: backendStatus,
              studentStage: backendStage,
              assignedSupervisor: backendSupervisor
            };
            localStorage.setItem("user", JSON.stringify(updatedUser));
            return updatedUser;
          });
        }
      } catch (eligErr) {
        console.error("Error syncing eligibility status:", eligErr);
      }

      // 🐙 Fetch GitHub & LinkedIn Connected Account Portfolio Telemetry
      const ghRes = await apiClient.get(`/github/portfolio?userId=${userId}`);
      if (ghRes.data?.ok) {
        setGhUsername(ghRes.data.githubUsername || "");
        setLinkedinUrl(ghRes.data.linkedinProfileUrl || "");
        setLinkedinData(ghRes.data.linkedinData || null);
        setGhRepos(ghRes.data.githubRepos || []);
        setGhEval(ghRes.data.githubEvaluation || null);

        setUser(prevUser => {
          if (!prevUser) return prevUser;
          const updatedUser = {
            ...prevUser,
            githubUsername: ghRes.data.githubUsername || prevUser.githubUsername,
            linkedinProfileUrl: ghRes.data.linkedinProfileUrl || prevUser.linkedinProfileUrl,
            linkedinData: ghRes.data.linkedinData || prevUser.linkedinData,
            profilePic: ghRes.data.profilePic || prevUser.profilePic,
            linkedinLocked: !!(ghRes.data.linkedinProfileUrl || prevUser.linkedinProfileUrl)
          };
          localStorage.setItem("user", JSON.stringify(updatedUser));
          return updatedUser;
        });
      }

    } catch (e) {
      console.error("Error loading dashboard data:", e);
    }
  };

  const handleSyncGitHub = async () => {
    if (!ghUsername.trim()) {
      addToast("Please enter a GitHub username first.", "warning");
      return;
    }
    setSyncingGh(true);
    try {
      const res = await apiClient.post("/github/connect", {
        userId: user.id || user._id,
        githubUsername: ghUsername.trim(),
        linkedinProfileUrl: linkedinUrl.trim()
      });
      if (res.data?.ok) {
        setGhRepos(res.data.githubRepos || []);
        setGhEval(res.data.githubEvaluation || null);
        setUser({ ...user, githubLocked: true, linkedinLocked: true });
        addToast(res.data.message || "GitHub connected & public repos evaluated!", "success");
      }
    } catch (err) {
      addToast(err.response?.data?.message || "Failed to connect GitHub account.", "error");
    } finally {
      setSyncingGh(false);
    }
  };

  const handleRequestSocialReset = async () => {
    try {
      const res = await apiClient.post("/users/student/request-social-reset", {
        userId: user.id || user._id,
        reason: "Student requested GitHub/LinkedIn modification"
      });
      if (res.data?.ok) {
        setUser({ ...user, socialResetRequest: { status: "PENDING" } });
        addToast(res.data.message || "Modification request sent to Coordinator!", "success");
      }
    } catch (err) {
      addToast("Failed to submit modification request.", "error");
    }
  };

  const handleDecision = async (requestId, decision) => {
    try {
      const status = decision === 'accept' ? 'ACCEPTED' : 'DENIED';
      await apiClient.put(`/users/requests/${requestId}`, { status });
      fetchDashboardData(user.id);
      addToast(`Request ${decision}ed!`, "success");
    } catch (e) {
      addToast("Failed to update request.", "error");
    }
  };

  if (!user) return null;

  const stage = user?.studentStage || "YEAR_1_2";
  const stageLabels = {
    YEAR_1_2: "📘 1st & 2nd Year Skill Building Stage",
    YEAR_3_INTERN: "⚡ 3rd Year 2nd Sem Intern-Ready Stage",
    FINAL_YEAR_JOB: "🎓 Final Year Graduate Job-Expecting Stage"
  };

  // 📈 PROGRESS BAR & TO-DO CHECKLIST COMPUTATION
  const isGhConnected = Boolean(user.githubLocked || (ghUsername && ghRepos.length > 0));
  const isGhReposGoal = ghRepos.length >= 3;
  const isAtsGoal = (user.atsScore || 0) >= 75;
  const isGhScoreGoal = (ghEval?.score || 0) >= 70;

  const todoItems = [
    { id: "gh_conn", text: "🐙 Connect official GitHub account via OAuth", points: 20, done: isGhConnected },
    { id: "gh_repos", text: "📦 Publish at least 3 public repositories on GitHub", points: 20, done: isGhReposGoal },
    { id: "resume_ats", text: "📄 Upload resume & achieve ATS score > 75%", points: 20, done: isAtsGoal },
    { id: "gh_score", text: "🤖 Achieve AI GitHub Code Quality Score > 70/100", points: 20, done: isGhScoreGoal },
    { id: "growth_log", text: "🚀 Log daily learning activities in Growth Tracker", points: 20, done: manualTodoChecked }
  ];

  const totalProgress = todoItems.reduce((acc, item) => acc + (item.done ? item.points : 0), 0);

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
              <p style={styles.subText}>
                📧 {user.email} {user.indexNumber && `• 🪪 ${user.indexNumber}`} {user.batchNumber && `• 🎓 ${user.batchNumber}`}
              </p>
            </div>
          </div>

          <div style={styles.actionRow}>
            {stage === "YEAR_3_INTERN" && user?.eligibilityStatus === "APPROVED" && (
              <button
                onClick={() => setShowInternModal(true)}
                style={{
                  ...styles.growthBtn,
                  background: "linear-gradient(135deg, #22c55e, #16a34a)",
                  border: "1px solid rgba(34, 197, 94, 0.5)",
                  boxShadow: "0 4px 14px rgba(34, 197, 94, 0.3)"
                }}
                className="button-hover"
              >
                🎓 Intern Program
              </button>
            )}
            {stage === "YEAR_3_INTERN" && user?.eligibilityStatus !== "APPROVED" && (
              <button
                onClick={() => setShowEligibilityModal(true)}
                style={{
                  ...styles.growthBtn,
                  background: "linear-gradient(135deg, #4f46e5, #6366f1)"
                }}
                className="button-hover"
              >
                📋 Internship Eligibility & Proof Upload
              </button>
            )}

            <button onClick={() => navigate("/growth")} style={styles.growthBtn} className="button-hover">
              🚀 Growth Tracker
            </button>
            <button
              onClick={() => {
                if (stage === "YEAR_1_2") {
                  addToast("🔒 Job Role Match is locked for 1st & 2nd Year students. It unlocks in Stage 2 (3rd Year Intern Ready).", "warning");
                } else {
                  navigate("/jd-match");
                }
              }}
              style={{
                ...styles.growthBtn,
                opacity: stage === "YEAR_1_2" ? 0.6 : 1,
                cursor: stage === "YEAR_1_2" ? "not-allowed" : "pointer"
              }}
              className="button-hover"
            >
              {stage === "YEAR_1_2" ? "🔒 Job Match (Locked)" : "📑 Job Match"}
            </button>
          </div>
        </div>

        <div style={styles.pillRow}>
          <span style={styles.pill}>{stageLabels[stage] || stage}</span>
          <span style={styles.pillSecondary}>LNBTI Verified Student</span>
          <span style={styles.pillSuccess}>Stage Controlled by Coordinator</span>
        </div>
      </BentoCard>

      {/* STAGE 1 GUIDANCE BANNER */}
      {stage === "YEAR_1_2" && (
        <BentoCard colSpan={4} padding="20px">
          <div style={{ background: "rgba(99, 102, 241, 0.08)", border: "1px solid rgba(99, 102, 241, 0.25)", padding: "16px", borderRadius: "12px" }}>
            <h4 style={{ color: "var(--accent)", margin: "0 0 6px 0" }}>📘 Stage 1 Guidance: Foundation & Skills</h4>
            <p style={{ color: "var(--text-secondary)", fontSize: "14px", margin: 0, lineHeight: 1.5 }}>
              Welcome! As a 1st/2nd year student, focus on building foundational technical skills, creating your initial resume draft, and logging daily learning progress in the Growth Tracker.
              Your Academic Coordinator (Senior Lecturer) will promote your account to <strong>Stage 2 (3rd Year Intern Ready)</strong> when you reach internship eligibility.
            </p>
          </div>
        </BentoCard>
      )}

      {/* STAGE 3 GUIDANCE BANNER (FINAL YEAR JOB) */}
      {stage === "FINAL_YEAR_JOB" && (
        <BentoCard colSpan={4} padding="20px">
          <div style={{ background: "rgba(16, 185, 129, 0.08)", border: "1px solid rgba(16, 185, 129, 0.25)", padding: "16px", borderRadius: "12px" }}>
            <h4 style={{ color: "var(--success)", margin: "0 0 6px 0" }}>🔥 Final Year Graduate Placement & Corporate Job Hub</h4>
            <p style={{ color: "var(--text-secondary)", fontSize: "14px", margin: 0, lineHeight: 1.5 }}>
              Welcome to your final year! Apply directly to corporate HR job openings below, respond to recruiter inquiries, and optimize your ATS resume & Job Match profile for direct full-time employment.
            </p>
          </div>
        </BentoCard>
      )}

      {/* INTERNSHIP ELIGIBILITY & INTERN PROGRAM BANNER - 3RD YEAR ONLY */}
      {stage === "YEAR_3_INTERN" && (
        <BentoCard colSpan={4} padding="20px">
          <div style={{ background: user?.eligibilityStatus === "APPROVED" ? "linear-gradient(135deg, rgba(34, 197, 94, 0.12), rgba(16, 185, 129, 0.12))" : "linear-gradient(135deg, rgba(99, 102, 241, 0.12), rgba(234, 179, 8, 0.12))", border: `1px solid ${user?.eligibilityStatus === "APPROVED" ? "rgba(34, 197, 94, 0.4)" : "rgba(99, 102, 241, 0.4)"}`, padding: "18px", borderRadius: "12px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
            <div>
              <h4 style={{ color: user?.eligibilityStatus === "APPROVED" ? "#22c55e" : "#818cf8", margin: "0 0 6px 0", fontSize: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
                {user?.eligibilityStatus === "APPROVED" ? "🎓 Internship Program Active & Unlocked" : "📋 Internship Eligibility Verification Portal"}
              </h4>
              <p style={{ color: "var(--text-secondary)", fontSize: "13px", margin: 0, lineHeight: 1.5 }}>
                {user?.eligibilityStatus === "APPROVED"
                  ? "Your academic credentials & proof documents have been verified by Academic Coordinators! Access supervisor contact details and maintain your 6-month daily internship diary."
                  : user?.eligibilityStatus === "PENDING_APPROVAL"
                  ? "⏳ Your Internship Eligibility Application (JLPT Certificate & 1st-3rd Yr Result Sheet) is under review by LNBTI Academic Coordinators."
                  : "Complete your subject GPA calculation (1st Yr - 3rd Yr 2nd Sem $\\ge$ 2.0 GPA), select your Japanese level ($\\ge$ N4), and upload official proof documents for Coordinator approval."
                }
              </p>
            </div>
            {user?.eligibilityStatus === "APPROVED" ? (
              <button
                onClick={() => setShowInternModal(true)}
                style={{
                  ...styles.growthBtn,
                  background: "linear-gradient(135deg, #22c55e, #16a34a)",
                  padding: "10px 20px"
                }}
                className="button-hover"
              >
                🎓 Open Intern Program Portal
              </button>
            ) : (
              <button
                onClick={() => setShowEligibilityModal(true)}
                style={{
                  ...styles.growthBtn,
                  background: "linear-gradient(135deg, #4f46e5, #6366f1)",
                  padding: "10px 20px"
                }}
                className="button-hover"
              >
                📋 Open Eligibility Portal
              </button>
            )}
          </div>
        </BentoCard>
      )}

      {/* 📈 GITHUB TELEMETRY PROGRESS BAR & ACTIONABLE TO-DO CHECKLIST - SPANS 4 COLUMNS */}
      <BentoCard colSpan={4} disableTilt={true}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px", flexWrap: "wrap", gap: "10px" }}>
          <div>
            <h3 style={{ ...styles.title, color: "var(--accent)" }}>
              📊 Student Performance & Portfolio Progress ({totalProgress}%)
            </h3>
            <p style={{ color: theme.colors.textSecondary, fontSize: "14px", margin: "4px 0 0" }}>
              Complete the actionable checklist items below to boost your progress status bar and prepare for coordinator promotion.
            </p>
          </div>
          <span style={{ fontSize: "14px", fontWeight: "bold", padding: "6px 14px", borderRadius: "8px", background: totalProgress >= 75 ? "rgba(16,185,129,0.15)" : totalProgress >= 40 ? "rgba(99,102,241,0.15)" : "rgba(245,158,11,0.15)", color: totalProgress >= 75 ? "var(--success)" : totalProgress >= 40 ? "var(--accent)" : "#f59e0b" }}>
            {totalProgress >= 75 ? "🎓 Graduate / Placement Ready" : totalProgress >= 40 ? "⚡ Internship Eligible" : "📘 Skill Building Stage"}
          </span>
        </div>

        {/* DAILY AI QUIZ & IQ CHALLENGE PROMPT BANNER */}
        <div style={{
          padding: "16px 20px",
          background: "linear-gradient(135deg, rgba(99, 102, 241, 0.12), rgba(16, 185, 129, 0.12))",
          border: "1px solid rgba(99, 102, 241, 0.3)",
          borderRadius: "12px",
          marginBottom: "20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "12px"
        }}>
          <div>
            <span style={{ fontSize: "14px", fontWeight: "bold", color: "var(--accent)", display: "flex", alignItems: "center", gap: "8px" }}>
              🎮 Daily Growth Assessment Challenge Ready!
            </span>
            <p style={{ margin: "4px 0 0 0", color: "var(--text-secondary)", fontSize: "13px" }}>
              Sharpen your skills with AI-generated <strong>Logic IQ Tests</strong>, <strong>Software Engineering Quizzes</strong>, and <strong>Japanese Language Practice</strong> to boost your Performance Index!
            </p>
          </div>
          <button
            onClick={() => navigate("/growth")}
            style={{
              ...styles.growthBtn,
              background: "linear-gradient(135deg, #6366f1, #10b981)",
              padding: "10px 18px"
            }}
            className="button-hover"
          >
            ▶ Take Today's Quiz ➔
          </button>
        </div>

        {/* DYNAMIC PROGRESS BAR */}
        <div style={{ width: "100%", height: "16px", background: "rgba(255,255,255,0.08)", borderRadius: "10px", overflow: "hidden", marginBottom: "20px", border: "1px solid rgba(255,255,255,0.1)" }}>
          <div
            style={{
              width: `${totalProgress}%`,
              height: "100%",
              background: totalProgress >= 75 ? "linear-gradient(90deg, #10b981, #34d399)" : totalProgress >= 40 ? "linear-gradient(90deg, #6366f1, #818cf8)" : "linear-gradient(90deg, #f59e0b, #fbbf24)",
              borderRadius: "10px",
              transition: "width 0.6s ease-in-out"
            }}
          />
        </div>

        {/* ACTIONABLE TO-DO CHECKLIST */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "12px" }}>
          {todoItems.map((item) => (
            <div
              key={item.id}
              onClick={() => {
                if (item.id === "growth_log") setManualTodoChecked(!manualTodoChecked);
              }}
              style={{
                padding: "12px 16px",
                background: item.done ? "rgba(16,185,129,0.08)" : "var(--card-item-bg)",
                border: item.done ? "1px solid rgba(16,185,129,0.3)" : "1px solid var(--card-item-border)",
                borderRadius: "10px",
                display: "flex",
                alignItems: "center",
                gap: "12px",
                cursor: item.id === "growth_log" ? "pointer" : "default"
              }}
            >
              <input
                type="checkbox"
                checked={item.done}
                readOnly={item.id !== "growth_log"}
                onChange={(e) => {
                  if (item.id === "growth_log") setManualTodoChecked(e.target.checked);
                }}
                style={{ width: "18px", height: "18px", accentColor: "var(--success)", cursor: "pointer" }}
              />
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: "13px", color: item.done ? "var(--text-primary)" : "var(--text-secondary)", textDecoration: item.done ? "line-through" : "none" }}>
                  {item.text}
                </span>
              </div>
              <span style={{ fontSize: "11px", fontWeight: "bold", color: item.done ? "var(--success)" : "var(--text-secondary)" }}>
                +{item.points}%
              </span>
            </div>
          ))}
        </div>
      </BentoCard>

      {/* 🏆 STUDENT PERFORMANCE LEADERBOARD - SPANS 4 COLUMNS */}
      <BentoCard colSpan={4} disableTilt={true}>
        <StudentLeaderboard user={user} />
      </BentoCard>

      {/* 2. AI RESUME PARSER - SPANS 2 COLUMNS */}
      <BentoCard colSpan={2} disableTilt={true}>
        <ResumeEnhancer />
      </BentoCard>

      {/* 🐙 GITHUB & LINKEDIN PORTFOLIO INTEGRATION - SPANS 4 COLUMNS */}
      <BentoCard colSpan={4} disableTilt={true}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px", flexWrap: "wrap", gap: "10px" }}>
          <div>
            <h3 style={{ ...styles.title, color: "var(--accent)" }}>
              🐙 Connected Accounts & GitHub Portfolio Telemetry
            </h3>
            <p style={{ color: theme.colors.textSecondary, fontSize: "14px", margin: "4px 0 0" }}>
              Connect your public GitHub username to import repositories, run AI portfolio evaluation, and feed code telemetry into your Growth Radar.
            </p>
          </div>
          {ghEval && ghEval.score > 0 && (
            <div style={{ padding: "8px 16px", background: "rgba(99, 102, 241, 0.12)", border: "1px solid rgba(99, 102, 241, 0.3)", borderRadius: "10px", textAlign: "right" }}>
              <span style={{ fontSize: "11px", color: "var(--text-secondary)", display: "block" }}>AI GitHub Index</span>
              <strong style={{ fontSize: "20px", color: "var(--accent)" }}>{ghEval.score} / 100</strong>
            </div>
          )}
        </div>

        {/* SETUP WALKTHROUGH & DUAL AUTHENTICATED CONNECTIONS */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "16px", marginBottom: "20px" }}>
          
          {/* 🐙 GITHUB ACCOUNT SLOT */}
          <div style={{ padding: "18px", background: "var(--card-item-bg)", borderRadius: "14px", border: "1px solid var(--card-item-border)", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                <h4 style={{ margin: 0, color: "var(--text-primary)", fontSize: "15px", display: "flex", alignItems: "center", gap: "8px" }}>
                  🐙 GitHub Code Telemetry
                </h4>
                <span style={{ fontSize: "11px", padding: "3px 8px", background: ghUsername ? "rgba(16, 185, 129, 0.15)" : "rgba(255,255,255,0.08)", color: ghUsername ? "#10b981" : "#aaa", borderRadius: "20px", fontWeight: "bold" }}>
                  {ghUsername ? "CONNECTED" : "NOT CONNECTED"}
                </span>
              </div>

              {ghUsername ? (
                <div>
                  <p style={{ margin: "4px 0 10px 0", color: "var(--text-secondary)", fontSize: "13px" }}>
                    Verified Account: <strong style={{ color: "var(--accent)" }}>@{ghUsername}</strong> ({ghRepos.length} Repos imported)
                  </p>
                  {ghEval && (
                    <div style={{ fontSize: "12px", color: "var(--text-primary)", background: "rgba(0,0,0,0.2)", padding: "8px 12px", borderRadius: "8px" }}>
                      AI Score: <strong>{ghEval.score}/100</strong> • Skills: {ghEval.detectedSkills?.slice(0, 3).join(", ") || "Engineering"}
                    </div>
                  )}
                </div>
              ) : (
                <p style={{ margin: "4px 0 14px 0", color: "var(--text-secondary)", fontSize: "13px" }}>
                  Authenticate your GitHub account to enable automated project repository imports and AI code evaluation.
                </p>
              )}
            </div>

            <div style={{ marginTop: "14px" }}>
              {!ghUsername && (
                <button
                  onClick={() => {
                    window.location.href = `http://localhost:5000/api/auth/github/connect?studentId=${user.id || user._id}`;
                  }}
                  style={{ width: "100%", padding: "10px", background: "#24292e", color: "#fff", border: "none", borderRadius: "8px", fontWeight: "bold", fontSize: "13px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
                  className="button-hover"
                >
                  🐙 Authenticate with GitHub OAuth
                </button>
              )}
            </div>
          </div>

          {/* 💼 LINKEDIN PROFESSIONAL TELEMETRY SLOT */}
          <div style={{ padding: "18px", background: "var(--card-item-bg)", borderRadius: "14px", border: "1px solid var(--card-item-border)", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                <h4 style={{ margin: 0, color: "var(--text-primary)", fontSize: "15px", display: "flex", alignItems: "center", gap: "8px" }}>
                  💼 LinkedIn Professional Telemetry
                </h4>
                <span style={{ fontSize: "11px", padding: "3px 8px", background: linkedinUrl ? "rgba(10, 102, 194, 0.2)" : "rgba(255,255,255,0.08)", color: linkedinUrl ? "#38bdf8" : "#aaa", borderRadius: "20px", fontWeight: "bold" }}>
                  {linkedinUrl ? "CONNECTED & VERIFIED" : "NOT CONNECTED"}
                </span>
              </div>

              {linkedinUrl ? (
                <div>
                  <p style={{ margin: "4px 0 6px 0", color: "var(--text-primary)", fontSize: "13px", fontWeight: "bold" }}>
                    {linkedinData?.headline || `${user.degreeProgram || 'Software Engineering'} Student @ LNBTI`}
                  </p>
                  <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: "8px" }}>
                    🌐 Network: <strong style={{ color: "#38bdf8" }}>{linkedinData?.connections || "500+ Connections"}</strong> • Industry: {linkedinData?.industry || "IT Services"}
                  </div>
                  {linkedinData?.endorsedSkills && (
                    <div style={{ display: "flex", gap: "4px", flexWrap: "wrap", marginBottom: "10px" }}>
                      {linkedinData.endorsedSkills.map((sk, i) => (
                        <span key={i} style={{ fontSize: "10px", padding: "2px 6px", background: "rgba(10, 102, 194, 0.15)", color: "#38bdf8", borderRadius: "4px" }}>
                          ✓ {sk}
                        </span>
                      ))}
                    </div>
                  )}
                  <a
                    href={linkedinUrl}
                    target="_blank"
                    rel="noreferrer"
                    style={{ fontSize: "12px", color: "var(--accent)", textDecoration: "underline", fontWeight: "bold" }}
                  >
                    🔗 View Public LinkedIn Profile ↗
                  </a>
                </div>
              ) : (
                <div>
                  <p style={{ margin: "4px 0 10px 0", color: "var(--text-secondary)", fontSize: "13px" }}>
                    Link your official LinkedIn profile to boost your Recruiter Visibility Index and showcase endorsed skills to employers.
                  </p>
                  <form onSubmit={handleConnectLinkedin} style={{ display: "flex", gap: "8px", marginTop: "10px" }}>
                    <input
                      type="url"
                      placeholder="https://linkedin.com/in/your-profile"
                      value={linkedinInput}
                      onChange={(e) => setLinkedinInput(e.target.value)}
                      style={{ ...theme.input(), flex: 1, padding: "6px 10px", fontSize: "12px" }}
                    />
                    <button
                      type="submit"
                      disabled={linkingLinkedin}
                      style={{ ...theme.button("primary"), background: "#0a66c2", padding: "6px 12px", fontSize: "12px", whiteSpace: "nowrap" }}
                      className="button-hover"
                    >
                      {linkingLinkedin ? "Linking..." : "Link Profile"}
                    </button>
                  </form>
                </div>
              )}
            </div>

            <div style={{ marginTop: "14px" }}>
              {!linkedinUrl && (
                <button
                  onClick={() => {
                    window.location.href = `http://localhost:5000/api/auth/linkedin/connect?studentId=${user.id || user._id}`;
                  }}
                  style={{ width: "100%", padding: "10px", background: "#0a66c2", color: "#fff", border: "none", borderRadius: "8px", fontWeight: "bold", fontSize: "13px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
                  className="button-hover"
                >
                  💼 Authenticate with LinkedIn OAuth
                </button>
              )}
            </div>
          </div>
        </div>

        {/* SOCIAL RESET REQUEST BANNER */}
        {(user.githubLocked || user.linkedinLocked) && (
          <div style={{ padding: "12px 16px", background: "rgba(0,0,0,0.2)", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.06)", marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
            <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
              🔒 Connected social profiles are locked for university authenticity.
            </span>
            <button
              onClick={handleRequestSocialReset}
              disabled={user.socialResetRequest?.status === "PENDING"}
              style={{ ...theme.button("secondary"), fontSize: "11px", padding: "4px 10px" }}
              className="button-hover"
            >
              {user.socialResetRequest?.status === "PENDING"
                ? "⌛ Link Swap Requested (Pending Coordinator Approval)"
                : "Request Coordinator to Swap Links"}
            </button>
          </div>
        )}

        {/* AI EVALUATION SUMMARY & DETECTED SKILLS */}
        {ghEval && (
          <div style={{ padding: "16px", background: "var(--card-item-bg)", borderRadius: "12px", border: "1px solid var(--card-item-border)", marginBottom: "20px" }}>
            <h4 style={{ margin: "0 0 8px 0", color: "var(--text-primary)", fontSize: "15px" }}>🤖 AI GitHub Portfolio Feedback</h4>
            <p style={{ color: "var(--text-secondary)", fontSize: "14px", margin: "0 0 12px 0", lineHeight: "1.5" }}>
              {ghEval.summary}
            </p>
            {ghEval.detectedSkills && ghEval.detectedSkills.length > 0 && (
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", alignItems: "center" }}>
                <span style={{ fontSize: "12px", color: "var(--text-primary)", fontWeight: "bold" }}>Detected Stack:</span>
                {ghEval.detectedSkills.map((sk, idx) => (
                  <span key={idx} style={{ fontSize: "11px", padding: "3px 8px", background: "rgba(16, 185, 129, 0.12)", color: "var(--success)", border: "1px solid rgba(16, 185, 129, 0.25)", borderRadius: "4px" }}>
                    {sk}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* IMPORTED PUBLIC REPOSITORIES GRID */}
        {ghRepos.length > 0 && (
          <div>
            <h4 style={{ margin: "0 0 12px 0", color: "var(--text-primary)", fontSize: "16px" }}>
              📦 Public Repositories ({ghRepos.length})
            </h4>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "14px", maxHeight: "360px", overflowY: "auto" }}>
              {ghRepos.map((repo, i) => (
                <div key={i} style={{ padding: "14px", background: "var(--card-item-bg)", border: "1px solid var(--card-item-border)", borderRadius: "10px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "6px" }}>
                      <a href={repo.htmlUrl} target="_blank" rel="noreferrer" style={{ color: "var(--accent)", fontWeight: "700", fontSize: "14px", textDecoration: "underline" }}>
                        {repo.name} ↗
                      </a>
                      <span style={{ fontSize: "11px", padding: "2px 6px", background: "rgba(99,102,241,0.12)", color: "var(--accent)", borderRadius: "4px" }}>
                        {repo.language || "Code"}
                      </span>
                    </div>
                    <p style={{ color: "var(--text-secondary)", fontSize: "12px", margin: "4px 0 10px 0", lineHeight: "1.4" }}>
                      {repo.description}
                    </p>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "var(--text-secondary)", paddingTop: "8px", borderTop: "1px solid var(--border)" }}>
                    <span>⭐ {repo.stars} stars • 🍴 {repo.forks} forks</span>
                    <span>Pushed: {new Date(repo.pushedAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </BentoCard>

      {/* 3. VACANCIES & OPPORTUNITIES BOARD - ADAPTIVE PER STAGE */}
      <BentoCard colSpan={2}>
        <h3 style={{ ...styles.title, color: "#34d399", marginBottom: 20 }}>
          {stage === "YEAR_1_2" ? "🔒 Internship Vacancies" : stage === "YEAR_3_INTERN" ? "🎓 LNBTI Official Internship Placement Status" : "🔥 Direct Full-Time Corporate Vacancies"}
        </h3>

        {stage === "YEAR_1_2" ? (
          <div style={{ padding: "20px", background: "var(--card-item-bg)", borderRadius: "12px", border: "1px solid var(--card-item-border)", textAlign: "center" }}>
            <p style={{ color: "var(--text-secondary)", fontSize: "14px", margin: 0 }}>
              Internship applications open in <strong>3rd Year 2nd Semester</strong>. Focus on logging daily learning activities in your Growth Tracker to raise your ATS score.
            </p>
          </div>
        ) : stage === "YEAR_3_INTERN" ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ padding: "16px", background: "rgba(99, 102, 241, 0.1)", border: "1px solid rgba(99, 102, 241, 0.25)", borderRadius: "12px" }}>
              <span style={{ fontSize: "12px", color: "var(--accent)", fontWeight: "bold", display: "block", marginBottom: "4px" }}>
                ℹ️ ACADEMIC COORDINATOR MATCHING POLICY
              </span>
              <p style={{ color: "var(--text-secondary)", fontSize: "13px", margin: 0, lineHeight: "1.5" }}>
                Internship vacancies posted by industry partners are routed exclusively to the <strong>LNBTI Academic Coordinator Hub</strong>. Your Senior Lecturer will match and assign your internship supervisor.
              </p>
            </div>

            {user?.assignedSupervisor ? (
              <div style={{ padding: "20px", background: "rgba(16, 185, 129, 0.08)", border: "1px solid rgba(16, 185, 129, 0.3)", borderRadius: "14px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px", flexWrap: "wrap", gap: "10px" }}>
                  <div>
                    <span style={{ fontSize: "11px", color: "var(--success)", fontWeight: "bold", textTransform: "uppercase" }}>
                      ✅ OFFICIAL INTERNSHIP CONNECTED & ACTIVE
                    </span>
                    <h4 style={{ margin: "4px 0 0", color: "var(--text-primary)", fontSize: "18px" }}>
                      {typeof user.assignedSupervisor === 'object' ? user.assignedSupervisor.name : "Assigned Supervisor"}
                    </h4>
                    <p style={{ margin: "2px 0 0", color: "var(--text-secondary)", fontSize: "13px" }}>
                      {typeof user.assignedSupervisor === 'object' ? `${user.assignedSupervisor.designation || 'Supervisor'} • ${user.assignedSupervisor.companyName || 'Partner Company'}` : "LNBTI Industry Partner"}
                    </p>
                  </div>
                  <span style={{ padding: "6px 12px", background: "rgba(16, 185, 129, 0.2)", color: "var(--success)", borderRadius: "20px", fontSize: "12px", fontWeight: "bold" }}>
                    Active Internship
                  </span>
                </div>
                
                {typeof user.assignedSupervisor === 'object' && (
                  <div style={{ fontSize: "13px", color: "var(--text-secondary)", margin: "8px 0 14px 0", display: "flex", gap: "16px", flexWrap: "wrap" }}>
                    {user.assignedSupervisor.email && (
                      <a href={`mailto:${user.assignedSupervisor.email}`} style={{ color: "var(--accent)", fontWeight: "600", textDecoration: "underline" }}>
                        📧 {user.assignedSupervisor.email}
                      </a>
                    )}
                    {user.assignedSupervisor.phone && (
                      <span style={{ color: "var(--text-primary)" }}>
                        📞 Phone: {user.assignedSupervisor.phone}
                      </span>
                    )}
                  </div>
                )}

                <button
                  onClick={() => setShowInternModal(true)}
                  style={{ ...theme.button("primary"), width: "100%", padding: "10px", fontSize: "13px" }}
                  className="button-hover"
                >
                  📖 Open Daily Internship Diary & Logbook Portal
                </button>
              </div>
            ) : (
              <div style={{ padding: "20px", background: "var(--card-item-bg)", borderRadius: "14px", border: "1px solid var(--card-item-border)", textAlign: "center" }}>
                <span style={{ fontSize: "28px", display: "block", marginBottom: "8px" }}>⌛</span>
                <h4 style={{ margin: "0 0 6px 0", color: "var(--text-primary)" }}>Matching in Progress</h4>
                <p style={{ color: "var(--text-secondary)", fontSize: "13px", margin: 0 }}>
                  Your Academic Coordinator is currently reviewing supervisor internship vacancies to match and assign your placement.
                </p>
              </div>
            )}
          </div>
        ) : displayJobs.length === 0 ? (
          <p style={{ color: "#888" }}>No active direct job postings available.</p>
        ) : (
          <div style={styles.grid}>
            {displayJobs.map(job => (
              <div key={job._id} style={styles.jobCard}>
                <div>
                  <h4 style={{ margin: "0 0 5px 0", fontSize: "18px", color: "var(--text-primary)" }}>{job.title}</h4>
                  <span style={{ fontSize: "12px", color: "var(--success)", fontWeight: "bold", background: "rgba(16, 185, 129, 0.12)", padding: "2px 8px", borderRadius: "4px" }}>
                    {job.salary} • {job.opportunityType || "FULL_TIME"}
                  </span>
                  <p style={{ color: "var(--text-secondary)", fontSize: "13px", marginTop: "10px" }}>
                    {job.employerId?.companyName || job.employerId?.name || "Corporate Employer"} • {job.location}
                  </p>
                  <p style={{ color: "var(--text-secondary)", fontSize: "14px", marginTop: "10px", lineHeight: "1.4" }}>
                    {job.description}
                  </p>
                </div>
                <button
                  style={styles.applyBtn}
                  className="button-hover"
                  onClick={() => {
                    if (job.employerId?.email) {
                      window.location.href = `mailto:${job.employerId.email}?subject=Application for ${encodeURIComponent(job.title)}`;

                      apiClient.put(`/users/jobs/${job._id}/click`).catch(err => console.error(err));

                      const newApplied = [...appliedJobs, job._id];
                      setAppliedJobs(newApplied);
                      localStorage.setItem("appliedJobs", JSON.stringify(newApplied));
                    } else {
                      addToast("Employer email not available.", "error");
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
                  <h4 style={{ margin: "0 0 5px 0", color: "var(--text-primary)" }}>
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

      {/* 6. CAREER RECOMMENDATIONS */}
      <BentoCard colSpan={4} disableTilt={true}>
        <CareerForm fullWidth />
      </BentoCard>

      {/* 📋 INTERNSHIP ELIGIBILITY PORTAL MODAL */}
      {showEligibilityModal && (
        <InternEligibilityPortalModal
          user={user}
          onClose={() => {
            setShowEligibilityModal(false);
            if (user?.id || user?._id) fetchDashboardData(user.id || user._id);
          }}
          onUserUpdated={(updated) => {
            setUser(updated);
            localStorage.setItem("user", JSON.stringify(updated));
            if (updated?.id || updated?._id) fetchDashboardData(updated.id || updated._id);
          }}
        />
      )}

      {/* 🎓 INTERN PROGRAM HUB MODAL */}
      {showInternModal && (
        <InternProgramModal
          user={user}
          onClose={() => setShowInternModal(false)}
          onUserUpdated={(updated) => setUser(updated)}
        />
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
    color: "var(--btn-text)",
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
    background: "rgba(99,102,241,0.12)",
    borderRadius: "999px",
    border: "1px solid rgba(99,102,241,0.25)",
    color: "var(--accent)",
    fontSize: "12px",
    fontWeight: 700,
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
  pillSuccess: {
    padding: "8px 12px",
    background: "rgba(16,185,129,0.12)",
    borderRadius: "999px",
    border: "1px solid rgba(16,185,129,0.25)",
    color: "var(--success)",
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
    background: "var(--card-item-bg)",
    border: `1px solid var(--card-item-border)`,
    borderRadius: theme.radii.lg,
    padding: "20px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    minHeight: "200px"
  },
  applyBtn: {
    ...theme.button("secondary"),
    width: "100%",
    marginTop: 15,
  },
  requestCard: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "16px",
    background: "var(--card-item-bg)",
    border: `1px solid var(--card-item-border)`,
    borderRadius: theme.radii.md
  },
  connectedCard: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "16px",
    background: "rgba(16, 185, 129, 0.04)",
    border: `1px solid rgba(16, 185, 129, 0.15)`,
    borderRadius: theme.radii.md
  },
  btnGroup: {
    display: "flex",
    gap: 10
  },
  acceptBtn: {
    ...theme.button("secondary"),
  },
  denyBtn: {
    ...theme.button("danger"),
  },
  savedCard: {
    padding: "12px",
    background: "var(--card-item-bg)",
    border: `1px solid var(--card-item-border)`,
    borderRadius: theme.radii.sm,
    display: "flex",
    justifyContent: "space-between",
    color: theme.colors.textPrimary
  }
};

export default UserDashboard;