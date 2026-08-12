// backend/server.js
console.log("✅ Using FIXED server.js");
const dotenv = require("dotenv");
dotenv.config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const path = require("path");
const session = require("express-session");
const passport = require("./config/passport");


const app = express();

// Trust reverse proxy (Render load balancer SSL termination)
app.set("trust proxy", 1);


// Security & parsing
app.use(helmet());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(
  cors({
    origin: "*", // you can restrict this later
  })
);

// Session needed for passport OAuth
app.use(session({
  secret: process.env.SESSION_SECRET || 'supersecret',
  resave: false,
  saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());

// Rate limiting (basic)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
});
app.use(limiter);

// Simple health/home route
app.get("/", (req, res) => {
  res.send({ ok: true, message: "Career Path API Running" });
});

app.get("/api/health", (req, res) => {
  res.json({ ok: true, message: "API healthy" });
});

/* ------------ ROUTES (wired correctly) ------------ */

// auth: oauth routes
app.use("/api/auth", require("./routes/authRoutes"));

// users: register, login, saved, etc.
app.use("/api/users", require("./routes/userRoutes"));

// careers CRUD
app.use("/api/careers", require("./routes/careerRoutes"));

// admin career management
// -> GET/POST/PUT/DELETE /api/admin/careers
app.use("/api/admin", require("./routes/adminRoutes"));

// simple AI helper route
app.use("/api/ai", require("./routes/aiChatRoute"));
// AI-based career recommendation
app.use("/api/ai", require("./routes/aiRecommendRoute"));

// AI-based resume analysis
app.use("/api/resume", require("./routes/resumeRoute"));


// ✅ AI-based growth tracker
app.use("/api/growth", require("./routes/growthRoute"));

// ✅ AI-based job description match
app.use("/api/jd", require("./routes/jdMatchRoute"));

// 🐙 GitHub & LinkedIn Portfolio Integration
app.use("/api/github", require("./routes/githubRoute"));

// 🎓 Internship Program & Diary System
app.use("/api/intern", require("./routes/internRoutes"));


/* ------------ DATABASE CONNECTION ------------ */

const connectWithRetry = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10
    });
    console.log("✅ MongoDB Connected Successfully");

    // Guarantee default coordinator and admin accounts
    const User = require("./models/user");
    await User.findOneAndUpdate(
      { email: "coordinator@lnbti.edu.lk" },
      {
        name: "LNBTI Academic Coordinator",
        email: "coordinator@lnbti.edu.lk",
        password: "coordinator123",
        role: "coordinator",
        isApproved: true,
        approvalStatus: "APPROVED"
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    console.log("🎓 Default Coordinator account ready: coordinator@lnbti.edu.lk / coordinator123");

    await User.findOneAndUpdate(
      { email: "admin@lnbti.edu.lk" },
      {
        name: "LNBTI System Administrator",
        email: "admin@lnbti.edu.lk",
        password: "admin123",
        role: "admin",
        isApproved: true,
        approvalStatus: "APPROVED"
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    console.log("👑 Default Admin account ready: admin@lnbti.edu.lk / admin123");
  } catch (err) {
    console.error("❌ MongoDB Connection Error:", err.message);
    console.log("🔄 Retrying MongoDB connection in 5 seconds...");
    setTimeout(connectWithRetry, 5000);
  }
};

connectWithRetry();

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
