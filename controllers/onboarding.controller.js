import { User } from "../models/user.model.js";

//**Update Profile Picture Logic**
const updateAvatar = async (req, res) => {
  try {
    // Check if a file was uploaded (Multer puts the processed file into req.file)
    if (!req.file) {
      return res.status(400).json({ error: "No image file provided" });
    }

    // Retrieve the Cloudinary URL from the file upload response
    const avatarUrl = req.file.path;

    // Get the authenticated user's id (assuming authentication middleware sets req.user)
    const userId = req.user?.id;
    if (!userId) {
      return res.status(400).json({ error: "User ID not provided" });
    }

    // Update the user's avatar field in the database
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { avatar: avatarUrl },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json({
      message: "Avatar updated successfully",
      user: {
        id: updatedUser._id,
        avatar: updatedUser.avatar,
      },
    });
  } catch (error) {
    console.error("Error updating avatar:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export { updateAvatar }
