import { User, validateUser } from "../models/user.model.js"; // Import User model and Joi validation
import bcrypt from "bcrypt"; // For hashing passwords (optional if updating passwords)

// **Get User Profile**
const getUserProfile = (req, res) => {
  // Always check if req.user exists to avoid sending undefined properties
  if (!req.user) {
    return res.status(401).json({
      message: "Unauthorized: No user found.",
      isAuthenticated: false,
    });
  }

  // Send the user profile information
  res.status(200).json({
    message: "Logged in ho aap",
    userProfile: req.user,
    isAuthenticated: true,
    token: req.cookies.token
  });
};

// **Update User Profile**
const updateUserProfile = async (req, res) => {
  try {
    const userId = req.user.id; // Assuming `req.user` contains the authenticated user's ID
    const { name, email, password, avatar, bio } = req.body;

    // Validate the user input using Joi
    const { error } = validateUser(req.body);
    if (error) {
      return res
        .status(400)
        .json({ errors: error.details.map((e) => e.message) });
    }

    // Find the user in the database
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Update user fields if provided
    if (name) user.name = name;
    if (email) user.email = email;
    if (password) {
      const salt = await bcrypt.genSalt(10); // Generate salt for hashing
      user.password = await bcrypt.hash(password, salt); // Hash the new password
    }
    if (avatar) user.avatar = avatar;
    if (bio) user.bio = bio;

    await user.save(); // Save the updated user in the database

    res.status(200).json({ message: "Profile updated successfully", user });
  } catch (error) {
    res
      .status(500)
      .json({ error: "An error occurred while updating the profile" });
  }
};

// **Delete User Profile**
const deleteUserProfile = async (req, res) => {
  try {
    const userId = req.user.id; // Assuming `req.user` contains the authenticated user's ID

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    await User.findByIdAndDelete(userId); // Delete the user from the database

    res.status(200).json({ message: "Profile deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ error: "An error occurred while deleting the profile" });
  }
};

// **Ban User Logic**
const banUser = async (req, res) => {
  try {
    const { userId, reason } = req.body; // Extract userId and reason from request body

    // Find the user in the database
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Update the user's banned status and reason
    user.banned = true; // Set banned status to true
    user.banningReason = reason || "No reason provided"; // Set banning reason
    user.banDate = new Date(); // Set the current date as the ban date

    await user.save(); // Save the updated user in the database

    res
      .status(200)
      .json({ message: "User has been banned successfully", user });
  } catch (error) {
    res.status(500).json({ error: "An error occurred while banning the user" });
  }
};

export { getUserProfile, updateUserProfile, deleteUserProfile, banUser };