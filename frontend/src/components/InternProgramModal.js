import React, { useState, useEffect } from "react";
import apiClient from "../apiClient";
import theme from "../theme";
import InternEligibilityCard from "./InternEligibilityCard";
import GpaCalculator from "./GpaCalculator";
import InternDiary from "./InternDiary";
import SupervisorContactModal from "./SupervisorContactModal";
import { useToast } from "./ToastContext";

function InternProgramModal({ user, onClose, onUserUpdated }) {
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState("eligibility");
  const [showGpaCalc, setShowGpaCalc] = useState(false);
  const [eligibility, setEligibility] = useState({
    isEligible: false,
    progressPercentage: 0,
    jlptLevel: user?.jlptLevel || "NONE",
    isJlptEligible: false,
    gpa: user?.gpa || 0,
    isGpaEligible: false
  });
  const [gpaCourses, setGpaCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  const userId = user?.id || user?._id;

  const fetchEligibility = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const res = await apiClient.get(`/intern/eligibility/${userId}`);
      if (res.data?.ok) {
        setEligibility(res.data.eligibility);
        setGpaCourses(res.data.gpaCourses || []);
      }
    } catch (err) {
      console.error("Fetch Eligibility Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEligibility();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const handleUpdateJlpt = async (newJlptLevel) => {
    try {
      const res = await apiClient.put(`/intern/eligibility/${userId}`, {
        jlptLevel: newJlptLevel
      });
      if (res.data?.ok) {
        setEligibility(res.data.eligibility);
        addToast(`Japanese level updated to ${newJlptLevel}!`, "success");
        if (onUserUpdated) onUserUpdated({ ...user, jlptLevel: newJlptLevel });
      }
    } catch (err) {
      addToast("Failed to update Japanese level.", "error");
    }
  };

  const handleSaveGpa = async (newGpa, coursesList) => {
    try {
      const res = await apiClient.put(`/intern/eligibility/${userId}`, {
        gpa: newGpa,
        gpaCourses: coursesList
      });
      if (res.data?.ok) {
        setEligibility(res.data.eligibility);
        setGpaCourses(coursesList);
        addToast(`Academic GPA updated to ${newGpa.toFixed(2)} and saved to profile!`, "success");
        if (onUserUpdated) onUserUpdated({ ...user, gpa: newGpa, gpaCourses: coursesList });
      }
    } catch (err) {
      addToast("Failed to save GPA.", "error");
    }
  };

  const isPlaced = Boolean(user?.assignedSupervisor);

  return (
    <div style={{
      position: "fixed",
      top: 0, left: 0, right: 0, bottom: 0,
      background: "rgba(5, 10, 25, 0.88)",
      backdropFilter: "blur(14px)",
      WebkitBackdropFilter: "blur(14px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 50000,
      padding: "80px 20px 30px"
    }}>
      <div style={{
        background: "#0f172a",
        border: "1px solid var(--glass-border)",
        borderRadius: theme.radii.xl,
        width: "100%",
        maxWidth: "960px",
        maxHeight: "85vh",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        boxShadow: "0 20px 50px rgba(0, 0, 0, 0.6)",
        color: "#fff"
      }}>
        {/* Modal Header */}
        <div style={{
          background: "linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%)",
          padding: "18px 24px",
          borderBottom: "1px solid var(--glass-border)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}>
          <div>
            <h2 style={{ margin: 0, fontSize: "20px", color: "#6366f1", display: "flex", alignItems: "center", gap: "10px" }}>
              🎓 LNBTI Internship Program Portal
            </h2>
            <p style={{ margin: "4px 0 0 0", fontSize: "12px", color: "var(--text-secondary)" }}>
              Supervisor connections, daily diary log, and academic eligibility tracker
            </p>
          </div>

          <button
            onClick={onClose}
            style={{
              background: "rgba(255,255,255,0.1)",
              border: "none",
              color: "#fff",
              borderRadius: "50%",
              width: "32px",
              height: "32px",
              fontSize: "16px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            ✕
          </button>
        </div>

        {/* Tab Bar */}
        <div style={{
          display: "flex",
          borderBottom: "1px solid var(--glass-border)",
          background: "rgba(0,0,0,0.2)",
          padding: "0 16px"
        }}>
          <button
            onClick={() => setActiveTab("eligibility")}
            style={{
              background: "none",
              border: "none",
              borderBottom: activeTab === "eligibility" ? "3px solid #6366f1" : "3px solid transparent",
              color: activeTab === "eligibility" ? "#6366f1" : "var(--text-secondary)",
              padding: "12px 18px",
              fontSize: "13px",
              fontWeight: "600",
              cursor: "pointer"
            }}
          >
            📊 Eligibility & GPA ({eligibility.progressPercentage}%)
          </button>

          <button
            onClick={() => {
              if (!isPlaced) {
                addToast("🔒 Daily diary is available only after your Academic Coordinator assigns your internship placement.", "info");
              }
              setActiveTab("diary");
            }}
            style={{
              background: "none",
              border: "none",
              borderBottom: activeTab === "diary" ? "3px solid #6366f1" : "3px solid transparent",
              color: activeTab === "diary" ? "#6366f1" : "var(--text-secondary)",
              padding: "12px 18px",
              fontSize: "13px",
              fontWeight: "600",
              cursor: "pointer"
            }}
          >
            📖 6-Month Daily Diary {isPlaced ? "🔓" : "🔒"}
          </button>

          <button
            onClick={() => {
              if (!isPlaced) {
                addToast("🔒 Supervisor contacts are available only after your Academic Coordinator assigns your internship placement.", "info");
              }
              setActiveTab("supervisors");
            }}
            style={{
              background: "none",
              border: "none",
              borderBottom: activeTab === "supervisors" ? "3px solid #6366f1" : "3px solid transparent",
              color: activeTab === "supervisors" ? "#6366f1" : "var(--text-secondary)",
              padding: "12px 18px",
              fontSize: "13px",
              fontWeight: "600",
              cursor: "pointer"
            }}
          >
            👔 Supervisor Contacts {isPlaced ? "🔓" : "🔒"}
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: "20px", overflowY: "auto", flex: 1 }}>
          {loading ? (
            <div style={{ textAlign: "center", padding: "40px 0", color: "var(--text-secondary)" }}>
              Loading internship portal...
            </div>
          ) : (
            <>
              {activeTab === "eligibility" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                  <InternEligibilityCard
                    eligibility={eligibility}
                    jlptLevel={user?.jlptLevel || eligibility.jlptLevel}
                    onUpdateJlpt={handleUpdateJlpt}
                    onToggleGpaCalc={() => setShowGpaCalc(!showGpaCalc)}
                  />

                  {showGpaCalc && (
                    <GpaCalculator
                      initialGpa={eligibility.gpa}
                      initialCourses={gpaCourses}
                      onSaveGpa={handleSaveGpa}
                    />
                  )}
                </div>
              )}

              {activeTab === "diary" && (
                !isPlaced ? (
                  <div style={{
                    background: "rgba(234, 179, 8, 0.08)",
                    border: "1px solid rgba(234, 179, 8, 0.3)",
                    borderRadius: theme.radii.xl,
                    padding: "36px 24px",
                    textAlign: "center",
                    margin: "20px 0"
                  }}>
                    <div style={{ fontSize: "44px", marginBottom: "12px" }}>🔒</div>
                    <h3 style={{ color: "#eab308", margin: "0 0 8px 0", fontSize: "18px" }}>
                      Available Only After Internship Placement
                    </h3>
                    <p style={{ margin: "0 auto", maxWidth: "540px", fontSize: "14px", color: "var(--text-secondary)", lineHeight: "1.6" }}>
                      Your <strong>6-Month Daily Internship Logbook</strong> will be unlocked <strong>only after</strong> your LNBTI Academic Coordinator matches and assigns your official internship placement.
                    </p>
                    <div style={{ marginTop: "14px", fontSize: "12px", color: "var(--accent)", fontWeight: "600" }}>
                      ⏳ Status: Internship Allocation Managed by Academic Coordinator
                    </div>
                  </div>
                ) : (
                  <InternDiary user={user} />
                )
              )}

              {activeTab === "supervisors" && (
                !isPlaced ? (
                  <div style={{
                    background: "rgba(234, 179, 8, 0.08)",
                    border: "1px solid rgba(234, 179, 8, 0.3)",
                    borderRadius: theme.radii.xl,
                    padding: "36px 24px",
                    textAlign: "center",
                    margin: "20px 0"
                  }}>
                    <div style={{ fontSize: "44px", marginBottom: "12px" }}>🔒</div>
                    <h3 style={{ color: "#eab308", margin: "0 0 8px 0", fontSize: "18px" }}>
                      Available Only After Internship Placement
                    </h3>
                    <p style={{ margin: "0 auto", maxWidth: "540px", fontSize: "14px", color: "var(--text-secondary)", lineHeight: "1.6" }}>
                      Industry Supervisor contact information will be available <strong>only after</strong> your LNBTI Academic Coordinator matches and assigns your official internship placement.
                    </p>
                    <div style={{ marginTop: "14px", fontSize: "12px", color: "var(--accent)", fontWeight: "600" }}>
                      ⏳ Status: Internship Allocation Managed by Academic Coordinator
                    </div>
                  </div>
                ) : (
                  <SupervisorContactModal user={user} eligibility={eligibility} />
                )
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default InternProgramModal;
