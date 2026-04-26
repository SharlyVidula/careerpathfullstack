import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import theme from "../theme";
import BentoCard from "../components/BentoCard";
import { useToast } from "../components/ToastContext";
import Skeleton from "../components/Skeleton";

export default function JobMatch() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [jd, setJd] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleScan = async () => {
    if (!jd.trim()) {
      addToast("Paste a Job Description first!", "warning");
      return;
    }
    const user = JSON.parse(localStorage.getItem("user"));
    
    setLoading(true);
    setResult(null); // Reset previous result

    try {
      const res = await axios.post("http://localhost:5000/api/users/match-job", {
        userId: user.id,
        jobDescription: jd
      });
      setResult(res.data.result);
      addToast("Job Match scan complete!", "success");
    } catch (err) {
      addToast(err.response?.data?.message || "Scan failed.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bento-grid" style={styles.page}>
      {/* Header - Spans 4 Columns */}
      <BentoCard colSpan={4} padding="32px">
        <div style={styles.header}>
          <button onClick={() => navigate("/user-dashboard")} style={styles.backBtn} className="button-hover">← Back</button>
          <h2 style={styles.title}>📑 AI Job Matcher</h2>
        </div>
      </BentoCard>

      {/* Left Side: Input - Spans 2 Columns */}
      <BentoCard colSpan={2}>
        <h3 style={{color: "#a78bfa", marginTop: 0}}>1. Paste Job Description</h3>
        <textarea
          value={jd}
          onChange={(e) => setJd(e.target.value)}
          placeholder="Paste the LinkedIn/Glassdoor job description here..."
          style={styles.textArea}
        />
        <button 
          onClick={handleScan} 
          disabled={loading}
          style={loading ? styles.disabledBtn : styles.scanBtn}
          className="button-hover"
        >
          {loading ? "🤖 AI is Analyzing..." : "Analyze Match"}
        </button>
      </BentoCard>

      {/* Right Side: Results - Spans 2 Columns */}
      <BentoCard colSpan={2}>
        <h3 style={{color: "#34d399", marginTop: 0}}>2. Match Result</h3>
        
        {!result && !loading && (
          <p style={{color: "#666", fontStyle: "italic"}}>
            Results will appear here after analysis.
          </p>
        )}

        {loading && (
          <div style={{ textAlign: "center", marginTop: "20px" }}>
            <Skeleton width="120px" height="120px" borderRadius="50%" style={{ margin: "0 auto 20px" }} />
            <Skeleton width="100%" height="16px" style={{ marginBottom: "10px" }} />
            <Skeleton width="80%" height="16px" style={{ marginBottom: "10px", marginLeft: "10%" }} />
            <Skeleton width="90%" height="16px" style={{ marginLeft: "5%" }} />
          </div>
        )}

        {result && (
          <div style={{textAlign: "center"}}>
            {/* Score Circle */}
            <div style={styles.scoreCircle}>
              <span style={{fontSize: "32px", fontWeight: "bold", color: "white"}}>
                {result.score}%
              </span>
              <span style={{fontSize: "12px", color: "#ccc"}}>MATCH</span>
            </div>

            {/* Advice Section */}
            <div style={{textAlign: "left", marginTop: "20px"}}>
              <h4 style={{marginBottom: "5px", color: "white"}}>AI Advice:</h4>
              <p style={{color: theme.colors.textSecondary, fontSize: "14px"}}>
                {result.advice}
              </p>

              {result.missingSkills?.length > 0 && (
                <>
                  <h4 style={{marginBottom: "5px", marginTop: "15px", color: "#f87171"}}>Missing Keywords:</h4>
                  <div style={{display: "flex", gap: "8px", flexWrap: "wrap"}}>
                    {result.missingSkills.map(skill => (
                      <span key={skill} style={styles.missingTag}>{skill}</span>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </BentoCard>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    padding: "24px 18px 60px",
    maxWidth: "1600px", margin: "0 auto"
  },
  header: {
    display: "flex",
    alignItems: "center",
    gap: "20px",
  },
  backBtn: {
    background: "transparent",
    border: "1px solid #444",
    color: "#ccc",
    padding: "8px 16px",
    borderRadius: "20px",
    cursor: "pointer",
    transition: "all 0.2s ease"
  },
  title: {
    margin: 0,
    fontSize: "24px",
    color: "white"
  },
  textArea: {
    width: "100%",
    height: "250px",
    background: "rgba(0,0,0,0.3)",
    border: "1px solid #444",
    borderRadius: "10px",
    color: "white",
    padding: "15px",
    fontSize: "14px",
    resize: "none",
    marginBottom: "15px",
    transition: "all 0.2s ease"
  },
  scanBtn: {
    ...theme.button("primary"),
    width: "100%"
  },
  disabledBtn: {
    ...theme.button("primary"),
    width: "100%",
    opacity: 0.5,
    cursor: "not-allowed"
  },
  scoreCircle: {
    width: "120px",
    height: "120px",
    borderRadius: "50%",
    border: "4px solid #34d399",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto",
    boxShadow: "0 0 20px rgba(52, 211, 153, 0.3)"
  },
  missingTag: {
    background: "rgba(248, 113, 113, 0.2)",
    color: "#fca5a5",
    border: "1px solid rgba(248, 113, 113, 0.4)",
    padding: "4px 8px",
    borderRadius: "4px",
    fontSize: "12px",
    fontWeight: "bold"
  },
  pulse: {
    color: "#a78bfa",
    fontWeight: "bold",
    textAlign: "center",
    marginTop: "50px",
    animation: "pulse 1.5s infinite"
  }
};