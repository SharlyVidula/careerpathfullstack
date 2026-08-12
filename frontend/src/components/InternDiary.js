import React, { useState, useEffect } from "react";
import apiClient from "../apiClient";
import theme from "../theme";
import { useToast } from "./ToastContext";

function InternDiary({ user }) {
  const { addToast } = useToast();
  const [diaryData, setDiaryData] = useState({
    entries: [],
    currentDayNumber: 1,
    missingDays: [],
    totalDays: 180
  });
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState(null);
  
  // Entry Form state
  const [activities, setActivities] = useState("");
  const [learnings, setLearnings] = useState("");
  const [hoursWorked, setHoursWorked] = useState(8);
  const [saving, setSaving] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);

  const userId = user?.id || user?._id;

  const fetchDiary = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const res = await apiClient.get(`/intern/diary/${userId}`);
      if (res.data?.ok) {
        setDiaryData({
          entries: res.data.entries || [],
          currentDayNumber: res.data.currentDayNumber || 1,
          missingDays: res.data.missingDays || [],
          totalDays: res.data.totalDays || 180
        });

        // Set default selected day to today
        const todayStr = new Date().toISOString().split("T")[0];
        const existingToday = (res.data.entries || []).find(e => e.date === todayStr);
        
        setSelectedDay({
          date: todayStr,
          dayNumber: res.data.currentDayNumber || 1,
          entry: existingToday || null
        });

        if (existingToday) {
          setActivities(existingToday.activities || "");
          setLearnings(existingToday.learnings || "");
          setHoursWorked(existingToday.hoursWorked || 8);
        } else {
          setActivities("");
          setLearnings("");
          setHoursWorked(8);
        }
      }
    } catch (err) {
      console.error("Fetch Diary Error:", err);
      addToast("Failed to load internship diary.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDiary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const handleSelectDay = (dayNum, dateStr, existingEntry) => {
    setSelectedDay({
      date: dateStr,
      dayNumber: dayNum,
      entry: existingEntry || null
    });
    if (existingEntry) {
      setActivities(existingEntry.activities || "");
      setLearnings(existingEntry.learnings || "");
      setHoursWorked(existingEntry.hoursWorked || 8);
    } else {
      setActivities("");
      setLearnings("");
      setHoursWorked(8);
    }
  };

  const handleSaveDiaryEntry = async (e) => {
    e.preventDefault();
    if (!activities.trim()) {
      addToast("Please describe the tasks/activities completed today.", "warning");
      return;
    }

    setSaving(true);
    try {
      const res = await apiClient.post("/intern/diary", {
        userId,
        date: selectedDay.date,
        dayNumber: selectedDay.dayNumber,
        title: `Day ${selectedDay.dayNumber} Log`,
        activities,
        learnings,
        hoursWorked
      });

      if (res.data?.ok) {
        addToast(res.data.message || "Daily diary entry saved!", "success");
        fetchDiary();
      }
    } catch (err) {
      console.error("Save Diary Entry Error:", err);
      addToast(err.response?.data?.message || "Failed to save entry.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleSendOutlookTestEmail = async () => {
    setSendingEmail(true);
    try {
      const targetDate = selectedDay?.date || new Date().toISOString().split("T")[0];
      const res = await apiClient.post("/intern/send-missing-email", {
        userId,
        missingDate: targetDate
      });
      if (res.data?.ok) {
        addToast(`📧 Outlook email warning triggered for date ${targetDate}!`, "success");
      }
    } catch (err) {
      addToast("Failed to trigger Outlook email warning.", "error");
    } finally {
      setSendingEmail(false);
    }
  };

  if (loading) {
    return <div style={{ padding: "20px", color: "var(--text-secondary)" }}>Loading 6-Month Daily Internship Diary...</div>;
  }

  const entriesMap = new Map(diaryData.entries.map(e => [e.date, e]));
  const missingCount = diaryData.missingDays.length;

  return (
    <div style={{
      background: "var(--glass-bg-alt, rgba(15, 23, 42, 0.6))",
      borderRadius: theme.radii.xl,
      padding: "20px",
      border: "1px solid var(--glass-border)",
      backdropFilter: "blur(12px)",
      color: "var(--text-primary)"
    }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
        <div>
          <h3 style={{ margin: 0, fontSize: "18px", color: "var(--accent, #6366f1)", display: "flex", alignItems: "center", gap: "8px" }}>
            📖 6-Month Daily Internship Diary Log
          </h3>
          <p style={{ margin: "4px 0 0 0", fontSize: "12px", color: "var(--text-secondary)" }}>
            Mandatory daily log for 6 Months (Day 1 to Day 180). Updates required daily.
          </p>
        </div>

        {missingCount > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{
              background: "rgba(239, 68, 68, 0.15)",
              color: "#ef4444",
              border: "1px solid rgba(239, 68, 68, 0.4)",
              padding: "4px 10px",
              borderRadius: "12px",
              fontSize: "12px",
              fontWeight: "bold"
            }}>
              ⚠️ {missingCount} Missing Log Day(s)
            </span>

            <button
              onClick={handleSendOutlookTestEmail}
              disabled={sendingEmail}
              style={{
                ...theme.button("danger"),
                fontSize: "11px",
                padding: "6px 12px",
                display: "flex",
                alignItems: "center",
                gap: "6px"
              }}
            >
              📧 Send Outlook Email Alert
            </button>
          </div>
        )}
      </div>

      {/* Grid Overview: 180 Days Mini Calendar / Timeline */}
      <div style={{ marginBottom: "20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "var(--text-secondary)", marginBottom: "8px" }}>
          <span>Current Day: <strong>Day {diaryData.currentDayNumber} / 180</strong></span>
          <span>Logged: <strong>{diaryData.entries.length} days</strong></span>
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(36px, 1fr))",
          gap: "6px",
          maxHeight: "150px",
          overflowY: "auto",
          padding: "8px",
          background: "rgba(0,0,0,0.2)",
          borderRadius: theme.radii.md,
          border: "1px solid var(--glass-border)"
        }}>
          {Array.from({ length: Math.min(180, diaryData.currentDayNumber + 5) }).map((_, idx) => {
            const dayNum = idx + 1;
            const d = new Date();
            d.setDate(d.getDate() - (diaryData.currentDayNumber - dayNum));
            const dateStr = d.toISOString().split("T")[0];
            const existing = entriesMap.get(dateStr);

            let bg = "rgba(255,255,255,0.05)";
            let border = "1px solid rgba(255,255,255,0.1)";
            let color = "var(--text-secondary)";

            if (existing) {
              bg = "rgba(34, 197, 94, 0.25)";
              border = "1px solid #22c55e";
              color = "#22c55e";
            } else if (dayNum < diaryData.currentDayNumber) {
              bg = "rgba(239, 68, 68, 0.25)";
              border = "1px solid #ef4444";
              color = "#ef4444";
            } else if (dayNum === diaryData.currentDayNumber) {
              bg = "rgba(99, 102, 241, 0.3)";
              border = "1px solid #6366f1";
              color = "#6366f1";
            }

            const isSelected = selectedDay?.dayNumber === dayNum;

            return (
              <button
                key={dayNum}
                onClick={() => handleSelectDay(dayNum, dateStr, existing)}
                style={{
                  background: isSelected ? "#6366f1" : bg,
                  border,
                  color: isSelected ? "#fff" : color,
                  borderRadius: "6px",
                  padding: "6px 2px",
                  fontSize: "10px",
                  fontWeight: "bold",
                  cursor: "pointer",
                  textAlign: "center",
                  transition: "all 0.15s ease"
                }}
                title={`Day ${dayNum} (${dateStr}) - ${existing ? 'Logged' : dayNum < diaryData.currentDayNumber ? 'Missing' : 'Pending'}`}
              >
                D{dayNum}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Day Log Form */}
      {selectedDay && (
        <form onSubmit={handleSaveDiaryEntry} style={{
          background: "var(--glass-bg, rgba(255,255,255,0.03))",
          padding: "16px",
          borderRadius: theme.radii.lg,
          border: "1px solid var(--glass-border)"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
            <h4 style={{ margin: 0, fontSize: "15px", color: "#6366f1" }}>
              ✍️ Log Entry for Day {selectedDay.dayNumber} ({selectedDay.date})
            </h4>

            {selectedDay.entry ? (
              <span style={{ fontSize: "11px", color: "#22c55e", fontWeight: "bold" }}>✅ Logged on {new Date(selectedDay.entry.submittedAt || Date.now()).toLocaleDateString()}</span>
            ) : (
              <span style={{ fontSize: "11px", color: "#eab308", fontWeight: "bold" }}>⚠️ Unsaved Entry</span>
            )}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
            <div>
              <label style={{ fontSize: "12px", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>
                Hours Worked
              </label>
              <input
                type="number"
                min="1"
                max="16"
                value={hoursWorked}
                onChange={(e) => setHoursWorked(Number(e.target.value))}
                style={{ ...theme.input(), padding: "8px 12px", fontSize: "13px" }}
              />
            </div>

            <div>
              <label style={{ fontSize: "12px", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>
                Log Status
              </label>
              <input
                type="text"
                disabled
                value={selectedDay.entry?.status || "SUBMITTED"}
                style={{ ...theme.input(), padding: "8px 12px", fontSize: "13px", background: "rgba(0,0,0,0.2)" }}
              />
            </div>
          </div>

          <div style={{ marginBottom: "12px" }}>
            <label style={{ fontSize: "12px", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>
              Activities & Tasks Completed *
            </label>
            <textarea
              rows="3"
              required
              placeholder="e.g. Implemented REST API endpoints for user authentication, attended daily agile standup, fixed database indexing bug..."
              value={activities}
              onChange={(e) => setActivities(e.target.value)}
              style={{
                ...theme.input(),
                padding: "10px 12px",
                fontSize: "13px",
                resize: "vertical"
              }}
            />
          </div>

          <div style={{ marginBottom: "16px" }}>
            <label style={{ fontSize: "12px", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>
              Key Learnings & Reflections
            </label>
            <textarea
              rows="2"
              placeholder="e.g. Learned MongoDB indexing strategies, improved Git branching workflow efficiency..."
              value={learnings}
              onChange={(e) => setLearnings(e.target.value)}
              style={{
                ...theme.input(),
                padding: "10px 12px",
                fontSize: "13px",
                resize: "vertical"
              }}
            />
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button
              type="submit"
              disabled={saving}
              style={{
                ...theme.button("primary"),
                padding: "8px 20px",
                fontSize: "13px"
              }}
            >
              {saving ? "Saving Log..." : "💾 Save Daily Log Entry"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

export default InternDiary;
