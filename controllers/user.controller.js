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

const updateUserProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      firstName,
      lastName,
      nickname,
      email,
      bio,
      phoneNumber
    } = req.body;
    
    // Create an update object with only the provided fields
    const updateData = {};
    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;
    if (nickname) updateData.nickname = nickname;
    if (email) updateData.email = email.toLowerCase();
    if (bio) updateData.bio = bio;
    if (phoneNumber) updateData.phoneNumber = phoneNumber;
    
    // Check if file was uploaded (will be handled by multer)
    if (req.file) {
      updateData.avatar = req.file.path; // Cloudinary returns the URL in req.file.path
    }

    // Find the user in the database
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check if the nickname is being changed and if it's already taken
    if (nickname && nickname !== user.nickname) {
      const existingUser = await User.findOne({ nickname });
      if (existingUser) {
        return res.status(400).json({ error: "Nickname is already taken" });
      }
    }

    // Check if the email is being changed and if it's already taken
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ error: "Email is already taken" });
      }
    }

    // Check if the phone number is being changed and if it's already taken
    if (phoneNumber && phoneNumber !== user.phoneNumber) {
      const existingUser = await User.findOne({ phoneNumber });
      if (existingUser) {
        return res.status(400).json({ error: "Phone number is already taken" });
      }
    }

    // Update the user with the updateData object
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    );

    // Create a sanitized user object without sensitive information
    const sanitizedUser = {
      _id: updatedUser._id,
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
      nickname: updatedUser.nickname,
      email: updatedUser.email,
      avatar: updatedUser.avatar,
      bio: updatedUser.bio,
      phoneNumber: updatedUser.phoneNumber,
      role: updatedUser.role,
      isVerified: updatedUser.isVerified,
      followers: updatedUser.followers,
      following: updatedUser.following,
      coins: updatedUser.coins,
      createdAt: updatedUser.createdAt,
      updatedAt: updatedUser.updatedAt
    };

    res.status(200).json({
      message: "Profile updated successfully",
      user: sanitizedUser
    });
  } catch (error) {
    console.error("Profile update error:", error);
    res.status(500).json({
      error: "An error occurred while updating the profile",
      details: error.message
    });
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