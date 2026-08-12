const mongoose = require("mongoose");

const internDiarySchema = new mongoose.Schema({
  studentId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  },
  date: { 
    type: String, 
    required: true 
  }, // Format: YYYY-MM-DD
  dayNumber: { 
    type: Number, 
    required: true 
  }, // 1 to 180 (for 6 months)
  title: { 
    type: String, 
    default: "Daily Work & Learning Log" 
  },
  activities: { 
    type: String, 
    required: true 
  },
  learnings: { 
    type: String 
  },
  hoursWorked: { 
    type: Number, 
    default: 8 
  },
  supervisorComments: { 
    type: String, 
    default: "" 
  },
  status: { 
    type: String, 
    enum: ["SUBMITTED", "APPROVED", "REVISION_NEEDED"], 
    default: "SUBMITTED" 
  },
  submittedAt: { 
    type: Date, 
    default: Date.now 
  }
}, { timestamps: true });

// Composite index to ensure 1 entry per student per date
internDiarySchema.index({ studentId: 1, date: 1 }, { unique: true });

module.exports = mongoose.models.InternDiary || mongoose.model("InternDiary", internDiarySchema);
