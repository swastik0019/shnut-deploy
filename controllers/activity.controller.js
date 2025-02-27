import { User } from "../models/user.model.js";

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

    const user = await User.findByIdAndUpdate(
      userId,
      { isOnline },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res
      .status(200)
      .json({ message: "User online status updated successfully", user });
  } catch (error) {
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
    return res.status(500).json({ message: error.message });
  }
};

// Mark the currently authenticated user as online.
// This assumes that you have authentication middleware that sets req.user.
const markUserOnline = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findByIdAndUpdate(
      userId,
      { isOnline: true },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({ message: "User marked as online", user });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// Mark the currently authenticated user as offline.
// This assumes that you have authentication middleware that sets req.user.
const markUserOffline = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findByIdAndUpdate(
      userId,
      { isOnline: false },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({ message: "User marked as offline", user });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export { updateOnlineStatus, getOnlineStatus, markUserOnline, markUserOffline };
