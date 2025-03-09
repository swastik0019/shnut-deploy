import http from "http";
import app from "./app.js";
import { Server } from "socket.io";
import setupSocket from "./socket/index.js";
import { connectDB } from "./config/db.js";
import cluster from "cluster";
import os from "os";

// Validating the essential environment variables
const validateEnv = () => {
  const requiredEnvVars = ['MONGODB_URI'];
  const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

  if (missingEnvVars.length > 0) {
    console.error(`❌ Missing required environment variables: ${missingEnvVars.join(', ')}`);
    process.exit(1);
  }
};

// Initializing the HTTP server with Socket.IO
const createServer = async () => {
  try {
    // Create HTTP server instance
    const server = http.createServer(app);

    // Configuring Socket.IO with CORS settings
    const io = new Server(server, {
      cors: {
        origin: [
          process.env.CORS_ORIGIN,
          "http://localhost:5173",
          "https://project-shnut-three.vercel.app"
        ].filter(Boolean),
        credentials: true,
        methods: ["GET", "POST"]
      },
      pingTimeout: 60000, // How long to wait before considering connection closed
      connectTimeout: 45000 // Connection timeout
    });

    // Initializing socket event handlers
    setupSocket(io);

    return { server, io };
  } catch (error) {
    console.error(`❌ Error creating server: ${error.message}`);
    throw error;
  }
};

// Handling graceful shutdown
const setupGracefulShutdown = (server, io) => {
  let isShuttingDown = false;

  const gracefulShutdown = async (signal) => {
    if (isShuttingDown) return;
    isShuttingDown = true;

    console.log(`\n🛑 ${signal} received. Gracefully shutting down...`);

    // Create a timeout that will force-close the server if graceful shutdown takes too long
    const forceShutdownTimeout = setTimeout(() => {
      console.error("⚠️ Forceful shutdown initiated after timeout");
      process.exit(1);
    }, 30000); // 30 seconds timeout for graceful shutdown

    try {
      // Close the HTTP server first (stop accepting new connections)
      await new Promise((resolve) => {
        server.close(resolve);
        console.log("✅ HTTP server closed");
      });

      // Close all Socket.IO connections
      await new Promise((resolve) => {
        io.close(() => {
          console.log("✅ All websocket connections closed");
          resolve();
        });
      });

      // Close database connection last
      await mongoose.connection.close();
      console.log("✅ Database connection closed");

      // Clear the force shutdown timeout
      clearTimeout(forceShutdownTimeout);

      // Exit process gracefully
      process.exit(0);
    } catch (error) {
      console.error(`❌ Error during graceful shutdown: ${error.message}`);
      process.exit(1);
    }
  };

  // Attach shutdown handlers to process signals
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
};

// Handle uncaught exceptions and unhandled promises
process.on('uncaughtException', (error) => {
  console.error('❌ UNCAUGHT EXCEPTION:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ UNHANDLED REJECTION:', reason);
  process.exit(1);
});

// Main server startup function
const startServer = async () => {
  const PORT = process.env.PORT || 8000;
  const ENABLE_CLUSTERING = process.env.ENABLE_CLUSTERING === 'true';
  const numCPUs = os.cpus().length;

  // Check for clustering mode
  if (ENABLE_CLUSTERING && cluster.isPrimary) {
    console.log(`🧠 Primary process ${process.pid} is running`);
    console.log(`🔄 Starting ${numCPUs} worker processes...`);

    // Fork workers for each CPU
    for (let i = 0; i < numCPUs; i++) {
      cluster.fork();
    }

    // Handle worker exits and restart them
    cluster.on('exit', (worker, code, signal) => {
      console.log(`⚠️ Worker ${worker.process.pid} died. Restarting...`);
      cluster.fork();
    });
  } else {
    try {
      // Validate environment variables first
      validateEnv();

      // Connect to database
      await connectDB();
      console.log(`✅ Database connected successfully [${process.env.NODE_ENV || 'development'} mode]`);

      // Initialize server and socket
      const { server, io } = await createServer();

      // Set up graceful shutdown handlers
      setupGracefulShutdown(server, io);

      // Start listening for requests
      server.listen(PORT, () => {
        console.log(`
🚀 Server is running on http://localhost:${PORT}
🔌 Socket.IO initialized
👷 Worker ${process.pid} started
⏱️  ${new Date().toISOString()}
        `);
      });
    } catch (error) {
      console.error(`🔥 Failed to start the server: ${error.message}`);
      process.exit(1);
    }
  }
};

// Start the server
startServer();