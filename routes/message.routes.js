import express from "express";
import { 
  sendMessage, 
  getConversation, 
  getUserConversations, 
  markConversationAsRead 
} from "../controllers/message.controller.js";

const router = express.Router();

// Route to send a new message
router.post("/send-message", sendMessage);

// Route to get a conversation between two users
router.get("/conversation", getConversation);

// Route to get all conversations for a user
router.get("/conversations", getUserConversations);

// Route to mark a conversation as read
router.put("/mark-read", markConversationAsRead);

export default router;