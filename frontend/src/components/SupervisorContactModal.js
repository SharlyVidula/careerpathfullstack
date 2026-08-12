import React, { useState, useEffect } from "react";
import apiClient from "../apiClient";
import theme from "../theme";
import { useToast } from "./ToastContext";

function SupervisorContactModal({ user, eligibility }) {
  const { addToast } = useToast();
  const [supervisors, setSupervisors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const [deniedMessage, setDeniedMessage] = useState("");
  const [contactingSupervisor, setContactingSupervisor] = useState(null);
  const [messageText, setMessageText] = useState("");
  const [sendingMsg, setSendingMsg] = useState(false);

  const userId = user?.id || user?._id;
  const isEligible = eligibility?.isEligible;
  const userStage = user?.studentStage;

  const fetchSupervisors = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const res = await apiClient.get(`/intern/supervisors?userId=${userId}`);
      if (res.data?.ok) {
        setSupervisors(res.data.supervisors || []);
        setAccessDenied(false);
      }
    } catch (err) {
      if (err.response?.status === 403) {
        setAccessDenied(true);
        setDeniedMessage(err.response?.data?.message || "Supervisor contact details are restricted to eligible Year 3 Intern Students.");
      } else {
        console.error("Fetch Supervisors Error:", err);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSupervisors();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, isEligible]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageText.trim()) return;

    setSendingMsg(true);
    try {
      // Send message API call or toast notification
      addToast(`📩 Message sent to ${contactingSupervisor.name} (${contactingSupervisor.email})!`, "success");
      setContactingSupervisor(null);
      setMessageText("");
    } catch (err) {
      addToast("Failed to send message.", "error");
    } finally {
      setSendingMsg(false);
    }
  };

  if (loading) {
    return <div style={{ padding: "20px", color: "var(--text-secondary)" }}>Loading Supervisor & Recruiter directory...</div>;
  }

  if (!user?.assignedSupervisor) {
    return (
      <div style={{
        background: "rgba(234, 179, 8, 0.08)",
        border: "1px solid rgba(234, 179, 8, 0.3)",
        borderRadius: theme.radii.xl,
        padding: "36px 24px",
        textAlign: "center",
        color: "var(--text-primary)"
      }}>
        <div style={{ fontSize: "44px", marginBottom: "12px" }}>🔒</div>
        <h3 style={{ color: "#eab308", margin: "0 0 8px 0", fontSize: "18px" }}>
          Available Only After Internship Placement
        </h3>
        <p style={{ margin: "0 auto", maxWidth: "540px", fontSize: "14px", color: "var(--text-secondary)", lineHeight: "1.6" }}>
          Industry Supervisor contact information will be available <strong>only after</strong> your LNBTI Academic Coordinator matches and assigns your official internship placement.
        </p>
        <div style={{ marginTop: "14px", fontSize: "12px", color: "var(--accent)", fontWeight: "600" }}>
          ⏳ Status: Internship Allocation Managed by Academic Coordinator
        </div>
      </div>
    );
  }

  if (accessDenied || userStage !== "YEAR_3_INTERN" || !isEligible) {
    return (
      <div style={{
        background: "rgba(239, 68, 68, 0.08)",
        border: "1px solid rgba(239, 68, 68, 0.3)",
        borderRadius: theme.radii.xl,
        padding: "28px",
        textAlign: "center",
        color: "var(--text-primary)"
      }}>
        <div style={{ fontSize: "42px", marginBottom: "12px" }}>🔒</div>
        <h3 style={{ color: "#ef4444", margin: "0 0 8px 0" }}>Supervisor Contact Access Locked</h3>
        <p style={{ maxWidth: "520px", margin: "0 auto 16px auto", fontSize: "14px", color: "var(--text-secondary)", lineHeight: "1.5" }}>
          {deniedMessage || "Supervisors and recruiters can only be contacted by Year 3 Intern Students who have completed all internship eligibility parameters."}
        </p>

        <div style={{
          display: "inline-block",
          background: "rgba(0,0,0,0.3)",
          padding: "12px 20px",
          borderRadius: theme.radii.md,
          textAlign: "left",
          fontSize: "13px"
        }}>
          <div style={{ fontWeight: "bold", marginBottom: "6px", color: "#eab308" }}>Requirements Remaining:</div>
          <div style={{ color: eligibility?.isJlptEligible ? "#22c55e" : "#ef4444" }}>
            {eligibility?.isJlptEligible ? "✅ Japanese JLPT/NAT N4 or higher" : "❌ Japanese JLPT/NAT level N4 or higher required"}
          </div>
          <div style={{ color: eligibility?.isGpaEligible ? "#22c55e" : "#ef4444" }}>
            {eligibility?.isGpaEligible ? "✅ Academic GPA 2.0 or higher" : "❌ Academic GPA minimum 2.0 required"}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      background: "var(--glass-bg-alt, rgba(15, 23, 42, 0.6))",
      borderRadius: theme.radii.xl,
      padding: "20px",
      border: "1px solid var(--glass-border)",
      backdropFilter: "blur(12px)",
      color: "var(--text-primary)"
    }}>
      <div style={{ marginBottom: "16px" }}>
        <h3 style={{ margin: 0, fontSize: "18px", color: "var(--accent, #6366f1)", display: "flex", alignItems: "center", gap: "8px" }}>
          👔 My Assigned Internship Supervisor
        </h3>
        <p style={{ margin: "4px 0 0 0", fontSize: "12px", color: "var(--text-secondary)" }}>
          Direct contact information for your official assigned industry supervisor. Supervisor allocation is managed by your Academic Coordinator.
        </p>
      </div>

      {/* When no supervisor is assigned yet */}
      {supervisors.length === 0 ? (
        <div style={{
          background: "rgba(234, 179, 8, 0.08)",
          border: "1px solid rgba(234, 179, 8, 0.3)",
          borderRadius: theme.radii.lg,
          padding: "24px",
          textAlign: "center"
        }}>
          <div style={{ fontSize: "36px", marginBottom: "10px" }}>⏳</div>
          <h4 style={{ color: "#eab308", margin: "0 0 6px 0", fontSize: "16px" }}>
            Supervisor Assignment Pending
          </h4>
          <p style={{ margin: "0 auto", maxWidth: "560px", fontSize: "13px", color: "var(--text-secondary)", lineHeight: "1.5" }}>
            Your Academic Coordinator (Senior Lecturer) has not assigned an Industry Supervisor to your internship profile yet.
            Assigning students to supervisors is managed exclusively by Academic Coordinators.
            Please check back later or contact your Academic Coordinator for supervisor allocation.
          </p>
        </div>
      ) : (
        /* Render ONLY the Assigned Supervisor Card */
        <div style={{ maxWidth: "480px", margin: "0 auto" }}>
          {supervisors.map((sup) => (
            <div key={sup._id} style={{
              background: "rgba(99, 102, 241, 0.08)",
              border: "1px solid rgba(99, 102, 241, 0.3)",
              borderRadius: theme.radii.lg,
              padding: "20px",
              display: "flex",
              flexDirection: "column",
              gap: "14px"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                <div style={{
                  width: "52px",
                  height: "52px",
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #6366f1, #3b82f6)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                  fontWeight: "bold",
                  fontSize: "20px"
                }}>
                  {sup.name ? sup.name.charAt(0) : "S"}
                </div>

                <div>
                  <h4 style={{ margin: 0, fontSize: "17px", fontWeight: "bold" }}>{sup.name}</h4>
                  <div style={{ fontSize: "13px", color: "#818cf8", fontWeight: "600" }}>{sup.designation || "Industry Supervisor"}</div>
                  <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>🏢 {sup.companyName || "LNBTI Partner Company"}</div>
                </div>
              </div>

              <div style={{ background: "rgba(0,0,0,0.2)", padding: "10px 14px", borderRadius: theme.radii.md, fontSize: "13px" }}>
                📧 <strong>Official Email:</strong> {sup.email}
              </div>

              {sup.skills && sup.skills.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                  {sup.skills.map((s, i) => (
                    <span key={i} style={{
                      background: "rgba(99, 102, 241, 0.15)",
                      color: "#818cf8",
                      padding: "4px 10px",
                      borderRadius: "12px",
                      fontSize: "11px",
                      fontWeight: "500"
                    }}>
                      {s}
                    </span>
                  ))}
                </div>
              )}

              <button
                onClick={() => setContactingSupervisor(sup)}
                style={{
                  ...theme.button("primary"),
                  width: "100%",
                  fontSize: "13px",
                  padding: "10px 0",
                  textAlign: "center",
                  marginTop: "6px"
                }}
              >
                💬 Contact Assigned Supervisor
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Message Modal Overlay */}
      {contactingSupervisor && (
        <div style={{
          position: "fixed",
          top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(0, 0, 0, 0.7)",
          backdropFilter: "blur(6px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 9999,
          padding: "16px"
        }}>
          <div style={{
            background: "#0f172a",
            border: "1px solid var(--glass-border)",
            borderRadius: theme.radii.xl,
            width: "100%",
            maxWidth: "480px",
            padding: "24px",
            color: "#fff"
          }}>
            <h3 style={{ margin: "0 0 6px 0", fontSize: "16px", color: "#6366f1" }}>
              Message {contactingSupervisor.name}
            </h3>
            <p style={{ margin: "0 0 14px 0", fontSize: "12px", color: "var(--text-secondary)" }}>
              Recruiter at {contactingSupervisor.companyName} ({contactingSupervisor.email})
            </p>

            <form onSubmit={handleSendMessage}>
              <textarea
                rows="4"
                required
                placeholder="Write your message or inquiry regarding internship opportunities..."
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                style={{
                  ...theme.input(),
                  marginBottom: "16px",
                  fontSize: "13px"
                }}
              />

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                <button
                  type="button"
                  onClick={() => setContactingSupervisor(null)}
                  style={{
                    ...theme.button("ghost"),
                    fontSize: "12px"
                  }}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={sendingMsg}
                  style={{
                    ...theme.button("primary"),
                    fontSize: "12px",
                    padding: "8px 16px"
                  }}
                >
                  {sendingMsg ? "Sending..." : "🚀 Send Message"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default SupervisorContactModal;
