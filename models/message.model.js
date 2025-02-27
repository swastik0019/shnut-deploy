import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    room: {
      type: String,
      required: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // Content as seen by the sender
    senderContent: {
      text: { type: String },
      image: { type: String },
      video: { type: String },
    },
    // Content as seen by the receiver
    receiverContent: {
      text: { type: String },
      image: { type: String },
      video: { type: String },
    },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const messageModel = mongoose.model("Message", messageSchema);

export default messageModel;
