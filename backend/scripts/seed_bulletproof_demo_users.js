const mongoose = require("mongoose");
require("dotenv").config();
const User = require("../models/user");
const Job = require("../models/job");
const Request = require("../models/request");
const Saved = require("../models/saved");

async function seed() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected successfully!");

    // 1. FLUSH ALL EXISTING DATA
    console.log("Flushing all existing users, jobs, requests, and saved entries...");
    await User.deleteMany({});
    await Job.deleteMany({});
    await Request.deleteMany({});
    await Saved.deleteMany({});
    console.log("Database successfully cleared clean!");

    // 2. CREATE BULLETPROOF DEMO USERS (1 FOR EACH CATEGORY)
    console.log("Seeding bulletproof demo users...");

    // Category 1: System Administrator
    const admin = await User.create({
      name: "LNBTI System Administrator",
      email: "admin@lnbti.edu.lk",
      password: "Password123!",
      role: "admin",
      isApproved: true,
      approvalStatus: "APPROVED"
    });

    // Category 2: Academic Coordinator
    const coordinator = await User.create({
      name: "Dr. Nimal Perera (Coordinator)",
      email: "coordinator@lnbti.edu.lk",
      password: "Password123!",
      role: "coordinator",
      isApproved: true,
      approvalStatus: "APPROVED"
    });

    // Category 3: 1st/2nd Year Student (Foundation Stage)
    const student1 = await User.create({
      name: "John Perera (1st/2nd Year)",
      email: "student1@lnbti.edu.lk",
      password: "Password123!",
      role: "student",
      indexNumber: "LNBTI/IT/2024/001",
      batchNumber: "SE1",
      degreeBatch: "UGC (SE)",
      academicYear: "Year 1",
      academicSemester: "Semester 1",
      studentStage: "YEAR_1_2",
      isApproved: true,
      approvalStatus: "APPROVED"
    });

    // Category 4: 3rd Year Intern Ready Student
    const student3 = await User.create({
      name: "Sharly Vidula (3rd Yr Intern)",
      email: "student3@lnbti.edu.lk",
      password: "Password123!",
      role: "student",
      indexNumber: "UGC0323021",
      batchNumber: "SE3",
      degreeBatch: "UGC (SE)",
      academicYear: "Year 3",
      academicSemester: "Semester 2",
      studentStage: "YEAR_3_INTERN",
      jlptLevel: "N4",
      gpa: 3.65,
      eligibilityStatus: "APPROVED",
      atsScore: 88,
      seekingRole: "Software Engineering Intern",
      isApproved: true,
      approvalStatus: "APPROVED"
    });

    // Category 5: 4th Year Graduating Student
    const student4 = await User.create({
      name: "Kasun Rajitha (4th Yr Graduate)",
      email: "student4@lnbti.edu.lk",
      password: "Password123!",
      role: "student",
      indexNumber: "LNBTI/IT/2022/088",
      batchNumber: "UOG1",
      degreeBatch: "UOG",
      academicYear: "Year 4",
      academicSemester: "Semester 2",
      studentStage: "FINAL_YEAR_JOB",
      atsScore: 92,
      seekingRole: "Associate Software Engineer",
      isApproved: true,
      approvalStatus: "APPROVED"
    });

    // Category 6: Industry Supervisor
    const supervisor = await User.create({
      name: "David Miller (Supervisor)",
      email: "supervisor@techcorp.lk",
      password: "Password123!",
      role: "supervisor",
      companyName: "TechCorp Systems",
      designation: "Senior Software Architect",
      phone: "+94 77 123 4567",
      isApproved: true,
      approvalStatus: "APPROVED"
    });

    // Category 7: Corporate Employer
    const employer = await User.create({
      name: "Virtusa Recruitment Team",
      email: "employer@virtusa.com",
      password: "Password123!",
      role: "employer",
      companyName: "Virtusa Pvt Ltd",
      designation: "Talent Acquisition Lead",
      phone: "+94 11 234 5678",
      isApproved: true,
      approvalStatus: "APPROVED"
    });

    console.log("Users created successfully!");

    // 3. CREATE SAMPLE DEMO JOBS
    console.log("Seeding sample vacancies...");

    // Vacancy 1: Supervisor Internship Vacancy (Pending Coordinator Matching)
    const job1 = await Job.create({
      employerId: supervisor._id,
      supervisorId: supervisor._id,
      title: "Full-Stack Software Engineering Intern",
      description: "Looking for an energetic 3rd-year intern with knowledge in Node.js, React, and MongoDB for active web projects.",
      salary: "LKR 50,000 / month",
      location: "Colombo 03 (Hybrid)",
      contactEmail: "supervisor@techcorp.lk",
      contactPhone: "+94 77 123 4567",
      opportunityType: "INTERNSHIP",
      targetStage: "YEAR_3_INTERN",
      status: "pending_coordinator",
      postedByRole: "supervisor"
    });

    // Vacancy 2: Corporate Direct Graduate Job (Live for 4th Year Graduates)
    const job2 = await Job.create({
      employerId: employer._id,
      title: "Associate Software Engineer (Java & React)",
      description: "Direct full-time career opportunity for 4th year graduating students. Strong OOP and Web fundamentals required.",
      salary: "LKR 180,000 / month",
      location: "Colombo 05 (On-site)",
      contactEmail: "employer@virtusa.com",
      contactPhone: "+94 11 234 5678",
      opportunityType: "FULL_TIME",
      targetStage: "FINAL_YEAR_JOB",
      status: "approved",
      postedByRole: "employer"
    });

    console.log("Sample vacancies created successfully!");

    console.log("\n==========================================");
    console.log("🎉 BULLETPROOF DEMO ENVIRONMENT READY FOR MEETING 🎉");
    console.log("==========================================");
    console.log("Master Password for ALL Accounts: Password123!");
    console.log("------------------------------------------");
    console.log("1. System Admin:        admin@lnbti.edu.lk");
    console.log("2. Coordinator:         coordinator@lnbti.edu.lk");
    console.log("3. 1st/2nd Yr Student:  student1@lnbti.edu.lk");
    console.log("4. 3rd Yr Intern:       student3@lnbti.edu.lk");
    console.log("5. 4th Yr Graduate:     student4@lnbti.edu.lk");
    console.log("6. Industry Supervisor: supervisor@techcorp.lk");
    console.log("7. Corporate Employer:  employer@virtusa.com");
    console.log("==========================================\n");

    process.exit(0);
  } catch (err) {
    console.error("Seeding Error:", err);
    process.exit(1);
  }
}

seed();
