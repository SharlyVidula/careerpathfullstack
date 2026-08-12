import React, { useState, useEffect } from "react";
import theme from "../theme";
import { useToast } from "./ToastContext";

const GRADE_POINTS = {
  "A+": 4.0,
  "A":  4.0,
  "A-": 3.7,
  "B+": 3.3,
  "B":  3.0,
  "B-": 2.7,
  "C+": 2.3,
  "C":  2.0,
  "C-": 1.7,
  "D+": 1.3,
  "D":  1.0,
  "F":  0.0
};

const SAMPLE_PRESETS = [
  { courseCode: "SE1010", courseName: "Programming Fundamentals", credits: 4, grade: "A" },
  { courseCode: "SE1020", courseName: "Database Systems & Design", credits: 3, grade: "B+" },
  { courseCode: "SE2010", courseName: "Data Structures & Algorithms", credits: 4, grade: "B" },
  { courseCode: "SE2020", courseName: "Software Architecture", credits: 3, grade: "A-" },
  { courseCode: "JPN101", courseName: "Japanese Language Skills I", credits: 3, grade: "A" },
];

function GpaCalculator({ initialGpa = 0, initialCourses = [], onSaveGpa, showSaveButton = true }) {
  const { addToast } = useToast();
  const [courses, setCourses] = useState(() => {
    if (initialCourses && initialCourses.length > 0) return initialCourses;
    return SAMPLE_PRESETS;
  });
  const [calculatedGpa, setCalculatedGpa] = useState(0);
  const [totalCredits, setTotalCredits] = useState(0);
  const [saving, setSaving] = useState(false);

  // Recalculate GPA whenever courses change
  useEffect(() => {
    let totCredits = 0;
    let totPoints = 0;

    courses.forEach(c => {
      const cr = Number(c.credits) || 0;
      const gp = GRADE_POINTS[c.grade] !== undefined ? GRADE_POINTS[c.grade] : 0;
      totCredits += cr;
      totPoints += cr * gp;
    });

    const gpaVal = totCredits > 0 ? parseFloat((totPoints / totCredits).toFixed(2)) : 0;
    setCalculatedGpa(gpaVal);
    setTotalCredits(totCredits);

    // Auto sync calculated GPA with parent component
    if (onSaveGpa) {
      onSaveGpa(gpaVal, courses);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courses]);

  const handleAddCourse = () => {
    setCourses([
      ...courses,
      { courseCode: `SE${1000 + courses.length * 10}`, courseName: `New Course ${courses.length + 1}`, credits: 3, grade: "B" }
    ]);
  };

  const handleRemoveCourse = (index) => {
    if (courses.length <= 1) {
      addToast("At least one course is required.", "warning");
      return;
    }
    const updated = courses.filter((_, i) => i !== index);
    setCourses(updated);
  };

  const handleCourseChange = (index, field, value) => {
    const updated = [...courses];
    updated[index] = { ...updated[index], [field]: value };
    setCourses(updated);
  };

  const handleLoadPresets = () => {
    setCourses(SAMPLE_PRESETS);
    addToast("Sample Software Engineering curriculum loaded!", "info");
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (onSaveGpa) {
        await onSaveGpa(calculatedGpa, courses);
      }
    } finally {
      setSaving(false);
    }
  };

  const isEligible = calculatedGpa >= 2.0;

  return (
    <div style={{
      background: "var(--glass-bg-alt, rgba(15, 23, 42, 0.6))",
      borderRadius: theme.radii.xl,
      padding: "20px",
      border: "1px solid var(--glass-border, rgba(255,255,255,0.1))",
      backdropFilter: "blur(12px)",
      color: "var(--text-primary)"
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
        <div>
          <h3 style={{ margin: 0, fontSize: "18px", color: "var(--accent, #6366f1)", display: "flex", alignItems: "center", gap: "8px" }}>
            🧮 LNBTI Academic GPA Calculator
          </h3>
          <p style={{ margin: "4px 0 0 0", fontSize: "12px", color: "var(--text-secondary)" }}>
            Minimum requirement for Internship Eligibility: <strong>GPA 2.0 / 4.0</strong>
          </p>
        </div>
        
        <button
          onClick={handleLoadPresets}
          style={{
            ...theme.button("secondary"),
            fontSize: "12px",
            padding: "6px 12px"
          }}
        >
          🔄 Load Sample SE Courses
        </button>
      </div>

      {/* GPA Summary Card */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
        gap: "12px",
        marginBottom: "20px"
      }}>
        <div style={{
          background: "var(--glass-bg, rgba(255,255,255,0.04))",
          padding: "14px",
          borderRadius: theme.radii.md,
          border: `1px solid ${isEligible ? "rgba(34, 197, 94, 0.4)" : "rgba(239, 68, 68, 0.4)"}`,
          textAlign: "center"
        }}>
          <span style={{ fontSize: "11px", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Cumulative GPA</span>
          <div style={{ fontSize: "28px", fontWeight: "bold", color: isEligible ? "#22c55e" : "#ef4444", marginTop: "2px" }}>
            {calculatedGpa.toFixed(2)} <span style={{ fontSize: "14px", color: "var(--text-secondary)" }}>/ 4.0</span>
          </div>
        </div>

        <div style={{
          background: "var(--glass-bg, rgba(255,255,255,0.04))",
          padding: "14px",
          borderRadius: theme.radii.md,
          border: "1px solid var(--glass-border)",
          textAlign: "center"
        }}>
          <span style={{ fontSize: "11px", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Total Credits</span>
          <div style={{ fontSize: "28px", fontWeight: "bold", color: "#6366f1", marginTop: "2px" }}>
            {totalCredits} <span style={{ fontSize: "14px", color: "var(--text-secondary)" }}>Hrs</span>
          </div>
        </div>

        <div style={{
          background: "var(--glass-bg, rgba(255,255,255,0.04))",
          padding: "14px",
          borderRadius: theme.radii.md,
          border: `1px solid ${isEligible ? "rgba(34, 197, 94, 0.4)" : "rgba(239, 68, 68, 0.4)"}`,
          textAlign: "center"
        }}>
          <span style={{ fontSize: "11px", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.5px" }}>GPA Requirement</span>
          <div style={{ fontSize: "14px", fontWeight: "bold", color: isEligible ? "#22c55e" : "#ef4444", marginTop: "8px" }}>
            {isEligible ? "✅ GPA Requirement Met (≥ 2.0)" : "❌ Needs Improvement (< 2.0)"}
          </div>
        </div>
      </div>

      {/* Course List Table */}
      <div style={{ overflowX: "auto", marginBottom: "16px" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--glass-border)", color: "var(--text-secondary)" }}>
              <th style={{ textAlign: "left", padding: "8px" }}>Course Code</th>
              <th style={{ textAlign: "left", padding: "8px" }}>Course Title</th>
              <th style={{ textAlign: "center", padding: "8px" }}>Credits</th>
              <th style={{ textAlign: "center", padding: "8px" }}>Grade</th>
              <th style={{ textAlign: "center", padding: "8px" }}>Points</th>
              <th style={{ textAlign: "center", padding: "8px" }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {courses.map((course, idx) => {
              const gp = GRADE_POINTS[course.grade] || 0;
              return (
                <tr key={idx} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                  <td style={{ padding: "8px" }}>
                    <input
                      type="text"
                      value={course.courseCode}
                      onChange={(e) => handleCourseChange(idx, "courseCode", e.target.value)}
                      style={{
                        ...theme.input(),
                        padding: "6px 10px",
                        fontSize: "12px",
                        width: "90px"
                      }}
                    />
                  </td>
                  <td style={{ padding: "8px" }}>
                    <input
                      type="text"
                      value={course.courseName}
                      onChange={(e) => handleCourseChange(idx, "courseName", e.target.value)}
                      style={{
                        ...theme.input(),
                        padding: "6px 10px",
                        fontSize: "12px"
                      }}
                    />
                  </td>
                  <td style={{ padding: "8px", textAlign: "center" }}>
                    <select
                      value={course.credits}
                      onChange={(e) => handleCourseChange(idx, "credits", Number(e.target.value))}
                      style={{
                        ...theme.input(),
                        padding: "6px 8px",
                        fontSize: "12px",
                        width: "60px",
                        textAlign: "center"
                      }}
                    >
                      {[1, 2, 3, 4, 5, 6].map(cr => (
                        <option key={cr} value={cr} style={{ background: "#1e293b", color: "#fff" }}>{cr}</option>
                      ))}
                    </select>
                  </td>
                  <td style={{ padding: "8px", textAlign: "center" }}>
                    <select
                      value={course.grade}
                      onChange={(e) => handleCourseChange(idx, "grade", e.target.value)}
                      style={{
                        ...theme.input(),
                        padding: "6px 8px",
                        fontSize: "12px",
                        width: "70px",
                        fontWeight: "bold",
                        color: gp >= 3.0 ? "#22c55e" : gp >= 2.0 ? "#eab308" : "#ef4444"
                      }}
                    >
                      {Object.keys(GRADE_POINTS).map(gr => (
                        <option key={gr} value={gr} style={{ background: "#1e293b", color: "#fff" }}>{gr} ({GRADE_POINTS[gr]})</option>
                      ))}
                    </select>
                  </td>
                  <td style={{ padding: "8px", textAlign: "center", fontWeight: "bold" }}>
                    {(course.credits * gp).toFixed(1)}
                  </td>
                  <td style={{ padding: "8px", textAlign: "center" }}>
                    <button
                      onClick={() => handleRemoveCourse(idx)}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#ef4444",
                        cursor: "pointer",
                        fontSize: "14px"
                      }}
                      title="Remove Course"
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
        <button
          onClick={handleAddCourse}
          style={{
            ...theme.button("ghost"),
            fontSize: "12px",
            padding: "8px 14px",
            display: "flex",
            alignItems: "center",
            gap: "6px"
          }}
        >
          ➕ Add Course
        </button>

        {showSaveButton && (
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              ...theme.button("primary"),
              fontSize: "13px",
              padding: "8px 20px",
              opacity: saving ? 0.7 : 1
            }}
          >
            {saving ? "Saving..." : "💾 Save GPA & Update Eligibility"}
          </button>
        )}
      </div>
    </div>
  );
}

export default GpaCalculator;
