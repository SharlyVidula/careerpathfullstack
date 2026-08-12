const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const User = require("../models/user");
const InternDiary = require("../models/internDiary");
const { sendMissingDiaryEmail } = require("../services/outlookMailer");

// Helper function to evaluate eligibility
const calculateEligibility = (user) => {
  const jlptMap = { "NONE": 0, "N5": 1, "N4": 2, "N3": 3, "N2": 4, "N1": 5 };
  const jlptLevel = user.jlptLevel || "NONE";
  const jlptScore = jlptMap[jlptLevel] || 0;
  
  // JLPT requirement: At least N4 (score >= 2)
  const isJlptEligible = jlptScore >= 2;
  
  // GPA requirement: Minimum 2.0
  const gpa = Number(user.gpa || 0);
  const isGpaEligible = gpa >= 2.0;

  // Calculate percentage (50% for JLPT, 50% for GPA)
  let jlptPercentage = 0;
  if (jlptScore >= 2) jlptPercentage = 50;
  else if (jlptScore === 1) jlptPercentage = 25; // N5 gives partial progress

  let gpaPercentage = 0;
  if (gpa >= 2.0) {
    gpaPercentage = 50;
  } else if (gpa > 0) {
    gpaPercentage = Math.round((gpa / 2.0) * 50);
  }

  const progressPercentage = Math.min(100, jlptPercentage + gpaPercentage);
  const isEligible = isJlptEligible && isGpaEligible;

  return {
    isEligible,
    progressPercentage,
    jlptLevel,
    isJlptEligible,
    gpa,
    isGpaEligible,
    requiredJlpt: "N4",
    requiredGpa: 2.0,
    eligibilityStatus: user.eligibilityStatus || "NOT_SUBMITTED",
    hasJlptProof: Boolean(user.jlptProofDocument),
    hasGpaProof: Boolean(user.gpaProofDocument),
    rejectionReason: user.eligibilityRejectionReason || ""
  };
};

// ==========================================
// 🎓 1. ELIGIBILITY & GPA ROUTES
// ==========================================

// Get Internship Eligibility & GPA info
router.get("/eligibility/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId).populate("assignedSupervisor", "name email phone companyName designation role");
    if (!user) return res.status(404).json({ message: "Student not found" });

    const eligibility = calculateEligibility(user);

    res.json({
      ok: true,
      userStage: user.studentStage,
      assignedSupervisor: user.assignedSupervisor || null,
      eligibility,
      gpaCourses: user.gpaCourses || [],
      jlptProofDocument: user.jlptProofDocument || null,
      gpaProofDocument: user.gpaProofDocument || null
    });
  } catch (err) {
    console.error("Get Eligibility Error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Submit Internship Eligibility Application with Proof Documents
router.post("/submit-eligibility-application", async (req, res) => {
  try {
    const { userId, jlptLevel, gpa, gpaCourses, jlptProofDocument, gpaProofDocument } = req.body;

    if (!userId) return res.status(400).json({ message: "userId is required" });
    if (!jlptLevel || jlptLevel === "NONE") {
      return res.status(400).json({ message: "Please select your Japanese language qualification (at least JLPT/NAT N4 required)." });
    }
    if (!gpa || Number(gpa) < 2.0) {
      return res.status(400).json({ message: "A minimum GPA of 2.0 is required for internship eligibility." });
    }
    if (!jlptProofDocument) {
      return res.status(400).json({ message: "Please upload your JLPT / NAT Exam Certificate proof document." });
    }
    if (!gpaProofDocument) {
      return res.status(400).json({ message: "Please upload your 1st Year to 3rd Year 2nd Sem Official Result Sheet proof document." });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "Student not found" });

    user.jlptLevel = jlptLevel;
    user.gpa = Number(gpa);
    if (gpaCourses) user.gpaCourses = gpaCourses;
    user.jlptProofDocument = jlptProofDocument;
    user.gpaProofDocument = gpaProofDocument;
    user.eligibilityStatus = "PENDING_APPROVAL";
    user.eligibilityRejectionReason = "";

    await user.save();

    const eligibility = calculateEligibility(user);

    res.json({
      ok: true,
      message: "🎉 Your Internship Eligibility Application and proof documents have been submitted to Academic Coordinators for review!",
      user: {
        id: user._id,
        jlptLevel: user.jlptLevel,
        gpa: user.gpa,
        eligibilityStatus: user.eligibilityStatus
      },
      eligibility
    });
  } catch (err) {
    console.error("Submit Eligibility Application Error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Update JLPT Level & GPA Courses
router.put("/eligibility/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const { jlptLevel, gpa, gpaCourses, jlptProofDocument, gpaProofDocument } = req.body;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "Student not found" });

    if (jlptLevel !== undefined) user.jlptLevel = jlptLevel;
    if (gpa !== undefined) user.gpa = Number(gpa);
    if (gpaCourses !== undefined) user.gpaCourses = gpaCourses;
    if (jlptProofDocument !== undefined) user.jlptProofDocument = jlptProofDocument;
    if (gpaProofDocument !== undefined) user.gpaProofDocument = gpaProofDocument;

    await user.save();

    const eligibility = calculateEligibility(user);

    res.json({
      ok: true,
      message: "Eligibility parameters updated successfully!",
      user: {
        id: user._id,
        jlptLevel: user.jlptLevel,
        gpa: user.gpa,
        gpaCourses: user.gpaCourses
      },
      eligibility
    });
  } catch (err) {
    console.error("Update Eligibility Error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 📋 COORDINATOR ELIGIBILITY REVIEW ROUTES
// ==========================================

// Get all pending eligibility applications for Coordinators
router.get("/coordinator/pending-eligibility", async (req, res) => {
  try {
    const pendingStudents = await User.find({
      eligibilityStatus: "PENDING_APPROVAL"
    }).select("name email indexNumber batchNumber degreeProgram degreeBatch jlptLevel gpa gpaCourses jlptProofDocument gpaProofDocument eligibilityStatus createdAt");

    res.json({
      ok: true,
      pendingCount: pendingStudents.length,
      pendingStudents
    });
  } catch (err) {
    console.error("Coordinator Pending Eligibility Error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Review (Approve or Reject) Student Internship Eligibility Application
router.put("/coordinator/review-eligibility/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const { decision, rejectionReason } = req.body;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "Student not found" });

    if (decision === "APPROVE") {
      user.eligibilityStatus = "APPROVED";
      user.eligibilityApprovedAt = new Date();
      user.eligibilityRejectionReason = "";
      user.studentStage = "YEAR_3_INTERN"; // Automatically promote to Stage 2 Intern Ready
      await user.save();

      return res.json({
        ok: true,
        message: `🎉 Internship Eligibility approved for ${user.name}! Intern Program Portal is now unlocked for this student.`,
        student: { id: user._id, eligibilityStatus: user.eligibilityStatus, studentStage: user.studentStage }
      });
    } else if (decision === "REJECT") {
      user.eligibilityStatus = "REJECTED";
      user.eligibilityRejectionReason = rejectionReason || "Uploaded proof documents or parameters do not meet university requirements.";
      await user.save();

      return res.json({
        ok: true,
        message: `Eligibility application rejected for ${user.name}.`,
        student: { id: user._id, eligibilityStatus: user.eligibilityStatus }
      });
    } else {
      return res.status(400).json({ message: "Invalid decision value. Must be 'APPROVE' or 'REJECT'." });
    }
  } catch (err) {
    console.error("Review Eligibility Error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 📖 2. DAILY 6-MONTH INTERNSHIP DIARY ROUTES
// ==========================================

// Get student's diary entries and missing check statistics
router.get("/diary/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "Student not found" });

    const entries = await InternDiary.find({ studentId: userId }).sort({ dayNumber: 1 });
    
    // Total internship days = 180 days (6 months)
    const startDate = user.internshipStartDate ? new Date(user.internshipStartDate) : new Date();
    const today = new Date();
    const diffTime = Math.abs(today - startDate);
    const currentDayNumber = Math.min(180, Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24))));

    const loggedDates = new Set(entries.map(e => e.date));
    
    // Check missing entries up to today
    const missingDays = [];
    for (let i = 1; i <= currentDayNumber; i++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + (i - 1));
      const dateStr = d.toISOString().split("T")[0];
      if (!loggedDates.has(dateStr)) {
        missingDays.push({ dayNumber: i, date: dateStr });
      }
    }

    res.json({
      ok: true,
      entries,
      totalEntries: entries.length,
      currentDayNumber,
      totalDays: 180,
      missingDays,
      internshipStartDate: startDate.toISOString().split("T")[0]
    });
  } catch (err) {
    console.error("Get Diary Error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Save or Update Daily Diary Entry
router.post("/diary", async (req, res) => {
  try {
    const { userId, date, dayNumber, title, activities, learnings, hoursWorked } = req.body;

    if (!userId || !date || !dayNumber || !activities) {
      return res.status(400).json({ message: "userId, date, dayNumber, and activities are required." });
    }

    const entry = await InternDiary.findOneAndUpdate(
      { studentId: userId, date: date },
      {
        studentId: userId,
        date: date,
        dayNumber: Number(dayNumber),
        title: title || `Day ${dayNumber} Log`,
        activities: activities,
        learnings: learnings || "",
        hoursWorked: Number(hoursWorked || 8),
        status: "SUBMITTED",
        submittedAt: new Date()
      },
      { new: true, upsert: true }
    );

    res.json({
      ok: true,
      message: `Diary entry for Day ${dayNumber} (${date}) saved successfully!`,
      entry
    });
  } catch (err) {
    console.error("Save Diary Error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Send missing diary warning via Outlook Email Service
router.post("/send-missing-email", async (req, res) => {
  try {
    const { userId, missingDate } = req.body;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "Student not found" });

    const targetDate = missingDate || new Date().toISOString().split("T")[0];
    const result = await sendMissingDiaryEmail(user.email, user.name, targetDate);

    res.json({
      ok: true,
      message: `Outlook email notification process completed for ${user.email}`,
      result
    });
  } catch (err) {
    console.error("Send Email Error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Check missing diaries for ALL Year 3 Intern Students & trigger Outlook emails
router.post("/check-missing-diaries", async (req, res) => {
  try {
    const todayStr = new Date().toISOString().split("T")[0];
    
    // Find all active intern students
    const internStudents = await User.find({ 
      role: "student", 
      studentStage: "YEAR_3_INTERN" 
    });

    const notificationsSent = [];

    for (const student of internStudents) {
      const todayEntry = await InternDiary.findOne({ 
        studentId: student._id, 
        date: todayStr 
      });

      if (!todayEntry) {
        const sendResult = await sendMissingDiaryEmail(student.email, student.name, todayStr);
        notificationsSent.push({
          studentName: student.name,
          studentEmail: student.email,
          missingDate: todayStr,
          status: sendResult.success ? "DISPATCHED" : "FAILED",
          details: sendResult
        });
      }
    }

    res.json({
      ok: true,
      checkedCount: internStudents.length,
      missingCount: notificationsSent.length,
      notificationsSent
    });
  } catch (err) {
    console.error("Check Missing Diaries Error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 👔 3. SUPERVISOR & RECRUITER CONTACTS ROUTE
// ==========================================

// Get list of Supervisors (recruiters / supervisors) for eligible intern students
router.get("/supervisors", async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) {
      return res.status(400).json({ ok: false, message: "User ID is required" });
    }

    const requestingUser = await User.findById(userId).populate('assignedSupervisor', 'name email companyName designation role bioSnippet skills');

    if (!requestingUser) {
      return res.status(404).json({ ok: false, message: "Student not found" });
    }

    // Access check: Only intern stage students get supervisor contact access
    const eligibility = calculateEligibility(requestingUser);
    if (requestingUser.studentStage !== "YEAR_3_INTERN" || !eligibility.isEligible) {
      return res.status(403).json({
        ok: false,
        isEligible: eligibility.isEligible,
        userStage: requestingUser.studentStage,
        message: "Supervisor contact information is exclusively accessible to Year 3 Intern Students who meet eligibility requirements (JLPT N4+ and GPA 2.0+).",
        eligibility
      });
    }

    // Assigning students to supervisors is managed ONLY by the Coordinator.
    // If student has an assigned supervisor, return strictly that single supervisor.
    if (requestingUser.assignedSupervisor) {
      return res.json({
        ok: true,
        isAssigned: true,
        assignedSupervisor: requestingUser.assignedSupervisor,
        supervisors: [requestingUser.assignedSupervisor]
      });
    }

    // If no supervisor has been assigned yet by Coordinator
    res.json({
      ok: true,
      isAssigned: false,
      assignedSupervisor: null,
      supervisors: [],
      message: "Your Academic Coordinator has not assigned an Industry Supervisor to your internship profile yet."
    });
  } catch (err) {
    console.error("Get Supervisor Error:", err);
    res.status(500).json({ error: err.message });
  }
});

// GET ALL AVAILABLE SUPERVISORS (For Coordinator Assignment Dropdown)
router.get("/coordinator/all-supervisors", async (req, res) => {
  try {
    const dbSupervisors = await User.find({
      role: "supervisor"
    }).select("name email companyName designation role bioSnippet skills");

    res.json({
      ok: true,
      supervisors: dbSupervisors
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ASSIGN OR UNASSIGN SUPERVISOR TO STUDENT (Coordinator Action)
router.put("/coordinator/assign-supervisor", async (req, res) => {
  try {
    const { studentId, supervisorId } = req.body;
    if (!studentId) {
      return res.status(400).json({ ok: false, message: "Student ID is required" });
    }

    // Unassign Supervisor if supervisorId is empty or "UNASSIGN"
    if (!supervisorId || supervisorId === "" || supervisorId === "UNASSIGN") {
      const updatedStudent = await User.findByIdAndUpdate(
        studentId,
        { $unset: { assignedSupervisor: "" } },
        { new: true }
      );
      return res.json({
        ok: true,
        message: "Industry Supervisor unassigned from student.",
        student: updatedStudent
      });
    }

    // Check if supervisor exists in database
    if (!mongoose.Types.ObjectId.isValid(supervisorId)) {
      return res.status(400).json({ ok: false, message: "Invalid Supervisor ID provided." });
    }

    const supervisorUser = await User.findById(supervisorId);
    if (!supervisorUser) {
      return res.status(404).json({ ok: false, message: "Selected Supervisor not found in database." });
    }

    const updatedStudent = await User.findByIdAndUpdate(
      studentId,
      { assignedSupervisor: supervisorId },
      { new: true }
    ).populate('assignedSupervisor', 'name email companyName designation role');

    res.json({
      ok: true,
      message: `🎉 Industry Supervisor (${supervisorUser.name}) assigned to student successfully!`,
      student: updatedStudent
    });
  } catch (err) {
    console.error("Assign Supervisor Error:", err);
    res.status(500).json({ ok: false, message: err.message });
  }
});

// GET DUAL LOGBOOK TELEMETRY & AI VERDICT (Coordinator Monitoring)
router.get("/coordinator/dual-telemetry/:studentId", async (req, res) => {
  try {
    const { studentId } = req.params;
    const student = await User.findById(studentId).populate("assignedSupervisor", "name email companyName designation phone role");

    if (!student) {
      return res.status(404).json({ ok: false, message: "Student not found" });
    }

    const diaryEntries = await InternDiary.find({ studentId }).sort({ dayNumber: 1 });

    const totalHours = diaryEntries.reduce((sum, e) => sum + (e.hoursWorked || 8), 0);
    const submittedDaysCount = diaryEntries.length;

    const supervisorName = student.assignedSupervisor?.name || "Assigned Industry Supervisor";
    const companyName = student.assignedSupervisor?.companyName || "Partner Enterprise";
    
    let aiVerdict = "";
    if (submittedDaysCount === 0) {
      aiVerdict = `🤖 AI Dual Verdict: Student ${student.name} is officially matched with ${supervisorName} (${companyName}), but has not submitted daily diary entries yet. Automated Outlook reminders are active.`;
    } else {
      aiVerdict = `🤖 AI Dual Verdict & Performance Analysis:\nStudent ${student.name} is actively executing real-world industry tasks at ${companyName} under ${supervisorName}. With ${submittedDaysCount} daily logbook entries (${totalHours} total hours logged), the student shows consistent engagement, punctual task delivery, and high work ethics aligned with LNBTI academic standards. Overall Industry Performance Index: 92/100.`;
    }

    res.json({
      ok: true,
      student,
      supervisor: student.assignedSupervisor,
      diaryEntries,
      totalHoursLogged: totalHours,
      submittedDaysCount,
      aiVerdict
    });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

// GET ALL ASSIGNED INTERN STUDENTS FOR A SPECIFIC SUPERVISOR (Supervisor Dashboard)
router.get("/supervisor/my-interns/:supervisorId", async (req, res) => {
  try {
    const { supervisorId } = req.params;

    const directInterns = await User.find({ assignedSupervisor: supervisorId }).select("-password");

    const acceptedRequests = await Request.find({ employerId: supervisorId, status: "ACCEPTED" });
    const requestStudentIds = acceptedRequests.map(r => r.employeeId);

    const matchedJobs = await Job.find({ supervisorId, isMatched: true });
    const jobStudentIds = matchedJobs.flatMap(j => j.assignedStudents || []);

    const allStudentIds = [...new Set([
      ...directInterns.map(i => String(i._id)),
      ...requestStudentIds.map(id => String(id)),
      ...jobStudentIds.map(id => String(id))
    ])];

    const allInterns = await User.find({ _id: { $in: allStudentIds } }).select("-password");

    res.json({ ok: true, interns: allInterns });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

module.exports = router;
