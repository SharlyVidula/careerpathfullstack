// frontend/src/components/ResumeEnhancer.js
import React, { useState } from "react";
import apiClient from "../apiClient";

export default function ResumeEnhancer() {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const uploadResume = async () => {
    if (!file) {
      alert("Please upload a resume file first.");
      return;
    }

    setError("");
    setResult(null);
    setLoading(true);

    try {
      const form = new FormData();
      form.append("resume", file);

      const res = await apiClient.post("/resume/analyze", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setResult(res.data.result);
    } catch (err) {
      console.error("Upload/AI error:", err);
      setError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          "Resume analysis failed."
      );
    } finally {
      setLoading(false);
    }
  };

  const cp = result?.careerPath || {};

  const renderList = (items) =>
    (items || []).length ? (
      <ul>
        {items.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    ) : (
      <p style={{ opacity: 0.7, fontSize: 14 }}>No data.</p>
    );

  return (
    <div
      style={{
        background: "#111827",
        padding: 20,
        borderRadius: 12,
        marginTop: 20,
        color: "white",
      }}
    >
      <h3 style={{ marginBottom: 12 }}>AI Resume Analyzer</h3>

      <input
        type="file"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
        style={{ marginTop: 8 }}
      />

      <button
        onClick={uploadResume}
        disabled={loading}
        style={{
          marginTop: 10,
          padding: "8px 16px",
          background: "#10b981",
          borderRadius: 8,
          border: "none",
          cursor: "pointer",
          opacity: loading ? 0.7 : 1,
        }}
      >
        {loading ? "Analyzing..." : "Analyze Resume"}
      </button>

      {error && (
        <div
          style={{
            marginTop: 12,
            padding: 10,
            borderRadius: 8,
            background: "rgba(248,113,113,0.15)",
            color: "#fecaca",
            fontSize: 14,
          }}
        >
          {error}
        </div>
      )}

      {result && (
        <div style={{ marginTop: 24 }}>
          {/* ====== BASIC ANALYSIS ====== */}
          <h4>Summary</h4>
          <p>{result.summary}</p>

          <h4>Strengths</h4>
          {renderList(result.strengths)}

          <h4>Weaknesses</h4>
          {renderList(result.weaknesses)}

          <h4>Improvements</h4>
          {renderList(result.improvements)}

          <h4>Keywords to Add</h4>
          {renderList(result.keywordsToAdd)}

          <h4>Improved Bullet Points</h4>
          {renderList(result.improvedBulletPoints)}

          {/* ====== CAREER PATH GUIDE ====== */}
          <div
            style={{
              marginTop: 28,
              paddingTop: 16,
              borderTop: "1px solid rgba(148,163,184,0.5)",
            }}
          >
            <h3 style={{ marginBottom: 8 }}>Career Path Guide</h3>

            <p style={{ opacity: 0.85 }}>
              This roadmap shows how you can grow from your{" "}
              <strong>current stage</strong> to your{" "}
              <strong>maximum potential</strong> in this field.
            </p>

            {cp.currentStage && (
              <>
                <h4 style={{ marginTop: 16 }}>Current Stage</h4>
                <p>{cp.currentStage}</p>
              </>
            )}

            <h4 style={{ marginTop: 12 }}>Next 3–6 Months (Short-Term)</h4>
            {renderList(cp.shortTermSteps)}

            <h4 style={{ marginTop: 12 }}>Next 1–2 Years (Mid-Term)</h4>
            {renderList(cp.midTermSteps)}

            <h4 style={{ marginTop: 12 }}>Next 3–5 Years (Long-Term)</h4>
            {renderList(cp.longTermSteps)}

            {cp.ultimateGoal && (
              <>
                <h4 style={{ marginTop: 12 }}>Ultimate Goal</h4>
                <p>{cp.ultimateGoal}</p>
              </>
            )}

            <h4 style={{ marginTop: 12 }}>Recommended Roles</h4>
            {renderList(cp.recommendedRoles)}

            <h4 style={{ marginTop: 12 }}>Recommended Courses & Certifications</h4>
            {renderList(cp.recommendedCourses)}
          </div>
        </div>
      )}
    </div>
  );
}
