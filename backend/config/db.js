const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    console.log('MONGO_URI from env:', process.env.MONGO_URI);
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/skillhub');
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;