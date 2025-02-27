import mongoose from "mongoose";

const postSchema = new mongoose.Schema(
  {
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    image: { type: String }, // Image URL (Cloudinary or S3)
    video: { type: String }, // Video URL
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // Liked users
    comments: [{ type: mongoose.Schema.Types.ObjectId, ref: "Comment" }], // Associated comments
    visibility: {
      type: String,
      enum: ["public", "private"],
      default: "public",
    },
  },
  { timestamps: true }
);

const postModel = mongoose.model("Post", postSchema);

export { postModel };
