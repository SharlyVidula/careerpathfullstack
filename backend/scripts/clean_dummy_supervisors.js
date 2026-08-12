const mongoose = require("mongoose");
require("dotenv").config();
const User = require("../models/user");
const Job = require("../models/job");

async function clean() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    const dummyEmails = [
      "demo2@gmail.com", "demo6@gmail.com", "demo9@gmail.com",
      "alex@gmail.com", "sudeera@gmail.com", "supervisor1@gmail.com",
      "sss@gmail.com", "jjj@gmail.com", "intern1@gmail.com"
    ];

    const r = await User.deleteMany({ email: { $in: dummyEmails } });
    console.log("Deleted dummy supervisors:", r.deletedCount);

    const j = await Job.deleteMany({});
    console.log("Deleted test jobs:", j.deletedCount);

    process.exit(0);
  } catch (err) {
    console.error("Cleanup error:", err);
    process.exit(1);
  }
}

clean();
