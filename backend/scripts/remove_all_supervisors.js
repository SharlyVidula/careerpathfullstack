const mongoose = require("mongoose");
require("dotenv").config();
const User = require("../models/user");
const Job = require("../models/job");

async function removeSupervisors() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    // Remove all users with role supervisor
    const r = await User.deleteMany({ role: "supervisor" });
    console.log("Removed all supervisor users:", r.deletedCount);

    // Unassign supervisor from any assigned students
    await User.updateMany({}, { $unset: { assignedSupervisor: "" } });
    console.log("Cleared assigned supervisor references from students.");

    // Remove any supervisor posted jobs
    const j = await Job.deleteMany({ postedByRole: "supervisor" });
    console.log("Removed supervisor posted jobs:", j.deletedCount);

    process.exit(0);
  } catch (err) {
    console.error("Remove supervisors error:", err);
    process.exit(1);
  }
}

removeSupervisors();
