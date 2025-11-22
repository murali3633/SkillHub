const mongoose = require('mongoose');

const enrollmentSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  enrollmentDate: {
    type: Date,
    default: Date.now
  },
  studentName: {
    type: String,
    required: true,
    trim: true
  },
  registrationNumber: {
    type: String,
    required: true,
    trim: true
  },
  // Store course details at time of enrollment for historical records
  courseTitle: {
    type: String,
    required: true,
    trim: true
  },
  courseCode: {
    type: String,
    required: true,
    trim: true
  }
}, {
  timestamps: true
});

// Ensure a student can only enroll in a course once
enrollmentSchema.index({ student: 1, course: 1 }, { unique: true });

// Add indexes for better query performance
enrollmentSchema.index({ student: 1 });
enrollmentSchema.index({ course: 1 });
enrollmentSchema.index({ enrollmentDate: 1 });

module.exports = mongoose.model('Enrollment', enrollmentSchema);