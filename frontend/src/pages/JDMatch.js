import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import apiClient from "../apiClient";
import theme from "../theme";
import { useToast } from "../components/ToastContext";
import BentoCard from "../components/BentoCard";
import Skeleton from "../components/Skeleton";

export default function JDMatch() {
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [resumeText, setResumeText] = useState("");
  const [jobDescription, setJobDescription] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  const scoreColor = useMemo(() => {
    const s = result?.matchScore ?? 0;
    if (s >= 80) return "rgba(34,197,94,0.18)";
    if (s >= 60) return "rgba(245,158,11,0.18)";
    return "rgba(239,68,68,0.18)";
  }, [result]);

  const runMatch = async () => {
    if (!resumeText.trim() || !jobDescription.trim()) {
      setError("Please paste both Resume Text and Job Description.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setResult(null);

      const res = await apiClient.post("/jd/match", {
        resumeText,
        jobDescription,
      });

      if (res.data?.ok) {
        setResult(res.data.result);
      } else {
        setError(res.data?.message || "Failed to match");
      }
    } catch (e) {
      setError(e?.response?.data?.message || e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bento-grid" style={styles.page}>
      <BentoCard colSpan={4} padding="32px">
        <div style={styles.headerRow}>
          <div>
            <h1 style={styles.h1}>Job Role Match</h1>
            <p style={styles.subtitle}>
              Paste your resume + a job role description. AI returns highly accurate match score, deep reasoning, missing keywords, and tailored bullet points.
            </p>
          </div>

          <button style={styles.btnGhost} onClick={() => navigate("/dashboard")} className="button-hover">
            ← Dashboard
          </button>
        </div>
        {!!error && <div style={styles.errorBox}>{error}</div>}
      </BentoCard>

      <BentoCard colSpan={2}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
          <h2 style={{ ...styles.h2, margin: 0 }}>Resume Text</h2>
          <button
            style={{ ...theme.button("ghost"), padding: "6px 12px", fontSize: "12px", background: "rgba(103, 232, 249, 0.1)", color: "var(--accent)", border: "1px solid var(--accent)" }}
            onClick={() => {
              try {
                const u = JSON.parse(localStorage.getItem("user") || "{}");
                if (u?.resumeText) {
                  setResumeText(u.resumeText);
                  addToast("Imported successfully from dashboard parameters.", "info");
                } else {
                  addToast("No resume text found. Have you uploaded a CV on the dashboard?", "error");
                }
              } catch (e) { }
            }}
            className="button-hover"
          >
            Paste from uploaded CV
          </button>
        </div>
        <textarea
          value={resumeText}
          onChange={(e) => setResumeText(e.target.value)}
          placeholder="Paste your resume content here (plain text)."
          rows={12}
          style={styles.textarea}
        />
      </BentoCard>

      <BentoCard colSpan={2}>
        <h2 style={styles.h2}>Job Role</h2>
        <textarea
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
          placeholder="Paste the job role description here."
          rows={12}
          style={styles.textarea}
        />
      </BentoCard>

      <div style={{ ...styles.actionsRow, gridColumn: "1 / -1" }}>
        <button
          style={styles.btnPrimary}
          onClick={runMatch}
          disabled={loading}
          className="button-hover"
        >
          {loading ? "Matching…" : "Run JD Match"}
        </button>
      </div>

      {loading && !result && (
        <>
          <BentoCard colSpan={2} style={{ opacity: 0.5 }}>
            <Skeleton width="160px" height="28px" style={{ marginBottom: "20px" }} />
            <Skeleton width="120px" height="120px" style={{ margin: "0 auto 20px" }} borderRadius="50%" />
            <Skeleton width="100%" height="80px" />
          </BentoCard>
          <BentoCard colSpan={2} style={{ opacity: 0.5 }}>
            <Skeleton width="180px" height="28px" style={{ marginBottom: "20px" }} />
            <Skeleton width="100%" height="40px" style={{ marginBottom: "10px" }} />
            <Skeleton width="100%" height="40px" style={{ marginBottom: "10px" }} />
            <Skeleton width="80%" height="40px" />
          </BentoCard>
        </>
      )}

      {result && (
        <>
          <BentoCard colSpan={2} style={{ border: "1px solid rgba(255,255,255,0.10)" }}>
            <h2 style={styles.h2}>Match Score</h2>
            <div style={{ ...styles.scoreBox, background: scoreColor }}>
              <div style={styles.scoreNum}>{result.matchScore}%</div>
              <div style={styles.scoreSub}>Role Suitability</div>
            </div>

            {result.reasoning && (
              <div style={{ padding: "12px", background: "var(--surface)", borderRadius: "8px", borderLeft: "4px solid var(--accent)", marginBottom: "16px" }}>
                <strong style={{ display: "block", marginBottom: "6px", color: "var(--text-primary)" }}>Why this score?</strong>
                <p style={styles.p}>{result.reasoning}</p>
              </div>
            )}

            {result.matchScore < 37 && result.rejectionMessage && (
              <div style={{ padding: "14px", background: "rgba(239,68,68,0.15)", borderRadius: "8px", border: "1px solid rgba(239,68,68,0.3)", marginBottom: "16px" }}>
                <strong style={{ display: "block", marginBottom: "6px", color: "var(--danger)" }}>Role Suitability Alert</strong>
                <p style={{ ...styles.p, color: "var(--text-primary)" }}>{result.rejectionMessage}</p>
              </div>
            )}

            <p style={styles.p}>{result.notes}</p>
          </BentoCard>
          
          {result?.ats && (
            <BentoCard colSpan={2}>
              <h2 style={styles.h2}>ATS Evaluation</h2>

              <div
                style={{
                  ...styles.scoreBox,
                  background:
                    result.ats.verdict === "pass"
                      ? "rgba(34,197,94,0.18)"
                      : result.ats.verdict === "borderline"
                        ? "rgba(245,158,11,0.18)"
                        : "rgba(239,68,68,0.18)",
                }}
              >
                <div style={styles.scoreNum}>{result.ats.score}%</div>
                <div style={styles.scoreSub}>
                  {result.ats.verdict.toUpperCase()}
                </div>
              </div>

              <p style={styles.p}>{result.ats.explanation}</p>

              <p style={{ marginTop: 10, fontWeight: 700 }}>
                Keyword Coverage: {result.ats.keywordCoverage}%
              </p>

              <h4 style={{ marginTop: 10 }}>Missing Sections</h4>
              <ul style={styles.list}>
                {result.ats.missingSections.length ? (
                  result.ats.missingSections.map((s, i) => (
                    <li key={i} style={styles.li}>{s}</li>
                  ))
                ) : (
                  <li style={styles.li}>No critical sections missing 🎉</li>
                )}
              </ul>
            </BentoCard>
          )}

          <BentoCard colSpan={4}>
            <h2 style={styles.h2}>5-Year Career Roadmap</h2>
            {result.roadmap?.length > 0 ? (
              <ul style={styles.list}>
                {result.roadmap.map((step, i) => (
                  <li key={i} style={{ ...styles.li, marginBottom: "8px" }}>{step}</li>
                ))}
              </ul>
            ) : (
              <p style={styles.p}>No roadmap generated.</p>
            )}
          </BentoCard>

          <BentoCard colSpan={2}>
            <h2 style={styles.h2}>Strengths</h2>
            <ul style={styles.list}>
              {result.strengths.map((x, i) => <li key={i} style={styles.li}>{x}</li>)}
            </ul>
          </BentoCard>

          <BentoCard colSpan={2}>
            <h2 style={styles.h2}>Gaps</h2>
            <ul style={styles.list}>
              {result.gaps.map((x, i) => <li key={i} style={styles.li}>{x}</li>)}
            </ul>
          </BentoCard>

          <BentoCard colSpan={2}>
            <h2 style={styles.h2}>Missing Keywords</h2>
            <div style={styles.chipWrap}>
              {result.missingKeywords.map((k, i) => (
                <span key={i} style={styles.chip}>{k}</span>
              ))}
            </div>
          </BentoCard>

          <BentoCard colSpan={2}>
            <h2 style={styles.h2}>Tailored Bullet Points</h2>
            <ul style={styles.list}>
              {result.tailoredBulletPoints.map((x, i) => <li key={i} style={styles.li}>{x}</li>)}
            </ul>
          </BentoCard>

          <BentoCard colSpan={4}>
            <h2 style={styles.h2}>Priority Actions</h2>
            <ul style={styles.list}>
              {result.priorityActions.map((x, i) => <li key={i} style={styles.li}>{x}</li>)}
            </ul>
          </BentoCard>
        </>
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

  headerRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: 16,
    alignItems: "flex-start",
    marginBottom: 18,
  },

  h1: { margin: 0, color: theme.colors.textPrimary, fontSize: 28, fontWeight: 900 },
  subtitle: { marginTop: 6, color: theme.colors.textSecondary, maxWidth: 820 },

  h2: { margin: "0 0 10px 0", color: theme.colors.textPrimary, fontSize: 18, fontWeight: 800 },
  p: { margin: 0, color: theme.colors.textSecondary, lineHeight: 1.6 },

  textarea: {
    width: "100%",
    padding: 14,
    borderRadius: theme.radii.md,
    border: `1px solid ${theme.colors.border}`,
    background: "rgba(255,255,255,0.03)",
    color: theme.colors.textPrimary,
    outline: "none",
    resize: "vertical",
    minHeight: "200px"
  },

  actionsRow: { display: "flex", justifyContent: "flex-end", marginTop: 14 },

  btnPrimary: { ...theme.button("primary"), width: "fit-content" },
  btnGhost: { ...theme.button("ghost"), width: "fit-content" },

  scoreBox: {
    borderRadius: theme.radii.lg,
    border: "1px solid rgba(255,255,255,0.10)",
    padding: 16,
    marginBottom: 10,
    display: "grid",
    placeItems: "center",
    gap: 4,
  },
  scoreNum: { fontSize: 42, fontWeight: 900, color: theme.colors.textPrimary },
  scoreSub: { fontSize: 12, color: theme.colors.textSecondary },

  list: { margin: 0, paddingLeft: 18, color: theme.colors.textSecondary, display: "grid", gap: 8 },
  li: {
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.08)",
    padding: "10px 12px",
    borderRadius: theme.radii.md,
    listStylePosition: "inside",
  },

  chipWrap: { display: "flex", flexWrap: "wrap", gap: 8 },
  chip: {
    padding: "8px 10px",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(255,255,255,0.03)",
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: 700,
  },

  errorBox: {
    ...theme.glassPanel("18px"),
    padding: 14,
    marginBottom: 14,
    border: "1px solid rgba(239,68,68,0.35)",
    background: "rgba(239,68,68,0.08)",
    color: theme.colors.textPrimary,
  },
};
