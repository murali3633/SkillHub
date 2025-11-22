const express = require('express');
const { login, register, getProfile } = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', login);

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', register);

// @route   GET /api/auth/profile
// @desc    Get user profile
// @access  Private
router.get('/profile', authMiddleware, getProfile);

module.exports = router;