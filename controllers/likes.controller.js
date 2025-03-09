import mongoose from "mongoose";
import likeModel from "../models/likes.model.js";

// Toggle the like status for a post for the authenticated user.
const toggleLike = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return res.status(400).json({ message: "Invalid post id" });
    }

    // Find an existing like record.
    let likeRecord = await likeModel.findOne({ post: postId, user: userId });

    if (likeRecord) {
      // Toggle the like status.
      likeRecord.isLiked = !likeRecord.isLiked;
      await likeRecord.save();
    } else {
      // Create a new like record with isLiked true.
      likeRecord = await likeModel.create({ post: postId, user: userId, isLiked: true });
    }

    // Count active likes.
    const likesCount = await likeModel.countDocuments({ post: postId, isLiked: true });
    res.status(200).json({
      message: "Like toggled successfully",
      like: likeRecord,
      likesCount,
    });
  } catch (error) {
    console.error("Error toggling like:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Like a post explicitly.
const likePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return res.status(400).json({ message: "Invalid post id" });
    }

    let likeRecord = await likeModel.findOne({ post: postId, user: userId });
    if (likeRecord) {
      if (likeRecord.isLiked) {
        return res.status(200).json({ message: "Post already liked" });
      }
      likeRecord.isLiked = true;
      await likeRecord.save();
    } else {
      likeRecord = await likeModel.create({ post: postId, user: userId, isLiked: true });
    }

    const likesCount = await likeModel.countDocuments({ post: postId, isLiked: true });
    res.status(200).json({
      message: "Post liked successfully",
      like: likeRecord,
      likesCount,
    });
  } catch (error) {
    console.error("Error liking post:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Unlike a post explicitly.
const unlikePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return res.status(400).json({ message: "Invalid post id" });
    }

    // Find the like record
    let likeRecord = await likeModel.findOne({ post: postId, user: userId });
    
    if (likeRecord) {
      // Set isLiked to false
      likeRecord.isLiked = false;
      await likeRecord.save();
    } else {
      // If no record exists, create one with isLiked set to false
      likeRecord = await likeModel.create({ 
        post: postId, 
        user: userId, 
        isLiked: false 
      });
    }

    // Count active likes
    const likesCount = await likeModel.countDocuments({ post: postId, isLiked: true });
    
    res.status(200).json({
      message: "Post unliked successfully",
      like: likeRecord,
      likesCount,
    });
  } catch (error) {
    console.error("Error unliking post:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Get the count of active likes for a post.
const getLikesCount = async (req, res) => {
  try {
    const { postId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return res.status(400).json({ message: "Invalid post id" });
    }

    const likesCount = await likeModel.countDocuments({ post: postId, isLiked: true });
    res.status(200).json({ likesCount });
  } catch (error) {
    console.error("Error fetching likes count:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const getLikeStatus = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return res.status(400).json({ message: "Invalid post id" });
    }

    // Find the like record for this user and post
    const likeRecord = await likeModel.findOne({ 
      post: postId, 
      user: userId 
    });

    // If record exists and isLiked is true, user has liked the post
    const isLiked = likeRecord ? likeRecord.isLiked : false;

    res.status(200).json({ isLiked });
  } catch (error) {
    console.error("Error fetching like status:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export {
  toggleLike,
  likePost,
  unlikePost,
  getLikesCount,
  getLikeStatus
}
