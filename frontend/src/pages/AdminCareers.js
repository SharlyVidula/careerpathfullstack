import React, { useState, useEffect } from "react";
import axios from "axios";
import theme from "../theme";
import BentoCard from "../components/BentoCard";

// SAFE confirm wrapper (fixes ESLint error)
const safeConfirm = (msg) => window.confirm(msg);

export default function AdminCareers() {
  const [list, setList] = useState([]);
  const [form, setForm] = useState({
    title: "",
    description: "",
    requiredSkills: [],
    relatedInterests: [],
  });
  const [editing, setEditing] = useState(null);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    try {
      const r = await axios.get("/api/admin/careers");
      setList(r.data.careers || []);
    } catch (e) {
      console.error(e);
    }
  }

  async function save() {
    const payload = { ...form };

    try {
      if (editing) {
        await axios.put("/api/admin/careers/" + editing._id, payload);
        setEditing(null);
      } else {
        await axios.post("/api/admin/careers", payload);
      }

      setForm({
        title: "",
        description: "",
        requiredSkills: [],
        relatedInterests: [],
      });

      load();
    } catch (e) {
      console.error(e);
    }
  }

  return (
    <div className="bento-grid" style={styles.page}>
      <BentoCard colSpan={4} padding="32px">
        <h2 style={styles.title}>Admin Careers Management</h2>
        <p style={styles.subText}>Manage the predefined careers, skills, and interests in the system.</p>
      </BentoCard>

      <BentoCard colSpan={2}>
        <h3 style={{ ...styles.title, marginBottom: 20 }}>Career Database</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
          {list.length === 0 ? (
             <p style={{ color: theme.colors.textSecondary }}>No careers found.</p>
          ) : list.map((c) => (
            <div key={c._id} style={styles.cardItem}>
              <strong style={{ color: "white", fontSize: "16px" }}>{c.title}</strong>
              <div style={{ fontSize: 13, color: theme.colors.textSecondary, marginTop: "6px" }}>{c.description}</div>

              <div style={{ marginTop: 12, display: "flex", gap: "10px" }}>
                <button
                  style={styles.editBtn}
                  className="button-hover"
                  onClick={() => {
                    setEditing(c);
                    setForm({
                      title: c.title,
                      description: c.description,
                      requiredSkills: c.requiredSkills || [],
                      relatedInterests: c.relatedInterests || [],
                    });
                  }}
                >
                  Edit
                </button>

                <button
                  style={styles.deleteBtn}
                  className="button-hover"
                  onClick={async () => {
                    const ok = safeConfirm("Are you sure you want to delete this career?");
                    if (!ok) return;
                    try {
                      await axios.delete("/api/admin/careers/" + c._id);
                      load();
                    } catch (e) { console.error(e); }
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </BentoCard>

      <BentoCard colSpan={2}>
        <h3 style={{ ...styles.title, marginBottom: 20, color: "#34d399" }}>
          {editing ? "Edit Career" : "Add New Career"}
        </h3>

        <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
          <input
            placeholder="Title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            style={styles.input}
          />

          <textarea
            placeholder="Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            style={{ ...styles.input, height: "100px", resize: "none" }}
          />

          <input
            placeholder="Required skills (comma-separated)"
            value={(form.requiredSkills || []).join(", ")}
            onChange={(e) =>
              setForm({
                ...form,
                requiredSkills: e.target.value
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean),
              })
            }
            style={styles.input}
          />

          <input
            placeholder="Related interests (comma-separated)"
            value={(form.relatedInterests || []).join(", ")}
            onChange={(e) =>
              setForm({
                ...form,
                relatedInterests: e.target.value
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean),
              })
            }
            style={styles.input}
          />

          <div style={{ display: "flex", gap: 10, marginTop: "10px" }}>
            <button style={styles.primaryBtn} className="button-hover" onClick={save}>
              {editing ? "Save Changes" : "Create Career"}
            </button>
            <button
              style={styles.ghostBtn}
              className="button-hover"
              onClick={() => {
                setEditing(null);
                setForm({
                  title: "",
                  description: "",
                  requiredSkills: [],
                  relatedInterests: [],
                });
              }}
            >
              Cancel
            </button>
          </div>
        </div>
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
  title: {
    fontSize: "22px",
    margin: 0,
    fontWeight: 700,
    color: theme.colors.textPrimary
  },
  subText: {
    fontSize: "14px",
    color: theme.colors.textSecondary,
    margin: "4px 0 0",
  },
  cardItem: {
    background: "rgba(255,255,255,0.03)",
    border: `1px solid ${theme.colors.border}`,
    borderRadius: theme.radii.md,
    padding: "20px",
    display: "flex",
    flexDirection: "column",
  },
  input: {
    padding: "12px",
    width: "100%",
    borderRadius: "8px",
    border: "1px solid rgba(255,255,255,0.1)",
    background: "rgba(255,255,255,0.05)",
    color: "white",
    outline: "none",
    fontSize: "14px",
    transition: "all 0.2s ease"
  },
  primaryBtn: {
    ...theme.button("primary"),
    flex: 1
  },
  ghostBtn: {
    ...theme.button("ghost"),
    flex: 1,
    background: "rgba(255,255,255,0.1)",
    color: "white"
  },
  editBtn: {
    ...theme.button("ghost"),
    padding: "6px 12px",
    fontSize: "12px",
    background: "rgba(103, 232, 249, 0.1)",
    color: "var(--accent)",
    border: "1px solid var(--accent)",
    flex: 1
  },
  deleteBtn: {
    ...theme.button("danger"),
    padding: "6px 12px",
    fontSize: "12px",
    flex: 1,
    background: "#ef4444",
    color: "white"
  }
};
