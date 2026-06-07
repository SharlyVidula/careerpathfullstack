const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true, required: true },
  password: { type: String }, // Optional for OAuth users
  role: { type: String, default: "user" },
  saved: [{ careerTitle: String, score: Number, date: Date }],

  // ⭐ NEW AI FIELDS ⭐
  resumeText: { type: String },       // The raw text from the PDF
  seekingRole: { type: String },      // The AI's classification (e.g., "UI Engineer")
  atsScore: { type: Number, default: 0 }, // ATS score calculation
  skills: [{ type: String }],         // Parsed main skills
  bioSnippet: { type: String },       // Very short bio or facts
  profilePic: { type: String },       // Extracted Base64 image
  extractedName: { type: String },    // Extracted Name

  // ⭐ NEW OAUTH FIELDS ⭐
  googleId: { type: String },
  githubId: { type: String },
  linkedinId: { type: String },
  linkedinData: { type: Object } // Store all raw data retrieved from LinkedIn
}, { timestamps: true });

module.exports = mongoose.models.User || mongoose.model("User", userSchema);