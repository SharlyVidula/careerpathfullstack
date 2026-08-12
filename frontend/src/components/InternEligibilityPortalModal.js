import React, { useState, useEffect } from "react";
import apiClient from "../apiClient";
import theme from "../theme";
import GpaCalculator from "./GpaCalculator";
import { useToast } from "./ToastContext";

function InternEligibilityPortalModal({ user, onClose, onUserUpdated }) {
  const { addToast } = useToast();
  const [eligibility, setEligibility] = useState({
    isEligible: false,
    progressPercentage: 0,
    jlptLevel: user?.jlptLevel || "NONE",
    gpa: user?.gpa || 0,
    eligibilityStatus: user?.eligibilityStatus || "NOT_SUBMITTED",
    rejectionReason: ""
  });
  const [gpaCourses, setGpaCourses] = useState([]);
  const [jlptLevel, setJlptLevel] = useState(user?.jlptLevel || "NONE");
  const [calculatedGpa, setCalculatedGpa] = useState(user?.gpa || 0);
  
  // File uploads state (base64 data strings)
  const [jlptProof, setJlptProof] = useState(null);
  const [jlptProofName, setJlptProofName] = useState("");
  const [gpaProof, setGpaProof] = useState(null);
  const [gpaProofName, setGpaProofName] = useState("");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const userId = user?.id || user?._id;

  const fetchEligibility = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const res = await apiClient.get(`/intern/eligibility/${userId}`);
      if (res.data?.ok) {
        setEligibility(res.data.eligibility);
        setGpaCourses(res.data.gpaCourses || []);
        setJlptLevel(res.data.eligibility.jlptLevel || "NONE");
        setCalculatedGpa(res.data.eligibility.gpa || 0);
        if (res.data.jlptProofDocument) setJlptProof(res.data.jlptProofDocument);
        if (res.data.gpaProofDocument) setGpaProof(res.data.gpaProofDocument);

        const currentStatus = res.data.eligibility.eligibilityStatus || "NOT_SUBMITTED";
        if (currentStatus === "NOT_SUBMITTED") {
          setIsEditing(true);
        } else {
          setIsEditing(false);
        }
      }
    } catch (err) {
      console.error("Fetch Eligibility Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEligibility();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const handleFileUpload = (e, setFile, setFileName) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      addToast("File size exceeds 5MB limit. Please upload a smaller PDF or image.", "warning");
      return;
    }

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      setFile(uploadEvent.target.result);
      addToast(`Attached proof document: ${file.name}`, "info");
    };
    reader.readAsDataURL(file);
  };

  const handleSaveGpaFromCalc = (newGpa, coursesList) => {
    setCalculatedGpa(newGpa);
    setGpaCourses(coursesList);
  };

  const handleSubmitApplication = async (e) => {
    e.preventDefault();

    if (!jlptLevel || jlptLevel === "NONE") {
      addToast("Please select your Japanese language qualification (at least JLPT/NAT N4 required).", "warning");
      return;
    }

    const jlptMap = { "NONE": 0, "N5": 1, "N4": 2, "N3": 3, "N2": 4, "N1": 5 };
    if ((jlptMap[jlptLevel] || 0) < 2) {
      addToast("Japanese qualification must be at least JLPT or NAT level N4.", "warning");
      return;
    }

    if (calculatedGpa < 2.0) {
      addToast("A minimum cumulative GPA of 2.0 (1st Yr - 3rd Yr 2nd Sem) is required.", "warning");
      return;
    }

    if (!jlptProof) {
      addToast("Please upload your JLPT / NAT Exam Certificate proof document.", "warning");
      return;
    }

    if (!gpaProof) {
      addToast("Please upload your Official 1st Year to 3rd Year 2nd Sem Result Sheet proof document.", "warning");
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiClient.post("/intern/submit-eligibility-application", {
        userId,
        jlptLevel,
        gpa: calculatedGpa,
        gpaCourses,
        jlptProofDocument: jlptProof,
        gpaProofDocument: gpaProof
      });

      if (res.data?.ok) {
        addToast(res.data.message || "Application submitted to Academic Coordinators!", "success");
        setEligibility(res.data.eligibility);
        setIsEditing(false); // Hide the application form immediately upon submission
        if (onUserUpdated) {
          onUserUpdated({
            ...user,
            jlptLevel,
            gpa: calculatedGpa,
            gpaCourses,
            eligibilityStatus: "PENDING_APPROVAL"
          });
        }
      }
    } catch (err) {
      console.error("Submit Application Error:", err);
      const msg = err.response?.data?.message || err.response?.data?.error || err.message || "Failed to submit eligibility application.";
      addToast(msg, "error");
    } finally {
      setSubmitting(false);
    }
  };

  const status = eligibility.eligibilityStatus || "NOT_SUBMITTED";

  return (
    <div style={{
      position: "fixed",
      top: 0, left: 0, right: 0, bottom: 0,
      background: "rgba(0, 0, 0, 0.8)",
      backdropFilter: "blur(10px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 9990,
      padding: "16px"
    }}>
      <div style={{
        background: "#0f172a",
        border: "1px solid var(--glass-border)",
        borderRadius: theme.radii.xl,
        width: "100%",
        maxWidth: "920px",
        maxHeight: "92vh",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        boxShadow: "0 25px 60px rgba(0,0,0,0.6)",
        color: "#fff"
      }}>
        {/* Modal Header */}
        <div style={{
          background: "linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%)",
          padding: "18px 24px",
          borderBottom: "1px solid var(--glass-border)",
          display: "flex",
          justify: "space-between",
          alignItems: "center"
        }}>
          <div>
            <h2 style={{ margin: 0, fontSize: "20px", color: "#6366f1", display: "flex", alignItems: "center", gap: "10px" }}>
              📋 Internship Eligibility Verification & Proof Upload Portal
            </h2>
            <p style={{ margin: "4px 0 0 0", fontSize: "12px", color: "var(--text-secondary)" }}>
              Submit academic parameters & official proof documents to Academic Coordinators for review
            </p>
          </div>

          <button
            onClick={onClose}
            style={{
              background: "rgba(255,255,255,0.1)",
              border: "none",
              color: "#fff",
              borderRadius: "50%",
              width: "32px",
              height: "32px",
              fontSize: "16px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: "20px", overflowY: "auto", flex: 1 }}>
          {loading ? (
            <div style={{ textAlign: "center", padding: "40px 0", color: "var(--text-secondary)" }}>
              Loading eligibility portal...
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              {/* Summary Card when form is submitted (isEditing === false) */}
              {!isEditing && (
                <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                  {/* Status Banner */}
                  {status === "PENDING_APPROVAL" && (
                    <div style={{
                      background: "rgba(234, 179, 8, 0.12)",
                      border: "1px solid rgba(234, 179, 8, 0.4)",
                      borderRadius: theme.radii.lg,
                      padding: "18px",
                      display: "flex",
                      alignItems: "center",
                      gap: "14px"
                    }}>
                      <div style={{ fontSize: "32px" }}>⏳</div>
                      <div>
                        <h4 style={{ margin: "0 0 4px 0", color: "#eab308", fontSize: "16px" }}>
                          Application Submitted & Under Review by Academic Coordinators
                        </h4>
                        <p style={{ margin: 0, fontSize: "13px", color: "var(--text-secondary)", lineHeight: "1.5" }}>
                          Your application parameters and uploaded proof documents are being monitored and reviewed by Senior Lecturers. Editing is locked while review is in progress.
                        </p>
                      </div>
                    </div>
                  )}

                  {status === "APPROVED" && (
                    <div style={{
                      background: "rgba(34, 197, 94, 0.12)",
                      border: "1px solid rgba(34, 197, 94, 0.4)",
                      borderRadius: theme.radii.lg,
                      padding: "18px",
                      display: "flex",
                      alignItems: "center",
                      gap: "14px"
                    }}>
                      <div style={{ fontSize: "32px" }}>✅</div>
                      <div>
                        <h4 style={{ margin: "0 0 4px 0", color: "#22c55e", fontSize: "16px" }}>
                          Internship Eligibility Verified & Approved!
                        </h4>
                        <p style={{ margin: 0, fontSize: "13px", color: "var(--text-secondary)", lineHeight: "1.5" }}>
                          Your academic credentials and proof documents have been verified by your Academic Coordinator. The <strong>"🎓 Intern Program"</strong> portal button is now unlocked on your dashboard.
                        </p>
                      </div>
                    </div>
                  )}

                  {status === "REJECTED" && (
                    <div style={{
                      background: "rgba(239, 68, 68, 0.12)",
                      border: "1px solid rgba(239, 68, 68, 0.4)",
                      borderRadius: theme.radii.lg,
                      padding: "18px",
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "14px"
                    }}>
                      <div style={{ fontSize: "32px" }}>❌</div>
                      <div style={{ flex: 1 }}>
                        <h4 style={{ margin: "0 0 4px 0", color: "#ef4444", fontSize: "16px" }}>
                          Application Revision Requested by Coordinator
                        </h4>
                        <p style={{ margin: "0 0 8px 0", fontSize: "13px", color: "#fca5a5" }}>
                          <strong>Feedback from Coordinator:</strong> "{eligibility.rejectionReason || "Please re-check your subject grades, GPA calculation, or upload clear proof documents."}"
                        </p>
                        <p style={{ margin: 0, fontSize: "12px", color: "var(--text-secondary)" }}>
                          Click the <strong>"🔄 Re-Apply & Update Application"</strong> button below to unlock the form, update your parameters or proof files, and re-submit.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Submission Details Summary Box */}
                  <div style={{
                    background: "var(--glass-bg-alt, rgba(15, 23, 42, 0.6))",
                    borderRadius: theme.radii.lg,
                    padding: "20px",
                    border: "1px solid var(--glass-border)"
                  }}>
                    <h3 style={{ margin: "0 0 16px 0", fontSize: "16px", color: "#6366f1", borderBottom: "1px solid var(--glass-border)", paddingBottom: "10px" }}>
                      📋 Submitted Application Summary
                    </h3>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px", marginBottom: "16px" }}>
                      <div style={{ background: "rgba(0,0,0,0.2)", padding: "12px", borderRadius: theme.radii.md }}>
                        <span style={{ fontSize: "12px", color: "var(--text-secondary)", display: "block" }}>Japanese Qualification</span>
                        <strong style={{ fontSize: "16px", color: jlptLevel === "NONE" ? "#ef4444" : "#22c55e" }}>
                          {jlptLevel || "NONE"}
                        </strong>
                      </div>

                      <div style={{ background: "rgba(0,0,0,0.2)", padding: "12px", borderRadius: theme.radii.md }}>
                        <span style={{ fontSize: "12px", color: "var(--text-secondary)", display: "block" }}>Calculated Cumulative GPA</span>
                        <strong style={{ fontSize: "16px", color: calculatedGpa >= 2.0 ? "#22c55e" : "#ef4444" }}>
                          {calculatedGpa.toFixed(2)} / 4.0 ({gpaCourses.length} Subjects)
                        </strong>
                      </div>

                      <div style={{ background: "rgba(0,0,0,0.2)", padding: "12px", borderRadius: theme.radii.md }}>
                        <span style={{ fontSize: "12px", color: "var(--text-secondary)", display: "block" }}>Attached Proof Files</span>
                        <div style={{ fontSize: "12px", fontWeight: "bold", color: "#22c55e", marginTop: "2px" }}>
                          {jlptProof ? "✅ JLPT Certificate Attached" : "❌ Certificate Missing"}
                        </div>
                        <div style={{ fontSize: "12px", fontWeight: "bold", color: "#22c55e", marginTop: "2px" }}>
                          {gpaProof ? "✅ Result Sheet Attached" : "❌ Result Sheet Missing"}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
                      <button
                        onClick={onClose}
                        style={{
                          ...theme.button("ghost"),
                          fontSize: "13px"
                        }}
                      >
                        Close Window
                      </button>

                      {/* Re-Apply button appears ONLY if last request was REJECTED */}
                      {status === "REJECTED" && (
                        <button
                          onClick={() => setIsEditing(true)}
                          style={{
                            ...theme.button("primary"),
                            background: "linear-gradient(135deg, #ef4444, #dc2626)",
                            fontSize: "13px",
                            padding: "10px 20px"
                          }}
                        >
                          🔄 Re-Apply & Update Application
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Editable Form Section (isEditing === true) */}
              {isEditing && (
                <form onSubmit={handleSubmitApplication} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                  
                  {/* Status Note when Re-Applying */}
                  {status === "REJECTED" && (
                    <div style={{
                      background: "rgba(239, 68, 68, 0.15)",
                      border: "1px solid rgba(239, 68, 68, 0.4)",
                      padding: "14px",
                      borderRadius: theme.radii.md,
                      color: "#fca5a5",
                      fontSize: "13px"
                    }}>
                      ⚠️ <strong>Re-Applying:</strong> Please update any required fields or re-upload clear proof documents based on Coordinator feedback ("{eligibility.rejectionReason}").
                    </div>
                  )}

                  {/* 1. Japanese Qualification & Certificate Proof */}
                  <div style={{
                    background: "var(--glass-bg-alt, rgba(15, 23, 42, 0.6))",
                    borderRadius: theme.radii.lg,
                    padding: "18px",
                    border: "1px solid var(--glass-border)"
                  }}>
                    <h3 style={{ margin: "0 0 6px 0", fontSize: "16px", color: "#6366f1", display: "flex", alignItems: "center", gap: "8px" }}>
                      🎌 1. Japanese Language Qualification & Proof
                    </h3>
                    <p style={{ margin: "0 0 14px 0", fontSize: "12px", color: "var(--text-secondary)" }}>
                      Minimum requirement: JLPT or NAT level <strong>N4</strong> or higher.
                    </p>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                      <div>
                        <label style={{ fontSize: "12px", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>
                          Selected Qualification Level *
                        </label>
                        <select
                          value={jlptLevel}
                          onChange={(e) => setJlptLevel(e.target.value)}
                          style={{
                            ...theme.input(),
                            padding: "10px 12px",
                            fontSize: "13px",
                            fontWeight: "bold",
                            color: (jlptLevel === "NONE" || jlptLevel === "N5") ? "#ef4444" : "#22c55e"
                          }}
                        >
                          <option value="NONE" style={{ background: "#1e293b", color: "#fff" }}>None / Below Requirement</option>
                          <option value="N5" style={{ background: "#1e293b", color: "#fff" }}>JLPT / NAT N5 (Ineligible)</option>
                          <option value="N4" style={{ background: "#1e293b", color: "#fff" }}>JLPT / NAT N4 (Eligible ✓)</option>
                          <option value="N3" style={{ background: "#1e293b", color: "#fff" }}>JLPT / NAT N3 (Eligible ✓)</option>
                          <option value="N2" style={{ background: "#1e293b", color: "#fff" }}>JLPT / NAT N2 (Eligible ✓)</option>
                          <option value="N1" style={{ background: "#1e293b", color: "#fff" }}>JLPT / NAT N1 (Eligible ✓)</option>
                        </select>
                      </div>

                      <div>
                        <label style={{ fontSize: "12px", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>
                          Upload JLPT / NAT Certificate Proof (PDF / Image) *
                        </label>
                        <input
                          type="file"
                          accept="image/*,application/pdf"
                          onChange={(e) => handleFileUpload(e, setJlptProof, setJlptProofName)}
                          style={{
                            ...theme.input(),
                            padding: "8px 12px",
                            fontSize: "12px"
                          }}
                        />
                        {jlptProofName && (
                          <div style={{ fontSize: "11px", color: "#22c55e", marginTop: "4px" }}>
                            📎 Attached: {jlptProofName}
                          </div>
                        )}
                        {jlptProof && !jlptProofName && (
                          <div style={{ fontSize: "11px", color: "#22c55e", marginTop: "4px" }}>
                            ✅ Certificate Proof Document Attached
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 2. Full 1st Yr to 3rd Yr 2nd Sem GPA Calculator & Result Sheet Proof */}
                  <div style={{
                    background: "var(--glass-bg-alt, rgba(15, 23, 42, 0.6))",
                    borderRadius: theme.radii.lg,
                    padding: "18px",
                    border: "1px solid var(--glass-border)"
                  }}>
                    <h3 style={{ margin: "0 0 6px 0", fontSize: "16px", color: "#6366f1", display: "flex", alignItems: "center", gap: "8px" }}>
                      🎓 2. Full 1st Year – 3rd Year 2nd Sem Results & GPA Calculation
                    </h3>
                    <p style={{ margin: "0 0 14px 0", fontSize: "12px", color: "var(--text-secondary)" }}>
                      Enter grade results for all subjects (1st Yr Sem 1 to 3rd Yr Sem 2). Minimum cumulative GPA: <strong>2.0 / 4.0</strong>.
                    </p>

                    <GpaCalculator
                      initialGpa={calculatedGpa}
                      initialCourses={gpaCourses}
                      onSaveGpa={handleSaveGpaFromCalc}
                      showSaveButton={false}
                    />

                    <div style={{ marginTop: "16px" }}>
                      <label style={{ fontSize: "12px", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>
                        Upload Official University Result Sheet Proof (1st Yr - 3rd Yr 2nd Sem) *
                      </label>
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        onChange={(e) => handleFileUpload(e, setGpaProof, setGpaProofName)}
                        style={{
                          ...theme.input(),
                          padding: "8px 12px",
                          fontSize: "12px"
                        }}
                      />
                      {gpaProofName && (
                        <div style={{ fontSize: "11px", color: "#22c55e", marginTop: "4px" }}>
                          📎 Attached: {gpaProofName}
                        </div>
                      )}
                      {gpaProof && !gpaProofName && (
                        <div style={{ fontSize: "11px", color: "#22c55e", marginTop: "4px" }}>
                          ✅ Official Result Sheet Proof Attached
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Submit Action Row */}
                  <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "10px" }}>
                    <button
                      type="button"
                      onClick={onClose}
                      style={{
                        ...theme.button("ghost"),
                        fontSize: "13px"
                      }}
                    >
                      Cancel / Close
                    </button>

                    <button
                      type="submit"
                      disabled={submitting}
                      style={{
                        ...theme.button("primary"),
                        padding: "10px 24px",
                        fontSize: "14px",
                        opacity: submitting ? 0.7 : 1
                      }}
                    >
                      {submitting ? "Submitting Application..." : "📤 Submit Application for Coordinator Approval"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default InternEligibilityPortalModal;
