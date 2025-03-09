import ConversationModel from "../models/conversation.model.js";

// Helper function to generate a unique room ID from two user IDs
const generateRoomId = (userId1, userId2) => {
  return [userId1, userId2].sort().join('_');
};

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

      // Validate required fields: sender, receiver, and message content
      if (
        !data?.sender ||
        !data?.receiver ||
        (!data?.senderMessage && !data?.senderImage && !data?.senderVideo)
      ) {
        console.error("❌ Invalid message format");
        return socket.emit("error", { message: "Invalid message format" });
      }

      // Generate room ID
      const room = generateRoomId(data.sender, data.receiver);
      
      // Create the new message object
      const newMessage = {
        sender: data.sender,
        senderContent: {
          text: data.senderMessage || "",
          image: data.senderImage || "",
          video: data.senderVideo || "",
        },
        receiverContent: {
          text: data.receiverMessage || data.senderMessage || "",
          image: data.receiverImage || data.senderImage || "",
          video: data.receiverVideo || data.senderVideo || "",
        },
        isRead: false,
        createdAt: new Date()
      };

      // Find the conversation or create it if it doesn't exist
      let conversation = await ConversationModel.findOne({ room });
      
      if (!conversation) {
        conversation = new ConversationModel({
          room,
          participants: [data.sender, data.receiver],
          messages: [newMessage],
          lastMessage: {
            text: data.senderMessage || "(Media)",
            sender: data.sender,
            timestamp: new Date()
          },
          unreadCount: {
            [data.receiver]: 1
          }
        });
      } else {
        // Add the new message to the existing conversation
        conversation.messages.push(newMessage);
        conversation.lastMessage = {
          text: data.senderMessage || "(Media)",
          sender: data.sender,
          timestamp: new Date()
        };
        
        // Increment unread count for receiver
        const currentUnreadCount = conversation.unreadCount.get(data.receiver) || 0;
        conversation.unreadCount.set(data.receiver, currentUnreadCount + 1);
      }

      await conversation.save();

      // Find the newly added message to return (it's the last one)
      const addedMessage = conversation.messages[conversation.messages.length - 1];

      // Get populated conversation for emitting
      const populatedConversation = await ConversationModel.findOne({ room })
        .populate("participants", "firstName lastName avatar")
        .populate("lastMessage.sender", "firstName lastName avatar");

      // Broadcast the message to the room
      io.to(room).emit("chatMessage", {
        message: addedMessage,
        conversation: populatedConversation
      });

      // Also emit an event to update the conversation list for both users
      [data.sender, data.receiver].forEach(userId => {
        io.to(userId).emit("conversationUpdated", populatedConversation);
      });

      console.log("💾 Saved message to conversation:", room);
    } catch (error) {
      console.error("🔥 Message handling error:", error);
      socket.emit("error", { message: "Failed to process message" });
    }
  });

  // Handle marking messages as read
  socket.on("markAsRead", async (data) => {
    try {
      const { userId, conversationId } = data;
      
      if (!userId || !conversationId) {
        return socket.emit("error", { message: "Missing required fields" });
      }

      // Find and update the conversation
      const conversation = await ConversationModel.findById(conversationId);
      
      if (!conversation) {
        return socket.emit("error", { message: "Conversation not found" });
      }

      // Reset unread count for the user
      conversation.unreadCount.set(userId, 0);
      
      // Mark messages as read
      let updated = false;
      conversation.messages.forEach(message => {
        if (message.sender.toString() !== userId && !message.isRead) {
          message.isRead = true;
          updated = true;
        }
      });

      if (updated) {
        await conversation.save();
        
        // Emit event to update UI for both participants
        conversation.participants.forEach(participantId => {
          io.to(participantId.toString()).emit("messagesRead", {
            conversationId,
            userId
          });
        });
      }
    } catch (error) {
      console.error("Error marking messages as read:", error);
      socket.emit("error", { message: "Failed to mark messages as read" });
    }
  });
};

export default chatHandler;