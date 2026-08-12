require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../models/user");

async function cleanDemoStudents() {
  try {
    const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/careerpath";
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB");

    // Find all student users
    const students = await User.find({ role: { $in: ["student", "user"] } });
    console.log(`Found ${students.length} student accounts in database:`);
    
    students.forEach(s => {
      console.log(`- ID: ${s._id} | Name: ${s.name} | Email: ${s.email} | Stage: ${s.studentStage}`);
    });

    // Delete demo / test student accounts
    const result = await User.deleteMany({
      role: { $in: ["student", "user"] },
      $or: [
        { email: { $regex: /test|demo|example|sample|student_|fresh_student_|4th@/i } },
        { name: { $regex: /test|demo|example|sample|fresh student|hello hello|4th/i } }
      ]
    });

    console.log(`\n🧹 Cleaned up ${result.deletedCount} demo student accounts.`);

    const remaining = await User.find({ role: { $in: ["student", "user"] } });
    console.log(`Remaining production student accounts: ${remaining.length}`);

    process.exit(0);
  } catch (err) {
    console.error("Error:", err);
    process.exit(1);
  }
}

cleanDemoStudents();
