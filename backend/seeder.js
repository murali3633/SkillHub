const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const connectDB = require('./config/db');

// Load environment variables
require('dotenv').config();

// Connect to database
connectDB();

const users = [
  {
    name: 'John Student',
    email: 'student@example.com',
    password: 'password123',
    role: 'student',
    registrationNumber: 'REG001'
  },
  {
    name: 'Dr. Smith',
    email: 'faculty@example.com',
    password: 'password123',
    role: 'faculty',
    department: 'Computer Science'
  }
];

const importData = async () => {
  try {
    // Clear existing data
    await User.deleteMany();
    
    // Hash passwords
    const usersWithHashedPasswords = await Promise.all(
      users.map(async (user) => {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(user.password, salt);
        return { ...user, password: hashedPassword };
      })
    );
    
    // Insert users
    await User.insertMany(usersWithHashedPasswords);
    
    console.log('Data imported successfully');
    process.exit();
  } catch (error) {
    console.error('Error importing data:', error);
    process.exit(1);
  }
};

const destroyData = async () => {
  try {
    await User.deleteMany();
    
    console.log('Data destroyed successfully');
    process.exit();
  } catch (error) {
    console.error('Error destroying data:', error);
    process.exit(1);
  }
};

if (process.argv[2] === '-d') {
  destroyData();
} else {
  importData();
}