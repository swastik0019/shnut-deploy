import mongoose from "mongoose"; // Import mongoose to interact with MongoDB
import Joi from "joi"; // Import Joi for validating data

// **Define the User schema for the MongoDB collection**
const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String, // Specifies that the 'firstName' field will be a string
      required: [true, "First name is required"], // Ensures the 'firstName' field is required
      trim: true, // Trims any leading/trailing whitespace from the name
    },
    lastName: {
      type: String, // Specifies that the 'lastName' field will be a string
      trim: true, // Trims any leading/trailing whitespace from the name
    },
    nickname: {
      type: String,
      required: [true, "Nickname is required"],
      unique: true, // Ensures the nickname is unique in the database
      trim: true,
    },
    email: {
      type: String, // Specifies that the 'email' field will be a string
      required: [true, "Email is required"], // Ensures the 'email' field is required
      unique: true, // Ensures the email is unique in the database
      lowercase: true, // Converts the email to lowercase before saving
      validate: {
        validator: function (email) {
          // Simple regex for validating the email format
          return /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email);
        },
        message: "Please provide a valid email address", // Error message if the email is invalid
      },
    },
    password: {
      type: String, // Specifies that the 'password' field will be a string
      required: [true, "Password is required"], // Ensures the 'password' field is required
      minlength: [6, "Password must be at least 6 characters long"], // Minimum password length of 6 characters
    },
    avatar: {
      type: String, // Specifies that the 'avatar' field will be a string
      default: "", // Default value for the avatar (if no avatar is provided)
    },
    bio: {
      type: String, // Specifies that the 'bio' field will be a string
      trim: true, // Trims any leading/trailing whitespace from the bio
      maxlength: [200, "Bio cannot exceed 200 characters"], // Limits the bio length to 200 characters
    },
    isVerified: {
      type: Boolean, // Specifies that the 'isVerified' field will be a boolean
      default: false, // Default value for the 'isVerified' field (false by default)
    },
    role: {
      type: String, // Specifies that the 'role' field will be a string
      enum: ["user", "creator", "admin"], // Valid roles: user, creator, admin
      default: "user", // Default role is 'user'
    },
    followers: [
      {
        type: mongoose.Schema.Types.ObjectId, // Specifies that 'followers' will be an array of ObjectIds
        ref: "User", // References the User model, allowing population of follower details
      },
    ],
    following: [
      {
        type: mongoose.Schema.Types.ObjectId, // Specifies that 'following' will be an array of ObjectIds
        ref: "User", // References the User model, allowing population of following details
      },
    ],
    // **Add coins field to define the number of coins a user has**
    coins: {
      type: Number,
      default: 0, // Every user starts with 0 coins by default
    },
    createdAt: {
      type: Date, // Specifies that 'createdAt' will be a Date field
      default: Date.now, // Default value is the current date and time
    },
    // **Banning fields**
    banned: {
      type: Boolean, // Specifies that the 'banned' field will be a boolean
      default: false, // Default value is false (not banned)
    },
    banningReason: {
      type: String, // Specifies that the 'banningReason' field will be a string
      default: "", // Default value is an empty string
    },
    banDate: {
      type: Date, // Specifies that the 'banDate' field will be a Date field
      default: null, // Default value is null (not banned)
    },
    // isOnline: {
    //   type: Boolean,
    //   default: false, // User is offline by default
    // },
  },
  {
    timestamps: true, // Automatically adds 'createdAt' and 'updatedAt' fields
  }
);

// **Define Joi validation schema for user data**
const validateUser = (data) => {
  const schema = Joi.object({
    firstName: Joi.string().min(3).max(30).required().messages({
      "string.empty": "First name is required", // Custom error message for empty first name
      "string.min": "First name should have a minimum length of 3 characters", // Custom error message for first name too short
      "string.max": "First name should have a maximum length of 30 characters", // Custom error message for first name too long
    }),
    lastName: Joi.string().min(3).max(30).optional().messages({
      "string.min": "Last name should have a minimum length of 3 characters", // Custom error message for last name too short
      "string.max": "Last name should have a maximum length of 30 characters", // Custom error message for last name too long
    }),
    nickname: Joi.string().min(3).max(30).required().messages({
      "string.empty": "Nickname is required",
      "string.min": "Nickname should have a minimum length of 3 characters",
      "string.max": "Nickname should have a maximum length of 30 characters",
    }),
    email: Joi.string().email().required().messages({
      "string.empty": "Email is required", // Custom error message for empty email
      "string.email": "Please provide a valid email address", // Custom error message for invalid email
    }),
    password: Joi.string().min(6).required().messages({
      "string.empty": "Password is required", // Custom error message for empty password
      "string.min": "Password must be at least 6 characters long", // Custom error message for password too short
    }),
    confirmPassword: Joi.string()
      .valid(Joi.ref("password"))
      .required()
      .messages({
        "string.empty": "Confirm Password is required", // Custom error message for empty confirm password
        "any.only": "Confirm Password must match Password", // Custom error message for mismatched passwords
      }),
    avatar: Joi.string().uri().optional().messages({
      "string.uri": "Avatar must be a valid URL", // Custom error message for invalid avatar URL
    }),
    bio: Joi.string().max(200).optional().messages({
      "string.max": "Bio cannot exceed 200 characters", // Custom error message for bio too long
    }),
    role: Joi.string().valid("user", "admin").optional().messages({
      "any.only": "Role must be one of user or admin", // Custom error message for invalid role
    }),
    coins: Joi.number().min(0).optional().messages({
      "number.min": "Coins cannot be negative",
    }),
    banned: Joi.boolean().optional(), // Optional field for banning status
    banningReason: Joi.string().optional(), // Optional field for banning reason
    banDate: Joi.date().optional(), // Optional field for ban date
    // isOnline: Joi.boolean().optional(),
  });

  // Validate the input data against the schema and return the result
  return schema.validate(data, { abortEarly: false }); // abortEarly: false ensures that all validation errors are collected
};

// Create the User model based on the schema
const User = mongoose.model("User", userSchema);

// Export the User model for use in other parts of the application
export { User, validateUser };
