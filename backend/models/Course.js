const mongoose = require('mongoose');

// Sub-schema for syllabus items
const syllabusItemSchema = new mongoose.Schema({
  module: {
    type: String,
    required: true
  },
  topic: {
    type: String,
    required: true
  },
  youtubeLinks: [{
    type: String
  }],
  fileUploads: [{
    fileName: {
      type: String,
      required: true
    },
    fileUrl: {
      type: String,
      required: true
    },
    fileType: {
      type: String // e.g., 'pdf', 'docx', 'pptx', 'zip'
    },
    fileSize: {
      type: String // e.g., '2.5 MB'
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }]
});

// Course schema
const courseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  code: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true
  },
  category: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  instructor: {
    type: String,
    required: true,
    trim: true
  },
  duration: {
    type: String,
    required: true,
    trim: true
  },
  level: {
    type: String,
    required: true,
    enum: ['Beginner', 'Intermediate', 'Advanced'],
    trim: true
  },
  maxStudents: {
    type: Number,
    required: true,
    min: 1
  },
  enrolled: {
    type: Number,
    default: 0,
    min: 0
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  syllabus: [syllabusItemSchema],
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Add indexes for better query performance
courseSchema.index({ category: 1 });
courseSchema.index({ level: 1 });
courseSchema.index({ title: 'text', code: 'text', description: 'text' });

module.exports = mongoose.model('Course', courseSchema);