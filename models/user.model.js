import mongoose from "mongoose";
import Joi from "joi";

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      trim: true,
    },
    nickname: {
      type: String,
      required: [true, "Nickname is required"],
      unique: true,
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      validate: {
        validator: function (email) {
          return /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email);
        },
        message: "Please provide a valid email address",
      },
    },
    password: {
      type: String,
      required: true,
      minlength: [6, "Password must be at least 6 characters long"],
    },
    avatar: {
      type: String,
      default: "",
    },
    gender: {
      type: String,
      enum: ["male", "female", "other"],
      default: "other",
    },
    bio: {
      type: String,
      trim: true,
      maxlength: [200, "Bio cannot exceed 200 characters"],
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    role: {
      type: String,
      enum: ["user", "creator", "admin"],
      default: "user",
    },
    phoneNumber: {
      type: String,
      unique: true,
      sparse: true, // Allows multiple null values
      trim: true,
    },
    followers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    following: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    coins: {
      type: Number,
      default: 0,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    banned: {
      type: Boolean,
      default: false,
    },
    banningReason: {
      type: String,
      default: "",
    },
    banDate: {
      type: Date,
      default: null,
    },
    isOnline: {
      type: Boolean,
      default: false,
    },
    // Add notification preferences
    notificationPreferences: {
      // Push notification settings
      pushEnabled: {
        type: Boolean,
        default: true,
      },
      // Email notification settings
      emailEnabled: {
        type: Boolean,
        default: true,
      },
      // Specific notification types that can be toggled
      types: {
        likes: {
          type: Boolean,
          default: true,
        },
        comments: {
          type: Boolean,
          default: true,
        },
        follows: {
          type: Boolean,
          default: true,
        },
        messages: {
          type: Boolean,
          default: true,
        },
        calls: {
          type: Boolean,
          default: true,
        },
        mentions: {
          type: Boolean,
          default: true,
        },
        friendRequests: {
          type: Boolean,
          default: true,
        },
        system: {
          type: Boolean,
          default: true,
        },
      },
      // Do not disturb time range
      doNotDisturb: {
        enabled: {
          type: Boolean,
          default: false,
        },
        startTime: {
          type: String,
          default: "22:00", // 10 PM in 24h format
        },
        endTime: {
          type: String,
          default: "08:00", // 8 AM in 24h format
        },
      },
    },
    // Last time user checked notifications (for new notification indicators)
    lastNotificationCheck: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Virtual to fetch user's unread notification count (doesn't store in DB)
userSchema.virtual("unreadNotificationsCount").get(function () {
  // This is just a placeholder. The actual count will come from the notification model.
  return 0;
});

// Method to get user's notifications
userSchema.methods.getNotifications = async function (
  page = 1,
  limit = 20,
  unreadOnly = false
) {
  try {
    // Import notification model here to avoid circular dependencies
    const { notificationModel } = await import(
      "../models/notification.model.js"
    );

    // Build query for notifications
    const query = { recipient: this._id };
    if (unreadOnly) {
      query.read = false;
    }

    // Fetch notifications with pagination
    const skip = (page - 1) * limit;
    const notifications = await notificationModel
      .find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("sender", "firstName lastName nickname avatar");

    // Get count of total and unread notifications
    const total = await notificationModel.countDocuments(query);
    const unreadCount = await notificationModel.countUnread(this._id);

    return {
      notifications,
      unreadCount,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    console.error("Error fetching user notifications:", error);
    throw error;
  }
};

// Method to mark all user's notifications as read
userSchema.methods.markAllNotificationsAsRead = async function () {
  try {
    const { notificationModel } = await import(
      "../models/notification.model.js"
    );
    await notificationModel.markAllAsRead(this._id);

    // Update last notification check time
    this.lastNotificationCheck = new Date();
    await this.save();

    return { success: true };
  } catch (error) {
    console.error("Error marking notifications as read:", error);
    throw error;
  }
};

// Method to update notification preferences
userSchema.methods.updateNotificationPreferences = async function (
  preferences
) {
  try {
    // Deep merge the new preferences with existing ones
    if (preferences.pushEnabled !== undefined) {
      this.notificationPreferences.pushEnabled = preferences.pushEnabled;
    }

    if (preferences.emailEnabled !== undefined) {
      this.notificationPreferences.emailEnabled = preferences.emailEnabled;
    }

    if (preferences.types) {
      Object.keys(preferences.types).forEach((type) => {
        if (this.notificationPreferences.types[type] !== undefined) {
          this.notificationPreferences.types[type] = preferences.types[type];
        }
      });
    }

    if (preferences.doNotDisturb) {
      if (preferences.doNotDisturb.enabled !== undefined) {
        this.notificationPreferences.doNotDisturb.enabled =
          preferences.doNotDisturb.enabled;
      }

      if (preferences.doNotDisturb.startTime) {
        this.notificationPreferences.doNotDisturb.startTime =
          preferences.doNotDisturb.startTime;
      }

      if (preferences.doNotDisturb.endTime) {
        this.notificationPreferences.doNotDisturb.endTime =
          preferences.doNotDisturb.endTime;
      }
    }

    await this.save();
    return this.notificationPreferences;
  } catch (error) {
    console.error("Error updating notification preferences:", error);
    throw error;
  }
};

// Method to check if a user should receive a specific type of notification
userSchema.methods.shouldReceiveNotification = function (type) {
  // Default mapping between notification types and preference types
  const typeMapping = {
    like: "likes",
    comment: "comments",
    reply: "comments",
    follow: "follows",
    message: "messages",
    call_incoming: "calls",
    call_missed: "calls",
    call_ended: "calls",
    mention: "mentions",
    friend_request: "friendRequests",
    friend_accepted: "friendRequests",
    post_share: "likes",
    system: "system",
  };

  const preferenceType = typeMapping[type] || type;

  // Check if notifications are generally enabled
  if (!this.notificationPreferences.pushEnabled) {
    return false;
  }

  // Check if this specific type is enabled
  if (this.notificationPreferences.types[preferenceType] === false) {
    return false;
  }

  // Check if we're in do not disturb hours
  if (this.notificationPreferences.doNotDisturb.enabled) {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinutes = now.getMinutes();
    const currentTime = `${currentHour
      .toString()
      .padStart(2, "0")}:${currentMinutes.toString().padStart(2, "0")}`;

    const startTime = this.notificationPreferences.doNotDisturb.startTime;
    const endTime = this.notificationPreferences.doNotDisturb.endTime;

    // Handle overnight periods (when start time is later than end time)
    if (startTime > endTime) {
      if (currentTime >= startTime || currentTime < endTime) {
        return false;
      }
    } else {
      if (currentTime >= startTime && currentTime < endTime) {
        return false;
      }
    }
  }

  return true;
};

// Add the method to check for new notifications since last check
userSchema.methods.hasNewNotifications = async function () {
  try {
    const { notificationModel } = await import(
      "../models/notification.model.js"
    );

    // Count notifications created after last check
    const count = await notificationModel.countDocuments({
      recipient: this._id,
      createdAt: { $gt: this.lastNotificationCheck },
    });

    return count > 0;
  } catch (error) {
    console.error("Error checking for new notifications:", error);
    return false;
  }
};

const validateUser = (user) => {
  // Validation schema for all users
  const userSchema = {
    firstName: Joi.string().required().messages({
      "string.empty": "First name is required",
    }),
    lastName: Joi.string().allow("").optional(),
    nickname: Joi.string().min(3).max(30).required().messages({
      "string.empty": "Nickname is required",
      "string.min": "Nickname should have a minimum length of 3 characters",
      "string.max": "Nickname should have a maximum length of 30 characters",
    }),
    email: Joi.string().email().required().messages({
      "string.empty": "Email is required",
      "string.email": "Please provide a valid email address",
    }),
    password: Joi.string().min(6).required().messages({
      "string.empty": "Password is required",
      "string.min": "Password must be at least 6 characters long",
    }),
    confirmPassword: Joi.string()
      .valid(Joi.ref("password"))
      .required()
      .messages({
        "any.only": "Passwords do not match",
        "string.empty": "Please confirm your password",
      }),
    avatar: Joi.string().uri().allow("").optional().messages({
      "string.uri": "Avatar must be a valid URL",
    }),
    gender: Joi.string().valid("male", "female", "other").required().messages({
      "any.only": "Gender must be either male, female, or other",
    }),
    bio: Joi.string().max(200).allow("").optional().messages({
      "string.max": "Bio cannot exceed 200 characters",
    }),
    role: Joi.string().valid("user", "creator", "admin").optional().messages({
      "any.only": "Role must be one of user, creator, or admin",
    }),
    coins: Joi.number().min(0).optional().messages({
      "number.min": "Coins cannot be negative",
    }),
    banned: Joi.boolean().optional(),
    banningReason: Joi.string().allow("").optional(),
    banDate: Joi.date().allow(null).optional(),
    isOnline: Joi.boolean().optional(),
    phoneNumber: Joi.string().allow("").optional(),
    isVerified: Joi.boolean().optional(),
    followers: Joi.array().items(Joi.string()).optional(),
    following: Joi.array().items(Joi.string()).optional(),
    notificationPreferences: Joi.object({
      pushEnabled: Joi.boolean().optional(),
      emailEnabled: Joi.boolean().optional(),
      types: Joi.object({
        likes: Joi.boolean().optional(),
        comments: Joi.boolean().optional(),
        follows: Joi.boolean().optional(),
        messages: Joi.boolean().optional(),
        calls: Joi.boolean().optional(),
        mentions: Joi.boolean().optional(),
        friendRequests: Joi.boolean().optional(),
        system: Joi.boolean().optional(),
      }).optional(),
      doNotDisturb: Joi.object({
        enabled: Joi.boolean().optional(),
        startTime: Joi.string()
          .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
          .optional(),
        endTime: Joi.string()
          .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
          .optional(),
      }).optional(),
    }).optional(),
  };

  // Create the validation schema
  const schema = Joi.object(userSchema);

  // Return the validation result
  return schema.validate(user, { abortEarly: false });
};

// Create the User model based on the schema
const User = mongoose.model("User", userSchema);

// Export the User model for use in other parts of the application
export { User, validateUser };
