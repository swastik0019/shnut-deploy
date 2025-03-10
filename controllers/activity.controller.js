import { User } from "../models/user.model.js";
import mongoose from "mongoose";
import { emitSocket } from "../socket/socketEmitter.js";

// Update a user's online status by their ID.
// Expects the user's ID in req.params and a boolean `isOnline` in req.body.
const updateOnlineStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const { isOnline } = req.body;

    // Validate that isOnline is a boolean
    if (typeof isOnline !== "boolean") {
      return res.status(400).json({ message: "isOnline must be a boolean" });
    }

    // Use a transaction to ensure consistency
    const session = await mongoose.startSession();
    let user;

    try {
      await session.withTransaction(async () => {
        user = await User.findByIdAndUpdate(
          userId,
          { isOnline },
          { new: true, runValidators: true, session }
        );

        if (!user) {
          throw new Error("User not found");
        }

        // Emit socket event after DB update
        if (isOnline) {
          emitSocket("userOnline", { userId });
        } else {
          emitSocket("userOffline", { userId });
        }
      });
    } catch (error) {
      throw error;
    } finally {
      session.endSession();
    }

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res
      .status(200)
      .json({ message: "User online status updated successfully", user });
  } catch (error) {
    console.error("Error updating online status:", error);
    return res.status(500).json({ message: error.message });
  }
};

// Retrieve the online status of a user by their ID.
// Expects the user's ID in req.params.
const getOnlineStatus = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId).select("isOnline");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({ isOnline: user.isOnline });
  } catch (error) {
    console.error("Error fetching online status:", error);
    return res.status(500).json({ message: error.message });
  }
};

// Mark the currently authenticated user as online.
// This assumes that you have authentication middleware that sets req.user.
const markUserOnline = async (req, res) => {
  try {
    const userId = req.user._id;
    console.log("Marking user online:", userId);

    // Use a transaction to ensure consistency
    const session = await mongoose.startSession();
    let user;

    try {
      await session.withTransaction(async () => {
        user = await User.findByIdAndUpdate(
          userId,
          { isOnline: true },
          { new: true, session }
        );

        if (!user) {
          throw new Error("User not found");
        }

        // Emit socket event after DB update
        emitSocket("userOnline", { userId });
      });
    } catch (error) {
      throw error;
    } finally {
      session.endSession();
    }

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({ message: "User marked as online", user });
  } catch (error) {
    console.error("Error marking user online:", error);
    return res.status(500).json({ message: error.message });
  }
};

// Mark the currently authenticated user as offline.
// This assumes that you have authentication middleware that sets req.user.
const markUserOffline = async (req, res) => {
  try {
    const userId = req.user._id;

    // Use a transaction to ensure consistency
    const session = await mongoose.startSession();
    let user;

    try {
      await session.withTransaction(async () => {
        user = await User.findByIdAndUpdate(
          userId,
          { isOnline: false },
          { new: true, session }
        );

        if (!user) {
          throw new Error("User not found");
        }

        // Emit socket event after DB update
        emitSocket("userOffline", { userId });
      });
    } catch (error) {
      throw error;
    } finally {
      session.endSession();
    }

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({ message: "User marked as offline", user });
  } catch (error) {
    console.error("Error marking user offline:", error);
    return res.status(500).json({ message: error.message });
  }
};

// Get a list of all online users
const getOnlineUsers = async (req, res) => {
  try {
    const onlineUsers = await User.find({ isOnline: true }).select(
      "_id firstName lastName nickname avatar role"
    );

    return res.status(200).json({ onlineUsers });
  } catch (error) {
    console.error("Error fetching online users:", error);
    return res.status(500).json({ message: error.message });
  }
};

// Get a list of all online creators
const getOnlineCreators = async (req, res) => {
  try {
    const onlineCreators = await User.find({
      isOnline: true,
      role: "creator",
      banned: false,
    }).select("_id firstName lastName nickname avatar bio");

    return res.status(200).json({ onlineCreators });
  } catch (error) {
    console.error("Error fetching online creators:", error);
    return res.status(500).json({ message: error.message });
  }
};

export {
  updateOnlineStatus,
  getOnlineStatus,
  markUserOnline,
  markUserOffline,
  getOnlineUsers,
  getOnlineCreators,
};
