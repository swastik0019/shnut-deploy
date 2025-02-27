// Import your User model to update online status in the database
import { User } from "../models/user.model.js";
import chatHandler from "./chatHandler.js";
import videoChatHandler from "./videoChatHandler.js";

// An object to keep track of active socket connections per user
const onlineUsers = {};

// The setupSocket function for your Socket.IO server
const setupSocket = (io) => {
  // Create a namespace for online status updates
  const statusNamespace = io.of("/status");

  // Main connection handler
  io.on("connection", async (socket) => {
    // Assume that the client sends the user ID in the handshake query
    // You can also use authentication middleware or a token-based approach
    const userId = socket.handshake.query.userId;

    if (userId) {
      // If the user already has active connections, add this socket's ID
      if (onlineUsers[userId]) {
        onlineUsers[userId].push(socket.id);
      } else {
        // Otherwise, create a new entry and mark the user as online
        onlineUsers[userId] = [socket.id];
        try {
          await User.findByIdAndUpdate(userId, { isOnline: true });
          io.emit("userOnline", { userId });
          statusNamespace.emit("userOnline", { userId });
          console.log(`User ${userId} marked as online.`);
          
          // After a user comes online, emit the updated list of online creators
          emitOnlineCreators(io);
        } catch (error) {
          console.error("Error updating online status:", error);
        }
      }
    }

    console.log("New client connected:", socket.id, "User:", userId);

    // Initialize chat and video chat event handlers
    chatHandler(io, socket);
    videoChatHandler(io, socket);

    // Handle client request for online creators
    socket.on("getOnlineCreators", async () => {
      try {
        await emitOnlineCreators(io, socket);
      } catch (error) {
        console.error("Error fetching online creators:", error);
      }
    });

    // When a socket disconnects
    socket.on("disconnect", async () => {
      console.log("Client disconnected:", socket.id, "User:", userId);
      if (userId && onlineUsers[userId]) {
        // Remove the socket ID from the list for this user
        onlineUsers[userId] = onlineUsers[userId].filter(
          (id) => id !== socket.id
        );
        // If no more active connections remain, mark the user as offline
        if (onlineUsers[userId].length === 0) {
          delete onlineUsers[userId];
          try {
            await User.findByIdAndUpdate(userId, { isOnline: false });
            io.emit("userOffline", { userId });
            statusNamespace.emit("userOffline", { userId });
            console.log(`User ${userId} marked as offline.`);
            
            // After a user goes offline, emit the updated list of online creators
            emitOnlineCreators(io);
          } catch (error) {
            console.error("Error updating offline status:", error);
          }
        }
      }
    });
  });

  // Status namespace for dedicated online status tracking
  statusNamespace.on("connection", async (socket) => {
    console.log("Client connected to status namespace:", socket.id);
    
    // Send the initial list of online users
    try {
      const onlineUserIds = Object.keys(onlineUsers);
      socket.emit("onlineUsers", onlineUserIds);
      
      // Also send the initial list of online creators
      await emitOnlineCreators(statusNamespace, socket);
    } catch (error) {
      console.error("Error sending initial online status:", error);
    }
    
    // Handle specific status requests
    socket.on("getOnlineUsers", () => {
      const onlineUserIds = Object.keys(onlineUsers);
      socket.emit("onlineUsers", onlineUserIds);
    });
    
    socket.on("getOnlineCreators", async () => {
      try {
        await emitOnlineCreators(statusNamespace, socket);
      } catch (error) {
        console.error("Error fetching online creators:", error);
      }
    });
  });
};

// Helper function to fetch and emit online creators
async function emitOnlineCreators(io, socket = null) {
  try {
    // Get all online users who have the role of "creator"
    const onlineCreators = await User.find({
      role: "creator",
      banned: false // Only include non-banned creators
    }).select('_id firstName lastName nickname avatar bio');
    
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
    throw error;
  }
}

export default setupSocket;