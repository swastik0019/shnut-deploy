import { emitToUser } from "./socketEmitter.js";

const webrtcHandler = (io, socket) => {
  console.log("Setting up WebRTC events for socket:", socket.id);

  // Get the user ID from the socket query
  const userId = socket.handshake.query.userId;
  console.log(`WebRTC handler initialized for user: ${userId}`);

  // Keep track of which rooms this socket has joined
  const joinedRooms = new Set();

  // Handle call invitations - THIS IS THE MISSING HANDLER
  socket.on("callInvitation", (data) => {
    const { to, from, fromName, fromAvatar, roomId } = data;
    console.log(
      `Call invitation from ${
        fromName || from
      } (${from}) to ${to} for room ${roomId}`
    );

    // Forward the invitation to the recipient
    // Using emitToUser from socketEmitter to ensure reliable delivery
    emitToUser(to, "callInvitation", {
      from,
      fromName,
      fromAvatar,
      roomId,
    });

    // Alternative direct method using socket.io
    io.to(to).emit("callInvitation", {
      from,
      fromName,
      fromAvatar,
      roomId,
    });

    console.log(`Call invitation forwarded to recipient: ${to}`);
  });

  // Handle call accepted - THIS IS ANOTHER MISSING HANDLER
  socket.on("callAccepted", (data) => {
    const { to, roomId } = data;
    console.log(
      `Call accepted by ${userId || socket.id} for ${to} in room ${roomId}`
    );

    // Notify the caller that their call was accepted
    emitToUser(to, "callAccepted", {
      from: userId || socket.id,
      roomId,
    });

    // Alternative direct method
    io.to(to).emit("callAccepted", {
      from: userId || socket.id,
      roomId,
    });
  });

  // Handle call declined - THIS IS ANOTHER MISSING HANDLER
  socket.on("callDeclined", (data) => {
    const { to, roomId } = data;
    console.log(
      `Call declined by ${userId || socket.id} for ${to} in room ${roomId}`
    );

    // Notify the caller that their call was declined
    emitToUser(to, "callDeclined", {
      from: userId || socket.id,
      roomId,
    });

    // Alternative direct method
    io.to(to).emit("callDeclined", {
      from: userId || socket.id,
      roomId,
    });
  });

  // Handle call canceled - THIS IS ANOTHER MISSING HANDLER
  socket.on("callCanceled", (data) => {
    const { to, roomId } = data;
    console.log(
      `Call canceled by ${userId || socket.id} for ${to} in room ${roomId}`
    );

    // Notify the recipient that the call was canceled
    emitToUser(to, "callCanceled", {
      from: userId || socket.id,
      roomId,
    });

    // Alternative direct method
    io.to(to).emit("callCanceled", {
      from: userId || socket.id,
      roomId,
    });
  });

  // Join a call room
  socket.on("joinCall", (room) => {
    if (typeof room !== "string") {
      console.error("Invalid room format for call");
      socket.emit("error", { message: "Invalid room format" });
      return;
    }

    // Add to our tracking set
    joinedRooms.add(room);

    // Join the Socket.IO room
    socket.join(room);

    // Get count of participants in the room
    const clients = io.sockets.adapter.rooms.get(room);
    const numClients = clients ? clients.size : 0;

    console.log(
      `Socket ${socket.id} joined call room ${room}. Total participants: ${numClients}`
    );

    // Notify others in the room
    socket.to(room).emit("userJoined", {
      id: socket.id,
      totalParticipants: numClients,
    });

    // Send back the list of other participants already in the room
    const participantIds = Array.from(clients || []).filter(
      (clientId) => clientId !== socket.id
    );

    socket.emit("roomJoined", {
      room,
      participants: participantIds,
      totalParticipants: numClients,
    });
  });

  // Leave a call room
  socket.on("leaveCall", (room) => {
    handleRoomLeave(socket, room);
  });

  // Handle WebRTC offer
  socket.on("offer", (data) => {
    if (!data || !data.room || !data.offer) {
      console.error("Invalid offer data format");
      socket.emit("error", { message: "Invalid offer format" });
      return;
    }

    console.log(`Received offer from ${socket.id} for room ${data.room}`);

    // If targeting a specific peer
    if (data.to) {
      io.to(data.to).emit("offer", {
        offer: data.offer,
        from: socket.id,
      });
    } else {
      // Broadcast to everyone else in the room
      socket.to(data.room).emit("offer", {
        offer: data.offer,
        from: socket.id,
      });
    }
  });

  // Handle WebRTC answer
  socket.on("answer", (data) => {
    if (!data || !data.room || !data.answer) {
      console.error("Invalid answer data format");
      socket.emit("error", { message: "Invalid answer format" });
      return;
    }

    console.log(`Received answer from ${socket.id} for room ${data.room}`);

    // If targeting a specific peer
    if (data.to) {
      io.to(data.to).emit("answer", {
        answer: data.answer,
        from: socket.id,
      });
    } else {
      // Broadcast to everyone else in the room
      socket.to(data.room).emit("answer", {
        answer: data.answer,
        from: socket.id,
      });
    }
  });

  // Handle ICE candidate exchange
  socket.on("iceCandidate", (data) => {
    if (!data || !data.room || !data.candidate) {
      console.error("Invalid ICE candidate data format");
      socket.emit("error", { message: "Invalid ICE candidate format" });
      return;
    }

    console.log(
      `Received ICE candidate from ${socket.id} for room ${data.room}`
    );

    // If targeting a specific peer
    if (data.to) {
      io.to(data.to).emit("iceCandidate", {
        candidate: data.candidate,
        from: socket.id,
      });
    } else {
      // Broadcast to everyone else in the room
      socket.to(data.room).emit("iceCandidate", {
        candidate: data.candidate,
        from: socket.id,
      });
    }
  });

  // Get participants in a room
  socket.on("getRoomParticipants", (room) => {
    if (typeof room !== "string") {
      console.error("Invalid room format");
      socket.emit("error", { message: "Invalid room format" });
      return;
    }

    const clients = io.sockets.adapter.rooms.get(room);
    const participants = Array.from(clients || []);

    socket.emit("roomParticipants", {
      room,
      participants,
      totalParticipants: participants.length,
    });
  });

  // Create a new call room
  socket.on("createCallRoom", (data = {}) => {
    // Generate a random room ID if none is provided
    const roomId = data.room || generateRoomId();

    console.log(`Creating new call room: ${roomId}`);

    socket.emit("callRoomCreated", {
      room: roomId,
    });
  });

  // Handle custom events for call features
  socket.on("toggleMute", (data) => {
    if (!data || !data.room) return;
    socket.to(data.room).emit("participantMuted", {
      id: socket.id,
      muted: data.muted,
    });
  });

  socket.on("toggleVideo", (data) => {
    if (!data || !data.room) return;
    socket.to(data.room).emit("participantVideoChanged", {
      id: socket.id,
      videoEnabled: data.videoEnabled,
    });
  });

  // Handle disconnect
  socket.on("disconnect", () => {
    // Clean up all rooms this socket has joined
    for (const room of joinedRooms) {
      handleRoomLeave(socket, room);
    }
  });

  socket.on("callTimeWarning", (data) => {
    const { room, timeRemaining } = data;
    console.log(
      `Call time warning in room ${room}: ${timeRemaining} seconds remaining`
    );
    socket.to(room).emit("callTimeWarning", {
      timeRemaining,
      from: userId || socket.id,
    });
  });

  socket.on("callTimeExceeded", (data) => {
    const { room } = data;
    console.log(`Call time exceeded in room ${room}`);
    socket.to(room).emit("callTimeExceeded", {
      from: userId || socket.id,
    });
  });

  socket.on("callCooldownSet", (data) => {
    const { room, userId1, userId2, expiresAt } = data;
    console.log(
      `Call cooldown set between users ${userId1} and ${userId2} until ${new Date(
        expiresAt
      ).toLocaleTimeString()}`
    );

    // Forward to others in the room
    socket.to(room).emit("callCooldownSet", {
      userId1,
      userId2,
      expiresAt,
    });
  });

  // Helper function to handle room leave logic
  function handleRoomLeave(socket, room) {
    if (!room || typeof room !== "string") return;

    console.log(`Socket ${socket.id} leaving call room ${room}`);

    // Remove from our tracking set
    joinedRooms.delete(room);

    // Leave the Socket.IO room
    socket.leave(room);

    // Get updated count of participants
    const clients = io.sockets.adapter.rooms.get(room);
    const numClients = clients ? clients.size : 0;

    // Notify others in the room
    socket.to(room).emit("userLeft", {
      id: socket.id,
      totalParticipants: numClients,
    });

    // If the room is empty, you might want to clean it up
    if (numClients === 0) {
      console.log(`Call room ${room} is now empty`);
      // Additional cleanup if needed
    }
  }

  // Helper function to generate a random room ID
  function generateRoomId() {
    return Math.random().toString(36).substring(2, 15);
  }
};

export default webrtcHandler;
