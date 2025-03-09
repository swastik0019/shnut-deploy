import { commentModel, validateComment } from "../models/comment.model.js";
import { postModel } from "../models/post.model.js";
import mongoose from "mongoose";

// Create a new comment
const createComment = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Validate incoming comment data
    const { error } = validateComment(req.body);
    if (error) {
      return res.status(400).json({ 
        error: error.details.map(detail => detail.message).join(', ') 
      });
    }

    // Check if post exists
    const post = await postModel.findById(req.body.post);
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    // If parentComment is provided, verify it exists
    if (req.body.parentComment) {
      const parentComment = await commentModel.findById(req.body.parentComment);
      if (!parentComment || parentComment.isDeleted) {
        return res.status(404).json({ error: "Parent comment not found" });
      }
    }

    // Create comment with session
    const comment = await commentModel.create([req.body], { session });
    
    // Update post to include this comment
    await postModel.findByIdAndUpdate(
      req.body.post,
      { $push: { comments: comment[0]._id } },
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    // Populate user info before returning
    const populatedComment = await commentModel.findById(comment[0]._id)
      .populate('user', 'firstName lastName nickname avatar')
      .populate({
        path: 'parentComment',
        populate: {
          path: 'user',
          select: 'firstName lastName nickname avatar'
        }
      });

    return res.status(201).json(populatedComment);
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    return res.status(500).json({ error: err.message });
  }
};

// Get a single comment by ID
const getCommentById = async (req, res) => {
  try {
    const comment = await commentModel.findById(req.params.id)
      .populate('user', 'firstName lastName nickname avatar')
      .populate({
        path: 'parentComment',
        populate: {
          path: 'user',
          select: 'firstName lastName nickname avatar'
        }
      });
    
    if (!comment || comment.isDeleted) {
      return res.status(404).json({ error: "Comment not found" });
    }
    
    return res.status(200).json(comment);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// Get all comments for a specific post
const getCommentsByPost = async (req, res) => {
  try {
    const { postId } = req.params;
    
    // Check if post exists
    const post = await postModel.findById(postId);
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }
    
    // Get top-level comments (those without parentComment)
    const comments = await commentModel.find({ 
      post: postId, 
      isDeleted: false,
      parentComment: null
    })
      .populate('user', 'firstName lastName nickname avatar')
      .sort({ createdAt: -1 }); // Recent comments first
    
    // Get replies for each comment
    const commentsWithReplies = await Promise.all(
      comments.map(async (comment) => {
        const replies = await commentModel.find({
          post: postId,
          parentComment: comment._id,
          isDeleted: false
        })
          .populate('user', 'firstName lastName nickname avatar')
          .sort({ createdAt: 1 }); // Oldest replies first
        
        // Convert to plain object to add replies
        const commentObj = comment.toObject({ virtuals: true });
        commentObj.replies = replies;
        
        return commentObj;
      })
    );
    
    return res.status(200).json(commentsWithReplies);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// Update a comment (e.g., update its content or moderation status)
const updateComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    
    // Find the comment
    const comment = await commentModel.findById(id);
    if (!comment || comment.isDeleted) {
      return res.status(404).json({ error: "Comment not found" });
    }
    
    // Check if user is the author (you would get userId from auth middleware)
    // const userId = req.user._id;
    // if (comment.user.toString() !== userId.toString()) {
    //   return res.status(403).json({ error: "Unauthorized to edit this comment" });
    // }
    
    // Update comment content and mark as edited
    const updatedComment = await commentModel.findByIdAndUpdate(
      id, 
      { content, isEdited: true }, 
      { new: true }
    )
      .populate('user', 'firstName lastName nickname avatar')
      .populate({
        path: 'parentComment',
        populate: {
          path: 'user',
          select: 'firstName lastName nickname avatar'
        }
      });
    
    return res.status(200).json(updatedComment);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// Soft delete a comment (mark as deleted without removing from DB)
const deleteComment = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;
    
    // Find the comment
    const comment = await commentModel.findById(id);
    if (!comment) {
      return res.status(404).json({ error: "Comment not found" });
    }
    
    // Check if user is the author (you would get userId from auth middleware)
    // const userId = req.user._id;
    // if (comment.user.toString() !== userId.toString()) {
    //   return res.status(403).json({ error: "Unauthorized to delete this comment" });
    // }
    
    // Mark as deleted
    await commentModel.findByIdAndUpdate(
      id, 
      { isDeleted: true, content: "[This comment has been deleted]" }, 
      { session }
    );
    
    // Remove from post's comments array
    // This is optional - you might want to keep the reference for counting purposes
    // await postModel.findByIdAndUpdate(
    //   comment.post,
    //   { $pull: { comments: id } },
    //   { session }
    // );
    
    await session.commitTransaction();
    session.endSession();
    
    return res.status(200).json({ message: "Comment deleted successfully" });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    return res.status(500).json({ error: err.message });
  }
};

// Like a comment
const likeComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;
    
    // Validate userId
    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }
    
    const comment = await commentModel.findById(id);
    if (!comment || comment.isDeleted) {
      return res.status(404).json({ error: "Comment not found" });
    }
    
    // Check if user already liked
    if (comment.likes.includes(userId)) {
      return res.status(400).json({ error: "User already liked this comment" });
    }
    
    // Add user to likes array
    const updatedComment = await commentModel.findByIdAndUpdate(
      id,
      { $push: { likes: userId } },
      { new: true }
    )
      .populate('user', 'firstName lastName nickname avatar');
    
    return res.status(200).json({
      message: "Comment liked successfully",
      comment: updatedComment
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// Unlike a comment
const unlikeComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;
    
    // Validate userId
    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }
    
    const comment = await commentModel.findById(id);
    if (!comment || comment.isDeleted) {
      return res.status(404).json({ error: "Comment not found" });
    }
    
    // Check if user has liked
    if (!comment.likes.includes(userId)) {
      return res.status(400).json({ error: "User has not liked this comment" });
    }
    
    // Remove user from likes array
    const updatedComment = await commentModel.findByIdAndUpdate(
      id,
      { $pull: { likes: userId } },
      { new: true }
    )
      .populate('user', 'firstName lastName nickname avatar');
    
    return res.status(200).json({
      message: "Comment unliked successfully",
      comment: updatedComment
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// Get all replies to a specific comment
const getRepliesByComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    
    // Check if parent comment exists
    const parentComment = await commentModel.findById(commentId);
    if (!parentComment || parentComment.isDeleted) {
      return res.status(404).json({ error: "Parent comment not found" });
    }
    
    // Get all replies
    const replies = await commentModel.find({
      parentComment: commentId,
      isDeleted: false
    })
      .populate('user', 'firstName lastName nickname avatar')
      .sort({ createdAt: 1 }); // Oldest first for replies
    
    return res.status(200).json(replies);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

export {
    createComment,
    getCommentById,
    getCommentsByPost,
    updateComment,
    deleteComment,
    likeComment,
    unlikeComment,
    getRepliesByComment
};