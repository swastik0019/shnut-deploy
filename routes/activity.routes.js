import express from "express";
import {
  updateOnlineStatus,
  getOnlineStatus,
  markUserOnline,
  markUserOffline,
} from "../controllers/activity.controller.js";
import { verifyToken, checkRole } from "../middlewares/auth.middleware.js";
const router = express.Router();

// Update online status by user ID
router.put(
  "/users/:userId/online-status",
  verifyToken, // Verify that the user is authenticated
  checkRole(["user", "creator", "admin"]), // Check if the user has a valid role
  updateOnlineStatus
);

// Get online status by user ID
router.get(
  "/users/:userId/online-status",
  verifyToken, // Verify that the user is authenticated
  checkRole(["user", "creator", "admin"]), // Check if the user has a valid role
  getOnlineStatus
);

// endpoints for authenticated users
router.put(
  "/users/me/online",
  verifyToken, // Verify that the user is authenticated
  checkRole(["user", "creator", "admin"]), // Check if the user has a valid role
  markUserOnline
);

router.put(
  "/users/me/offline",
  verifyToken, // Verify that the user is authenticated
  checkRole(["user", "creator", "admin"]), // Check if the user has a valid role
  markUserOffline
);

export default router;
