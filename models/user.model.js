import mongoose from "mongoose";
import Joi from "joi";

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: function () {
        // Only required for local auth
        return this.authType === "local";
      },
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
      required: function () {
        // Only required for local auth
        return this.authType === "local";
      },
      minlength: [6, "Password must be at least 6 characters long"],
    },
    // Add authType field that was likely removed
    authType: {
      type: String,
      enum: ["local"],
      default: "local",
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
  },
  {
    timestamps: true,
  }
);

const validateUser = (user) => {
  // Base schema with common fields
  const baseSchema = {
    nickname: Joi.string().min(3).max(30).required().messages({
      "string.empty": "Nickname is required",
      "string.min": "Nickname should have a minimum length of 3 characters",
      "string.max": "Nickname should have a maximum length of 30 characters",
    }),
    email: Joi.string().email().required().messages({
      "string.empty": "Email is required",
      "string.email": "Please provide a valid email address",
    }),
    avatar: Joi.string().uri().allow('').optional().messages({
      "string.uri": "Avatar must be a valid URL",
    }),
    gender: Joi.string().valid("male", "female", "other").required().messages({
      "any.only": "Gender must be either male, female, or other",
    }),
    bio: Joi.string().max(200).allow('').optional().messages({
      "string.max": "Bio cannot exceed 200 characters",
    }),
    role: Joi.string().valid("user", "creator", "admin").optional().messages({
      "any.only": "Role must be one of user, creator, or admin",
    }),
    coins: Joi.number().min(0).optional().messages({
      "number.min": "Coins cannot be negative",
    }),
    banned: Joi.boolean().optional(),
    banningReason: Joi.string().allow('').optional(),
    banDate: Joi.date().allow(null).optional(),
    isOnline: Joi.boolean().optional(),
    phoneNumber: Joi.string().allow('').optional(),
    isVerified: Joi.boolean().optional(),
    followers: Joi.array().items(Joi.string()).optional(),
    following: Joi.array().items(Joi.string()).optional(),
  };

  // Local auth schema adds required fields for local authentication
  const localAuthSchema = {
    ...baseSchema,
    firstName: Joi.string().required().messages({
      "string.empty": "First name is required",
    }),
    lastName: Joi.string().allow('').optional(),
    password: Joi.string().min(6).required().messages({
      "string.empty": "Password is required",
      "string.min": "Password must be at least 6 characters long",
    }),
    authType: Joi.string().valid("local").required(),
  };

  // Default to local auth validation if authType is not specified
  const authType = user.authType || "local";
  
  // Create the validation schema based on auth type
  const schema = Joi.object(localAuthSchema);
  
  // Return the validation result
  return schema.validate(user, { abortEarly: false });
};

// Create the User model based on the schema
const User = mongoose.model("User", userSchema);

// Export the User model for use in other parts of the application
export { User, validateUser };