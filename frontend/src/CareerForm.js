// src/CareerForm.js
import React, { useState } from "react";
import apiClient from "./apiClient";
import { jsPDF } from "jspdf";

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

  const handleSubmit = async (e) => {
    e.preventDefault();
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

      <form onSubmit={handleSubmit} style={styles.form}>
        <label style={styles.label}>
          Skills (comma separated)
          <input
            style={styles.input}
            placeholder="javascript, design, communication"
            value={skills}
            onChange={(e) => setSkills(e.target.value)}
          />
        </label>

        <label style={styles.label}>
          Interests (comma separated)
          <input
            style={styles.input}
            placeholder="ai, frontend, teaching"
            value={interests}
            onChange={(e) => setInterests(e.target.value)}
          />
        </label>

        <label style={styles.label}>
          Work style (optional)
          <input
            style={styles.input}
            placeholder="remote, team player, independent..."
            value={workStyle}
            onChange={(e) => setWorkStyle(e.target.value)}
          />
        </label>

        <button type="submit" style={styles.button} disabled={loading}>
          {loading ? "Getting recommendation..." : "Get Recommendation"}
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
    width: "100%",
    padding: 24,
    borderRadius: 16,
    background: "rgba(10,10,25,0.85)",
    color: "#fff",
  },
  title: {
    fontSize: 22,
    marginBottom: 16,
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
  },
  input: {
    padding: "10px 12px",
    borderRadius: 8,
    border: "1px solid #444",
    background: "rgba(0,0,0,0.3)",
    color: "#fff",
  },
  button: {
    marginTop: 8,
    padding: "10px 14px",
    borderRadius: 999,
    border: "none",
    background: "#4ade80",
    color: "#041024",
    fontWeight: 600,
    cursor: "pointer",
  },
  error: {
    marginTop: 12,
    padding: 10,
    borderRadius: 8,
    background: "rgba(255,0,0,0.1)",
    color: "#ff8080",
    fontSize: 14,
  },

  // ⭐ NEW — PREMIUM RESULT BOX
  resultBox: {
    marginTop: 24,
    padding: "24px 28px",
    borderRadius: 20,
    background: "rgba(15, 23, 42, 0.75)",
    border: "1px solid rgba(99,102,241,0.35)",
    boxShadow: "0 0 20px rgba(99,102,241,0.25)",
    backdropFilter: "blur(14px)",
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
    color: "#ffffff",
  },

  resultDescription: {
    marginTop: 14,
    fontSize: 15,
    lineHeight: 1.55,
    opacity: 0.9,
    color: "#e2e8f0",
  },

  sectionTitle: {
    color: "#8ab4ff",
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
    background: "rgba(56,189,248,0.15)",
    borderRadius: 12,
    fontSize: 14,
    color: "#7dd3fc",
    border: "1px solid rgba(125,211,252,0.3)",
    boxShadow: "0 0 8px rgba(125,211,252,0.25)",
  },

  // ⭐ PDF BUTTON STYLE
  pdfButton: {
    marginTop: 20,
    padding: "10px 16px",
    background: "#3b82f6",
    color: "white",
    border: "none",
    borderRadius: 10,
    cursor: "pointer",
    fontWeight: 600,
    transition: "0.2s",
  },
};
