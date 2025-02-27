import express from "express";
import upload from "../middlewares/multer.middleware.js";
import { updateAvatar } from "../controllers/onboarding.controller.js";
import { verifyToken, checkRole } from "../middlewares/auth.middleware.js";

const router = express.Router();

// PATCH /api/onboarding/avatar - Update the user's avatar
router.patch(
  "/avatar",
  verifyToken,
  checkRole(["user", "creator", "admin"]) ,
  upload.single("avatar"),
  updateAvatar
);

export default router;
