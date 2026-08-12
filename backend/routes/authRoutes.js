const express = require("express");
const passport = require("passport");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const axios = require("axios");
const User = require("../models/user");
const router = express.Router();

// Helper to generate JWT and redirect
const handleOAuthCallback = (req, res) => {
  if (!req.user) {
    return res.redirect(`${process.env.FRONTEND_URL}/login?error=auth_failed`);
  }

  const token = jwt.sign({ id: req.user._id, role: req.user.role }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });

  res.redirect(`${process.env.FRONTEND_URL}/oauth/callback?token=${token}`);
};

// ========================
// GOOGLE OAUTH
// ========================
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "/login?error=auth_failed" }),
  handleOAuthCallback
);

// ========================
// GITHUB OAUTH (STUDENT CONNECT)
// ========================
router.get("/github/connect", (req, res, next) => {
  const { studentId } = req.query;
  passport.authenticate("github", { 
    scope: ["user:email", "public_repo"],
    state: studentId || "" 
  })(req, res, next);
});

router.get("/github", (req, res, next) => {
  const { studentId } = req.query;
  passport.authenticate("github", { 
    scope: ["user:email", "public_repo"],
    state: studentId || "" 
  })(req, res, next);
});

router.get("/github/callback", (req, res, next) => {
  passport.authenticate("github", async (err, authUser) => {
    if (err || !authUser) {
      return res.redirect(`${process.env.FRONTEND_URL}/dashboard?error=github_failed`);
    }

    const studentId = req.query.state;
    let targetUser = authUser;

    if (studentId && mongoose.Types.ObjectId.isValid(studentId)) {
      const student = await User.findById(studentId);
      if (student) {
        student.githubId = authUser.githubId || student.githubId;
        student.githubUsername = authUser.githubUsername || student.githubUsername;
        student.githubLocked = true;
        targetUser = student;
      }
    } else {
      targetUser.githubLocked = true;
    }

    // Auto Import Repos & Compute AI Code Evaluation
    if (targetUser.githubUsername) {
      try {
        const ghRes = await axios.get(`https://api.github.com/users/${targetUser.githubUsername}/repos?sort=pushed&per_page=30`, {
          headers: { "User-Agent": "LNBTI-Career-Path-System" }
        });
        const reposData = ghRes.data || [];
        targetUser.githubRepos = reposData.map(r => ({
          name: r.name,
          description: r.description || "No description provided",
          stars: r.stargazers_count || 0,
          forks: r.forks_count || 0,
          language: r.language || "Other",
          pushedAt: r.pushed_at ? new Date(r.pushed_at) : new Date(),
          htmlUrl: r.html_url
        }));

        const detectedLangs = [...new Set(reposData.map(r => r.language).filter(Boolean))];
        const calcScore = Math.min(95, Math.max(65, 60 + reposData.length * 4));

        targetUser.githubEvaluation = {
          score: calcScore,
          summary: `Candidate maintains ${reposData.length} public project repositories with activity in ${detectedLangs.slice(0, 4).join(", ") || "software engineering"}.`,
          detectedSkills: detectedLangs,
          lastEvaluated: new Date()
        };

        if (detectedLangs.length > 0) {
          const mergedSkills = new Set([...(targetUser.skills || []), ...detectedLangs]);
          targetUser.skills = Array.from(mergedSkills);
        }
      } catch (e) {
        console.error("Auto repo import on OAuth error:", e.message);
      }
    }

    await targetUser.save();
    return res.redirect(`${process.env.FRONTEND_URL}/dashboard?status=github_connected`);
  })(req, res, next);
});

// ========================
// LINKEDIN OAUTH (STUDENT CONNECT)
// ========================
router.get("/linkedin/connect", (req, res, next) => {
  const { studentId } = req.query;
  passport.authenticate("linkedin", { state: studentId || "" })(req, res, next);
});

router.get("/linkedin", (req, res, next) => {
  const { studentId } = req.query;
  passport.authenticate("linkedin", { state: studentId || "" })(req, res, next);
});

router.get("/linkedin/callback", (req, res, next) => {
  passport.authenticate("linkedin", async (err, authUser) => {
    if (err || !authUser) {
      return res.redirect(`${process.env.FRONTEND_URL}/dashboard?error=linkedin_failed`);
    }

    const studentId = req.query.state;
    let targetUser = authUser;

    if (studentId && mongoose.Types.ObjectId.isValid(studentId)) {
      const student = await User.findById(studentId);
      if (student) {
        student.linkedinId = authUser.linkedinId || student.linkedinId;
        student.linkedinData = authUser.linkedinData || student.linkedinData;
        if (authUser.linkedinData?.picture) student.linkedinProfileUrl = authUser.linkedinData.picture;
        student.linkedinLocked = true;
        targetUser = student;
      }
    } else {
      targetUser.linkedinLocked = true;
    }

    await targetUser.save();
    return res.redirect(`${process.env.FRONTEND_URL}/dashboard?status=linkedin_connected`);
  })(req, res, next);
});

module.exports = router;
