import express from "express";
import { sendMessage, getConversation } from "../controllers/message.controller.js";

const router = express.Router();

// Route to send a new message
router.post("/send-message", sendMessage);

// Route to get a conversation between two users
router.get("/conversation", getConversation);

export default router;
