import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true, // For faster queries when fetching user's notifications
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: [
        "like", // When someone likes your post
        "comment", // When someone comments on your post
        "follow", // When someone follows you
        "message", // When someone sends you a message
        "call_incoming", // When someone calls you
        "call_missed", // When you miss a call
        "call_ended", // When a call ends
        "system", // System notifications (updates, announcements, etc.)
      ],
      required: true,
    },
    read: {
      type: Boolean,
      default: false,
    },
    // Add a timestamp for when the notification was read
    readAt: {
      type: Date,
      default: null,
    },
    // References to relevant content based on notification type
    reference: {
      // For post-related notifications (like, comment)
      post: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "postModel",
      },
      // For comment-related notifications (reply)
      comment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "commentModel",
      },
      // For message-related notifications
      message: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ConversationModel",
      },
      // For call-related notifications
      call: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Call", // Assuming you have a Call model
      },
    },
    // Additional metadata specific to notification type
    metadata: {
      type: Object, // Flexible object to store type-specific data
    },
    // Optional custom message override
    customMessage: {
      type: String,
    },
  },
  { timestamps: true }
);

// Create indices for frequently queried fields
notificationSchema.index({ createdAt: -1 }); // For sorting by time
notificationSchema.index({ read: 1 }); // For filtering read/unread
notificationSchema.index({ type: 1 }); // For filtering by type
notificationSchema.index({ readAt: 1 }); // For automatic cleanup

// Instance method to mark a notification as read
notificationSchema.methods.markAsRead = function () {
  this.read = true;
  this.readAt = new Date(); // Set the readAt timestamp
  return this.save();
};

// Static method to mark multiple notifications as read
notificationSchema.statics.markMultipleAsRead = function (notificationIds, userId) {
  const currentTime = new Date();
  return this.updateMany(
    {
      _id: { $in: notificationIds },
      recipient: userId,
    },
    { 
      $set: { 
        read: true,
        readAt: currentTime // Set the readAt timestamp
      } 
    }
  );
};

// Static method to mark all notifications as read for a user
notificationSchema.statics.markAllAsRead = function (userId) {
  const currentTime = new Date();
  return this.updateMany(
    { recipient: userId },
    { 
      $set: { 
        read: true,
        readAt: currentTime // Set the readAt timestamp
      } 
    }
  );
};

// Static method to count unread notifications
notificationSchema.statics.countUnread = function (userId) {
  return this.countDocuments({ recipient: userId, read: false });
};

// Static method to delete notifications that have been read for more than 1 hour
notificationSchema.statics.deleteOldReadNotifications = function () {
  const oneHourAgo = new Date();
  oneHourAgo.setHours(oneHourAgo.getHours() - 1);
  
  return this.deleteMany({
    read: true,
    readAt: { $lt: oneHourAgo }
  });
};

// Static method to get notification message based on type
notificationSchema.statics.getNotificationMessage = function (notification) {
  if (notification.customMessage) {
    return notification.customMessage;
  }

  // Use template strings for each notification type
  const senderName = notification.sender?.firstName || "Someone";
  
  switch (notification.type) {
    case "like":
      return `${senderName} liked your post`;
    case "comment":
      return `${senderName} commented on your post`;
    case "reply":
      return `${senderName} replied to your comment`;
    case "follow":
      return `${senderName} started following you`;
    case "mention":
      return `${senderName} mentioned you in a post`;
    case "message":
      return `${senderName} sent you a message`;
    case "call_incoming":
      return `${senderName} is calling you`;
    case "call_missed":
      return `You missed a call from ${senderName}`;
    case "call_ended":
      return `Call with ${senderName} ended`;
    case "friend_request":
      return `${senderName} sent you a friend request`;
    case "friend_accepted":
      return `${senderName} accepted your friend request`;
    case "post_share":
      return `${senderName} shared your post`;
    case "system":
      return notification.metadata?.message || "System notification";
    default:
      return "You have a new notification";
  }
};

// Create the model
const notificationModel = mongoose.model("Notification", notificationSchema);

export { notificationModel };