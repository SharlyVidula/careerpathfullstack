const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  password: { type: String }, // Optional for OAuth users
  role: { 
    type: String, 
    enum: ["student", "coordinator", "supervisor", "admin", "user", "employer"], 
    default: "student" 
  },
  
  // 🎓 LNBTI REGISTRATION GATE & ACADEMIC FIELDS 🎓
  isApproved: { type: Boolean, default: false }, // Coordinator must approve student registrations
  approvalStatus: { 
    type: String, 
    enum: ["PENDING", "APPROVED", "REJECTED"], 
    default: "PENDING" 
  },
  indexNumber: { type: String },   // e.g. "UGC0323021" or "UOG0323045"
  batchNumber: { type: String },   // e.g. "Batch 05 (2023-2027)"
  degreeBatch: { type: String, default: "UGC (SE)" }, // "UGC (SE)" or "UOG"
  academicYear: { type: String, default: "Year 1" },  // Year 1, Year 2, Year 3, Year 4
  academicSemester: { type: String, default: "Semester 1" }, // Semester 1, Semester 2
  degreeProgram: { type: String }, // e.g. "BSc (Hons) Software Engineering"

  // 🎯 STAGE CONTROL (Controlled strictly by Coordinator)
  studentStage: { 
    type: String, 
    enum: ["YEAR_1_2", "YEAR_3_INTERN", "FINAL_YEAR_JOB"], 
    default: "YEAR_1_2" 
  },

  // 🎌 INTERNSHIP & ELIGIBILITY PARAMETERS (JLPT N4+ & GPA 2.0+) 🎓
  jlptLevel: { 
    type: String, 
    enum: ["NONE", "N5", "N4", "N3", "N2", "N1"], 
    default: "NONE" 
  },
  gpa: { type: Number, default: 0.0 },
  gpaCourses: [{
    courseCode: String,
    courseName: String,
    credits: Number,
    grade: String,
    gradePoint: Number
  }],
  // 📄 PROOF DOCUMENTS & COORDINATOR APPROVAL WORKFLOW
  jlptProofDocument: { type: String }, // Base64 or File URL of JLPT/NAT Certificate
  gpaProofDocument: { type: String },  // Base64 or File URL of Official Result Sheet
  eligibilityStatus: { 
    type: String, 
    enum: ["NOT_SUBMITTED", "PENDING_APPROVAL", "APPROVED", "REJECTED"], 
    default: "NOT_SUBMITTED" 
  },
  eligibilityRejectionReason: { type: String, default: "" },
  eligibilityApprovedAt: { type: Date },
  assignedSupervisor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  internshipStartDate: { type: Date, default: Date.now },

  // 💼 SUPERVISOR / INDUSTRY PARTNER FIELDS
  companyName: { type: String },
  designation: { type: String },

  saved: [{ careerTitle: String, score: Number, date: Date }],

  // ⭐ AI FIELDS & ATS IMPROVEMENTS ⭐
  resumeText: { type: String },       // The raw text from the PDF
  seekingRole: { type: String },      // The AI's classification (e.g., "UI Engineer")
  atsScore: { type: Number, default: 0 }, // ATS score calculation
  atsImprovements: [{ type: String }], // Recommended ATS improvements
  skills: [{ type: String }],         // Parsed main skills
  bioSnippet: { type: String },       // Very short bio or facts
  profilePic: { type: String },       // Base64 profile image
  extractedName: { type: String },    // Name

  // 📈 PROGRESS SYSTEM & ACTIONABLE TO-DO CHECKLIST 📈
  progressPercentage: { type: Number, default: 0 },
  todoTasks: [{
    id: String,
    text: String,
    points: { type: Number, default: 20 },
    completed: { type: Boolean, default: false }
  }],

  // 🔗 CONNECTED ACCOUNTS & PORTFOLIO TELEMETRY (ALL STUDENTS) 🔗
  githubUsername: { type: String },
  linkedinProfileUrl: { type: String },
  githubLocked: { type: Boolean, default: false },
  linkedinLocked: { type: Boolean, default: false },
  socialResetRequest: {
    requestedAt: Date,
    reason: String,
    status: { type: String, enum: ["NONE", "PENDING", "APPROVED", "REJECTED"], default: "NONE" }
  },
  githubRepos: [{
    name: String,
    description: String,
    stars: { type: Number, default: 0 },
    forks: { type: Number, default: 0 },
    language: String,
    pushedAt: Date,
    htmlUrl: String
  }],
  githubEvaluation: {
    score: { type: Number, default: 0 },
    summary: String,
    detectedSkills: [{ type: String }],
    lastEvaluated: Date
  },

  // ⭐ OAUTH FIELDS ⭐
  googleId: { type: String },
  githubId: { type: String },
  linkedinId: { type: String },
  linkedinData: { type: Object } // Store all raw data retrieved from LinkedIn
}, { timestamps: true });

module.exports = mongoose.models.User || mongoose.model("User", userSchema);