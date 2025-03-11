import { postModel } from "../models/post.model.js";
import cloudinary from "../utils/cloudinary.js";

// 📌 Create a new post with media upload
const createPost = async (req, res) => {
  try {
    const { description, visibility } = req.body;
    let imageUrl = null;
    let videoUrl = null;
    console.log(req.file);

    if (req.file) {
      console.log("Uploaded File Details:", req.file);

      if (req.file.mimetype.startsWith("image/")) {
        imageUrl = req.file.path;
      } else if (req.file.mimetype.startsWith("video/")) {
        videoUrl = req.file.path;
      }
    }

    const newPost = await postModel.create({
      creator: req.user._id,
      description,
      image: imageUrl,
      video: videoUrl,
      visibility,
    });

    // Populate creator details before sending response
    const populatedPost = await postModel
      .findById(newPost._id)
      .populate("creator", "firstName lastName avatar nickname");

    res.status(201).json({
      success: true,
      message: "Post created!",
      newPost: populatedPost,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error creating post",
      error: error.message,
    });
  }
};

// 📌 Get all posts (Public or Subscriber-Only)
const getPosts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const skip = (page - 1) * limit;
    const sortOption = req.query.sort || "newest";

    let sortCriteria = { createdAt: -1 }; // Default sort by latest

    // Apply sort options if expanded in the future
    if (sortOption === "trending") {
      // Could implement engagement-based sorting here
      // For now, use default sorting
    }

    const posts = await postModel
      .find()
      .populate("creator", "firstName lastName avatar nickname")
      .sort(sortCriteria)
      .skip(skip)
      .limit(limit);

    // Get total count for pagination info
    const totalPosts = await postModel.countDocuments();

    res.status(200).json({
      posts,
      currentPage: page,
      totalPages: Math.ceil(totalPosts / limit),
      hasMore: page * limit < totalPosts,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching posts",
      error: error.message,
    });
  }
};

// 📌 Get a single post by ID
const getUserPosts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const skip = (page - 1) * limit;

    const posts = await postModel
      .find({ creator: req.params.id })
      .populate("creator", "firstName lastName avatar nickname")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Get total count for pagination
    const totalPosts = await postModel.countDocuments({
      creator: req.params.id,
    });

    res.status(200).json({
      success: true,
      posts,
      currentPage: page,
      totalPages: Math.ceil(totalPosts / limit),
      hasMore: page * limit < totalPosts,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching user posts",
      error: error.message,
    });
  }
};

// 📌 Update a post (With Media Deletion from Cloudinary)
const updatePost = async (req, res) => {
  try {
    const { description, visibility } = req.body;
    let post = await postModel.findById(req.params.id);

    if (!post)
      return res
        .status(404)
        .json({ success: false, message: "Post not found" });
    if (post.creator.toString() !== req.user._id.toString()) {
      return res
        .status(401)
        .json({ success: false, message: "Not authorized" });
    }

    let imageUrl = post.image;
    let videoUrl = post.video;

    // If new media is uploaded, delete the old one from Cloudinary
    if (req.file) {
      if (req.file.mimetype.startsWith("image/")) {
        if (post.image) {
          await cloudinary.uploader.destroy(
            post.image.split("/").pop().split(".")[0]
          );
        }
        imageUrl = req.file.path;
      } else if (req.file.mimetype.startsWith("video/")) {
        if (post.video) {
          await cloudinary.uploader.destroy(
            post.video.split("/").pop().split(".")[0],
            { resource_type: "video" }
          );
        }
        videoUrl = req.file.path;
      }
    }

    post.description = description || post.description;
    post.image = imageUrl;
    post.video = videoUrl;
    post.visibility = visibility || post.visibility;

    const updatedPost = await post.save();

    // Populate creator details before sending response
    const populatedPost = await postModel
      .findById(updatedPost._id)
      .populate("creator", "firstName lastName avatar nickname");

    res.status(200).json({
      success: true,
      message: "Post updated",
      updatedPost: populatedPost,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating post",
      error: error.message,
    });
  }
};

// 📌 Delete a post (With Cloudinary Media Deletion)
const deletePost = async (req, res) => {
  try {
    const post = await postModel.findById(req.params.id);

    if (!post)
      return res
        .status(404)
        .json({ success: false, message: "Post not found" });
    if (post.creator.toString() !== req.user._id.toString()) {
      return res
        .status(401)
        .json({ success: false, message: "Not authorized" });
    }

    // Delete media from Cloudinary
    if (post.image) {
      await cloudinary.uploader.destroy(
        post.image.split("/").pop().split(".")[0]
      );
    }
    if (post.video) {
      await cloudinary.uploader.destroy(
        post.video.split("/").pop().split(".")[0],
        { resource_type: "video" }
      );
    }

    await postModel.deleteOne({ _id: req.params.id });
    res
      .status(200)
      .json({ success: true, message: "Post deleted successfully" });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error deleting post",
      error: error.message,
    });
  }
};

export { createPost, getPosts, getUserPosts, updatePost, deletePost };
