import express from "express";
import {
  createComment,
  getCommentById,
  getCommentsByPost,
  updateComment,
  deleteComment,
  likeComment,
  unlikeComment,
  getRepliesByComment
} from "../controllers/comment.controller.js";
// Import your authentication middleware
// import { authenticate } from "../middlewares/auth.middleware.js";

const router = express.Router();

// Create a new comment
// Use authentication middleware to get the authenticated user
// router.post("/", authenticate, createComment);
router.post("/", createComment);

// Get a single comment by its ID
router.get("/:id", getCommentById);

// Get all comments for a specific post
router.get("/post/:postId", getCommentsByPost);

// Get all replies to a specific comment
router.get("/replies/:commentId", getRepliesByComment);

// Update a comment by its ID (requires authentication)
// router.put("/:id", authenticate, updateComment);
router.put("/:id", updateComment);

// Soft delete a comment by its ID (requires authentication)
// router.delete("/:id", authenticate, deleteComment);
router.delete("/:id", deleteComment);

// Like a comment (requires authentication)
// router.post("/like/:id", authenticate, likeComment);
router.post("/like/:id", likeComment);

// Unlike a comment (requires authentication)
// router.post("/unlike/:id", authenticate, unlikeComment);
router.post("/unlike/:id", unlikeComment);

export default router;