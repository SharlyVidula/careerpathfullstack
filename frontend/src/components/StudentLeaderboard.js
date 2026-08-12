import React, { useState, useEffect } from "react";
import theme from "../theme";
import apiClient from "../apiClient";

export default function StudentLeaderboard({ user }) {
  const [activeTab, setActiveTab] = useState("university"); // "university" | "batch"
  const [leaderboardData, setLeaderboardData] = useState({
    userBatch: "SE1",
    myUniversityRank: null,
    myBatchRank: null,
    totalStudents: 0,
    universityLeaderboard: [],
    batchLeaderboard: []
  });
  const [loading, setLoading] = useState(true);

  const userId = user?._id || user?.id || user?.userId;

  useEffect(() => {
    if (userId) {
      fetchLeaderboard();
    }
  }, [userId]);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get(`/growth/leaderboard?userId=${userId}`);
      if (res.data?.ok) {
        setLeaderboardData({
          userBatch: res.data.userBatch || "SE1",
          myUniversityRank: res.data.myUniversityRank,
          myBatchRank: res.data.myBatchRank,
          totalStudents: res.data.totalStudents || 0,
          universityLeaderboard: res.data.universityLeaderboard || [],
          batchLeaderboard: res.data.batchLeaderboard || []
        });
      }
    } catch (err) {
      console.error("Error fetching leaderboard", err);
    } finally {
      setLoading(false);
    }
  };

  const currentList = activeTab === "university" ? leaderboardData.universityLeaderboard : leaderboardData.batchLeaderboard;
  const myRank = activeTab === "university" ? leaderboardData.myUniversityRank : leaderboardData.myBatchRank;

  const getRankBadge = (rank) => {
    if (rank === 1) return "🥇 1st Place";
    if (rank === 2) return "🥈 2nd Place";
    if (rank === 3) return "🥉 3rd Place";
    return `#${rank}`;
  };

  return (
    <div>
      {/* Header & Toggle Row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h3 style={{ margin: 0, color: "var(--accent, #6366f1)", fontSize: "18px", display: "flex", alignItems: "center", gap: "8px" }}>
            🏆 LNBTI Student Performance Leaderboard
          </h3>
          <p style={{ color: "var(--text-secondary, #94a3b8)", fontSize: "13px", margin: "4px 0 0" }}>
            Log daily learning, complete AI quizzes, and boost your weekly score to claim the #1 spot!
          </p>
        </div>

        {/* Tab Switcher */}
        <div style={{ display: "flex", background: "rgba(255,255,255,0.06)", padding: "4px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.1)" }}>
          <button
            onClick={() => setActiveTab("university")}
            style={{
              padding: "6px 14px",
              borderRadius: "8px",
              background: activeTab === "university" ? "var(--accent, #6366f1)" : "transparent",
              color: activeTab === "university" ? "#fff" : "var(--text-secondary)",
              border: "none",
              fontSize: "12px",
              fontWeight: "bold",
              cursor: "pointer",
              transition: "all 0.2s"
            }}
          >
            🌍 Whole University
          </button>
          <button
            onClick={() => setActiveTab("batch")}
            style={{
              padding: "6px 14px",
              borderRadius: "8px",
              background: activeTab === "batch" ? "var(--accent, #6366f1)" : "transparent",
              color: activeTab === "batch" ? "#fff" : "var(--text-secondary)",
              border: "none",
              fontSize: "12px",
              fontWeight: "bold",
              cursor: "pointer",
              transition: "all 0.2s"
            }}
          >
            🎓 My Batch ({leaderboardData.userBatch})
          </button>
        </div>
      </div>

      {/* Logged in User Rank Highlight Card */}
      {myRank && (
        <div style={{
          padding: "12px 18px",
          background: "linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(16, 185, 129, 0.15))",
          border: "1px solid rgba(99, 102, 241, 0.4)",
          borderRadius: "12px",
          marginBottom: "16px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "20px" }}>⭐</span>
            <div>
              <span style={{ fontSize: "12px", color: "var(--text-secondary)", display: "block" }}>Your Position ({activeTab === "university" ? "University-Wide" : `Batch ${leaderboardData.userBatch}`})</span>
              <strong style={{ fontSize: "14px", color: "var(--text-primary)" }}>{user?.name}</strong>
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <span style={{ fontSize: "16px", fontWeight: "bold", color: "#34d399" }}>
              {getRankBadge(myRank)}
            </span>
          </div>
        </div>
      )}

      {/* Leaderboard Table */}
      {loading ? (
        <div style={{ padding: "20px", textAlign: "center", color: "var(--text-secondary)" }}>
          ⏳ Loading Rankings...
        </div>
      ) : currentList.length === 0 ? (
        <div style={{ padding: "20px", textAlign: "center", color: "var(--text-secondary)" }}>
          No active student rankings recorded yet. Be the first to log progress!
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {currentList.map((item, idx) => {
            const isMe = item._id.toString() === userId?.toString();
            const rankNum = idx + 1;

            return (
              <div
                key={item._id}
                style={{
                  padding: "10px 16px",
                  borderRadius: "10px",
                  background: isMe ? "rgba(99, 102, 241, 0.2)" : rankNum <= 3 ? "rgba(255, 255, 255, 0.05)" : "var(--card-item-bg, rgba(255,255,255,0.03))",
                  border: isMe ? "1px solid var(--accent)" : rankNum <= 3 ? "1px solid rgba(255,255,255,0.15)" : "1px solid var(--card-item-border, rgba(255,255,255,0.06))",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  transition: "all 0.2s"
                }}
              >
                {/* Left: Rank & Avatar & Name */}
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <span style={{
                    width: "36px",
                    fontWeight: "bold",
                    fontSize: rankNum <= 3 ? "16px" : "13px",
                    color: rankNum === 1 ? "#f59e0b" : rankNum === 2 ? "#94a3b8" : rankNum === 3 ? "#b45309" : "var(--text-secondary)"
                  }}>
                    {rankNum === 1 ? "🥇 1" : rankNum === 2 ? "🥈 2" : rankNum === 3 ? "🥉 3" : `#${rankNum}`}
                  </span>

                  <div style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "50%",
                    background: "var(--accent)",
                    color: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: "bold",
                    fontSize: "13px"
                  }}>
                    {item.name?.[0] || "S"}
                  </div>

                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ fontSize: "14px", fontWeight: isMe ? "bold" : "600", color: isMe ? "var(--accent)" : "var(--text-primary)" }}>
                        {item.name} {isMe && "(You)"}
                      </span>
                      <span style={{ fontSize: "10px", padding: "2px 6px", borderRadius: "4px", background: "rgba(255,255,255,0.08)", color: "var(--text-secondary)" }}>
                        {item.batchNumber}
                      </span>
                    </div>
                    <span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
                      {item.degreeBatch}
                    </span>
                  </div>
                </div>

                {/* Right: Score & Status */}
                <div style={{ textAlign: "right" }}>
                  <span style={{ fontSize: "14px", fontWeight: "bold", color: "#34d399", display: "block" }}>
                    {item.weeklyScore} pts
                  </span>
                  <span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
                    Progress: {item.totalProgress}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
