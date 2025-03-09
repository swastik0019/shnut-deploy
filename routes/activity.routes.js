import express from "express";
import {
  updateOnlineStatus,
  getOnlineStatus,
  markUserOnline,
  markUserOffline,
  getOnlineUsers,
  getOnlineCreators
} from "../controllers/activity.controller.js";
import { verifyToken, checkRole } from "../middlewares/auth.middleware.js";

const router = express.Router();

// Update online status by user ID
router.put(
  "/users/:userId/online-status",
  verifyToken,
  checkRole(["user", "creator", "admin"]),
  updateOnlineStatus
);

// Get online status by user ID
router.get(
  "/users/:userId/online-status",
  getOnlineStatus  // Removed auth requirements to allow public checking
);

// Endpoints for authenticated users
router.put(
  "/users/me/online",
  verifyToken,
  checkRole(["user", "creator", "admin"]),
  markUserOnline
);

router.put(
  "/users/me/offline",
  verifyToken,
  checkRole(["user", "creator", "admin"]),
  markUserOffline
);

// Get all online users
router.get(
  "/users/online",
  getOnlineUsers
);

// Get all online creators
router.get(
  "/creators/online",
  getOnlineCreators
);

export default router;