import { createSocketNotification } from './notificationHandler.js';

let io = null;
let userSocketMap = {}; // Added for direct user-to-user messaging

const initSocketEmitter = (ioInstance, socketMap = {}) => {
  io = ioInstance;
  // If a user socket map is provided, use it
  if (Object.keys(socketMap).length > 0) {
    userSocketMap = socketMap;
  }
};

const updateUserSocketMap = (map) => {
  userSocketMap = map;
};

const emitSocket = (event, data, namespace = null) => {
  if (!io) {
    console.error("Socket.IO instance not initialized. Call initSocketEmitter first.");
    return false;
  }

  try {
    if (namespace) {
      io.of(namespace).emit(event, data);
    } else {
      io.emit(event, data);
    }
    return true;
  } catch (error) {
    console.error(`Error emitting socket event ${event}:`, error);
    return false;
  }
};

const emitToRoom = (room, event, data, namespace = null) => {
  if (!io) {
    console.error("Socket.IO instance not initialized. Call initSocketEmitter first.");
    return false;
  }

  try {
    if (namespace) {
      io.of(namespace).to(room).emit(event, data);
    } else {
      io.to(room).emit(event, data);
    }
    return true;
  } catch (error) {
    console.error(`Error emitting socket event ${event} to room ${room}:`, error);
    return false;
  }
};

const emitToUser = (userId, event, data, namespace = null) => {
  if (!io) {
    console.error("Socket.IO instance not initialized. Call initSocketEmitter first.");
    return false;
  }

  let success = false;

  try {
    // First, try to emit to user's room (most reliable method)
    if (namespace) {
      io.of(namespace).to(userId).emit(event, data);
    } else {
      io.to(userId).emit(event, data);
    }
    
    console.log(`Emitted ${event} to user room: ${userId}`);
    success = true;
    
    // Additionally, try direct socket if we have it in our map
    const socketId = userSocketMap[userId];
    if (socketId) {
      if (namespace) {
        io.of(namespace).to(socketId).emit(event, data);
      } else {
        io.to(socketId).emit(event, data);
      }
      console.log(`Also emitted ${event} directly to socket: ${socketId}`);
    }
    
    return success;
  } catch (error) {
    console.error(`Error emitting socket event ${event} to user ${userId}:`, error);
    return success;
  }
};

// Notification-specific functions
const sendNotification = async (recipientId, senderId, type, reference = {}, metadata = {}, customMessage = null) => {
  if (!io) {
    console.error("Socket.IO instance not initialized. Call initSocketEmitter first.");
    return null;
  }
  
  // Use the notification handler to create and send notification
  return await createSocketNotification(io, recipientId, senderId, type, reference, metadata, customMessage);
};

const sendNotificationToMany = async (recipientIds, senderId, type, reference = {}, metadata = {}, customMessage = null) => {
  if (!io) {
    console.error("Socket.IO instance not initialized. Call initSocketEmitter first.");
    return [];
  }
  
  const notifications = [];
  for (const recipientId of recipientIds) {
    const notification = await createSocketNotification(io, recipientId, senderId, type, reference, metadata, customMessage);
    if (notification) {
      notifications.push(notification);
    }
  }
  
  return notifications;
};

// Special function for call notifications
const sendCallNotification = (recipientId, event, data) => {
  // First, try emitting directly to user's room
  const roomSuccess = emitToUser(recipientId, event, data);
  
  // Log detailed information for debugging
  console.log(`Call notification (${event}) sent to user ${recipientId}: ${roomSuccess ? 'SUCCESS' : 'FAILED'}`);
  
  // If we have a direct socket connection, try that too as backup
  const socketId = userSocketMap[recipientId];
  if (socketId) {
    try {
      io.to(socketId).emit(event, data);
      console.log(`Also sent call notification directly to socket ${socketId}`);
    } catch (err) {
      console.error(`Failed to send direct call notification to socket ${socketId}:`, err);
    }
  }
  
  return roomSuccess;
};

export {
  initSocketEmitter,
  updateUserSocketMap,
  emitSocket,
  emitToRoom,
  emitToUser,
  sendNotification,
  sendNotificationToMany,
  sendCallNotification
};