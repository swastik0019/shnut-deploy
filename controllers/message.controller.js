import ConversationModel from "../models/conversation.model.js";
import { User } from "../models/user.model.js";

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

    // Create the new message object
    const newMessage = {
      sender,
      senderContent: {
        text: senderMessage || "",
        image: senderImage || "",
        video: senderVideo || "",
      },
      receiverContent: {
        text: receiverMessage || senderMessage || "",
        image: receiverImage || senderImage || "",
        video: receiverVideo || senderVideo || "",
      },
      isRead: false,
      createdAt: new Date()
    };

    // Find the conversation or create it if it doesn't exist
    let conversation = await ConversationModel.findOne({ room });
    
    if (!conversation) {
      conversation = new ConversationModel({
        room,
        participants: [sender, receiver],
        messages: [newMessage],
        lastMessage: {
          text: senderMessage || "(Media)",
          sender,
          timestamp: new Date()
        },
        unreadCount: {
          [receiver]: 1
        }
      });
    } else {
      // Add the new message to the existing conversation
      conversation.messages.push(newMessage);
      conversation.lastMessage = {
        text: senderMessage || "(Media)",
        sender,
        timestamp: new Date()
      };
      
      // Increment unread count for receiver
      const currentUnreadCount = conversation.unreadCount.get(receiver) || 0;
      conversation.unreadCount.set(receiver, currentUnreadCount + 1);
    }

    await conversation.save();

    // Find the newly added message to return (it's the last one)
    const addedMessage = conversation.messages[conversation.messages.length - 1];

    // Return the populated message with sender and receiver info
    const populatedConversation = await ConversationModel.findOne({ room })
      .populate("participants", "firstName lastName avatar")
      .populate("lastMessage.sender", "firstName lastName avatar");

    res.status(201).json({
      message: addedMessage,
      conversation: populatedConversation
    });
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

    // Find the conversation and populate participant details
    const conversation = await ConversationModel.findOne({ room })
      .populate("participants", "firstName lastName avatar")
      .populate("lastMessage.sender", "firstName lastName avatar");

    if (!conversation) {
      return res.status(200).json({ conversation: null, messages: [] });
    }

    // Reset unread count if the requester is the receiver
    if (conversation.unreadCount.has(user1)) {
      conversation.unreadCount.set(user1, 0);
      await conversation.save();
    }

    res.status(200).json({
      conversation: conversation,
      messages: conversation.messages
    });
  } catch (error) {
    console.error("Error fetching conversation:", error);
    res.status(500).json({ error: "Server error fetching messages" });
  }
};

// **Get all conversations for a user**
// **GET /api/messages/conversations?userId=<userId>**
const getUserConversations = async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    // Find all conversations where the user is a participant
    const conversations = await ConversationModel.find({
      participants: userId
    })
      .populate("participants", "firstName lastName avatar isOnline nickname")
      .populate("lastMessage.sender", "firstName lastName avatar nickname")
      .sort({ "lastMessage.timestamp": -1 });

    res.status(200).json(conversations);
  } catch (error) {
    console.error("Error fetching user conversations:", error);
    res.status(500).json({ error: "Server error fetching conversations" });
  }
};

// **Mark conversation as read**
// **PUT /api/messages/mark-read**
const markConversationAsRead = async (req, res) => {
  try {
    const { userId, conversationId } = req.body;

    if (!userId || !conversationId) {
      return res.status(400).json({ error: "User ID and Conversation ID are required" });
    }

    // Find the conversation
    const conversation = await ConversationModel.findById(conversationId);
    
    if (!conversation) {
      return res.status(404).json({ error: "Conversation not found" });
    }

    // Reset unread count for the user
    conversation.unreadCount.set(userId, 0);
    
    // Mark all messages as read where the user is the receiver
    conversation.messages.forEach(message => {
      if (message.sender.toString() !== userId) {
        message.isRead = true;
      }
    });

    await conversation.save();

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error marking conversation as read:", error);
    res.status(500).json({ error: "Server error" });
  }
};

export { sendMessage, getConversation, getUserConversations, markConversationAsRead };