import mongoose from "mongoose";

const participantSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  joinedAt: {
    type: Date,
    default: Date.now,
  },
  leftAt: {
    type: Date,
    default: null,
  },
});

const videoChatSessionSchema = new mongoose.Schema(
  {
    // Unique room identifier for the video call
    room: {
      type: String,
      required: [true, "Room is required"],
      unique: true,
      trim: true,
    },
    // Array of participants in the video call
    participants: {
      type: [participantSchema],
      required: true,
      validate: {
        validator: function (v) {
          return Array.isArray(v) && v.length > 0;
        },
        message: "There must be at least one participant in the session",
      },
    },
    // Timestamp for when the call started
    startedAt: {
      type: Date,
      default: Date.now,
    },
    // Timestamp for when the call ended (if applicable)
    endedAt: {
      type: Date,
      default: null,
    },
    // Indicates whether the call is currently active
    isActive: {
      type: Boolean,
      default: true,
    },
    // Optional URL for a recording of the session, if recorded
    recordingUrl: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

const VideoChatSession = mongoose.model("VideoChatSession", videoChatSessionSchema);

export default VideoChatSession;
