import React, { useState } from "react";
import theme from "../theme";

function InternEligibilityCard({ eligibility, jlptLevel, onUpdateJlpt, onToggleGpaCalc }) {
  const [updatingJlpt, setUpdatingJlpt] = useState(false);

  const {
    isEligible = false,
    progressPercentage = 0,
    isJlptEligible = false,
    gpa = 0,
    isGpaEligible = false
  } = eligibility || {};

  const handleJlptChange = async (e) => {
    const newLevel = e.target.value;
    setUpdatingJlpt(true);
    try {
      if (onUpdateJlpt) {
        await onUpdateJlpt(newLevel);
      }
    } finally {
      setUpdatingJlpt(false);
    }
  };

  return (
    <div style={{
      background: "var(--glass-bg-alt, rgba(15, 23, 42, 0.6))",
      borderRadius: theme.radii.xl,
      padding: "20px",
      border: `1px solid ${isEligible ? "rgba(34, 197, 94, 0.3)" : "rgba(234, 179, 8, 0.3)"}`,
      backdropFilter: "blur(12px)",
      color: "var(--text-primary)",
      boxShadow: theme.shadows.glow
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
        <div>
          <h3 style={{ margin: 0, fontSize: "18px", color: "var(--accent, #6366f1)", display: "flex", alignItems: "center", gap: "8px" }}>
            📊 Internship Eligibility Progress
          </h3>
          <p style={{ margin: "4px 0 0 0", fontSize: "12px", color: "var(--text-secondary)" }}>
            Complete required eligibility tasks to connect with internship supervisors & recruiters
          </p>
        </div>

        <div style={{
          padding: "6px 14px",
          borderRadius: "20px",
          fontSize: "12px",
          fontWeight: "bold",
          background: isEligible ? "rgba(34, 197, 94, 0.15)" : "rgba(234, 179, 8, 0.15)",
          color: isEligible ? "#22c55e" : "#eab308",
          border: `1px solid ${isEligible ? "rgba(34, 197, 94, 0.4)" : "rgba(234, 179, 8, 0.4)"}`
        }}>
          {isEligible ? "✅ ELIGIBLE FOR SUPERVISOR CONNECT" : "⏳ INELIGIBLE - TASKS PENDING"}
        </div>
      </div>

      {/* Progress Bar */}
      <div style={{ marginBottom: "20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", fontWeight: "bold", marginBottom: "6px" }}>
          <span>Overall Eligibility Completion</span>
          <span style={{ color: isEligible ? "#22c55e" : "#6366f1" }}>{progressPercentage}%</span>
        </div>
        <div style={{
          height: "12px",
          borderRadius: "6px",
          background: "rgba(255,255,255,0.08)",
          overflow: "hidden",
          border: "1px solid var(--glass-border)"
        }}>
          <div style={{
            height: "100%",
            width: `${progressPercentage}%`,
            background: isEligible 
              ? "linear-gradient(90deg, #22c55e, #10b981)" 
              : "linear-gradient(90deg, #6366f1, #3b82f6)",
            borderRadius: "6px",
            transition: "width 0.5s ease"
          }} />
        </div>
      </div>

      {/* Parameter Checklist */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "14px" }}>
        
        {/* Task 1: JLPT / NAT Level */}
        <div style={{
          background: "var(--glass-bg, rgba(255,255,255,0.03))",
          padding: "14px",
          borderRadius: theme.radii.md,
          border: `1px solid ${isJlptEligible ? "rgba(34, 197, 94, 0.3)" : "rgba(239, 68, 68, 0.3)"}`
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <span style={{ fontSize: "13px", fontWeight: "600" }}>🎌 Japanese Level (JLPT/NAT)</span>
            <span style={{ fontSize: "12px", color: isJlptEligible ? "#22c55e" : "#ef4444", fontWeight: "bold" }}>
              {isJlptEligible ? "✅ Met (≥ N4)" : "❌ Required ≥ N4"}
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <select
              value={jlptLevel || "NONE"}
              onChange={handleJlptChange}
              disabled={updatingJlpt}
              style={{
                ...theme.input(),
                padding: "6px 10px",
                fontSize: "12px",
                fontWeight: "bold"
              }}
            >
              <option value="NONE" style={{ background: "#1e293b", color: "#fff" }}>None / Not Taken</option>
              <option value="N5" style={{ background: "#1e293b", color: "#fff" }}>JLPT / NAT N5 (Basic)</option>
              <option value="N4" style={{ background: "#1e293b", color: "#fff" }}>JLPT / NAT N4 (Eligible ✓)</option>
              <option value="N3" style={{ background: "#1e293b", color: "#fff" }}>JLPT / NAT N3 (Eligible ✓)</option>
              <option value="N2" style={{ background: "#1e293b", color: "#fff" }}>JLPT / NAT N2 (Eligible ✓)</option>
              <option value="N1" style={{ background: "#1e293b", color: "#fff" }}>JLPT / NAT N1 (Eligible ✓)</option>
            </select>
          </div>
          <p style={{ margin: "6px 0 0 0", fontSize: "11px", color: "var(--text-secondary)" }}>
            Requirement: JLPT / NAT Exam N4 or higher.
          </p>
        </div>

        {/* Task 2: Academic GPA */}
        <div style={{
          background: "var(--glass-bg, rgba(255,255,255,0.03))",
          padding: "14px",
          borderRadius: theme.radii.md,
          border: `1px solid ${isGpaEligible ? "rgba(34, 197, 94, 0.3)" : "rgba(239, 68, 68, 0.3)"}`
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <span style={{ fontSize: "13px", fontWeight: "600" }}>🎓 Academic GPA</span>
            <span style={{ fontSize: "12px", color: isGpaEligible ? "#22c55e" : "#ef4444", fontWeight: "bold" }}>
              {isGpaEligible ? "✅ Met (≥ 2.0)" : "❌ Required ≥ 2.0"}
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "16px", fontWeight: "bold", color: isGpaEligible ? "#22c55e" : "#ef4444" }}>
              {Number(gpa).toFixed(2)} / 4.0
            </span>
            <button
              onClick={onToggleGpaCalc}
              style={{
                ...theme.button("ghost"),
                fontSize: "11px",
                padding: "4px 10px"
              }}
            >
              🧮 Open GPA Calculator
            </button>
          </div>
          <p style={{ margin: "6px 0 0 0", fontSize: "11px", color: "var(--text-secondary)" }}>
            Requirement: Minimum cumulative GPA of 2.0.
          </p>
        </div>

      </div>
    </div>
  );
}

export default InternEligibilityCard;
