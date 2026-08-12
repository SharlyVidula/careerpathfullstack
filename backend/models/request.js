const mongoose = require('mongoose');

const requestSchema = new mongoose.Schema({
  employerId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  employeeId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  requestedByRole: {
    type: String,
    enum: ['supervisor', 'employer'],
    default: 'employer'
  },
  status: { 
    type: String, 
    // This list defines every possible state of a job request
    enum: [
        'PENDING_COORDINATOR', // 0. Supervisor sent connection request, waiting for Academic Coordinator
        'PENDING_ADMIN',       // 1. Employer sent it, waiting for Admin / Coordinator
        'PENDING_EMPLOYEE',    // 2. Admin/Coordinator approved, waiting for Student
        'ACCEPTED',            // 3. Student accepted (Connection made!)
        'DENIED',              // 4. Student said no
        'REJECTED_BY_ADMIN'    // 5. Admin blocked it (Spam/Safety)
    ], 
    default: 'PENDING_ADMIN' 
  }
}, { timestamps: true }); // ⭐ Professional Touch: Adds createdAt & updatedAt automatically

module.exports = mongoose.model('Request', requestSchema);