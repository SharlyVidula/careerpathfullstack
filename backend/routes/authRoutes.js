const express = require("express");
const passport = require("passport");
const jwt = require("jsonwebtoken");
const router = express.Router();

// Helper to generate JWT and redirect
const handleOAuthCallback = (req, res) => {
  if (!req.user) {
    return res.redirect(`${process.env.FRONTEND_URL}/login?error=auth_failed`);
  }

  // Generate JWT token
  const token = jwt.sign({ id: req.user._id, role: req.user.role }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });

  // Redirect to frontend with token
  // The frontend will grab the token from the URL, store it, and redirect to dashboard
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
// GITHUB OAUTH
// ========================
router.get(
  "/github",
  passport.authenticate("github", { scope: ["user:email"] })
);

router.get(
  "/github/callback",
  passport.authenticate("github", { failureRedirect: "/login?error=auth_failed" }),
  handleOAuthCallback
);

// ========================
// LINKEDIN OAUTH
// ========================
router.get(
  "/linkedin",
  passport.authenticate("linkedin")
);

router.get(
  "/linkedin/callback",
  passport.authenticate("linkedin", { failureRedirect: "/login?error=auth_failed" }),
  handleOAuthCallback
);

module.exports = router;
