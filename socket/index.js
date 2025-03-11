import { User } from "../models/user.model.js";
import chatHandler from "./chatHandler.js";
import webrtcHandler from "./videoChatHandler.js";
import notificationHandler from "./notificationHandler.js";
import mongoose from "mongoose";
import { initSocketEmitter } from "./socketEmitter.js";

// An object to keep track of active socket connections per user
const onlineUsers = {};

// Track user's last activity timestamp
const userActivity = {};

// Map of userId to socketId for direct communication
const userSocketMap = {};

// The setupSocket function for your Socket.IO server
const setupSocket = (io) => {
  // Initialize socket emitter with the io instance
  initSocketEmitter(io);

  // Create a namespace for online status updates
  const statusNamespace = io.of("/status");

  // Create a namespace for notifications
  const notificationNamespace = io.of("/notifications");

  // Reset all users to offline when server starts
  User.updateMany({}, { isOnline: false })
    .then(() => console.log("✅ Reset all users to offline on server start"))
    .catch((err) => console.error("❌ Error resetting user statuses:", err));

  // Setup heartbeat ping
  const pingInterval = setInterval(() => {
    io.emit("ping");
    statusNamespace.emit("ping");
    notificationNamespace.emit("ping");

    // Check for inactive users (5 minutes timeout)
    const now = Date.now();
    Object.entries(userActivity).forEach(async ([userId, lastActive]) => {
      if (now - lastActive > 5 * 60 * 1000) {
        // 5 minutes
        // Only mark as offline if they still have an entry in userActivity
        // but no active connections
        if (!onlineUsers[userId] || onlineUsers[userId].length === 0) {
          console.log(
            `🕒 Timeout: User ${userId} marked offline due to inactivity`
          );
          delete userActivity[userId];

          try {
            // Use a transaction to prevent race conditions
            const session = await mongoose.startSession();
            await session.withTransaction(async () => {
              const user = await User.findByIdAndUpdate(
                userId,
                { isOnline: false },
                { new: true, session }
              );

              if (user) {
                io.emit("userOffline", { userId });
                statusNamespace.emit("userOffline", { userId });
                console.log(
                  `User ${userId} marked as offline due to inactivity.`
                );

                // After a user goes offline, emit the updated list of online creators
                await emitOnlineCreators(io);
                await emitOnlineCreators(statusNamespace);
              }
            });
            session.endSession();
          } catch (error) {
            console.error(
              "Error updating offline status for inactive user:",
              error
            );
          }
        }
      }
    });
  }, 30000); // Every 30 seconds

  // Clean up interval when server is shutting down
  process.on("SIGTERM", () => clearInterval(pingInterval));
  process.on("SIGINT", () => clearInterval(pingInterval));

  // Main connection handler
  io.on("connection", async (socket) => {
    // Assume that the client sends the user ID in the handshake query
    const userId = socket.handshake.query.userId;

    // Handle pong response to maintain activity status
    socket.on("pong", () => {
      if (userId) {
        userActivity[userId] = Date.now();
      }
    });

    if (userId) {
      // Add to userSocketMap for direct communication
      userSocketMap[userId] = socket.id;
      
      // IMPORTANT: Join a room specific to this user's ID to allow direct messaging
      socket.join(userId);
      console.log(`User ${userId} joined their personal room (socket ${socket.id})`);

      // Update activity timestamp
      userActivity[userId] = Date.now();

      // If the user already has active connections, add this socket's ID
      if (onlineUsers[userId]) {
        onlineUsers[userId].push(socket.id);
        console.log(
          `Additional connection for user ${userId}. Total: ${onlineUsers[userId].length}`
        );
      } else {
        // Otherwise, create a new entry and mark the user as online
        onlineUsers[userId] = [socket.id];
        try {
          // Use a transaction to prevent race conditions
          const session = await mongoose.startSession();
          await session.withTransaction(async () => {
            await User.findByIdAndUpdate(
              userId,
              { isOnline: true },
              { new: true, session }
            );

            io.emit("userOnline", { userId });
            statusNamespace.emit("userOnline", { userId });
            console.log(`User ${userId} marked as online.`);

            // After a user comes online, emit the updated list of online creators
            await emitOnlineCreators(io);
            await emitOnlineCreators(statusNamespace);
          });
          session.endSession();
        } catch (error) {
          console.error("Error updating online status:", error);
          // Send error to the client
          socket.emit("error", {
            type: "status-update",
            message: "Failed to update online status",
          });
        }
      }
    }

    console.log("New client connected:", socket.id, "User:", userId);

    // Initialize chat, video chat, and notification event handlers
    chatHandler(io, socket);
    webrtcHandler(io, socket); // Make sure to use the correct handler
    notificationHandler(io, socket);

    // Handle client request for online creators
    socket.on("getOnlineCreators", async () => {
      try {
        await emitOnlineCreators(io, socket);
      } catch (error) {
        console.error("Error fetching online creators:", error);
        socket.emit("error", {
          type: "creators-fetch",
          message: "Failed to fetch online creators",
        });
      }
    });

    // When a socket disconnects
    socket.on("disconnect", async () => {
      console.log("Client disconnected:", socket.id, "User:", userId);
      
      // Remove from userSocketMap if this is the mapped socket
      if (userId && userSocketMap[userId] === socket.id) {
        delete userSocketMap[userId];
      }
      
      if (userId && onlineUsers[userId]) {
        // Remove the socket ID from the list for this user
        onlineUsers[userId] = onlineUsers[userId].filter(
          (id) => id !== socket.id
        );

        console.log(
          `Connection removed for user ${userId}. Remaining: ${onlineUsers[userId].length}`
        );

        // If no more active connections remain, mark the user as offline
        if (onlineUsers[userId].length === 0) {
          delete onlineUsers[userId];

          // Add a small delay to prevent race conditions with reconnects
          setTimeout(async () => {
            // Check again after the delay - the user might have reconnected
            if (!onlineUsers[userId] || onlineUsers[userId].length === 0) {
              try {
                // Use a transaction to prevent race conditions
                const session = await mongoose.startSession();
                await session.withTransaction(async () => {
                  await User.findByIdAndUpdate(
                    userId,
                    { isOnline: false },
                    { new: true, session }
                  );

                  io.emit("userOffline", { userId });
                  statusNamespace.emit("userOffline", { userId });
                  console.log(`User ${userId} marked as offline.`);

                  // After a user goes offline, emit the updated list of online creators
                  await emitOnlineCreators(io);
                  await emitOnlineCreators(statusNamespace);
                });
                session.endSession();
              } catch (error) {
                console.error("Error updating offline status:", error);
              }
            }
          }, 2000); // 2 second delay
        }
      }
    });
  });

  // Status namespace for dedicated online status tracking
  statusNamespace.on("connection", async (socket) => {
    console.log("Client connected to status namespace:", socket.id);
    const userId = socket.handshake.query.userId;

    // Update activity timestamp
    if (userId) {
      userActivity[userId] = Date.now();
    }

    // Handle pong response for status namespace
    socket.on("pong", () => {
      if (userId) {
        userActivity[userId] = Date.now();
      }
    });

    // Send the initial list of online users
    try {
      const onlineUserIds = Object.keys(onlineUsers);
      socket.emit("onlineUsers", onlineUserIds);

      // Also send the initial list of online creators
      await emitOnlineCreators(statusNamespace, socket);
    } catch (error) {
      console.error("Error sending initial online status:", error);
      socket.emit("error", {
        type: "initial-status",
        message: "Failed to load initial status",
      });
    }

    // Handle specific status requests
    socket.on("getOnlineUsers", () => {
      try {
        const onlineUserIds = Object.keys(onlineUsers);
        socket.emit("onlineUsers", onlineUserIds);
      } catch (error) {
        console.error("Error fetching online users:", error);
        socket.emit("error", {
          type: "users-fetch",
          message: "Failed to fetch online users",
        });
      }
    });

    socket.on("getOnlineCreators", async () => {
      try {
        await emitOnlineCreators(statusNamespace, socket);
      } catch (error) {
        console.error("Error fetching online creators:", error);
        socket.emit("error", {
          type: "creators-fetch",
          message: "Failed to fetch online creators",
        });
      }
    });
  });

  // Notification namespace for dedicated notification handling
  notificationNamespace.on("connection", async (socket) => {
    console.log("Client connected to notification namespace:", socket.id);
    const userId = socket.handshake.query.userId;

    if (userId) {
      // Join a room specific to this user's ID
      socket.join(userId);

      // Update activity timestamp
      userActivity[userId] = Date.now();

      // Initialize notification handler for this socket
      notificationHandler(io, socket);
    }

    // Handle pong response for notification namespace
    socket.on("pong", () => {
      if (userId) {
        userActivity[userId] = Date.now();
      }
    });
  });
  
  // Export the userSocketMap for direct access from other handlers
  return {
    userSocketMap,
    onlineUsers
  };
};

// Helper function to fetch and emit online creators with retry mechanism
async function emitOnlineCreators(io, socket = null, retries = 3) {
  try {
    // Get all online users who have the role of "creator"
    const onlineCreators = await User.find({
      isOnline: true,
      role: "creator",
      banned: false, // Only include non-banned creators
    }).select("_id firstName lastName nickname avatar bio");

    // If a specific socket is provided, emit only to that socket
    if (socket) {
      socket.emit("onlineCreators", onlineCreators);
    } else {
      // Otherwise broadcast to all connected clients
      io.emit("onlineCreators", onlineCreators);
    }

    console.log(`Emitted ${onlineCreators.length} online creators`);
    return onlineCreators;
  } catch (error) {
    console.error("Error fetching online creators:", error);

    // Implement retry logic
    if (retries > 0) {
      console.log(
        `Retrying to fetch online creators. Attempts left: ${retries - 1}`
      );
      // Wait for 1 second before retrying
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return emitOnlineCreators(io, socket, retries - 1);
    }

    throw error;
  }
}

export default setupSocket;