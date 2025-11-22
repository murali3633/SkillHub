const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  role: {
    type: String,
    required: true,
    enum: ['student', 'faculty']
  },
  registrationNumber: {
    type: String,
    trim: true
  },
  department: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('User', userSchema);