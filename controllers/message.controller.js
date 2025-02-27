import messageModel from "../models/message.model.js";

// Helper function to generate a unique room ID from two user IDs
const generateRoomId = (userId1, userId2) => {
  return [userId1, userId2].sort().join('_');
};

// **Send a message**
// **POST /api/messages/send-message**
const sendMessage = async (req, res) => {
  try {
    const { 
      sender, 
      receiver, 
      senderMessage, 
      senderImage, 
      senderVideo, 
      receiverMessage, 
      receiverImage, 
      receiverVideo 
    } = req.body;

    // Generate the room ID for this conversation
    const room = generateRoomId(sender, receiver);

    // Create the new message using separate subdocuments for sender and receiver content,
    // and include the room ID.
    const message = await messageModel.create({
      room,
      sender,
      receiver,
      senderContent: {
        text: senderMessage,
        image: senderImage || "",
        video: senderVideo || "",
      },
      receiverContent: {
        text: receiverMessage || senderMessage, // fallback to sender's message if not provided
        image: receiverImage || "",
        video: receiverVideo || "",
      },
    });

    if (message) {
      res.status(201).json(message);
    } else {
      res.status(400);
      throw new Error("Error creating message");
    }
  } catch (error) {
    console.error("Error in sendMessage:", error);
    res.status(500).json({ error: error.message });
  }
};

// **Get conversation between two users**
// **GET /api/messages/conversation?user1=<user1>&user2=<user2>**
const getConversation = async (req, res) => {
  try {
    const { user1, user2 } = req.query;

    if (!user1 || !user2) {
      return res.status(400).json({ error: "Both user IDs are required" });
    }

    // Generate the room ID to query messages from the conversation
    const room = generateRoomId(user1, user2);

    const messages = await messageModel
      .find({ room })
      .sort({ createdAt: 1 })
      .populate("sender", "firstName lastName avatar")
      .populate("receiver", "firstName lastName avatar");

    res.status(200).json(messages);
  } catch (error) {
    console.error("Error fetching conversation:", error);
    res.status(500).json({ error: "Server error fetching messages" });
  }
};

export { sendMessage, getConversation };
