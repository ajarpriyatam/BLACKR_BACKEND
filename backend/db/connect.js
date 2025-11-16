const mongoose = require("mongoose");

// Cache the connection promise to prevent multiple connection attempts
let connectionPromise = null;

const connect = async () => {
  try {
    // Check if already connected
    if (mongoose.connection.readyState === 1) {
      console.log("Already connected to MongoDB");
      return mongoose.connection;
    }

    // If connection is in progress, return the existing promise
    if (connectionPromise) {
      console.log("Connection in progress, waiting...");
      return await connectionPromise;
    }

    // Check if connection string exists
    if (!process.env.DB_URI) {
      throw new Error("Database URI not found in environment variables");
    }

    // Ensure connection string has database name
    let dbUri = process.env.DB_URI.trim();
    
    // Check if database name is already in the URI
    // MongoDB URI format: mongodb+srv://user:pass@cluster.mongodb.net/database?options
    // Extract the part after the last / and before ? or end of string
    const lastSlashIndex = dbUri.lastIndexOf('/');
    const questionMarkIndex = dbUri.indexOf('?', lastSlashIndex);
    const afterSlash = questionMarkIndex > -1 
      ? dbUri.substring(lastSlashIndex + 1, questionMarkIndex)
      : dbUri.substring(lastSlashIndex + 1);
    
    // If after the last slash is empty or just whitespace, add database name
    if (!afterSlash || afterSlash.trim().length === 0) {
      if (dbUri.endsWith('/')) {
        dbUri += 'blackr';
      } else if (questionMarkIndex > -1) {
        // Has query params but no database name
        dbUri = dbUri.substring(0, questionMarkIndex) + '/blackr' + dbUri.substring(questionMarkIndex);
      } else {
        dbUri += '/blackr';
      }
    }

    console.log("Attempting to connect to MongoDB...");
    
    // Create connection promise
    connectionPromise = mongoose.connect(dbUri, {
      serverSelectionTimeoutMS: 30000, // 30 seconds
      socketTimeoutMS: 45000, // 45 seconds
      maxPoolSize: 10, // Maintain up to 10 socket connections
      minPoolSize: 1, // Reduced for serverless (was 5)
      retryWrites: true, // Enable retryable writes
      retryReads: true, // Enable retryable reads
      connectTimeoutMS: 30000, // 30 seconds
      heartbeatFrequencyMS: 10000, // 10 seconds
    }).then(() => {
      console.log("✅ Connected to MongoDB successfully");
      connectionPromise = null; // Reset promise on success
      return mongoose.connection;
    }).catch((err) => {
      connectionPromise = null; // Reset promise on error
      throw err;
    });

    // Add connection event listeners (only once)
    if (!mongoose.connection.listeners('error').length) {
      mongoose.connection.on('error', (err) => {
        console.error('❌ MongoDB connection error:', err);
        connectionPromise = null; // Reset on error
      });
      
      mongoose.connection.on('disconnected', () => {
        console.warn('⚠️ MongoDB disconnected - attempting to reconnect...');
        connectionPromise = null; // Reset promise
        // Auto-reconnect after 5 seconds
        setTimeout(() => {
          if (mongoose.connection.readyState === 0) {
            connect().catch(err => console.error('Reconnection failed:', err));
          }
        }, 5000);
      });
      
      mongoose.connection.on('reconnected', () => {
        console.log('🔄 MongoDB reconnected');
      });

      mongoose.connection.on('close', () => {
        console.warn('⚠️ MongoDB connection closed');
        connectionPromise = null; // Reset promise
      });
    }

    return await connectionPromise;

  } catch (error) {
    connectionPromise = null; // Reset promise on error
    console.error("❌ MongoDB connection failed:", error.message);
    throw error; // Throw error so caller can handle it
  }
};

// Helper function to ensure connection is ready before operations
const ensureConnection = async () => {
  // If already connected, return immediately
  if (mongoose.connection.readyState === 1) {
    return true;
  }
  
  // If connection is in progress (either via connectionPromise or readyState 2)
  if (connectionPromise || mongoose.connection.readyState === 2) {
    try {
      // Wait for the connection promise if it exists
      if (connectionPromise) {
        await connectionPromise;
        return true;
      }
      
      // Otherwise wait for the connection event
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Connection timeout after 30 seconds'));
        }, 30000);
        
        const onConnected = () => {
          clearTimeout(timeout);
          mongoose.connection.removeListener('error', onError);
          resolve(true);
        };
        
        const onError = (err) => {
          clearTimeout(timeout);
          mongoose.connection.removeListener('connected', onConnected);
          reject(err);
        };
        
        mongoose.connection.once('connected', onConnected);
        mongoose.connection.once('error', onError);
      });
    } catch (error) {
      // If connectionPromise failed, try to reconnect
      if (connectionPromise) {
        connectionPromise = null;
      }
      throw error;
    }
  }
  
  // Not connected, establish connection
  await connect();
  return true;
};

module.exports = { connect, ensureConnection };
