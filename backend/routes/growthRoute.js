// backend/routes/growthRoute.js
const express = require("express");
const router = express.Router();
const Groq = require("groq-sdk");

const GrowthProgress = require("../models/growthProgress");

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

function clampPct(n) {
  const x = Number.isFinite(n) ? n : 0;
  return Math.max(0, Math.min(100, Math.round(x)));
}

function ensureProgress(obj) {
  const p = obj || {};
  return {
    academic: clampPct(p.academic),
    industry: clampPct(p.industry),
    skills: clampPct(p.skills),
    certifications: clampPct(p.certifications),
    networking: clampPct(p.networking),
  };
}

function ensureTodos(arr) {
  return Array.isArray(arr) ? arr.filter(Boolean).map(String).slice(0, 12) : [];
}

function extractJson(text = "") {
  const firstBrace = text.indexOf("{");
  const firstBracket = text.indexOf("[");
  
  let first = -1;
  let last = -1;
  
  if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
    first = firstBrace;
    last = text.lastIndexOf("}");
  } else if (firstBracket !== -1) {
    first = firstBracket;
    last = text.lastIndexOf("]");
  }
  
  if (first === -1 || last === -1 || last <= first) {
    return text.trim();
  }
  
  let jsonString = text.slice(first, last + 1);
  
  try {
    JSON.parse(jsonString);
    return jsonString;
  } catch (e) {
    const cleaned = jsonString
      .replace(/,\s*([}\]])/g, "$1")
      .replace(/\/\/.*/g, "")
      .replace(/\/\*[\s\S]*?\*\//g, "");
    try {
      JSON.parse(cleaned);
      return cleaned;
    } catch (err) {
      return jsonString;
    }
  }
}

function defaultState() {
  return {
    progress: { academic: 0, industry: 0, skills: 0, certifications: 0, networking: 0 },
    todos: [
      "Log one learning activity you did today",
      "Add 1 new skill you want to improve this week",
      "Complete one small portfolio task (even 30 minutes)",
    ],
    explanation: "Start logging small wins daily — the AI will adjust your progress and tasks.",
  };
}

/**
 * GET /api/growth/state?userId=...
 * Returns saved state (creates default if none)
 */
router.get("/state", async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ ok: false, message: "userId is required" });

    let doc = await GrowthProgress.findOne({ userId }).lean();
    if (!doc) {
      const seed = defaultState();
      const created = await GrowthProgress.create({
        userId,
        progress: seed.progress,
        todos: seed.todos,
        lastExplanation: seed.explanation,
      });
      doc = created.toObject();
    }

    return res.json({
      ok: true,
      progress: ensureProgress(doc.progress),
      todos: ensureTodos(doc.todos),
      explanation: doc.lastExplanation || "",
      lastLog: doc.lastLog || "",
      updatedAt: doc.updatedAt,
    });
  } catch (err) {
    console.error("Growth state error:", err);
    return res.status(500).json({ ok: false, message: err.message });
  }
});

/**
 * POST /api/growth/evaluate
 * Body: { userId, logText }
 */
router.post("/evaluate", async (req, res) => {
  try {
    const { userId, logText = "" } = req.body;
    if (!userId) return res.status(400).json({ ok: false, message: "userId is required" });
    if (!logText.trim()) return res.status(400).json({ ok: false, message: "logText is required" });

    // Load current state (or create default)
    let doc = await GrowthProgress.findOne({ userId });
    if (!doc) {
      const seed = defaultState();
      doc = await GrowthProgress.create({
        userId,
        progress: seed.progress,
        todos: seed.todos,
        lastExplanation: seed.explanation,
      });
    }

    const current = ensureProgress(doc.progress);

    const systemPrompt = `
You are an AI career growth coach.
Return ONLY valid JSON (no markdown, no comments, no extra text).
The user writes a progress log. Update the five progress categories (0-100).
Give practical todos and a concise explanation.
`;

    const userPrompt = `
User progress log:
"${logText}"

Current progress:
${JSON.stringify(current)}

Rules:
- Output JSON only
- Keep progress realistic: small changes for small actions
- Each progress field must be an integer 0-100
- todos: 5 to 8 items, short actionable tasks
- explanation: 2 to 5 sentences, friendly and specific to the log
Return this JSON shape exactly:
{
  "progress": { "academic": 0, "industry": 0, "skills": 0, "certifications": 0, "networking": 0 },
  "todos": ["..."],
  "explanation": "..."
}
`;

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      temperature: 0.3,
      messages: [
        { role: "system", content: systemPrompt.trim() },
        { role: "user", content: userPrompt.trim() },
      ],
    });

    const raw = completion.choices?.[0]?.message?.content || "";
    const jsonText = extractJson(raw);

    let parsed;
    try {
      parsed = JSON.parse(jsonText);
    } catch (e) {
      console.error("Growth JSON parse fail. Raw:", raw);
      return res.status(500).json({
        ok: false,
        message: "AI returned invalid JSON",
        raw: raw.slice(0, 1200),
      });
    }

    const nextProgress = ensureProgress(parsed.progress);
    const nextTodos = ensureTodos(parsed.todos);
    const nextExplanation = String(parsed.explanation || "").slice(0, 1200);

    // Save
    doc.progress = nextProgress;
    doc.todos = nextTodos;
    doc.lastLog = logText;
    doc.lastExplanation = nextExplanation;

    doc.history.unshift({
      logText,
      progress: nextProgress,
      todos: nextTodos,
      explanation: nextExplanation,
    });

    // Keep last 30 logs
    if (doc.history.length > 30) doc.history = doc.history.slice(0, 30);

    await doc.save();

    return res.json({
      ok: true,
      progress: nextProgress,
      todos: nextTodos,
      explanation: nextExplanation,
      updatedAt: doc.updatedAt,
    });
  } catch (err) {
    console.error("Growth evaluate error:", err);
    return res.status(500).json({ ok: false, message: err.message });
  }
});


/**
 * GET /api/growth/history?userId=...&limit=7
 * Returns latest logs from history
 */
router.get("/history", async (req, res) => {
  try {
    const { userId, limit = 7 } = req.query;
    if (!userId) return res.status(400).json({ ok: false, message: "userId is required" });

    const doc = await GrowthProgress.findOne({ userId }).lean();
    if (!doc) return res.json({ ok: true, history: [] });

    const n = Math.max(1, Math.min(30, parseInt(limit, 10) || 7));
    const history = Array.isArray(doc.history) ? doc.history.slice(0, n) : [];

    return res.json({ ok: true, history });
  } catch (err) {
    console.error("Growth history error:", err);
    return res.status(500).json({ ok: false, message: err.message });
  }
});

/**
 * GET /api/growth/streak?userId=...
 * Calculates daily streak from history timestamps
 */
router.get("/streak", async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ ok: false, message: "userId is required" });

    const doc = await GrowthProgress.findOne({ userId }).lean();
    const history = Array.isArray(doc?.history) ? doc.history : [];

    const dayKey = (d) => {
      const dt = new Date(d);
      return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
    };

    const days = [...new Set(history.map(h => dayKey(h.createdAt || h.createdAt === 0 ? h.createdAt : h.createdAt)).filter(Boolean))];

    if (days.length === 0) return res.json({ ok: true, streak: 0 });

    days.sort((a, b) => (a < b ? 1 : -1));

    const today = new Date();
    const todayKey = dayKey(today);

    const keys = new Set(days);
    let streak = 0;

    const shiftKey = (base, k) => {
      const d = new Date(base);
      d.setDate(d.getDate() - k);
      return dayKey(d);
    };

    let startOffset = keys.has(todayKey) ? 0 : 1;

    for (let i = startOffset; i < 365; i++) {
      const k = shiftKey(today, i);
      if (keys.has(k)) streak++;
      else break;
    }

    return res.json({ ok: true, streak });
  } catch (err) {
    console.error("Growth streak error:", err);
    return res.status(500).json({ ok: false, message: err.message });
  }
});

// ==========================================
// 🧠 GAMIFIED AI QUIZZES & IQ ASSESSMENT API
// ==========================================
const QUIZ_BANKS = require("../data/quizData");
const User = require("../models/user");

async function generateAIQuiz(category, targetContext) {
  try {
    let prompt = "";
    if (category === "IQ") {
      prompt = `Generate 4 multiple-choice IQ/Logic and analytical reasoning questions for university IT students. Return ONLY a valid JSON array of objects with keys: "id" (string), "question" (string), "options" (array of 4 strings), "correct" (number 0-3), "explanation" (string explaining why the correct option is right). No markdown or extra text.`;
    } else if (category === "SE") {
      prompt = `Generate 4 multiple-choice Software Engineering questions tailored specifically for a student at level: ${targetContext}. Questions should test software concepts, coding logic, and software engineering best practices for this level. Return ONLY a valid JSON array of objects with keys: "id" (string), "question" (string), "options" (array of 4 strings), "correct" (number 0-3), "explanation" (string). No markdown or extra text.`;
    } else if (category === "JLPT") {
      prompt = `Generate 4 multiple-choice Japanese language questions tailored for JLPT Level: ${targetContext}. Include Romaji or English translations where appropriate, testing Kanji, vocabulary, particles, and workplace expressions. Return ONLY a valid JSON array of objects with keys: "id" (string), "question" (string), "options" (array of 4 strings), "correct" (number 0-3), "explanation" (string). No markdown or extra text.`;
    }

    if (process.env.GROQ_API_KEY) {
      const resp = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 1000
      });
      const rawText = resp.choices?.[0]?.message?.content || "";
      const jsonStr = extractJson(rawText);
      const parsed = JSON.parse(jsonStr);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn("AI Quiz Generation Warning (falling back to curated bank):", err.message);
  }
  return null;
}

/**
 * GET /api/growth/quiz/questions?userId=...&category=IQ|SE|JLPT
 */
router.get("/quiz/questions", async (req, res) => {
  try {
    const { userId, category } = req.query;
    let bankKey = "IQ";
    let targetContext = "General Logic & IQ";

    const user = await User.findById(userId);

    if (category === "SE") {
      const stage = user?.studentStage || "YEAR_1_2";
      if (stage === "FINAL_YEAR_JOB") {
        bankKey = "SE_FINAL_YEAR_JOB";
        targetContext = "4th Year / Final Year (Microservices, DevOps, System Scalability)";
      } else if (stage === "YEAR_3_INTERN") {
        bankKey = "SE_YEAR_3_INTERN";
        targetContext = "3rd Year (Advanced Algorithms, REST APIs, SQL Indexing)";
      } else {
        bankKey = "SE_YEAR_1_2";
        targetContext = "1st/2nd Year (Data Structures, OOP, Git, JS)";
      }
    } else if (category === "JLPT") {
      const jlpt = user?.jlptLevel || "N4";
      bankKey = `JLPT_${jlpt}`;
      targetContext = `JLPT ${jlpt}`;
    }

    // Try generating fresh AI quiz first
    const aiQuestions = await generateAIQuiz(category, targetContext);
    if (aiQuestions) {
      return res.json({ ok: true, source: "🤖 AI Real-Time Generated", bankKey: `${category} (${targetContext})`, questions: aiQuestions });
    }

    // Fallback to static curated quiz bank
    const questions = QUIZ_BANKS[bankKey] || QUIZ_BANKS.IQ;
    res.json({ ok: true, source: "📚 Curated Question Bank", bankKey, questions });
  } catch (err) {
    console.error("Quiz questions error:", err);
    res.status(500).json({ ok: false, message: err.message });
  }
});

/**
 * POST /api/growth/quiz/submit
 */
router.post("/quiz/submit", async (req, res) => {
  try {
    const { userId, category, score, totalQuestions } = req.body;
    if (!userId) return res.status(400).json({ ok: false, message: "userId is required" });

    let doc = await GrowthProgress.findOne({ userId });
    if (!doc) {
      doc = new GrowthProgress({ userId, progress: defaultState().progress, todos: defaultState().todos });
    }

    // Boost skills & academic progress
    const pctAdd = Math.round((score / (totalQuestions || 1)) * 10); // up to +10% boost
    doc.progress.skills = Math.min(100, (doc.progress.skills || 0) + pctAdd);
    doc.progress.academic = Math.min(100, (doc.progress.academic || 0) + pctAdd);
    doc.progress.industry = Math.min(100, (doc.progress.industry || 0) + Math.round(pctAdd / 2));

    // Save completion entry in history
    doc.history = doc.history || [];
    doc.history.unshift({
      text: `🏆 Completed ${category} Quiz (${score}/${totalQuestions} Correct, +${pctAdd}% Growth Score)`,
      createdAt: new Date()
    });

    await doc.save();

    // Also update user's atsScore/growthScore in User model
    const user = await User.findById(userId);
    if (user) {
      user.atsScore = Math.min(98, (user.atsScore || 65) + pctAdd);
      await user.save();
    }

    res.json({
      ok: true,
      message: `🎉 Quiz completed! Scored ${score}/${totalQuestions}. Performance Index boosted by +${pctAdd}%!`,
      progress: doc.progress,
      atsScore: user?.atsScore || 75
    });
  } catch (err) {
    console.error("Quiz submit error:", err);
    res.status(500).json({ ok: false, message: err.message });
  }
});

// ==========================================
// 🏆 STUDENT LEADERBOARD & COORDINATOR MONITORING API
// ==========================================

/**
 * GET /api/growth/leaderboard?userId=...
 * Returns University-wide & Batch leaderboards based on weekly scores & progress
 */
router.get("/leaderboard", async (req, res) => {
  try {
    const { userId } = req.query;
    const currentUser = userId ? await User.findById(userId) : null;
    const userBatch = currentUser?.batchNumber || "SE1";

    // Fetch all active students
    const students = await User.find({ role: { $in: ["student", "user"] } }).select("name email batchNumber degreeBatch studentStage atsScore profilePic").lean();
    const studentIds = students.map(s => s._id);

    // Fetch growth progress docs for all students
    const growthDocs = await GrowthProgress.find({ userId: { $in: studentIds } }).lean();
    const growthMap = {};
    growthDocs.forEach(g => {
      growthMap[g.userId.toString()] = g;
    });

    // Compute weekly composite score for each student
    const rankedStudents = students.map(s => {
      const g = growthMap[s._id.toString()] || {};
      const prog = g.progress || {};
      const totalProg = Math.round(((prog.academic || 0) + (prog.industry || 0) + (prog.skills || 0) + (prog.certifications || 0) + (prog.networking || 0)) / 5);
      
      // Calculate weekly score combining ATS score, growth progress, and quiz history
      const weeklyScore = Math.max(totalProg, (g.weeklyScore || 0) + (s.atsScore || 60));

      return {
        _id: s._id,
        name: s.name,
        email: s.email,
        batchNumber: s.batchNumber || "SE1",
        degreeBatch: s.degreeBatch || "UGC (SE)",
        studentStage: s.studentStage || "YEAR_1_2",
        profilePic: s.profilePic,
        weeklyScore,
        totalProgress: totalProg
      };
    });

    // Sort by weeklyScore descending
    rankedStudents.sort((a, b) => b.weeklyScore - a.weeklyScore);

    // Add rank positions
    rankedStudents.forEach((s, idx) => {
      s.universityRank = idx + 1;
    });

    // Top 10 University-Wide
    const universityTop10 = rankedStudents.slice(0, 10);

    // Batch Rankings for current user's batch
    const batchStudents = rankedStudents.filter(s => s.batchNumber === userBatch);
    batchStudents.forEach((s, idx) => {
      s.batchRank = idx + 1;
    });
    const batchTop10 = batchStudents.slice(0, 10);

    // Current user ranking details
    let myUniversityRank = null;
    let myBatchRank = null;
    if (currentUser) {
      const myUniv = rankedStudents.find(s => s._id.toString() === currentUser._id.toString());
      if (myUniv) myUniversityRank = myUniv.universityRank;

      const myBat = batchStudents.find(s => s._id.toString() === currentUser._id.toString());
      if (myBat) myBatchRank = myBat.batchRank;
    }

    return res.json({
      ok: true,
      userBatch,
      myUniversityRank,
      myBatchRank,
      totalStudents: rankedStudents.length,
      universityLeaderboard: universityTop10,
      batchLeaderboard: batchTop10
    });
  } catch (err) {
    console.error("Leaderboard error:", err);
    return res.status(500).json({ ok: false, message: err.message });
  }
});

/**
 * GET /api/growth/coordinator-monitoring
 * Returns full student engagement telemetry, skills developed, and motivation levels for Coordinators
 */
router.get("/coordinator-monitoring", async (req, res) => {
  try {
    const students = await User.find({ role: { $in: ["student", "user"] } }).select("name email indexNumber batchNumber degreeBatch studentStage atsScore githubEvaluation").lean();
    const studentIds = students.map(s => s._id);

    const growthDocs = await GrowthProgress.find({ userId: { $in: studentIds } }).lean();
    const growthMap = {};
    growthDocs.forEach(g => {
      growthMap[g.userId.toString()] = g;
    });

    const monitoringData = students.map(s => {
      const g = growthMap[s._id.toString()] || {};
      const history = g.history || [];
      const prog = g.progress || {};
      const totalProg = Math.round(((prog.academic || 0) + (prog.industry || 0) + (prog.skills || 0) + (prog.certifications || 0) + (prog.networking || 0)) / 5);

      // Determine motivation status
      const logCount = history.length;
      let motivationStatus = "💤 Low Activity";
      let motivationBadge = "warning";
      if (logCount >= 5 || totalProg >= 60) {
        motivationStatus = "🔥 High Motivation";
        motivationBadge = "success";
      } else if (logCount >= 2 || totalProg >= 30) {
        motivationStatus = "⚡ Active Progress";
        motivationBadge = "info";
      }

      // Combine AI-detected skills + manual skills
      const ghSkills = s.githubEvaluation?.detectedSkills || [];
      const devSkills = g.developedSkills || [];
      const allSkills = [...new Set([...ghSkills, ...devSkills])];

      return {
        _id: s._id,
        name: s.name,
        email: s.email,
        indexNumber: s.indexNumber || "N/A",
        batchNumber: s.batchNumber || "SE1",
        degreeBatch: s.degreeBatch || "UGC (SE)",
        studentStage: s.studentStage || "YEAR_1_2",
        totalProgress: totalProg,
        atsScore: s.atsScore || 65,
        weeklyLogsCount: logCount,
        motivationStatus,
        motivationBadge,
        developedSkills: allSkills.length > 0 ? allSkills : ["Software Fundamentals"],
        lastActive: g.updatedAt || s.updatedAt || new Date()
      };
    });

    return res.json({
      ok: true,
      totalStudents: monitoringData.length,
      students: monitoringData
    });
  } catch (err) {
    console.error("Coordinator monitoring error:", err);
    return res.status(500).json({ ok: false, message: err.message });
  }
});

module.exports = router;
