import express from "express";
import { verifyToken, checkRole } from "../middlewares/auth.middleware.js";
import upload from "../middlewares/multer.middleware.js";
import {
  getUserProfile,
  updateUserProfile,
  deleteUserProfile,
  banUser
} from "../controllers/user.controller.js";
import { User } from "../models/user.model.js";

const router = express.Router();

// **GET User Profile Based on Role**
// Endpoint: /api/users/profile
router.get(
  "/profile",
  verifyToken, // Verify that the user is authenticated
  checkRole(["user", "creator", "admin"]), // Check if the user has a valid role
  getUserProfile // Fetch the user profile if the role check passes
);

// **UPDATE User Profile Based on Role**
// Endpoint: /api/users/profile
router.put(
  "/profile",
  verifyToken,
  checkRole(["user", "creator", "admin"]),
  upload.single('avatar'), // Add this line to handle avatar upload
  updateUserProfile
);

// **DELETE User Profile Based on Role**
// Endpoint: /api/users/profile
router.delete(
  "/profile",
  verifyToken, // Verify that the user is authenticated
  checkRole(["user", "creator", "admin"]),
  deleteUserProfile // Delete the user profile if the role check passes
);

// **Ban User (Admin Only)**
// Endpoint: /api/users/ban
router.post(
  "/ban",
  verifyToken,
  checkRole(["admin"]), // Only admins can ban users
  banUser
);

// **Search User by Nickname**
// Endpoint: /api/users/search
router.get("/search", async (req, res) => {
  const { q } = req.query;
  if (!q) {
    return res.status(400).json({ error: "Search query is required" });
  }

  try {
    const user = await User.findOne({ nickname: q });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const result = {
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      nickname: user.nickname,
      email: user.email,
      avatar: user.avatar,
      gender: user.gender
    };

    res.status(200).json({ success: true, user: result });
  } catch (error) {
    console.error("Search error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;