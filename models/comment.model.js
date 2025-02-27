import mongoose from "mongoose"; // Import mongoose to interact with MongoDB
import Joi from "joi"; // Import Joi for validating data

const commentSchema = new mongoose.Schema(
  {
    post: { type: mongoose.Schema.Types.ObjectId, ref: "Post", required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    content: { type: String, required: true },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // Users who liked the comment
  },
  { timestamps: true }
);

const commentModel = mongoose.model("Comment", commentSchema);

export {commentModel}
