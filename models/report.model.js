import mongoose from "mongoose"; // Import mongoose to interact with MongoDB
import Joi from "joi"; // Import Joi for validating data

const reportSchema = new mongoose.Schema(
  {
    reporter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    reportedUser: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    reportedPost: { type: mongoose.Schema.Types.ObjectId, ref: "Post" },
    reason: {
      type: String,
      required: true,
      enum: ["spam", "abuse", "nudity", "scam"],
    },
    status: {
      type: String,
      enum: ["pending", "resolved", "dismissed"],
      default: "pending",
    },
  },
  { timestamps: true }
);

const reportModel = mongoose.model("Report", reportSchema);

export { reportModel }
