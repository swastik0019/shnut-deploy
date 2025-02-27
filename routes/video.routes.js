import express from "express";
import {
  createVideoChatSession,
  getVideoChatSessionByRoom,
  updateVideoChatSession,
  deleteVideoChatSession,
  addParticipant,
  removeParticipant,
} from "../controllers/video.controller.js";

const router = express.Router();

// Create a new video chat session
router.post("/create", createVideoChatSession);

// Retrieve a session by its room
router.get("/:room", getVideoChatSessionByRoom);

// Update a session by its ID
router.put("/:id", updateVideoChatSession);

// Delete a session by its ID
router.delete("/:id", deleteVideoChatSession);

// Add a participant to a session (using room as identifier)
router.put("/:room/addParticipant", addParticipant);

// Remove a participant from a session (using room as identifier)
router.put("/:room/removeParticipant", removeParticipant);

export default router;
