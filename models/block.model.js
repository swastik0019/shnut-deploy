import mongoose from "mongoose"; // Import mongoose to interact with MongoDB
import Joi from "joi"; // Import Joi for validating data

const blockSchema = new mongoose.Schema(
  {
    blocker: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    blockedUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

const blockModel = mongoose.model("Block", blockSchema);

export { blockModel }
