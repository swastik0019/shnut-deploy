import { notificationModel } from "../models/notification.model.js";
import { User } from "../models/user.model.js";

const notificationHandler = (io, socket) => {
  // Listen for notification mark-as-read events
  socket.on("markNotificationRead", async ({ notificationId }) => {
    try {
      const userId = socket.handshake.query.userId;
      if (!userId) return;

      const notification = await notificationModel.findOne({
        _id: notificationId,
        recipient: userId,
      });

      if (!notification) {
        return socket.emit("error", {
          type: "notification",
          message: "Notification not found",
        });
      }

      // Mark notification as read
      notification.read = true;
      notification.readAt = new Date();
      await notification.save();

      // Count remaining unread notifications
      const unreadCount = await notificationModel.countUnread(userId);

      // Emit an event back to the client with the updated unread count
      socket.emit("notificationMarkedRead", { notificationId, unreadCount });
    } catch (error) {
      console.error("Error marking notification as read:", error);
      socket.emit("error", {
        type: "notification",
        message: "Failed to mark notification as read",
      });
    }
  });

  // Listen for mark all notifications as read
  socket.on("markAllNotificationsRead", async () => {
    try {
      const userId = socket.handshake.query.userId;
      if (!userId) return;

      // Mark all notifications as read for this user
      const currentTime = new Date();
      await notificationModel.updateMany(
        { recipient: userId, read: false },
        { read: true, readAt: currentTime }
      );

      // Emit an event back to the client
      socket.emit("allNotificationsMarkedRead", { unreadCount: 0 });
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      socket.emit("error", {
        type: "notification",
        message: "Failed to mark all notifications as read",
      });
    }
  });

  // Listen for requests to get notifications
  socket.on("getNotifications", async ({ page = 1, limit = 20, unreadOnly = false }) => {
    try {
      const userId = socket.handshake.query.userId;
      if (!userId) return;

      // Build query based on filters
      const query = { recipient: userId };
      if (unreadOnly === true) {
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

      // Emit notifications to the client
      socket.emit("notifications", {
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
      console.error("Error fetching notifications:", error);
      socket.emit("error", {
        type: "notification",
        message: "Failed to fetch notifications",
      });
    }
  });
};

// Function to create and send a notification
export const createSocketNotification = async (
  io,
  recipientId,
  senderId,
  type,
  reference = {},
  metadata = {},
  customMessage = null
) => {
  try {
    // Don't create notification if recipient is the same as sender
    if (recipientId.toString() === senderId.toString()) {
      return null;
    }

    // Check if recipient wants to receive this type of notification
    const recipient = await User.findById(recipientId);
    if (!recipient || !recipient.shouldReceiveNotification(type)) {
      return null;
    }

    // Create notification in the database
    const notification = await notificationModel.create({
      recipient: recipientId,
      sender: senderId,
      type,
      reference,
      metadata,
      customMessage,
    });

    // Populate sender information for sending through socket
    const populatedNotification = await notificationModel
      .findById(notification._id)
      .populate("sender", "firstName lastName nickname avatar");

    // Add formatted message
    const notificationObj = populatedNotification.toObject();
    notificationObj.message = notificationModel.getNotificationMessage(notificationObj);

    // Get updated unread count
    const unreadCount = await notificationModel.countUnread(recipientId);

    // Emit to the specific recipient's room
    io.to(recipientId.toString()).emit("newNotification", {
      notification: notificationObj,
      unreadCount,
    });

    return notification;
  } catch (error) {
    console.error(`Error creating ${type} notification:`, error);
    return null;
  }
};

export default notificationHandler;