import express from "express";
import upload from "../middlewares/multer.middleware.js";
import { 
  createPost, 
  getPosts, 
  getUserPosts, 
  updatePost, 
  deletePost,
} from "../controllers/post.controller.js";
import { verifyToken, checkRole } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/create-posts", verifyToken, checkRole(["user", "creator", "admin"]), upload.single("media"), createPost);
router.get("/get-posts", getPosts);
router.get("/:id", getUserPosts);
router.put("/:id", verifyToken, checkRole(["user", "creator", "admin"]), upload.single("media"), updatePost);
router.delete("/:id", verifyToken, checkRole(["user", "creator", "admin"]), deletePost);

export default router;
