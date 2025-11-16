const mongoose = require('mongoose');
const { ensureConnection } = require('../db/connect');

const checkDatabaseConnection = async (req, res, next) => {
  try {
    // Ensure connection is ready before proceeding
    await ensureConnection();
    next();
  } catch (error) {
    console.error('Database connection check failed:', error.message);
    return res.status(500).json({
      success: false,
      message: "Database connection error",
      error: error.message || "Database is not connected. Please try again later.",
      connectionState: mongoose.connection.readyState
    });
  }
};

module.exports = checkDatabaseConnection;
