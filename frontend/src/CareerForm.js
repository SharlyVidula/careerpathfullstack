// src/CareerForm.js
import React, { useState } from "react";
import apiClient from "./apiClient";
import { jsPDF } from "jspdf";
import theme from "./theme";

function parseList(input) {
  if (!input) return [];
  return input
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export default function CareerForm() {
  const [skills, setSkills] = useState("");
  const [interests, setInterests] = useState("");
  const [workStyle, setWorkStyle] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  // ⭐ PDF Download Function
  const downloadPDF = (data) => {
    const doc = new jsPDF();

    doc.setFontSize(22);
    doc.text(data.careerTitle, 10, 20);

    doc.setFontSize(14);
    doc.text("Why this career?", 10, 35);
    doc.text(doc.splitTextToSize(data.reasoning, 180), 10, 43);

    doc.text("Motivation:", 10, 75);
    doc.text(doc.splitTextToSize(data.motivation, 180), 10, 83);

    doc.text("Recommended Skills:", 10, 115);
    data.suggestedSkills.forEach((skill, i) => {
      doc.text(`• ${skill}`, 14, 125 + i * 8);
    });

    doc.save(`${data.careerTitle}_recommendation.pdf`);
  };

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const isStageLocked = user?.role === "student" && (user?.studentStage === "YEAR_1_2" || !user?.studentStage);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isStageLocked) return;
    setError("");
    setResult(null);
    setLoading(true);

    try {
      const res = await apiClient.post("/ai/recommend", {
        skills: parseList(skills),
        interests: parseList(interests),
        workStyle,
      });

      setResult(res.data.aiResult);
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.error ||
        err.response?.data?.message ||
        "Something went wrong generating a recommendation."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Get Your Career Recommendation</h2>

      {isStageLocked && (
        <div style={{ padding: "16px", background: "rgba(245, 158, 11, 0.08)", border: "1px solid rgba(245, 158, 11, 0.3)", borderRadius: "12px", marginBottom: "20px" }}>
          <h4 style={{ color: "#f59e0b", margin: "0 0 6px 0" }}>🔒 Stage 1 Lock: Recommendation Tool Locked</h4>
          <p style={{ color: "var(--text-secondary)", fontSize: "13px", margin: 0, lineHeight: 1.5 }}>
            Career recommendation inputs are locked for 1st & 2nd Year students. Focus on foundational skill building in your Growth Tracker. Your Academic Coordinator (Senior Lecturer) will unlock recommendation tools in <strong>Stage 2 (3rd Year Intern Ready)</strong>.
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} style={styles.form}>
        <label style={styles.label}>
          Skills (comma separated)
          <input
            style={{ ...styles.input, opacity: isStageLocked ? 0.5 : 1, cursor: isStageLocked ? "not-allowed" : "text" }}
            placeholder={isStageLocked ? "🔒 Locked for 1st/2nd Year Students" : "javascript, design, communication"}
            value={skills}
            onChange={(e) => setSkills(e.target.value)}
            disabled={isStageLocked}
            readOnly={isStageLocked}
          />
        </label>

        <label style={styles.label}>
          Interests (comma separated)
          <input
            style={{ ...styles.input, opacity: isStageLocked ? 0.5 : 1, cursor: isStageLocked ? "not-allowed" : "text" }}
            placeholder={isStageLocked ? "🔒 Locked for 1st/2nd Year Students" : "ai, frontend, teaching"}
            value={interests}
            onChange={(e) => setInterests(e.target.value)}
            disabled={isStageLocked}
            readOnly={isStageLocked}
          />
        </label>

        <label style={styles.label}>
          Work style (optional)
          <input
            style={{ ...styles.input, opacity: isStageLocked ? 0.5 : 1, cursor: isStageLocked ? "not-allowed" : "text" }}
            placeholder={isStageLocked ? "🔒 Locked for 1st/2nd Year Students" : "remote, team player, independent..."}
            value={workStyle}
            onChange={(e) => setWorkStyle(e.target.value)}
            disabled={isStageLocked}
            readOnly={isStageLocked}
          />
        </label>

        <button
          type="submit"
          style={{ ...styles.button, opacity: isStageLocked ? 0.5 : 1, cursor: isStageLocked ? "not-allowed" : "pointer" }}
          disabled={loading || isStageLocked}
        >
          {isStageLocked ? "🔒 Locked for 1st & 2nd Year Students" : loading ? "Getting recommendation..." : "Get Recommendation"}
        </button>
      </form>

      {error && <div style={styles.error}>{error}</div>}

      {/* ⭐ PREMIUM AI RESULT BOX */}
      {result && (
        <div style={styles.resultBox} className="ai-result-animate">

          <div style={styles.resultHeader}>
            <span style={styles.resultIcon}>🎯</span>
            <h3 style={styles.resultTitle}>{result.careerTitle}</h3>
          </div>

          <p style={styles.resultDescription}>
            <strong style={styles.sectionTitle}>Why this career?</strong><br />
            {result.reasoning}
          </p>

          <p style={styles.resultDescription}>
            <strong style={styles.sectionTitle}>Motivation</strong><br />
            {result.motivation}
          </p>

          <div style={{ marginTop: 16 }}>
            <strong style={styles.sectionTitle}>Recommended Skills to Learn</strong>

            <div style={styles.skillWrap}>
              {result.suggestedSkills.map((skill, index) => (
                <span key={index} style={styles.skillPill}>
                  ⚡ {skill}
                </span>
              ))}
            </div>
          </div>

          {/* ⭐ PDF Button */}
          <button style={styles.pdfButton} onClick={() => downloadPDF(result)}>
            📄 Download as PDF
          </button>

        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    ...theme.glassPanel("24px"),
    width: "100%",
    color: "var(--text-primary)",
  },
  title: {
    fontSize: 22,
    marginBottom: 16,
    color: "var(--text-primary)",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  label: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
    fontSize: 14,
    color: "var(--text-secondary)",
  },
  input: {
    ...theme.input(),
  },
  button: {
    ...theme.button("primary"),
    marginTop: 8,
  },
  error: {
    marginTop: 12,
    padding: 10,
    borderRadius: 8,
    background: "rgba(239, 68, 68, 0.1)",
    color: "var(--danger)",
    fontSize: 14,
  },

  resultBox: {
    ...theme.glassPanel("24px 28px"),
    marginTop: 24,
    background: "var(--glass-bg-alt)",
    border: "1px solid var(--border)",
  },

  resultHeader: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },

  resultIcon: {
    fontSize: 32,
  },

  resultTitle: {
    fontSize: 24,
    fontWeight: "bold",
    margin: 0,
    color: "var(--text-primary)",
  },

  resultDescription: {
    marginTop: 14,
    fontSize: 15,
    lineHeight: 1.55,
    color: "var(--text-secondary)",
  },

  sectionTitle: {
    color: "var(--accent)",
    fontWeight: 700,
    fontSize: 15,
  },

  skillWrap: {
    display: "flex",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 10,
  },

  skillPill: {
    padding: "8px 14px",
    background: "var(--card-item-bg)",
    borderRadius: 12,
    fontSize: 14,
    color: "var(--text-primary)",
    border: "1px solid var(--card-item-border)",
  },

  pdfButton: {
    ...theme.button("secondary"),
    marginTop: 20,
  },
};
