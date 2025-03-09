import express from "express";
import { 
  toggleLike, 
  likePost, 
  unlikePost, 
  getLikesCount, 
  getLikeStatus 
} from "../controllers/likes.controller.js";
import { verifyToken, checkRole } from "../middlewares/auth.middleware.js";
const router = express.Router();

router.post(
    "/posts/like/toggle/:postId",
    verifyToken,
    checkRole(["user", "creator", "admin"]),
    toggleLike
);

router.post(
    "/posts/like/:postId",
    verifyToken,
    checkRole(["user", "creator", "admin"]),
    likePost
);

router.post(
    "/posts/unlike/:postId",
    verifyToken,
    checkRole(["user", "creator", "admin"]),
    unlikePost
);

router.get(
    "/posts/likes/count/:postId",
    getLikesCount
);

// Add the new route to check like status - note we need auth for this
router.get(
    "/posts/likes/status/:postId",
    verifyToken,
    checkRole(["user", "creator", "admin"]),
    getLikeStatus
);

export default router;