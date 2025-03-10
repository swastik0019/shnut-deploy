// notification.routes.js
import express from "express";
import { verifyToken } from "../middlewares/auth.middleware.js";
import {
  getUserNotifications,
  markAsRead,
  markMultipleAsRead,
  markAllAsRead,
  deleteNotification,
  getUnreadCount,
} from "../controllers/notification.controller.js";

const router = express.Router();

// Apply authentication middleware to all notification routes
router.use(verifyToken);

// Get user's notifications with pagination and filters
router.get("/", getUserNotifications);

// Get unread notification count
router.get("/unread-count", getUnreadCount);

// Mark a single notification as read
router.patch("/:notificationId/read", markAsRead);

// Mark multiple notifications as read
router.patch("/read-multiple", markMultipleAsRead);

// Mark all notifications as read
router.patch("/read-all", markAllAsRead);

// Delete a notification
router.delete("/:notificationId", deleteNotification);

export default router;