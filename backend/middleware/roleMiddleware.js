const User = require('../models/User');

const roleMiddleware = (roles) => {
  return async (req, res, next) => {
    try {
      // Get user from database to verify role
      const user = await User.findById(req.user.id);
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Check if user role is in allowed roles
      if (!roles.includes(user.role)) {
        return res.status(403).json({ message: 'Access denied. Insufficient permissions.' });
      }
      
      next();
    } catch (error) {
      console.error('Role middleware error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  };
};

module.exports = roleMiddleware;