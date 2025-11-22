const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const User = require('../models/User');

// Zapier webhook URL for welcome email automation
const ZAPIER_WEBHOOK_URL = 'https://hooks.zapier.com/hooks/catch/24944272/u59sq1a/';

// Helper function to send welcome email via Zapier webhook
const sendWelcomeEmail = async (userData) => {
  try {
    const webhookData = {
      name: userData.name,
      email: userData.email,
      role: userData.role,
      registrationNumber: userData.registrationNumber || null,
      department: userData.department || null,
      registrationDate: new Date().toISOString(),
      platform: 'SkillHub'
    };

    console.log('Sending welcome email via Zapier webhook:', webhookData);
    
    const response = await axios.post(ZAPIER_WEBHOOK_URL, webhookData, {
      timeout: 10000, // 10 second timeout
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('Zapier webhook response:', response.status, response.statusText);
    return { success: true, response: response.data };
  } catch (error) {
    console.error('Error sending welcome email via Zapier:', error.message);
    // Don't throw error - we don't want email failure to break registration
    return { success: false, error: error.message };
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
    
    // Check database for user
    const user = await User.findOne({ email });

    if (user && (await bcrypt.compare(password, user.password))) {
      // Generate JWT token
      const token = jwt.sign(
        { id: user._id, name: user.name, role: user.role },
        process.env.JWT_SECRET || 'skillhub_secret_key',
        { expiresIn: '30d' }
      );

      // Remove password from user object
      const userResponse = {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        registrationNumber: user.registrationNumber,
        department: user.department
      };

      res.json({
        success: true,
        token,
        user: userResponse
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res) => {
  try {
    const { name, email, password, role, registrationNumber, department } = req.body;

    console.log('Registration request received:', { name, email, role, registrationNumber, department });

    // Validate required fields
    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: 'All required fields must be filled' });
    }

    // Validate email format
    if (!email.includes('@')) {
      return res.status(400).json({ message: 'Please enter a valid email address' });
    }

    // Validate password length
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    // Validate registration number for students
    if (role === 'student' && !registrationNumber) {
      return res.status(400).json({ message: 'Registration number is required for students' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log('User already exists:', existingUser.email);
      return res.status(400).json({ message: 'An account with this email already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    console.log('Password hashed successfully');

    // Create user
    const user = new User({
      name,
      email,
      password: hashedPassword,
      role,
      registrationNumber: role === 'student' ? registrationNumber : undefined,
      department: role === 'faculty' ? department : undefined
    });

    console.log('User object created:', user);

    // Save user and handle the result
    console.log('Attempting to save user...');
    const savedUser = await user.save();
    console.log('User saved successfully:', savedUser._id);

    // Send welcome email via Zapier webhook (non-blocking)
    const emailResult = await sendWelcomeEmail({
      name: savedUser.name,
      email: savedUser.email,
      role: savedUser.role,
      registrationNumber: savedUser.registrationNumber,
      department: savedUser.department
    });

    if (emailResult.success) {
      console.log('Welcome email sent successfully via Zapier');
    } else {
      console.log('Welcome email failed, but registration continues:', emailResult.error);
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: savedUser._id, name: savedUser.name, role: savedUser.role },
      process.env.JWT_SECRET || 'skillhub_secret_key',
      { expiresIn: '30d' }
    );

    // Prepare user response
    const userResponse = {
      id: savedUser._id,
      name: savedUser.name,
      email: savedUser.email,
      role: savedUser.role,
      registrationNumber: savedUser.registrationNumber,
      department: savedUser.department
    };

    res.status(201).json({
      success: true,
      token,
      user: userResponse,
      emailSent: emailResult.success
    });
  } catch (error) {
    console.error('Registration error:', error);
    // Check if it's a MongoDB duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({ message: 'An account with this email already exists' });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
const getProfile = async (req, res) => {
  try {
    // req.user is set by auth middleware
    const user = await User.findById(req.user.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  login,
  register,
  getProfile
};