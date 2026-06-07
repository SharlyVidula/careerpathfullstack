const mongoose = require("mongoose");

const jobSchema = new mongoose.Schema({
  employerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  title: { type: String, required: true },
  description: { type: String, required: true },
  salary: { type: String, required: true },
  location: { type: String, required: true },
  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending"
  },
  applyClicks: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model("Job", jobSchema);