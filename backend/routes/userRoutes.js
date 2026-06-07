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
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) return res.status(400).json({ message: "All fields required" });
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: "User already exists" });
    const newUser = new User({ name, email, password, role: role || 'user' });
    await newUser.save();
    res.status(201).json({ message: "Registered", user: { id: newUser._id, name: newUser.name, role: newUser.role } });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// LOGIN
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || user.password !== password) return res.status(400).json({ message: "Invalid credentials" });
    res.json({ message: "Login success", user: { id: user._id, name: user.name, email: user.email, role: user.role, seekingRole: user.seekingRole, profilePic: user.profilePic, extractedName: user.extractedName, resumeText: user.resumeText } });
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

      // --- CULINARY / CHEF ---
      if (text.includes("chef") || text.includes("culinary") || text.includes("kitchen") || text.includes("cooking") || text.includes("sous") || text.includes("food") || text.includes("restaurant") || text.includes("catering")) {
        aiRole = "Chef / Culinary Expert";
        atsScore = 85 + Math.floor(Math.random() * 10);
      }
      // --- IT / TECH ---
      else if (text.includes("react") || text.includes("angular") || text.includes("frontend") || text.includes("ui") || text.includes("web")) {
        aiRole = "UI Engineer";
        atsScore = 88 + Math.floor(Math.random() * 8);
      }
      else if (text.includes("python") || text.includes("data science") || text.includes("machine learning") || text.includes("sql") || text.includes("data")) {
        aiRole = "Data Scientist";
        atsScore = 86 + Math.floor(Math.random() * 9);
      }
      else if (text.includes("java") || text.includes("node") || text.includes("backend") || text.includes("api") || text.includes("aws")) {
        aiRole = "Backend Engineer";
        atsScore = 87 + Math.floor(Math.random() * 10);
      }
      else if (text.includes("flutter") || text.includes("swift") || text.includes("android") || text.includes("ios") || text.includes("mobile")) {
        aiRole = "Mobile Developer";
        atsScore = 85 + Math.floor(Math.random() * 12);
      }

      // --- BUSINESS ---
      else if (text.includes("marketing") || text.includes("seo") || text.includes("brand") || text.includes("sales") || text.includes("customer")) {
        aiRole = "Marketing Specialist";
        atsScore = 89 + Math.floor(Math.random() * 8);
      }
      else if (text.includes("accounting") || text.includes("finance") || text.includes("audit") || text.includes("tax") || text.includes("bank")) {
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

    // 3. Save
    const updatePayload = { resumeText: pdfData.text, seekingRole: aiRole, atsScore, skills: extractedSkills, bioSnippet };
    if (profilePic) updatePayload.profilePic = profilePic;
    if (extractedName) updatePayload.extractedName = extractedName;
    await User.findByIdAndUpdate(userId, updatePayload);

    console.log(`✅ Assigned: ${aiRole} Output Score: ${atsScore} Name: ${extractedName}`);
    res.json({ ok: true, role: aiRole, atsScore, profilePic, extractedName, resumeText: pdfData.text, message: "Resume parsed successfully!" });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, error: e.message });
  }
});

// ... (Keep Recruitment, Admin, Saved Routes exactly the same) ...
// 1. GET CANDIDATES
router.get("/candidates", async (req, res) => {
  try {
    const candidates = await User.find({ role: { $nin: ['employer', 'admin'] } }).select('-password');
    res.json({ ok: true, candidates });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

// 2. REQUEST CONNECTION
router.post("/request-connection", async (req, res) => {
  try {
    const { employerId, employeeId } = req.body;
    const existing = await Request.findOne({ employerId, employeeId });
    if (existing) return res.status(400).json({ message: "Request pending" });
    await Request.create({ employerId, employeeId, status: 'PENDING_ADMIN' });
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// 3. MY REQUESTS
router.get("/my-requests", async (req, res) => {
  try {
    const requests = await Request.find({ employeeId: req.query.userId }).populate('employerId', 'name email');
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
    const requests = await Request.find({ status: 'PENDING_ADMIN' }).populate('employerId').populate('employeeId');
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

// ==========================================
// 📢 JOB BOARD ROUTES (New Feature)
// ==========================================

// 1. POST A JOB (Employer) -> Status: Pending
router.post("/post-job", async (req, res) => {
  try {
    const { employerId, title, description, salary, location } = req.body;
    await Job.create({ employerId, title, description, salary, location, status: "pending" });
    res.json({ ok: true, message: "Job posted! Waiting for Admin approval." });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// 2. GET PENDING JOBS (Admin)
router.get("/admin/pending-jobs", async (req, res) => {
  try {
    const jobs = await Job.find({ status: "pending" }).populate("employerId", "name email");
    res.json({ ok: true, jobs });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// 3. APPROVE/REJECT JOB (Admin)
router.put("/admin/jobs/:id", async (req, res) => {
  try {
    const { status } = req.body; // 'approved' or 'rejected'
    await Job.findByIdAndUpdate(req.params.id, { status });
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// 4. GET APPROVED JOBS (Student)
router.get("/jobs", async (req, res) => {
  try {
    const jobs = await Job.find({ status: "approved" }).populate("employerId", "name email");
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

// 6. GET EMPLOYER'S JOBS (Employer)
router.get("/employer-jobs", async (req, res) => {
  try {
    const { employerId } = req.query;
    if (!employerId) return res.status(400).json({ error: "Missing employerId" });
    const jobs = await Job.find({ employerId });
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