import mongoose from "mongoose"; // Import mongoose to interact with MongoDB
import Joi from "joi"; // Import Joi for validating data

const analyticsSchema = new mongoose.Schema(
  {
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    views: {
      type: Number,
      default: 0,
    },
    likes: {
      type: Number,
      default: 0,
    },
    earnings: {
      type: Number,
      default: 0,
    },
    subscribers: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

const analyticsModel = mongoose.model("Analytics", analyticsSchema);

export { analyticsModel }
