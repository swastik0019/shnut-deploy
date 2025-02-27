import mongoose from "mongoose"; // Import Mongoose library to interact with MongoDB
import { DB_NAME } from "../constants.js"; // Import the database name from constants.js


//  **Establishes a connection to the MongoDB database.**
const connectDB = async () => {
  try {
    // Ensure that the MongoDB URI is defined in environment variables
    if (!process.env.MONGODB_URI) {
      // If not defined, throw an error
      throw new Error("Please define the MONGODB_URI environment variable.");
    }

    // Build the MongoDB URI by appending the database name to the connection string
    const mongoURI = `${process.env.MONGODB_URI}${DB_NAME}`;

    // Connect to MongoDB using the built URI and options
    const connectionInstance = await mongoose.connect(mongoURI);

    // Log the successful connection and the host to which it is connected
    console.log(`MongoDB connected: ${connectionInstance.connection.host}`);
  } catch (error) {
    // Log the error message in case of failure
    console.error(`MongoDB Connection Error: ${error.message}`);
    // Exit the process with a non-zero code to indicate failure
    process.exit(1);
  }
};

// Export the connectDB function so it can be used in other parts of the application
export { connectDB };