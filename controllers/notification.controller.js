import { notificationModel } from "../models/notification.model.js";

// Create a new notification
const createNotification = async (notificationData) => {
  try {
    const notification = await notificationModel.create(notificationData);
    return notification;
  } catch (error) {
    console.error("Error creating notification:", error);
    throw error;
  }
};

// Get user notifications with pagination
const getUserNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 20, unreadOnly = false } = req.query;
    const userId = req.user._id;

    // Build query based on filters
    const query = { recipient: userId };
    if (unreadOnly === 'true') {
      query.read = false;
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Fetch notifications with populated sender
    const notifications = await notificationModel
      .find(query)
      .sort({ createdAt: -1 }) // Newest first
      .skip(skip)
      .limit(parseInt(limit))
      .populate("sender", "firstName lastName nickname avatar");

    // Count total notifications for pagination
    const total = await notificationModel.countDocuments(query);
    
    // Count unread notifications
    const unreadCount = await notificationModel.countUnread(userId);

    // Add formatted message to each notification
    const notificationsWithMessage = notifications.map(notification => {
      const notificationObj = notification.toObject();
      notificationObj.message = notificationModel.getNotificationMessage(notificationObj);
      return notificationObj;
    });

    res.status(200).json({
      success: true,
      notifications: notificationsWithMessage,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
      unreadCount,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching notifications",
      error: error.message,
    });
  }
};

// Mark a notification as read
const markAsRead = async (req, res) => {
  try {
    const userId = req.user._id;
    const { notificationId } = req.params;

    const notification = await notificationModel.findOne({
      _id: notificationId,
      recipient: userId,
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    await notification.markAsRead();

    // Get updated unread count
    const unreadCount = await notificationModel.countUnread(userId);

    res.status(200).json({
      success: true,
      message: "Notification marked as read",
      unreadCount,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error marking notification as read",
      error: error.message,
    });
  }
};

// Mark multiple notifications as read
const markMultipleAsRead = async (req, res) => {
  try {
    const userId = req.user._id;
    const { notificationIds } = req.body;

    if (!notificationIds || !Array.isArray(notificationIds)) {
      return res.status(400).json({
        success: false,
        message: "Invalid notification IDs provided",
      });
    }

    await notificationModel.markMultipleAsRead(notificationIds, userId);

    // Get updated unread count
    const unreadCount = await notificationModel.countUnread(userId);

    res.status(200).json({
      success: true,
      message: "Notifications marked as read",
      unreadCount,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error marking notifications as read",
      error: error.message,
    });
  }
};

// Mark all notifications as read
const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user._id;

    await notificationModel.markAllAsRead(userId);

    res.status(200).json({
      success: true,
      message: "All notifications marked as read",
      unreadCount: 0,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error marking all notifications as read",
      error: error.message,
    });
  }
};

// Delete a notification
const deleteNotification = async (req, res) => {
  try {
    const userId = req.user._id;
    const { notificationId } = req.params;

    const notification = await notificationModel.findOne({
      _id: notificationId,
      recipient: userId,
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    await notificationModel.deleteOne({ _id: notificationId });

    // Get updated unread count
    const unreadCount = await notificationModel.countUnread(userId);

    res.status(200).json({
      success: true,
      message: "Notification deleted",
      unreadCount,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error deleting notification",
      error: error.message,
    });
  }
};

// Get unread notification count
const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user._id;
    const unreadCount = await notificationModel.countUnread(userId);

    res.status(200).json({
      success: true,
      unreadCount,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching unread notification count",
      error: error.message,
    });
  }
};

// Function to create notifications for different types of activities
// This is typically called from other controllers
const createActivityNotification = async (
  recipientId,
  senderId,
  type,
  reference = {},
  metadata = {},
  customMessage = null
) => {
  // Don't create notification if user is acting on their own content
  if (recipientId.toString() === senderId.toString()) {
    return null;
  }

  try {
    const notificationData = {
      recipient: recipientId,
      sender: senderId,
      type,
      reference,
      metadata,
      customMessage,
    };

    return await createNotification(notificationData);
  } catch (error) {
    console.error(`Error creating ${type} notification:`, error);
    return null;
  }
};

export {
  getUserNotifications,
  markAsRead,
  markMultipleAsRead,
  markAllAsRead,
  deleteNotification,
  getUnreadCount,
  createActivityNotification,
};