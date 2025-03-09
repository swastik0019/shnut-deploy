// This utility enables emitting socket events from outside socket handlers
// like REST API controllers

let io = null;

/**
 * Initialize the socket emitter with the io instance
 * @param {Object} ioInstance - The Socket.IO instance
 */
const initSocketEmitter = (ioInstance) => {
  io = ioInstance;
};

/**
 * Emit an event to all connected clients
 * @param {string} event - The event name
 * @param {Object} data - The data to emit
 * @param {string} namespace - Optional namespace
 * @returns {boolean} - Whether the emit was successful
 */
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

/**
 * Emit an event to a specific room
 * @param {string} room - The room name
 * @param {string} event - The event name
 * @param {Object} data - The data to emit
 * @param {string} namespace - Optional namespace
 * @returns {boolean} - Whether the emit was successful
 */
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

/**
 * Emit an event to a specific user (using their user ID as room)
 * @param {string} userId - The user ID
 * @param {string} event - The event name
 * @param {Object} data - The data to emit
 * @param {string} namespace - Optional namespace
 * @returns {boolean} - Whether the emit was successful
 */
const emitToUser = (userId, event, data, namespace = null) => {
  return emitToRoom(userId, event, data, namespace);
};

export {
  initSocketEmitter,
  emitSocket,
  emitToRoom,
  emitToUser
};