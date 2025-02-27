import http from "http";
import app from "./app.js";
import { Server } from "socket.io";
import setupSocket from "./socket/index.js";
import { connectDB } from "./config/db.js";

const PORT = process.env.PORT || 8000;

const startServer = async () => {
  try {
    // Connect to the database
    await connectDB();
    console.log("✅ Database connected successfully.");

    // Create an HTTP server from your Express app
    const server = http.createServer(app);

    // Initialize Socket.IO with CORS options (adjust origins as needed)
    const io = new Server(server, {
      cors: {
        origin: [
          process.env.CORS_ORIGIN,
          "http://localhost:5173",
          "https://project-shnut-three.vercel.app",
        ],
        credentials: true,
      },
    });

    // Set up your Socket.IO events (chat, notifications, etc.)
    setupSocket(io);

    // Start the server
    server.listen(PORT, () => {
      console.log(`🚀 Server is running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("🔥 Failed to start the server:", error.message);
    process.exit(1);
  }
};

startServer();
