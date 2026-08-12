const mongoose = require("mongoose");

const jobSchema = new mongoose.Schema({
  employerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  supervisorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  title: { type: String, required: true },
  description: { type: String, required: true },
  salary: { type: String, required: true },
  location: { type: String, required: true },
  contactEmail: { type: String, default: "" },
  contactPhone: { type: String, default: "" },
  opportunityType: {
    type: String,
    enum: ["INTERNSHIP", "FULL_TIME"],
    default: "INTERNSHIP"
  },
  targetStage: {
    type: String,
    enum: ["YEAR_3_INTERN", "FINAL_YEAR_JOB", "ALL"],
    default: "YEAR_3_INTERN"
  },
  postedByRole: {
    type: String,
    enum: ["supervisor", "employer"],
    default: "employer"
  },
  assignedStudents: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }],
  status: {
    type: String,
    enum: ["pending", "approved", "rejected", "pending_coordinator"],
    default: "pending"
  },
  applyClicks: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model("Job", jobSchema);