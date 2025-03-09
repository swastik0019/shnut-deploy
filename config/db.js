import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

/**
 * Connecting MongoDB database with following features:
 * - Connection retries
 * - Proper URI formatting
 * - Graceful shutdown handling
 * - Advanced error handling
 * - Environment-specific configuration
 */
const connectDB = async () => {
  // Maximum number of connection attempts
  const MAX_RETRIES = 3;
  let retryCount = 0;
  let connectionInstance = null;

  // Connection options based on environment
  const connectionOptions = {
    // Auto-create indexes in development, but not in production for performance
    autoIndex: process.env.NODE_ENV !== 'production',
    // Connection timeout
    connectTimeoutMS: 10000,
    // Wait 5 seconds before timing out operations
    socketTimeoutMS: 45000,
    // Max pool size for concurrent connections (depends on your app's requirements)
    maxPoolSize: 50
  };

  while (retryCount < MAX_RETRIES) {
    try {
      // Ensure that the MongoDB URI is defined in environment variables
      if (!process.env.MONGODB_URI) {
        throw new Error("Please define the MONGODB_URI environment variable.");
      }

      // Use URL to properly format the connection string
      let mongoURI = process.env.MONGODB_URI;
      // Ensure URI ends with a slash if needed before appending DB name
      if (mongoURI.charAt(mongoURI.length - 1) !== '/' && !mongoURI.includes('?')) {
        mongoURI += '/';
      }
      
      // Append DB name only if it's not already in the URI
      if (!mongoURI.includes(`/${DB_NAME}`) && !mongoURI.includes(`/${DB_NAME}?`)) {
        mongoURI += DB_NAME;
      }

      // Connect to MongoDB using the built URI and options
      connectionInstance = await mongoose.connect(mongoURI, connectionOptions);

      // Log the successful connection and the host to which it is connected
      console.log(`MongoDB connected successfully: ${connectionInstance.connection.host}`);
      
      // Break out of retry loop on success
      break;
    } catch (error) {
      retryCount++;
      console.error(`MongoDB Connection Error (Attempt ${retryCount}/${MAX_RETRIES}): ${error.message}`);
      
      // If we've exhausted all retries, exit the process
      if (retryCount >= MAX_RETRIES) {
        console.error("Failed to connect to MongoDB after multiple attempts. Exiting...");
        process.exit(1);
      }
      
      // Wait before retrying (exponential backoff)
      const retryDelay = Math.pow(2, retryCount) * 1000; // 2s, 4s, 8s...
      console.log(`Retrying connection in ${retryDelay/1000} seconds...`);
      await new Promise(resolve => setTimeout(resolve, retryDelay));
    }
  }

  // Set up graceful shutdown handlers
  setupGracefulShutdown(connectionInstance);
  
  return connectionInstance;
};

/**
 * Sets up graceful shutdown to properly close database connections
 * when the application is terminated.
 */
const setupGracefulShutdown = (connectionInstance) => {
  // Handle the most common termination signals
  ['SIGINT', 'SIGTERM', 'SIGQUIT'].forEach(signal => {
    process.on(signal, async () => {
      try {
        // Close all Mongoose connections gracefully
        console.log('Closing MongoDB connections...');
        await mongoose.connection.close();
        console.log('MongoDB connections closed.');
        
        // Exit the process with success code
        process.exit(0);
      } catch (err) {
        console.error(`Error during MongoDB disconnection: ${err.message}`);
        process.exit(1);
      }
    });
  });
};

export { connectDB };