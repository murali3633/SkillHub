const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authMiddleware = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authorization token required' });
    }
    
    // Extract token
    const token = authHeader.split(' ')[1];
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'skillhub_secret_key');
    
    // If name is not in token (for backward compatibility), fetch from database
    if (!decoded.name) {
      const user = await User.findById(decoded.id).select('name');
      decoded.name = user?.name;
    }
    
    // Add user info to request object
    req.user = decoded;
    
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ message: 'Not authorized, token failed' });
  }
};

module.exports = authMiddleware;