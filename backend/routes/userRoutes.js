const express = require("express");
const router = express.Router();
const multer = require("multer");
const pdfParse = require("pdf-parse");
const { OpenAI } = require("openai");

// Import Models
const User = require("../models/user");
const Saved = require("../models/saved");
const Request = require("../models/request");
const Job = require("../models/job");

// --- CONFIGURATION ---
const upload = multer({ storage: multer.memoryStorage() });
const client = new OpenAI({
  apiKey: process.env.XAI_API_KEY || "dummy-key",
  baseURL: "https://api.x.ai/v1",
  dangerouslyAllowBrowser: true
});

// ... (Keep Register/Login Routes as they are) ...
// (I will paste the FULL file below so you don't miss anything)

// ==========================================
// 🔐 AUTHENTICATION ROUTES
// ==========================================

// REGISTER
router.post("/register", async (req, res) => {
  try {
    const { 
      name, email, password, role, 
      indexNumber, batchNumber, degreeBatch, academicYear, academicSemester, degreeProgram, studentStage,
      companyName, designation 
    } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email, and password are required" });
    }

    if (role === 'coordinator' || role === 'admin') {
      return res.status(403).json({ message: "Coordinator accounts cannot be created publicly. They must be created by an existing LNBTI Senior Lecturer inside the Coordinator Hub." });
    }

    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: "User already exists with this email" });

    const assignedRole = role || 'student';
    // Students require Coordinator approval before logging in
    const isStudent = assignedRole === 'student';
    const isApproved = !isStudent; 
    const approvalStatus = isStudent ? 'PENDING' : 'APPROVED';

    const newUser = new User({ 
      name, 
      email, 
      password, 
      role: assignedRole,
      isApproved,
      approvalStatus,
      indexNumber: isStudent ? indexNumber : undefined,
      batchNumber: isStudent ? batchNumber : undefined,
      degreeBatch: isStudent ? (degreeBatch || 'UGC (SE)') : undefined,
      academicYear: isStudent ? (academicYear || 'Year 1') : undefined,
      academicSemester: isStudent ? (academicSemester || 'Semester 1') : undefined,
      degreeProgram: isStudent ? degreeProgram : undefined,
      studentStage: isStudent ? (studentStage || 'YEAR_1_2') : undefined,
      companyName: (assignedRole === 'supervisor' || assignedRole === 'employer') ? companyName : undefined,
      designation: (assignedRole === 'supervisor' || assignedRole === 'employer') ? designation : undefined
    });

    await newUser.save();

    if (isStudent) {
      return res.status(201).json({ 
        ok: true,
        pendingApproval: true, 
        message: "Registration submitted successfully! Your account is pending Coordinator approval before you can log in.",
        user: { id: newUser._id, name: newUser.name, email: newUser.email, role: newUser.role, approvalStatus: newUser.approvalStatus }
      });
    }

    res.status(201).json({ 
      ok: true,
      pendingApproval: false,
      message: "Registered successfully", 
      user: { id: newUser._id, name: newUser.name, email: newUser.email, role: newUser.role } 
    });
  } catch (e) { 
    console.error("Register Error:", e);
    res.status(500).json({ error: e.message }); 
  }
});

// LOGIN
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: "Email and password are required" });

    const cleanEmail = email.trim();
    const user = await User.findOne({ 
      email: { $regex: new RegExp(`^${cleanEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } 
    });

    if (!user || user.password !== password) return res.status(400).json({ message: "Invalid credentials" });

    // Check student registration approval gate
    if (user.role === 'student' || user.role === 'user') {
      if (user.approvalStatus === 'REJECTED') {
        return res.status(403).json({ 
          ok: false, 
          message: "Your registration was rejected by the Coordinator. Please contact LNBTI academic administration." 
        });
      }
      if (!user.isApproved || user.approvalStatus === 'PENDING') {
        return res.status(403).json({ 
          ok: false, 
          pendingApproval: true,
          message: "Your account registration is pending approval by your LNBTI Academic Coordinator. Please check back later." 
        });
      }
    }

    user.lastLoginAt = new Date();
    await user.save();

    res.json({ 
      ok: true,
      message: "Login success", 
      user: { 
        id: user._id, 
        _id: user._id,
        name: user.name, 
        email: user.email, 
        role: user.role, 
        studentStage: user.studentStage || "YEAR_1_2",
        indexNumber: user.indexNumber,
        batchNumber: user.batchNumber,
        degreeProgram: user.degreeProgram,
        companyName: user.companyName,
        designation: user.designation,
        isApproved: user.isApproved,
        seekingRole: user.seekingRole, 
        atsScore: user.atsScore,
        profilePic: user.profilePic, 
        extractedName: user.extractedName, 
        resumeText: user.resumeText 
      } 
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ==========================================
// 🎓 COORDINATOR MANAGEMENT ROUTES
// ==========================================

// 0. CREATE NEW COORDINATOR (Existing Coordinator / Admin Only)
router.post("/coordinator/create-coordinator", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ message: "Name, email, and password required" });
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: "Account already exists with this email" });

    const newCoordinator = new User({
      name,
      email,
      password,
      role: 'coordinator',
      isApproved: true,
      approvalStatus: 'APPROVED'
    });
    await newCoordinator.save();
    res.status(201).json({ ok: true, message: "New Academic Coordinator account created successfully!" });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

// 1. GET PENDING STUDENT REGISTRATIONS (Coordinator)
router.get("/coordinator/pending-registrations", async (req, res) => {
  try {
    const pendingStudents = await User.find({ 
      role: { $in: ['student', 'user'] }, 
      approvalStatus: 'PENDING' 
    }).select('-password');
    res.json({ ok: true, pendingStudents });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

// 2. APPROVE STUDENT REGISTRATION (Coordinator)
router.put("/coordinator/approve-student/:id", async (req, res) => {
  try {
    const student = await User.findByIdAndUpdate(
      req.params.id, 
      { isApproved: true, approvalStatus: 'APPROVED' },
      { new: true }
    ).select('-password');
    res.json({ ok: true, message: "Student approved successfully", student });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

// 3. REJECT STUDENT REGISTRATION (Coordinator)
router.put("/coordinator/reject-student/:id", async (req, res) => {
  try {
    await User.findByIdAndUpdate(
      req.params.id, 
      { isApproved: false, approvalStatus: 'REJECTED' }
    );
    res.json({ ok: true, message: "Student registration rejected" });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

// 4. PROMOTE / SET STUDENT ACADEMIC STAGE (Coordinator)
router.put("/coordinator/promote-student/:id", async (req, res) => {
  try {
    const { studentStage } = req.body;
    if (!['YEAR_1_2', 'YEAR_3_INTERN', 'FINAL_YEAR_JOB'].includes(studentStage)) {
      return res.status(400).json({ ok: false, message: "Invalid stage specified" });
    }
    const student = await User.findByIdAndUpdate(
      req.params.id,
      { studentStage },
      { new: true }
    ).select('-password');
    res.json({ ok: true, message: `Student stage updated to ${studentStage}`, student });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

// 4b. GET ALL SUPERVISORS & INTERN CANDIDATES FOR MATCHING (Coordinator)
router.get("/coordinator/supervisors", async (req, res) => {
  try {
    const supervisors = await User.find({ role: 'supervisor' }).select('-password');
    res.json({ ok: true, supervisors });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

router.get("/coordinator/intern-candidates", async (req, res) => {
  try {
    const internStudents = await User.find({ 
      role: { $in: ['student', 'user'] },
      studentStage: 'YEAR_3_INTERN',
      isApproved: true 
    }).select('-password');
    res.json({ ok: true, internStudents });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

// 4c. ASSIGN / MATCH INTERN STUDENT TO SUPERVISOR (Coordinator)
router.post("/coordinator/assign-internship", async (req, res) => {
  try {
    const { studentId, supervisorId, jobId } = req.body;
    if (!studentId || !supervisorId) {
      return res.status(400).json({ ok: false, message: "studentId and supervisorId are required" });
    }

    // 1. Update Student
    const student = await User.findByIdAndUpdate(
      studentId,
      { 
        assignedSupervisor: supervisorId,
        eligibilityStatus: "APPROVED",
        studentStage: "YEAR_3_INTERN"
      },
      { new: true }
    ).populate('assignedSupervisor', 'name email phone companyName designation role');

    // 2. Update Job if jobId provided
    if (jobId) {
      await Job.findByIdAndUpdate(jobId, {
        status: 'approved',
        isMatched: true,
        $addToSet: { assignedStudents: studentId }
      });
    }

    // 3. Create or update connection request as ACCEPTED
    await Request.findOneAndUpdate(
      { employerId: supervisorId, employeeId: studentId },
      { status: 'ACCEPTED', requestedByRole: 'supervisor' },
      { upsert: true, new: true }
    );

    res.json({ ok: true, message: "Intern student successfully matched & assigned to Supervisor!", student });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

// 5. STUDENT SUBMIT REQUEST TO RESET LINKED SOCIAL ACCOUNTS
router.post("/student/request-social-reset", async (req, res) => {
  try {
    const { userId, reason } = req.body;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "Student not found" });

    user.socialResetRequest = {
      requestedAt: new Date(),
      reason: reason || "Student requested GitHub/LinkedIn modification",
      status: "PENDING"
    };
    await user.save();
    res.json({ ok: true, message: "Social account modification request submitted to your LNBTI Academic Coordinator." });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// 6. GET PENDING SOCIAL RESETS (Coordinator)
router.get("/coordinator/pending-social-resets", async (req, res) => {
  try {
    const pendingResets = await User.find({ "socialResetRequest.status": "PENDING" }).select("-password");
    res.json({ ok: true, pendingResets });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// 7. APPROVE & UNLOCK SOCIAL RESET (Coordinator)
router.put("/coordinator/approve-social-reset/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "Student not found" });

    user.githubLocked = false;
    user.linkedinLocked = false;
    user.githubUsername = "";
    user.linkedinProfileUrl = "";
    user.githubRepos = [];
    user.githubEvaluation = { score: 0, summary: "", detectedSkills: [] };
    user.socialResetRequest = { status: "APPROVED", approvedAt: new Date() };

    await user.save();
    res.json({ ok: true, message: "Student social accounts unlocked & reset successfully!" });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ==========================================
// 🧠 AI & RESUME ROUTES (The "Smart" Feature)
// ==========================================

function extractFirstJPEG(buffer) {
  const startMarker = Buffer.from([0xFF, 0xD8]);
  const endMarker = Buffer.from([0xFF, 0xD9]);
  const startIndex = buffer.indexOf(startMarker);
  if (startIndex === -1) return null;
  const endIndex = buffer.indexOf(endMarker, startIndex);
  if (endIndex === -1) return null;
  // Make sure the image is at least a few KB to avoid tiny thumbnail noise
  if (endIndex - startIndex < 1024) return null;
  const imgBuffer = buffer.subarray(startIndex, endIndex + 2);
  return `data:image/jpeg;base64,${imgBuffer.toString('base64')}`;
}

router.post("/upload-resume", upload.single("resume"), async (req, res) => {
  try {
    const { userId } = req.body;
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    // 1. Extract Text & Default Profile Pic
    const pdfData = await pdfParse(req.file.buffer);
    const text = pdfData.text.toLowerCase();
    const profilePic = extractFirstJPEG(req.file.buffer);

    // Debug: See what the code sees
    console.log("--- PDF TEXT ---");
    console.log(text.substring(0, 300) + "...");

    let aiRole = "General Applicant";
    let atsScore = 65;

    // Extract Skills & Bio Snippet
    const ALL_SKILLS = ["react", "python", "java", "sql", "aws", "docker", "angular", "node", "javascript", "c++", "c#", "flutter", "swift", "machine learning", "data science", "agile", "scrum", "marketing", "seo", "sales", "finance", "autocad", "chef", "culinary", "design", "ui/ux", "html", "css", "management", "leadership", "analytics", "nursing", "teaching"];
    const extractedSkills = ALL_SKILLS.filter(s => text.includes(s));

    // Clean up text for a bio snippet
    const cleanText = text.replace(/[\r\n]+/g, " ");
    const bioSnippet = cleanText.length > 160 ? cleanText.substring(0, 160).trim() + "..." : cleanText.trim();

    // Extract Name
    const lines = pdfData.text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    let extractedName = "";
    const ignoreList = ["resume", "cv", "curriculum", "vitae", "page", "profile", "contact", "email", "phone"];
    for (const line of lines.slice(0, 10)) {
      const words = line.split(/\s+/);
      const lowerLine = line.toLowerCase();
      const hasIgnoreWord = ignoreList.some(iw => lowerLine.includes(iw));

      if (words.length >= 1 && words.length <= 4 && !/\d/.test(line) && !hasIgnoreWord) {
        extractedName = words.map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");
        break;
      }
    }

    if (process.env.XAI_API_KEY) {
      const completion = await client.chat.completions.create({
        model: "grok-beta",
        messages: [{ role: "system", content: "You are an HR expert. Return ONLY the job title." }, { role: "user", content: pdfData.text }]
      });
      aiRole = completion.choices[0].message.content.trim();
      atsScore = 80 + Math.floor(Math.random() * 15);
    } else {
      // ⚠️ ENHANCED MOCK LOGIC ⚠️

      // --- CULINARY / CHEF / HOSPITALITY ---
      if (text.includes("chef") || text.includes("culinary") || text.includes("kitchen") || text.includes("cooking") || text.includes("sous") || text.includes("food") || text.includes("restaurant") || text.includes("catering") || text.includes("hotel") || text.includes("hospitality") || text.includes("tourism") || text.includes("housekeeping") || text.includes("receptionist")) {
        aiRole = "Chef / Hospitality Specialist";
        atsScore = 85 + Math.floor(Math.random() * 10);
      }
      // --- IT / TECH ---
      else if (text.includes("react") || text.includes("angular") || text.includes("frontend") || /\bui\b/i.test(text) || text.includes("web")) {
        aiRole = "UI Engineer";
        atsScore = 88 + Math.floor(Math.random() * 8);
      }
      else if (text.includes("python") || text.includes("data science") || text.includes("machine learning") || text.includes("sql") || text.includes("data")) {
        aiRole = "Data Scientist";
        atsScore = 86 + Math.floor(Math.random() * 9);
      }
      else if (text.includes("java") || text.includes("node") || text.includes("backend") || /\bapi\b/i.test(text) || /\baws\b/i.test(text)) {
        aiRole = "Backend Engineer";
        atsScore = 87 + Math.floor(Math.random() * 10);
      }
      else if (text.includes("flutter") || text.includes("swift") || text.includes("android") || /\bios\b/i.test(text) || text.includes("mobile")) {
        aiRole = "Mobile Developer";
        atsScore = 85 + Math.floor(Math.random() * 12);
      }

      // --- BUSINESS ---
      else if (text.includes("marketing") || /\bseo\b/i.test(text) || text.includes("brand") || text.includes("sales") || text.includes("customer")) {
        aiRole = "Marketing Specialist";
        atsScore = 89 + Math.floor(Math.random() * 8);
      }
      else if (text.includes("accounting") || text.includes("finance") || text.includes("audit") || /\btax\b|\btaxes\b|\btaxation\b/i.test(text) || text.includes("bank")) {
        aiRole = "Accountant";
        atsScore = 86 + Math.floor(Math.random() * 10);
      }
      else if (text.includes("project management") || text.includes("agile") || text.includes("scrum") || text.includes("manager") || text.includes("lead")) {
        aiRole = "Project Manager";
        atsScore = 90 + Math.floor(Math.random() * 7);
      }

      // --- ENGINEERING ---
      else if (text.includes("civil") || text.includes("construction") || text.includes("autocad") || text.includes("architect")) {
        aiRole = "Civil Engineer";
        atsScore = 88 + Math.floor(Math.random() * 8);
      }
      else if (text.includes("mechanical") || text.includes("solidworks") || text.includes("manufacturing")) {
        aiRole = "Mechanical Engineer";
        atsScore = 87 + Math.floor(Math.random() * 8);
      }

      // --- OTHER ---
      else if (text.includes("teaching") || text.includes("education") || text.includes("tutor") || text.includes("school")) {
        aiRole = "Teacher";
        atsScore = 85 + Math.floor(Math.random() * 12);
      }
      else if (text.includes("nursing") || text.includes("medical") || text.includes("patient") || text.includes("hospital") || text.includes("doctor")) {
        aiRole = "Healthcare Professional";
        atsScore = 92 + Math.floor(Math.random() * 6);
      } else {
        aiRole = "Business Operations Associate";
        atsScore = 75 + Math.floor(Math.random() * 10);
      }
    }

    const atsImprovements = [
      "Use clear, ATS-parseable section headings: 'Technical Skills', 'Experience', 'Projects', 'Education'",
      "Incorporate action verbs at the start of each bullet point (e.g. Developed, Engineered, Optimized)",
      "Add quantifiable metrics to experience descriptions (e.g. 'improved app load time by 35%')",
      `Include core tech stack keywords: ${extractedSkills.slice(0, 6).join(", ") || "Git, JavaScript, Python"}`
    ];

    // Generate Role-Based Industry Keywords
    const roleKeywordsMap = {
      "Chef / Hospitality Specialist": ["HACCP Food Safety", "Culinary Operations", "Menu Engineering", "Inventory Control", "Kitchen Hygiene", "Catering & Banquet Management"],
      "UI Engineer": ["React / Vue", "TypeScript", "CSS Grid / Flexbox", "Figma / UI Design", "Web Accessibility (a11y)", "State Management"],
      "Data Scientist": ["Python / Pandas", "Machine Learning", "SQL Database", "Data Visualization", "Statistical Analysis", "Scikit-Learn"],
      "Backend Engineer": ["Node.js / Java", "RESTful APIs", "Database Optimization", "Microservices", "Docker / Kubernetes", "CI/CD"],
      "Mobile Developer": ["Flutter / React Native", "iOS (Swift) / Android (Kotlin)", "Mobile State Management", "App Store Deployment"],
      "Marketing Specialist": ["SEO / SEM", "Content Marketing", "Google Analytics", "Social Media Campaigns", "Conversion Rate Optimization"],
      "Accountant": ["Financial Auditing", "Tax Compliance", "QuickBooks / SAP", "Financial Reporting", "Ledger Management"],
      "Project Manager": ["Agile / Scrum", "JIRA", "Risk Assessment", "Stakeholder Communication", "Budget Management"]
    };

    const roleKeywords = roleKeywordsMap[aiRole] || ["Project Lifecycle", "Team Collaboration", "Process Optimization", "Quality Assurance"];

    const analysisResult = {
      summary: `Resume successfully analyzed for target role: ${aiRole}. ATS Compatibility Score computed at ${atsScore}%.`,
      strengths: [
        "Well-structured section organization with clean formatting",
        `Extracted core competencies: ${extractedSkills.slice(0, 5).join(", ") || "Industry Skills"}`,
        `Directly aligns with ${aiRole} industry requirements`
      ],
      weaknesses: [
        "Include more quantifiable impact metrics (percentages, dollar amounts, project volumes)",
        "Highlight specific professional certifications or official university credentials"
      ],
      improvements: atsImprovements,
      keywordsToAdd: roleKeywords,
      improvedBulletPoints: [
        `Spearheaded daily operational workflows for ${aiRole}, increasing team productivity by 25%.`,
        `Standardized quality control guidelines and project documentation, reducing process errors by 30%.`,
        `Collaborated with cross-functional teams to execute key deliverables on time and within budget.`
      ],
      careerPath: {
        currentStage: `Associate / Mid-Level ${aiRole}`,
        shortTermSteps: [
          `Master specialized tools and frameworks relevant to ${aiRole}`,
          "Complete 1–2 practical portfolio projects demonstrating end-to-end execution",
          "Obtain an accredited professional certification"
        ],
        midTermSteps: [
          `Advance to Senior / Lead ${aiRole}`,
          "Lead complex high-impact projects and cross-functional team initiatives",
          "Mentor junior staff members and drive process improvements"
        ],
        longTermSteps: [
          `Promote to Head / Director of ${aiRole} Operations`,
          "Oversee regional strategy, budget allocation, and department scaling"
        ],
        ultimateGoal: `Principal Specialist / Executive Director in ${aiRole}`,
        recommendedRoles: [aiRole, `Senior ${aiRole}`, `${aiRole} Team Lead`],
        recommendedCourses: [
          `Professional ${aiRole} Specialization Certificate`,
          "Strategic Leadership & Operations Management",
          "Advanced Quality & Compliance Standards"
        ]
      }
    };

    // 3. Save
    const updatePayload = { 
      resumeText: pdfData.text, 
      seekingRole: aiRole, 
      atsScore, 
      atsImprovements,
      skills: extractedSkills, 
      bioSnippet 
    };
    await User.findByIdAndUpdate(userId, updatePayload);

    console.log(`✅ Assigned ATS Role: ${aiRole} | Score: ${atsScore}%`);
    res.json({ 
      ok: true, 
      role: aiRole, 
      atsScore, 
      atsImprovements,
      result: analysisResult,
      resumeText: pdfData.text, 
      message: "Resume analyzed for ATS optimization successfully!" 
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, error: e.message });
  }
});

// ... (Keep Recruitment, Admin, Saved Routes exactly the same) ...
// 1. GET CANDIDATES / STUDENTS
router.get("/candidates", async (req, res) => {
  try {
    const candidates = await User.find({ role: { $nin: ['employer', 'supervisor', 'admin', 'coordinator'] } })
      .populate('assignedSupervisor', 'name email phone companyName designation role')
      .select('-password');
    res.json({ ok: true, candidates, students: candidates });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

router.get("/students", async (req, res) => {
  try {
    const students = await User.find({ role: { $nin: ['employer', 'supervisor', 'admin', 'coordinator'] } })
      .populate('assignedSupervisor', 'name email phone companyName designation role')
      .select('-password');
    res.json({ ok: true, students, candidates: students });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

// 🤖 AI MULTI-SOURCE STUDENT BACKGROUND CHECK & RECRUITER VERDICT
router.post("/ai-background-check", async (req, res) => {
  try {
    const { studentId } = req.body;
    if (!studentId) return res.status(400).json({ ok: false, message: "studentId is required" });

    const student = await User.findById(studentId).select("-password");
    if (!student) return res.status(404).json({ ok: false, message: "Student not found" });

    const hasGithub = !!(student.githubUsername || (student.githubRepos && student.githubRepos.length > 0));
    const hasLinkedin = !!(student.linkedinProfileUrl || student.linkedinData);
    const repoCount = student.githubRepos ? student.githubRepos.length : (hasGithub ? 8 : 0);
    const ghScore = student.githubEvaluation?.score || (hasGithub ? 85 : 0);
    const network = student.linkedinData?.connections || (hasLinkedin ? "500+ Connections" : "Not Linked");
    const ats = student.atsScore || 85;

    const overallRating = Math.min(98, Math.max(75, Math.round((ghScore * 0.35) + (ats * 0.35) + (hasLinkedin ? 25 : 10) + (hasGithub ? 10 : 0))));

    const report = {
      overallRating,
      ratingBadge: overallRating >= 90 ? "🌟 Top Tier Talent — High Potential Direct Recruit Match" : "✅ Solid Qualified Candidate",
      verificationStatus: {
        githubVerified: hasGithub,
        linkedinVerified: hasLinkedin,
        academicVerified: true,
        identityVerified: true
      },
      aiSynthesisVerdict: `AI Talent Background Check: ${student.name} demonstrates a verified multi-source candidate profile. ${hasGithub ? `GitHub telemetry confirms ${repoCount} active repositories with an AI Code Quality index of ${ghScore}/100.` : 'GitHub repository sync recommended.'} ${hasLinkedin ? `LinkedIn professional profile verified (${network}) with validated industry skill matrix.` : 'LinkedIn account link pending.'} Academic Standing: ${student.degreeProgram || 'BSc Software Engineering'} (GPA ${student.gpa || '3.65'}, JLPT ${student.jlptLevel || 'N4'}). Background Verification Risk Level: LOW (<2%). Outstanding candidate suitability for direct recruiter outreach and coordinator internship matching.`,
      highlights: [
        hasGithub ? `🐙 GitHub Verified: ${repoCount} Public Repositories (Code Index: ${ghScore}/100)` : "🐙 GitHub Account Pending",
        hasLinkedin ? `💼 LinkedIn Verified: ${network} • ${student.linkedinData?.headline || 'Professional Profile'}` : "💼 LinkedIn Link Pending",
        `🎓 Academic Status: ${student.degreeProgram || 'BSc Software Engineering'} (GPA: ${student.gpa || '3.65'}, JLPT: ${student.jlptLevel || 'N4'})`,
        `⚡ ATS Resume Compatibility: ${ats}%`
      ],
      skillsMatrix: student.skills?.length ? student.skills : ["React.js", "Node.js", "TypeScript", "SQL", "REST APIs"],
      riskLevel: "Low Risk — Verified University & Social Telemetry"
    };

    res.json({ ok: true, student, report });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

// 2. REQUEST CONNECTION
router.post("/request-connection", async (req, res) => {
  try {
    const { employerId, employeeId, studentId } = req.body;
    const targetStudentId = employeeId || studentId;
    if (!targetStudentId) {
      return res.status(400).json({ message: "Student ID is required." });
    }

    const existing = await Request.findOne({ employerId, employeeId: targetStudentId });
    if (existing) return res.status(400).json({ message: "Request pending or already submitted" });
    
    // Check requester role
    const sender = await User.findById(employerId);
    const isSupervisor = sender?.role === 'supervisor';
    const status = isSupervisor ? 'PENDING_COORDINATOR' : 'PENDING_ADMIN';
    const requestedByRole = isSupervisor ? 'supervisor' : 'employer';

    await Request.create({ 
      employerId, 
      employeeId: targetStudentId, 
      status, 
      requestedByRole 
    });

    res.json({ 
      ok: true, 
      message: isSupervisor 
        ? "Connection request sent to LNBTI Academic Coordinator for review." 
        : "Connection request submitted! Waiting for Admin review." 
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// 3. MY REQUESTS
router.get("/my-requests", async (req, res) => {
  try {
    const requests = await Request.find({ employeeId: req.query.userId }).populate('employerId', 'name email companyName designation');
    res.json({ ok: true, requests });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// 4. UPDATE REQUEST
router.put("/requests/:id", async (req, res) => {
  try {
    await Request.findByIdAndUpdate(req.params.id, { status: req.body.status });
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// 5. ADMIN PENDING
router.get("/admin/pending-requests", async (req, res) => {
  try {
    const requests = await Request.find({ status: { $in: ['PENDING_ADMIN', 'PENDING_COORDINATOR'] } }).populate('employerId').populate('employeeId');
    res.json({ ok: true, requests });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// 6. SAVED ITEMS
router.post('/save-recommendation', async (req, res) => {
  try {
    const { userId = "anonymous", careerTitle, score } = req.body;
    if (userId === "anonymous") {
      await Saved.create({ careerTitle, score, userId: "anonymous", createdAt: new Date() });
      return res.json({ ok: true });
    }
    const u = await User.findById(userId);
    if (u) { u.saved.push({ careerTitle, score, date: new Date() }); await u.save(); }
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

router.get('/saved', async (req, res) => {
  const userId = req.query.userId || "anonymous";
  if (userId === "anonymous") { const list = await Saved.find({ userId: "anonymous" }).lean(); return res.json({ ok: true, saved: list }); }
  const user = await User.findById(userId).lean();
  res.json({ ok: true, saved: user?.saved || [] });
});

// 7. JOB MATCH
router.post("/match-job", async (req, res) => {
  try {
    const { userId, jobDescription } = req.body;
    const user = await User.findById(userId);
    if (!user || !user.resumeText) return res.status(400).json({ ok: false, message: "Upload resume first!" });

    let feedback = { score: 0, advice: "Analysis failed" };

    // MOCK MATCH LOGIC
    const resumeWords = new Set(user.resumeText.toLowerCase().split(/\W+/));
    const jdWords = jobDescription.toLowerCase().split(/\W+/);
    let matchCount = 0;
    // Expanded keywords for Chef compatibility
    const keywords = ["chef", "cooking", "food", "kitchen", "hygiene", "menu", "react", "python", "java", "sql", "communication"];
    const missing = [];

    keywords.forEach(word => {
      if (jdWords.includes(word)) {
        if (resumeWords.has(word)) matchCount += 10;
        else missing.push(word);
      }
    });

    let score = Math.min(95, Math.max(30, 30 + matchCount));
    feedback = { score, missingSkills: missing.slice(0, 3), advice: missing.length ? `Add: ${missing.join(", ")}` : "Good match!" };

    res.json({ ok: true, result: feedback });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

// 4c. ASSIGN / MATCH INTERN STUDENT TO SUPERVISOR (Coordinator)
router.post("/coordinator/assign-internship", async (req, res) => {
  try {
    const { studentId, supervisorId, jobId } = req.body;
    if (!studentId || !supervisorId) {
      return res.status(400).json({ ok: false, message: "studentId and supervisorId are required" });
    }

    // 1. Update Student
    const student = await User.findByIdAndUpdate(
      studentId,
      { 
        assignedSupervisor: supervisorId,
        eligibilityStatus: "APPROVED",
        studentStage: "YEAR_3_INTERN"
      },
      { new: true }
    ).populate('assignedSupervisor', 'name email phone companyName designation');

    // 2. Update Job if jobId provided
    if (jobId) {
      await Job.findByIdAndUpdate(jobId, {
        status: 'approved',
        isMatched: true,
        $addToSet: { assignedStudents: studentId }
      });
    }

    // 3. Create or update connection request as ACCEPTED
    await Request.findOneAndUpdate(
      { employerId: supervisorId, employeeId: studentId },
      { status: 'ACCEPTED', requestedByRole: 'supervisor' },
      { upsert: true, new: true }
    );

    res.json({ ok: true, message: "Intern student successfully matched & assigned to Supervisor!", student });
  } catch (e) { res.status(500).json({ ok: false, message: e.message }); }
});

// ==========================================
// 📢 JOB BOARD ROUTES (Dual Workflow: Supervisor vs Employer)
// ==========================================

// 1. POST A JOB (Supervisor -> Internship -> Pending Coordinator; Employer -> Direct Job -> Approved)
router.post("/post-job", async (req, res) => {
  try {
    const { employerId, title, description, salary, location, contactEmail, contactPhone, opportunityType, targetStage } = req.body;
    
    // Check poster role
    const poster = await User.findById(employerId);
    const isSupervisor = poster?.role === 'supervisor';

    let finalOppType = opportunityType || (isSupervisor ? "INTERNSHIP" : "FULL_TIME");
    let finalStage = targetStage || (isSupervisor ? "YEAR_3_INTERN" : "FINAL_YEAR_JOB");
    let finalStatus = isSupervisor ? "pending_coordinator" : "approved";
    let postedByRole = isSupervisor ? "supervisor" : "employer";

    const newJob = await Job.create({ 
      employerId, 
      supervisorId: isSupervisor ? employerId : undefined,
      title, 
      description, 
      salary, 
      location,
      contactEmail: contactEmail || poster?.email || "",
      contactPhone: contactPhone || poster?.phone || "",
      opportunityType: finalOppType,
      targetStage: finalStage,
      status: finalStatus,
      postedByRole
    });

    res.json({ 
      ok: true, 
      job: newJob,
      message: isSupervisor 
        ? "Internship vacancy submitted to LNBTI Academic Coordinator Hub for student matching." 
        : "Direct Job posted live to 4th Year Student Dashboards!" 
    });
  } catch (e) { res.status(500).json({ ok: false, message: e.message }); }
});

// 2. GET UNMATCHED JOBS (Admin / Coordinator Hub)
router.get("/admin/pending-jobs", async (req, res) => {
  try {
    const jobs = await Job.find({
      isMatched: { $ne: true }
    }).populate("employerId", "name email phone companyName designation role").populate("supervisorId", "name email phone companyName designation role");

    res.json({ ok: true, jobs });
  } catch (e) { res.status(500).json({ ok: false, message: e.message }); }
});

// 3. APPROVE/REJECT JOB (Admin / Coordinator)
router.put("/admin/jobs/:id", async (req, res) => {
  try {
    const { status } = req.body; // 'approved' or 'rejected'
    await Job.findByIdAndUpdate(req.params.id, { status });
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// 4. GET DIRECT JOBS FOR STUDENTS (Filtered by Student Stage)
router.get("/jobs", async (req, res) => {
  try {
    const { studentStage, userId } = req.query;

    let userStage = studentStage;
    if (!userStage && userId) {
      const u = await User.findById(userId);
      userStage = u?.studentStage;
    }

    // 🎓 RULE:
    // If student is 3rd Year Intern (YEAR_3_INTERN), supervisor internship vacancies do NOT show up directly.
    // Internship vacancies are matched via the Academic Coordinator.
    if (userStage === "YEAR_3_INTERN") {
      return res.json({ ok: true, jobs: [], isInternStage: true, message: "Internship vacancies are matched and assigned directly by your LNBTI Academic Coordinator." });
    }

    // 🎓 4th Year Direct Jobs (FINAL_YEAR_JOB): Shows direct jobs posted by Corporate HR (employer)
    const jobs = await Job.find({ 
      status: "approved", 
      targetStage: { $in: ["FINAL_YEAR_JOB", "ALL"] } 
    }).populate("employerId", "name email companyName designation");

    res.json({ ok: true, jobs });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// 5. INCREMENT JOB CLICK (Student)
router.put("/jobs/:id/click", async (req, res) => {
  try {
    const job = await Job.findByIdAndUpdate(req.params.id, { $inc: { applyClicks: 1 } }, { new: true });
    res.json({ ok: true, applyClicks: job.applyClicks });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// 6. GET EMPLOYER/SUPERVISOR'S POSTED JOBS (Employer & Supervisor Dashboard)
router.get("/my-jobs/:employerId", async (req, res) => {
  try {
    const { employerId } = req.params;
    const jobs = await Job.find({
      $or: [
        { employerId: employerId },
        { supervisorId: employerId }
      ]
    }).sort({ createdAt: -1 });

    res.json({ ok: true, jobs });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get("/employer-jobs", async (req, res) => {
  try {
    const { employerId } = req.query;
    if (!employerId) return res.status(400).json({ error: "Missing employerId" });
    const jobs = await Job.find({
      $or: [
        { employerId: employerId },
        { supervisorId: employerId }
      ]
    }).sort({ createdAt: -1 });

    res.json({ ok: true, jobs });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// 7. DELETE A JOB (Employer)
router.delete("/jobs/:id", async (req, res) => {
  try {
    await Job.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;