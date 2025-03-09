import mongoose from "mongoose";

const likeSchema = new mongoose.Schema(
  {
    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // Indicates whether the user has liked the post.
    isLiked: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Ensure that a user can only have one like record per post.
likeSchema.index({ post: 1, user: 1 }, { unique: true });

const likeModel = mongoose.model("Like", likeSchema);

export default likeModel;
