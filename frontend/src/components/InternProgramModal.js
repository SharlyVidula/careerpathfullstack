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

  return (
    <div style={{
      position: "fixed",
      top: 0, left: 0, right: 0, bottom: 0,
      background: "rgba(0, 0, 0, 0.75)",
      backdropFilter: "blur(8px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 9990,
      padding: "16px"
    }}>
      <div style={{
        background: "#0f172a",
        border: "1px solid var(--glass-border)",
        borderRadius: theme.radii.xl,
        width: "100%",
        maxWidth: "960px",
        maxHeight: "90vh",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        boxShadow: "0 20px 50px rgba(0, 0, 0, 0.5)",
        color: "#fff"
      }}>
        {/* Modal Header */}
        <div style={{
          background: "linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%)",
          padding: "18px 24px",
          borderBottom: "1px solid var(--glass-border)",
          display: "flex",
          justify: "space-between",
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
            onClick={() => setActiveTab("diary")}
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
            📖 6-Month Daily Diary
          </button>

          <button
            onClick={() => setActiveTab("supervisors")}
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
            👔 Supervisor Contacts {eligibility.isEligible ? "🔓" : "🔒"}
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
                <InternDiary user={user} />
              )}

              {activeTab === "supervisors" && (
                <SupervisorContactModal user={user} eligibility={eligibility} />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default InternProgramModal;
