import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import theme from "../theme";
import { sendNotification } from "../emailService"; // ✅ Keeps the Email Feature working
import BentoCard from "../components/BentoCard";
import { useToast } from "../components/ToastContext";
import Skeleton from "../components/Skeleton";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [admin, setAdmin] = useState(null);
  const [requests, setRequests] = useState([]);
  const [pendingJobs, setPendingJobs] = useState([]); // 🆕 State for Jobs
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Check Admin Login
    const data = localStorage.getItem("user");
    if (!data) {
      navigate("/login");
      return;
    }
    const parsed = JSON.parse(data);
    if (parsed.role !== "admin") {
      addToast("Access Denied: Admins only.", "error");
      navigate("/dashboard");
      return;
    }
    setAdmin(parsed);

    // 2. Fetch Data
    Promise.all([fetchPendingRequests(), fetchPendingJobs()]).finally(() => {
      setLoading(false);
    });
  }, [navigate]);

  // --- FETCHING DATA ---
  const fetchPendingRequests = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/users/admin/pending-requests");
      setRequests(res.data.requests || []);
    } catch (err) {
      console.error("Error fetching admin requests", err);
    }
  };

  const fetchPendingJobs = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/users/admin/pending-jobs");
      setPendingJobs(res.data.jobs || []);
    } catch (err) {
      console.error("Error fetching jobs", err);
    }
  };

  // --- HANDLERS ---

  // 1. Handle Connection Requests (With Email)
  const handleRequestDecision = async (req, decision) => {
    try {
      const newStatus = decision === 'approve' ? 'PENDING_EMPLOYEE' : 'DENIED';
      
      await axios.put(`http://localhost:5000/api/users/requests/${req._id}`, {
        status: newStatus
      });

      // Send Email if Approved
      if (decision === 'approve' && req.employeeId?.email && req.employerId?.name) {
          await sendNotification(
            req.employeeId.name,  
            req.employeeId.email, 
            req.employerId.name   
          );
          addToast(`✅ Request Approved & Email Sent to ${req.employeeId.email}`, "success");
      } else {
          addToast(`Request ${decision}d successfully!`, "success");
      }

      fetchPendingRequests(); // Refresh
    } catch (err) {
      addToast("Error updating request.", "error");
    }
  };

  // 2. Handle Job Approvals (New Feature)
  const handleJobDecision = async (jobId, decision) => {
    try {
        const status = decision === 'approve' ? 'approved' : 'rejected';
        await axios.put(`http://localhost:5000/api/users/admin/jobs/${jobId}`, { status });
        addToast(`Job Post ${status.toUpperCase()}!`, "success");
        fetchPendingJobs(); // Refresh
    } catch (err) {
        addToast("Error updating job.", "error");
    }
  };

  if (!admin) return null;

  return (
    <div className="bento-grid" style={styles.page}>
      {/* Header - Spans 4 Columns */}
      <BentoCard colSpan={4} padding="32px">
        <h2 style={styles.title}>Admin Control Center</h2>
        <p style={styles.subText}>Logged in as {admin.name}</p>
        <div style={styles.pillRow}>
            <span style={styles.pillDanger}>System Admin</span>
        </div>
      </BentoCard>

      {/* SECTION 1: JOB VACANCY APPROVALS (NEW) - Spans 2 Columns */}
      <BentoCard colSpan={2}>
        <h3 style={{...styles.title, marginBottom: 20, color: "#34d399"}}>
           📢 Job Post Approvals ({pendingJobs.length})
        </h3>

        {loading ? (
          <div style={styles.listContainer}>
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} style={styles.requestItem}>
                <div style={{ flex: 1 }}>
                  <Skeleton width="60%" height="20px" style={{ marginBottom: "10px" }} />
                  <Skeleton width="40%" height="16px" style={{ marginBottom: "10px" }} />
                  <Skeleton width="100%" height="16px" style={{ marginBottom: "10px" }} />
                  <Skeleton width="50%" height="14px" />
                </div>
                <div style={styles.btnGroup}>
                  <Skeleton width="80px" height="36px" />
                  <Skeleton width="80px" height="36px" />
                </div>
              </div>
            ))}
          </div>
        ) : pendingJobs.length === 0 ? (
          <p style={{color: theme.colors.textSecondary}}>No pending job posts.</p>
        ) : (
          <div style={styles.listContainer}>
            {pendingJobs.map((job) => (
              <div key={job._id} style={styles.requestItem}>
                <div style={{ flex: 1 }}>
                  <h4 style={{margin: "0 0 5px 0", color: "white"}}>{job.title}</h4>
                  <div style={styles.row}>
                    <strong style={{color: "#aaa", fontSize: "12px"}}>Company:</strong> 
                    <span style={{color: theme.colors.textSecondary, fontSize: "13px"}}> {job.employerId?.name}</span>
                  </div>
                  <p style={{color: "#ddd", fontSize: "13px", margin: "5px 0"}}>{job.description}</p>
                  <div style={{fontSize: "11px", color: "#888"}}>
                     📍 {job.location} | 💰 {job.salary}
                  </div>
                </div>

                <div style={styles.btnGroup}>
                  <button 
                    onClick={() => handleJobDecision(job._id, 'approve')}
                    style={styles.approveBtn}
                    className="button-hover"
                  >
                    ✅ Publish
                  </button>
                  <button 
                    onClick={() => handleJobDecision(job._id, 'deny')}
                    style={styles.denyBtn}
                    className="button-hover"
                  >
                    ❌ Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </BentoCard>

      {/* SECTION 2: CONNECTION REQUESTS - Spans 2 Columns */}
      <BentoCard colSpan={2}>
        <h3 style={{...styles.title, marginBottom: 20}}>
            🔗 Connection Approvals ({requests.length})
        </h3>

        {loading ? (
          <div style={styles.listContainer}>
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} style={styles.requestItem}>
                <div style={{ flex: 1 }}>
                  <Skeleton width="50%" height="18px" style={{ marginBottom: "8px" }} />
                  <Skeleton width="50%" height="18px" style={{ marginBottom: "8px" }} />
                  <Skeleton width="40%" height="14px" />
                </div>
                <div style={styles.btnGroup}>
                  <Skeleton width="80px" height="36px" />
                  <Skeleton width="80px" height="36px" />
                </div>
              </div>
            ))}
          </div>
        ) : requests.length === 0 ? (
          <p style={{color: theme.colors.textSecondary}}>No pending connection requests.</p>
        ) : (
          <div style={styles.listContainer}>
            {requests.map((req) => (
              <div key={req._id} style={styles.requestItem}>
                <div style={{ flex: 1 }}>
                  <div style={styles.row}>
                    <strong style={{color: "#fff"}}>Employer:</strong> 
                    <span style={{color: theme.colors.textSecondary}}> {req.employerId?.name}</span>
                  </div>
                  <div style={styles.row}>
                    <strong style={{color: "#fff"}}>Candidate:</strong> 
                    <span style={{color: theme.colors.textSecondary}}> {req.employeeId?.name}</span>
                  </div>
                  <div style={{fontSize: "12px", color: theme.colors.textSecondary, marginTop: 5}}>
                    Requested on: {new Date(req.createdAt).toLocaleDateString()}
                  </div>
                </div>

                <div style={styles.btnGroup}>
                  <button 
                    onClick={() => handleRequestDecision(req, 'approve')}
                    style={styles.approveBtn}
                    className="button-hover"
                  >
                    Approve
                  </button>
                  <button 
                    onClick={() => handleRequestDecision(req, 'deny')}
                    style={styles.denyBtn}
                    className="button-hover"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
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
  pillRow: { display: "flex", marginTop: theme.spacing.sm },
  pillDanger: {
    padding: "8px 12px",
    background: "rgba(239,68,68,0.15)",
    borderRadius: "999px",
    border: "1px solid rgba(239,68,68,0.3)",
    color: "#fca5a5",
    fontSize: "12px",
    fontWeight: 700,
  },
  listContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "15px"
  },
  requestItem: {
    background: "rgba(255,255,255,0.03)",
    border: `1px solid ${theme.colors.border}`,
    borderRadius: theme.radii.md,
    padding: "20px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 15
  },
  row: { marginBottom: 4 },
  btnGroup: { display: "flex", gap: 10 },
  approveBtn: {
    ...theme.button("success"),
    backgroundColor: "#10b981",
    backgroundImage: "none",
    padding: "8px 16px",
    fontSize: "13px"
  },
  denyBtn: {
    ...theme.button("danger"),
    backgroundColor: "#ef4444",
    backgroundImage: "none",
    padding: "8px 16px",
    fontSize: "13px"
  }
};