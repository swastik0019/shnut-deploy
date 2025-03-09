import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../utils/cloudinary.js"; // Import Cloudinary config

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (_, file) => {
    let folder = "shnut_posts/general"; // Default folder
    let resourceType = "auto";

    // Check file mimetype
    if (file.mimetype.startsWith("image/")) {
      folder = "shnut_posts/images"; // Store images in "posts/images"
      resourceType = "image";
    } else if (file.mimetype.startsWith("video/")) {
      folder = "shnut_posts/videos"; // Store videos in "posts/videos"
      resourceType = "video";
    }

    return {
      folder,
      resource_type: resourceType,
      allowed_formats: ["jpg", "png", "jpeg", "mp4"], // Allowed file types
    };
  },
});

const upload = multer({ storage });

export default upload;
