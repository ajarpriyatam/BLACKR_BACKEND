const express = require("express");
const app = express();
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const path = require("path")
const { ensureConnection } = require("./db/connect");

// if (process.env.NODE_ENV !== "PRODUCTION") {
//     require("dotenv").config({ path: "backend/db/config.env" });
//   }

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cookieParser());

// Middleware to ensure DB connection before handling API requests
app.use(async (req, res, next) => {
  // Skip for health check and static files
  if (req.path === '/api/health' || req.path.startsWith('/static') || !req.path.startsWith('/api')) {
    return next();
  }
  
  try {
    await ensureConnection();
    next();
  } catch (error) {
    console.error('Database connection error in middleware:', error.message);
    return res.status(500).json({
      success: false,
      message: "Database connection error",
      error: error.message || "Unable to connect to database. Please try again later."
    });
  }
});

const product = require("./routes/ProdectRoute");
const user = require("./routes/UserRoute");
const order = require("./routes/OrderRoute");
const coupon = require("./routes/CouponRoute");

app.use("/api/v4", product);
app.use("/api/v4", user);
app.use("/api/v4", order);
app.use("/api/v4", coupon);

app.get("/api/getkey", (req, res) => {
  res.status(200).json({
    key: process.env.RAZORPAY_API_KEY,
    success: true,
    message: "Get Razorpay API key from backend to frontend",
  });
});

// app.use(express.static(path.join(__dirname, "../frontend/build")));

// Serve static files from public directory
app.use(express.static(path.join(__dirname, "../public")));

// API health check endpoint
app.get("/api/health", (req, res) => {
    const mongoose = require('mongoose');
    const dbStatus = mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected';
    
    res.json({ 
        status: "OK", 
        message: "Candle Backend API is running",
        database: dbStatus,
        timestamp: new Date().toISOString()
    });
});

// Catch-all handler for API routes
app.get("*", (req, res) => {
    res.status(404).json({ 
        error: "API endpoint not found",
        message: "Please check your API endpoint URL"
    });
});
 
module.exports = app;
