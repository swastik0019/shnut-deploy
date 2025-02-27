import mongoose from "mongoose"; // Import mongoose to interact with MongoDB
import Joi from "joi"; // Import Joi for validating data

const notificationSchema = new mongoose.Schema(
  {
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    type: { type: String, enum: ["like", "comment", "subscription", "message"], required: true },
    post: { type: mongoose.Schema.Types.ObjectId, ref: "Post" },
    message: { type: String },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const notificationModel = mongoose.model("Notification", notificationSchema);

export {notificationModel}
