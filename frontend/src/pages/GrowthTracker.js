import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import apiClient from "../apiClient";
import theme from "../theme";
import Skeleton from "../components/Skeleton";
import BentoCard from "../components/BentoCard";
import { useToast } from "../components/ToastContext";



const DEFAULT = {
  progress: {
    academic: 0,
    industry: 0,
    skills: 0,
    certifications: 0,
    networking: 0,
  },
  todos: [],
  explanation: "",
};

const formatDateTime = (d) => {
  try {
    const dt = new Date(d);
    return dt.toLocaleString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
};

export default function GrowthTracker() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [user, setUser] = useState(null);

  const [state, setState] = useState(DEFAULT);
  const [logText, setLogText] = useState("");
  const [loading, setLoading] = useState(false);
  const [booting, setBooting] = useState(true);
  const [error, setError] = useState("");

  // ✅ NEW: timeline + streak
  const [history, setHistory] = useState([]);
  const [streak, setStreak] = useState(0);

  // Load user from localStorage
  useEffect(() => {
    const data = localStorage.getItem("user");
    if (!data) {
      navigate("/login");
      return;
    }
    setUser(JSON.parse(data));
  }, [navigate]);

  // Normalize userId ONCE
  const userId = user?._id || user?.id || user?.userId;

  // Load growth state + history + streak
  useEffect(() => {
    if (!userId) return;

    const run = async () => {
      try {
        setBooting(true);
        setError("");

        const [stateRes, histRes, streakRes] = await Promise.all([
          apiClient.get(`/growth/state?userId=${userId}`),
          apiClient.get(`/growth/history?userId=${userId}&limit=7`),
          apiClient.get(`/growth/streak?userId=${userId}`),
        ]);

        if (stateRes.data?.ok) {
          setState({
            progress: stateRes.data.progress,
            todos: stateRes.data.todos,
            explanation: stateRes.data.explanation,
          });
        } else {
          setError(stateRes.data?.message || "Failed to load growth state");
        }

        if (histRes.data?.ok) setHistory(histRes.data.history || []);
        if (streakRes.data?.ok) setStreak(streakRes.data.streak || 0);
      } catch (e) {
        setError(e?.response?.data?.message || e.message);
      } finally {
        setBooting(false);
      }
    };

    run();
  }, [userId]);

  const refreshHistoryAndStreak = async () => {
    if (!userId) return;
    try {
      const [histRes, streakRes] = await Promise.all([
        apiClient.get(`/growth/history?userId=${userId}&limit=7`),
        apiClient.get(`/growth/streak?userId=${userId}`),
      ]);

      if (histRes.data?.ok) setHistory(histRes.data.history || []);
      if (streakRes.data?.ok) setStreak(streakRes.data.streak || 0);
    } catch {
      // silent
    }
  };

  // Overall average %
  const total = useMemo(() => {
    const p = state.progress;
    return p.academic + p.industry + p.skills + p.certifications + p.networking;
  }, [state.progress]);



  // Submit daily log
  const submitLog = async () => {
    if (!logText.trim()) return;

    if (!userId) {
      setError("User not authenticated");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const res = await apiClient.post("/growth/evaluate", {
        userId,
        logText: logText.trim(),
      });

      if (res.data?.ok) {
        setState({
          progress: res.data.progress,
          todos: res.data.todos,
          explanation: res.data.explanation,
        });
        setLogText("");
        addToast("[ SUCCESS ] SYSTEM INTEGRITY UPDATED. PROGRESS SYNCED.", "success");

        // ✅ refresh recent activity + streak after update
        await refreshHistoryAndStreak();
      } else {
        setError(res.data?.message || "Failed to update progress");
      }
    } catch (e) {
      setError(e?.response?.data?.message || e.message);
    } finally {
      setLoading(false);
    }
  };

  if (booting) {
    return (
      <div className="bento-grid" style={styles.page}>
        <div style={{ ...styles.headerRow, gridColumn: "1 / -1" }}>
          <div>
            <Skeleton width="340px" height="36px" style={{ marginBottom: 12 }} />
            <Skeleton width="500px" height="18px" />
          </div>
          <Skeleton width="110px" height="42px" borderRadius="14px" />
        </div>
        <BentoCard colSpan={2} style={{ opacity: 0.5 }}>
          <Skeleton width="120px" height="24px" style={{ marginBottom: 24 }} />
          <Skeleton width="260px" height="260px" borderRadius="50%" style={{ margin: "0 auto 30px" }} />
          <Skeleton width="100%" height="46px" style={{ marginBottom: 10 }} />
          <Skeleton width="100%" height="46px" style={{ marginBottom: 10 }} />
          <Skeleton width="100%" height="46px" style={{ marginBottom: 10 }} />
        </BentoCard>
        <BentoCard colSpan={2} style={{ opacity: 0.5 }}>
          <Skeleton width="160px" height="24px" style={{ marginBottom: 16 }} />
          <Skeleton width="100%" height="150px" style={{ marginBottom: 30 }} />
          <Skeleton width="220px" height="24px" style={{ marginBottom: 16 }} />
          <Skeleton width="100%" height="40px" style={{ marginBottom: 8 }} />
          <Skeleton width="90%" height="40px" style={{ marginBottom: 8 }} />
          <Skeleton width="95%" height="40px" style={{ marginBottom: 8 }} />
        </BentoCard>
      </div>
    );
  }

  return (
    <div className="bento-grid" style={styles.page}>
      <div style={{ ...styles.headerRow, gridColumn: "1 / -1" }}>
        <div>
          <h1 style={styles.h1}>Career Growth Tracker</h1>
          <p style={styles.subtitle}>
            Log what you did — the AI updates your progress and tasks.
          </p>
        </div>

        <div style={styles.headerActions}>
          {/* ✅ NEW: streak pill */}
          <span style={styles.streakPill}>
            🔥 Streak: {streak} day{streak === 1 ? "" : "s"}
          </span>

          <button style={styles.btnGhost} onClick={() => navigate("/dashboard")}>
            ← Dashboard
          </button>
          <button
            style={styles.btnDanger}
            onClick={() => {
              localStorage.removeItem("user");
              navigate("/login");
            }}
          >
            Logout
          </button>
        </div>
      </div>

      {!!error && <div style={{ ...styles.errorBox, gridColumn: "1 / -1" }}>{error}</div>}

      {/* LEFT: PROGRESS */}
      <BentoCard colSpan={2} style={{ justifyContent: "flex-start", gap: "20px" }}>
        <h2 style={styles.h2}>Progress</h2>

        <div style={styles.hudContainer}>
          <div style={styles.radarWrapper}>
            <svg width="300" height="300" viewBox="0 0 300 300" style={styles.radarSvg}>
              <defs>
                <filter id="radar-glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="4" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              
              {/* Telemetry background crosshairs */}
              <line x1="150" y1="10" x2="150" y2="290" stroke="rgba(255, 255, 255, 0.05)" strokeWidth="1" strokeDasharray="3 5" />
              <line x1="10" y1="150" x2="290" y2="150" stroke="rgba(255, 255, 255, 0.05)" strokeWidth="1" strokeDasharray="3 5" />
              
              {/* Concentric Progress Tracks (Background & Active Rings) */}
              
              {/* Track 5: Networking (Pink) - Radius 130 */}
              <circle cx="150" cy="150" r="130" fill="none" stroke="rgba(236, 72, 153, 0.06)" strokeWidth="6" />
              <circle 
                cx="150" 
                cy="150" 
                r="130" 
                fill="none" 
                stroke="rgba(236, 72, 153, 0.9)" 
                strokeWidth="6" 
                strokeLinecap="round"
                strokeDasharray="816" 
                strokeDashoffset={816 - (816 * (state.progress.networking || 0)) / 100} 
                filter="url(#radar-glow)"
                style={{ transition: "stroke-dashoffset 1s ease-in-out", transform: "rotate(-90deg)", transformOrigin: "150px 150px" }} 
              />
              
              {/* Track 4: Certifications (Orange) - Radius 108 */}
              <circle cx="150" cy="150" r="108" fill="none" stroke="rgba(245, 158, 11, 0.06)" strokeWidth="6" />
              <circle 
                cx="150" 
                cy="150" 
                r="108" 
                fill="none" 
                stroke="rgba(245, 158, 11, 0.9)" 
                strokeWidth="6" 
                strokeLinecap="round"
                strokeDasharray="678" 
                strokeDashoffset={678 - (678 * (state.progress.certifications || 0)) / 100} 
                filter="url(#radar-glow)"
                style={{ transition: "stroke-dashoffset 1s ease-in-out", transform: "rotate(-90deg)", transformOrigin: "150px 150px" }} 
              />
              
              {/* Track 3: Skills (Green) - Radius 86 */}
              <circle cx="150" cy="150" r="86" fill="none" stroke="rgba(34, 197, 94, 0.06)" strokeWidth="6" />
              <circle 
                cx="150" 
                cy="150" 
                r="86" 
                fill="none" 
                stroke="rgba(34, 197, 94, 0.9)" 
                strokeWidth="6" 
                strokeLinecap="round"
                strokeDasharray="540" 
                strokeDashoffset={540 - (540 * (state.progress.skills || 0)) / 100} 
                filter="url(#radar-glow)"
                style={{ transition: "stroke-dashoffset 1s ease-in-out", transform: "rotate(-90deg)", transformOrigin: "150px 150px" }} 
              />
              
              {/* Track 2: Industry (Blue) - Radius 64 */}
              <circle cx="150" cy="150" r="64" fill="none" stroke="rgba(56, 189, 248, 0.06)" strokeWidth="6" />
              <circle 
                cx="150" 
                cy="150" 
                r="64" 
                fill="none" 
                stroke="rgba(56, 189, 248, 0.9)" 
                strokeWidth="6" 
                strokeLinecap="round"
                strokeDasharray="402" 
                strokeDashoffset={402 - (402 * (state.progress.industry || 0)) / 100} 
                filter="url(#radar-glow)"
                style={{ transition: "stroke-dashoffset 1s ease-in-out", transform: "rotate(-90deg)", transformOrigin: "150px 150px" }} 
              />
              
              {/* Track 1: Academic (Violet) - Radius 42 */}
              <circle cx="150" cy="150" r="42" fill="none" stroke="rgba(139, 92, 246, 0.06)" strokeWidth="6" />
              <circle 
                cx="150" 
                cy="150" 
                r="42" 
                fill="none" 
                stroke="rgba(139, 92, 246, 0.9)" 
                strokeWidth="6" 
                strokeLinecap="round"
                strokeDasharray="264" 
                strokeDashoffset={264 - (264 * (state.progress.academic || 0)) / 100} 
                filter="url(#radar-glow)"
                style={{ transition: "stroke-dashoffset 1s ease-in-out", transform: "rotate(-90deg)", transformOrigin: "150px 150px" }} 
              />
              
              {/* Inner Sweep Sonar Line */}
              <line 
                x1="150" 
                y1="150" 
                x2="150" 
                y2="20" 
                stroke="rgba(0, 243, 255, 0.15)" 
                strokeWidth="1.5" 
                style={{ transformOrigin: "150px 150px", animation: "radar-sweep 6s linear infinite" }} 
              />
            </svg>
            
            <div style={styles.radarInfo}>
              <span style={styles.radarLabel}>OVERALL</span>
              <span style={styles.radarVal}>{Math.round(total / 5)}%</span>
              <span style={styles.radarStatus}>ACTIVE</span>
            </div>
          </div>

          <div style={styles.terminalTrackers}>
            {Object.entries(state.progress).map(([k, v]) => {
              const litSegments = Math.round(v / 10);
              const colors = {
                academic: "rgba(139, 92, 246, 1)",
                industry: "rgba(56, 189, 248, 1)",
                skills: "rgba(34, 197, 94, 1)",
                certifications: "rgba(245, 158, 11, 1)",
                networking: "rgba(236, 72, 153, 1)"
              };
              const color = colors[k] || "var(--accent)";
              return (
                <div key={k} style={styles.trackerRow}>
                  <div style={styles.trackerHeader}>
                    <span style={{ ...styles.trackerName, display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ display: "inline-block", width: "8px", height: "8px", borderRadius: "50%", backgroundColor: color, boxShadow: `0 0 6px ${color}` }} />
                      {`> SYS.${k.toUpperCase()}`}
                    </span>
                    <span style={{ ...styles.trackerPct, color }}>{v}%</span>
                  </div>
                  <div style={styles.ledBar}>
                    {Array.from({ length: 10 }).map((_, idx) => {
                      const isLit = idx < litSegments;
                      return (
                        <div 
                          key={idx} 
                          style={{
                            ...styles.ledSegment,
                            backgroundColor: isLit ? color : "rgba(255,255,255,0.05)",
                            boxShadow: isLit ? `0 0 8px ${color}` : "none",
                            animation: isLit ? "led-charge 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94) both" : "none",
                            animationDelay: isLit ? `${idx * 0.04}s` : "0s"
                          }} 
                        />
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div style={styles.divider} />

        <h2 style={styles.h2}>AI Insight</h2>
        <p style={styles.p}>
          {state.explanation || "Add a log to get AI insights."}
        </p>
      </BentoCard>

      {/* RIGHT: LOG + TODOS + TIMELINE */}
      <BentoCard colSpan={2}>
        <h2 style={styles.h2}>Today’s Log</h2>

        <textarea
          value={logText}
          onChange={(e) => setLogText(e.target.value)}
          placeholder='Example: "Completed a food safety course and updated my CV."'
          style={styles.textarea}
          rows={5}
        />

        <div style={styles.row}>
          <button
            style={styles.btnPrimary}
            onClick={submitLog}
            disabled={loading || !logText.trim()}
          >
            {loading ? "Evaluating…" : "Update Progress"}
          </button>
        </div>

        <div style={styles.divider} />

        <h2 style={styles.h2}>AI To-Do List</h2>
        <ul style={styles.todoList}>
          {state.todos.map((t, i) => (
            <li key={i} style={styles.todoItem}>
              {t}
            </li>
          ))}
          {state.todos.length === 0 && (
            <li style={styles.todoEmpty}>
              No tasks yet — add a log to generate tasks.
            </li>
          )}
        </ul>

        <div style={styles.divider} />
        <h2 style={styles.h2}>Recent Activity</h2>

        <div style={{ position: "relative", ...styles.historyWrap, paddingLeft: 10 }}>
          {/* Central glowing vertical timeline stem */}
          <div style={{ position: "absolute", left: -4, top: 20, bottom: 20, width: 2, background: "rgba(103, 232, 249, 0.15)", boxShadow: "0 0 10px rgba(103, 232, 249, 0.1)" }} />

          {history.length === 0 && (
            <div style={{ ...styles.todoEmpty, marginLeft: 14 }}>
              No history yet — your logs will appear here.
            </div>
          )}

          {history.map((h, idx) => {
            const hp = h?.progress || {};
            const avg =
              ((hp.academic || 0) +
                (hp.industry || 0) +
                (hp.skills || 0) +
                (hp.certifications || 0) +
                (hp.networking || 0)) /
              5;

            return (
              <div key={idx} style={{ position: "relative", ...styles.historyCard, marginLeft: 20, transition: "transform 200ms ease" }} className="button-hover">
                {/* Glowing Tree Node */}
                <div style={{
                  position: "absolute", left: "-31px", top: "18px", width: "12px", height: "12px",
                  borderRadius: "50%", background: "var(--accent)",
                  boxShadow: "0 0 12px var(--accent), 0 0 24px var(--accent)",
                  zIndex: 2, border: "2px solid var(--surface-alt)"
                }} />
                <div style={styles.historyTop}>
                  <span style={styles.historyDate}>
                    {formatDateTime(h.createdAt)}
                  </span>
                  <span style={{ ...styles.historyAvg, color: "var(--accent)" }}>
                    Avg: {Math.round(avg)}%
                  </span>
                </div>
                <div style={styles.historyText}>{h.logText}</div>
              </div>
            );
          })}
        </div>
      </BentoCard>
    </div>
  );
}

/* ===================== STYLES ===================== */

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

  headerActions: {
    display: "flex",
    gap: 10,
    alignItems: "center",
    flexWrap: "wrap",
  },

  h1: {
    margin: 0,
    color: theme.colors.textPrimary,
    fontSize: 28,
    fontWeight: 800,
  },

  subtitle: {
    marginTop: 6,
    color: theme.colors.textSecondary,
  },

  streakPill: {
    padding: "8px 12px",
    background: "rgba(245, 158, 11, 0.14)",
    borderRadius: "999px",
    border: "1px solid rgba(245, 158, 11, 0.35)",
    color: "#fde68a",
    fontSize: "12px",
    fontWeight: 800,
  },



  h2: {
    margin: "0 0 10px 0",
    color: theme.colors.textPrimary,
    fontSize: 18,
    fontWeight: 800,
  },

  p: {
    margin: 0,
    color: theme.colors.textSecondary,
    lineHeight: 1.6,
  },

  textarea: {
    width: "100%",
    padding: 14,
    borderRadius: theme.radii.md,
    border: `1px solid ${theme.colors.border}`,
    background: "rgba(255,255,255,0.03)",
    color: theme.colors.textPrimary,
    outline: "none",
    resize: "vertical",
  },

  row: {
    display: "flex",
    justifyContent: "flex-end",
    marginTop: 10,
  },

  btnPrimary: {
    ...theme.button("primary"),
    width: "fit-content",
  },

  btnGhost: {
    ...theme.button("ghost"),
    width: "fit-content",
  },

  btnDanger: {
    ...theme.button("danger"),
    color: "#0b1224",
    width: "fit-content",
  },

  divider: {
    height: 1,
    background: "rgba(255,255,255,0.08)",
    margin: "14px 0",
  },

  hudContainer: {
    display: "flex",
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-around",
    alignItems: "center",
    gap: "32px",
    marginTop: "16px",
    width: "100%",
  },
  radarWrapper: {
    position: "relative",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "320px",
    height: "320px",
    borderRadius: "50%",
    background: "rgba(0, 243, 255, 0.02)",
    border: "2px solid var(--border)",
    boxShadow: "inset 0 0 35px rgba(0, 243, 255, 0.08)",
  },
  radarSvg: {
    position: "absolute",
    inset: 0,
    pointerEvents: "none",
  },
  radarInfo: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
    fontFamily: "'Share Tech Mono', monospace",
  },
  radarLabel: {
    fontSize: "9px",
    letterSpacing: "0.5px",
    color: "var(--text-secondary)",
  },
  radarVal: {
    fontSize: "24px",
    fontWeight: "900",
    color: "var(--accent)",
    textShadow: "0 0 10px rgba(0, 243, 255, 0.7)",
    margin: "2px 0",
  },
  radarStatus: {
    fontSize: "9px",
    color: "var(--success)",
    textShadow: "0 0 4px var(--success)",
  },
  terminalTrackers: {
    flex: 1,
    minWidth: "260px",
    display: "grid",
    gap: "14px",
  },
  trackerRow: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    padding: "10px 12px",
    borderRadius: "10px",
    border: "1px solid rgba(255, 255, 255, 0.06)",
    background: "rgba(0,0,0,0.25)",
  },
  trackerHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontFamily: "'Share Tech Mono', monospace",
  },
  trackerName: {
    fontSize: "13px",
    color: "var(--text-primary)",
  },
  trackerPct: {
    fontSize: "14px",
    fontWeight: "700",
    color: "var(--accent)",
  },
  ledBar: {
    display: "flex",
    gap: "4px",
    width: "100%",
  },
  ledSegment: {
    flex: 1,
    height: "10px",
    borderRadius: "2px",
    transition: "background-color 0.3s ease, box-shadow 0.3s ease",
  },

  todoList: {
    margin: 0,
    paddingLeft: 18,
    color: theme.colors.textSecondary,
    display: "grid",
    gap: 8,
  },

  todoItem: {
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.08)",
    padding: "10px 12px",
    borderRadius: theme.radii.md,
    listStylePosition: "inside",
  },

  todoEmpty: {
    opacity: 0.8,
  },

  historyWrap: {
    display: "grid",
    gap: 10,
    marginTop: 8,
  },

  historyCard: {
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.08)",
    padding: "12px",
    borderRadius: theme.radii.md,
  },

  historyTop: {
    display: "flex",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 6,
  },

  historyDate: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },

  historyAvg: {
    fontSize: 12,
    fontWeight: 900,
    color: theme.colors.textPrimary,
  },

  historyText: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    lineHeight: 1.5,
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
