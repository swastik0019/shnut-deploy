import messageModel from "../models/message.model.js";

const chatHandler = (io, socket) => {
  console.log("New connection:", socket.id);

  // Join room with validation
  socket.on("joinRoom", (room) => {
    console.log("JOINING ROOM:", room);
    if (typeof room !== "string") {
      console.error("⚠️ Invalid room format");
      return;
    }
    socket.join(room);
    console.log(`✅ Socket ${socket.id} joined room ${room}`);
  });

  // Handle incoming chat messages
  socket.on("chatMessage", async (data) => {
    try {
      console.log("📩 Received raw message data:", data);

      // Validate required fields: room, sender, receiver, and message content
      if (
        !data?.room ||
        !data?.sender ||
        !data?.receiver ||
        (!data?.senderMessage && !data?.receiverMessage)
      ) {
        console.error("❌ Invalid message format");
        return;
      }

      // Save the message with room info along with sender and receiver content
      const savedMessage = await messageModel.create({
        room: data.room,
        sender: data.sender,
        receiver: data.receiver,
        senderContent: {
          text: data.senderMessage,
          image: data.senderImage || "",
          video: data.senderVideo || "",
        },
        receiverContent: {
          text: data.receiverMessage || data.senderMessage, // fallback if not provided
          image: data.receiverImage || "",
          video: data.receiverVideo || "",
        },
      });

      // Populate sender and receiver details for better frontend display
      const populatedMessage = await messageModel
        .findById(savedMessage._id)
        .populate("sender", "firstName lastName avatar")
        .populate("receiver", "firstName lastName avatar");

      console.log("💾 Saved message:", populatedMessage);

      // Broadcast the message to all clients in the specified room
      console.log("📤 Broadcasting to room:", data.room);
      io.to(data.room).emit("chatMessage", populatedMessage);
    } catch (error) {
      console.error("🔥 Message handling error:", error);
    }
  });
};

export default chatHandler;
