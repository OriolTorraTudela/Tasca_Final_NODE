const mongoose = require('mongoose');

/**
 * Connecta amb MongoDB
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`MongoDB connectat: ${conn.connection.host}`);
  } catch (error) {
    console.error('Error connectant MongoDB:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
