import React, { useState, useEffect } from "react";
import axios from "axios";

// ✅ Safe wrapper to avoid ESLint warnings (must be AFTER imports!)
const safeConfirm = (message) => window.confirm(message);

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
    const r = await axios.get("/api/admin/careers");
    setList(r.data.careers || []);
  }

  async function save() {
    const payload = { ...form };

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
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>Admin Careers</h2>

      <div style={{ display: "flex", gap: 20 }}>
        {/* LEFT COLUMN — CAREER LIST */}
        <div style={{ flex: 1 }}>
          {list.map((c) => (
            <div
              key={c._id}
              style={{
                padding: 10,
                border: "1px solid #eee",
                marginBottom: 8,
                background: "#111",
                color: "#fff",
                borderRadius: "8px",
              }}
            >
              <strong>{c.title}</strong>
              <div style={{ fontSize: 13, opacity: 0.8 }}>{c.description}</div>

              <div style={{ marginTop: 6 }}>
                {/* EDIT BUTTON */}
                <button
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

                {/* DELETE BUTTON — 100% FIXED ✔ */}
                <button
                  onClick={async () => {
                    if (!safeConfirm("Are you sure you want to delete this career?")) return;
                    await axios.delete("/api/admin/careers/" + c._id);
                    load();
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* RIGHT COLUMN — FORM */}
        <div style={{ width: 420 }}>
          <h3>{editing ? "Edit Career" : "Add Career"}</h3>

          <input
            placeholder="Title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            style={{ width: "100%", marginBottom: 8 }}
          />

          <textarea
            placeholder="Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            style={{ width: "100%", marginBottom: 8 }}
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
            style={{ width: "100%", marginBottom: 8 }}
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
            style={{ width: "100%", marginBottom: 8 }}
          />

          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={save}>{editing ? "Save" : "Create"}</button>
            <button
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
      </div>
    </div>
  );
}
