import express from "express";
import {
  followUser,
  unfollowUser,
  getFollowers,
  getFollowing,
} from "../controllers/follow.controller.js";
import { verifyToken, checkRole } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post(
  "/:id",
  verifyToken, // Verify that the user is authenticated
  checkRole(["user", "creator", "admin"]), // Check if the user has a valid role
  followUser
);

router.delete(
  "/unfollow/:id",
  verifyToken, // Verify that the user is authenticated
  checkRole(["user", "creator", "admin"]), // Check if the user has a valid role
  unfollowUser
);

router.get(
  "/followers/:id",
  verifyToken, // Verify that the user is authenticated
  checkRole(["user", "creator", "admin"]), // Check if the user has a valid role
  getFollowers
);

router.get(
  "/following/:id",
  verifyToken, // Verify that the user is authenticated
  checkRole(["user", "creator", "admin"]), // Check if the user has a valid role
  getFollowing
);

export default router;
