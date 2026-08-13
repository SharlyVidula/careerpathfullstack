const mongoose = require("mongoose");

const supervisorLogSchema = new mongoose.Schema({
  studentId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  },
  supervisorId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  },
  logDate: { 
    type: String, 
    default: () => new Date().toISOString().split("T")[0] 
  },
  title: { 
    type: String, 
    required: true, 
    default: "Daily Internship Log & Performance Record" 
  },
  remarks: { 
    type: String, 
    required: true 
  },
  performanceRating: { 
    type: Number, 
    min: 1, 
    max: 5, 
    default: 5 
  },
  status: { 
    type: String, 
    enum: ["EXCELLENT", "SATISFACTORY", "NEEDS_IMPROVEMENT"], 
    default: "EXCELLENT" 
  }
}, { timestamps: true });

module.exports = mongoose.models.SupervisorLog || mongoose.model("SupervisorLog", supervisorLogSchema);
