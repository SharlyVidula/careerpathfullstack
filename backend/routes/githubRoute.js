// backend/routes/githubRoute.js
const express = require("express");
const router = express.Router();
const axios = require("axios");
const Groq = require("groq-sdk");
const User = require("../models/user");

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

function extractJson(text = "") {
  const firstBrace = text.indexOf("{");
  const lastBrace = text.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    const raw = text.slice(firstBrace, lastBrace + 1);
    try { return JSON.parse(raw); } catch (e) {}
  }
  return null;
}

/**
 * POST /api/github/connect
 * Connects a student's GitHub username & LinkedIn profile, imports public repos, and runs AI evaluation.
 */
router.post("/connect", async (req, res) => {
  try {
    const { userId, githubUsername, linkedinProfileUrl } = req.body;
    if (!userId) return res.status(400).json({ ok: false, message: "userId is required" });
    const cleanUsername = githubUsername.trim().replace(/^@/, '');

    // 0. Check User Account & Lock Status
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ ok: false, message: "User not found" });

    if (user.githubLocked && user.githubUsername && user.githubUsername.toLowerCase() !== cleanUsername.toLowerCase()) {
      return res.status(403).json({
        ok: false,
        message: "🔒 Your linked GitHub account is locked. To modify or swap your GitHub account, you must submit a modification request to your LNBTI Academic Coordinator."
      });
    }

    // 1. Fetch public repos from GitHub REST API
    let reposData = [];
    try {
      const ghRes = await axios.get(`https://api.github.com/users/${cleanUsername}/repos?sort=pushed&per_page=30`, {
        headers: { "User-Agent": "LNBTI-Career-Path-System" }
      });
      reposData = ghRes.data || [];
    } catch (ghErr) {
      console.error("GitHub API fetch error:", ghErr.message);
      return res.status(400).json({ ok: false, message: `Could not find public GitHub account for username '${cleanUsername}'` });
    }

    const formattedRepos = reposData.map(r => ({
      name: r.name,
      description: r.description || "No description provided",
      stars: r.stargazers_count || 0,
      forks: r.forks_count || 0,
      language: r.language || "Other",
      pushedAt: r.pushed_at ? new Date(r.pushed_at) : new Date(),
      htmlUrl: r.html_url
    }));

    // 2. AI Code & Repository Portfolio Evaluation
    let aiEvaluation = {
      score: 75,
      summary: "Good repository activity found across public projects.",
      detectedSkills: [...new Set(formattedRepos.map(r => r.language).filter(Boolean))],
      lastEvaluated: new Date()
    };

    if (process.env.GROQ_API_KEY && formattedRepos.length > 0) {
      const prompt = `
You are a Lead Software Architect and Senior Technical Recruiter.
Analyze this candidate's public GitHub repository portfolio:

GitHub Username: ${cleanUsername}
Total Public Repos: ${formattedRepos.length}
Repositories:
${JSON.stringify(formattedRepos.map(r => ({ name: r.name, lang: r.language, stars: r.stars, lastPush: r.pushedAt, desc: r.description })), null, 2)}

Evaluate their portfolio quality, project diversity, code activity, and technical skills.
Return ONLY valid JSON in this exact structure:
{
  "score": 85, // Integer 0 to 100 representing technical depth and portfolio strength
  "summary": "2-3 sentence technical feedback summary on their project portfolio strengths and recommendations.",
  "detectedSkills": ["React", "Python", "Node.js", "Docker"]
}
`;

      try {
        const completion = await groq.chat.completions.create({
          model: "llama-3.3-70b-versatile",
          temperature: 0.3,
          messages: [{ role: "user", content: prompt }]
        });

        const raw = completion.choices?.[0]?.message?.content || "";
        const parsed = extractJson(raw);
        if (parsed && typeof parsed.score === "number") {
          aiEvaluation = {
            score: Math.max(0, Math.min(100, parsed.score)),
            summary: String(parsed.summary || aiEvaluation.summary),
            detectedSkills: Array.isArray(parsed.detectedSkills) ? parsed.detectedSkills.slice(0, 10) : aiEvaluation.detectedSkills,
            lastEvaluated: new Date()
          };
        }
      } catch (aiErr) {
        console.error("GitHub AI evaluation fallback:", aiErr.message);
      }
    }

    // 3. Save to User document with ONE-TIME LOCK
    user.githubUsername = cleanUsername;
    if (linkedinProfileUrl) user.linkedinProfileUrl = linkedinProfileUrl.trim();
    user.githubLocked = true;
    if (user.linkedinProfileUrl) user.linkedinLocked = true;
    user.githubRepos = formattedRepos;
    user.githubEvaluation = aiEvaluation;

    // Merge detected skills into user.skills array
    if (aiEvaluation.detectedSkills && aiEvaluation.detectedSkills.length) {
      const merged = new Set([...(user.skills || []), ...aiEvaluation.detectedSkills]);
      user.skills = Array.from(merged);
    }

    await user.save();

    res.json({
      ok: true,
      message: `Successfully connected GitHub @${cleanUsername}! Imported ${formattedRepos.length} public repos.`,
      githubUsername: cleanUsername,
      linkedinProfileUrl: user.linkedinProfileUrl,
      githubRepos: formattedRepos,
      githubEvaluation: aiEvaluation,
      skills: user.skills
    });
  } catch (err) {
    console.error("GitHub connect route error:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

/**
 * GET /api/github/portfolio?userId=...
 */
router.get("/portfolio", async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ ok: false, message: "userId is required" });

    const user = await User.findById(userId).select("githubUsername linkedinProfileUrl githubRepos githubEvaluation skills");
    if (!user) return res.status(404).json({ ok: false, message: "User not found" });

    res.json({
      ok: true,
      githubUsername: user.githubUsername || "",
      linkedinProfileUrl: user.linkedinProfileUrl || "",
      githubRepos: user.githubRepos || [],
      githubEvaluation: user.githubEvaluation || { score: 0, summary: "No evaluation yet", detectedSkills: [] },
      skills: user.skills || []
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

module.exports = router;
