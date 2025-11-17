const app = require("./app.js");
const dotenv = require('dotenv');
const Razorpay = require("razorpay");
const { connect, ensureConnection } = require("./db/connect.js");
const cloudinary = require("cloudinary");

// Load environment variables - try both local and Vercel
if (process.env.NODE_ENV !== 'production') {
  dotenv.config({ path: "backend/db/config.env" });
}

// Connect to database
const startServer = async () => {
  try {
    await connect();
    console.log("✅ Database connection established");
  } catch (error) {
    console.error("❌ Failed to connect to database:", error.message);
    console.warn("⚠️ Will retry on first request");
  }
};

// Initialize database connection (non-blocking for local, blocking for serverless)
if (process.env.NODE_ENV === 'production') {
  // For serverless, ensure connection before exporting
  startServer().catch(err => {
    console.error("Initial connection failed, will retry on request:", err.message);
  });
} else {
  // For local development, start connection in background
  startServer();
}

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDNAME,
  api_key: process.env.APIKEY,
  api_secret: process.env.APISECRET,
});

exports.instance = new Razorpay({
  key_id: process.env.RAZORPAY_API_KEY,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const PORT = process.env.PORT || 4000;

// For Vercel serverless functions, export the app directly
if (process.env.NODE_ENV === 'production') {
  module.exports = app;
  // Also export instance for use in other modules
  module.exports.instance = exports.instance;
} else {
  // For local development, start the server
  const server = app.listen(PORT, () => {
    console.log(`Server is working on port ${PORT}`);
  });
}
