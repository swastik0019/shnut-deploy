import express from "express"; // Import express for routing
import { register, login, logout, refreshToken, forgotPassword, resetPassword } from "../controllers/auth.controller.js"; // Import controller functions
import { verifyToken } from "../middlewares/auth.middleware.js"; // Import middleware
// import passport from "passport"; // Import passport for OAuth

const router = express.Router(); // Create a new router

// Route for user signup
router.post("/register", register); 

// Route for user login
router.post("/login", login); 

// Route for user logout
router.post("/logout", logout); 

// Route for refreshing access token
router.post("/refresh-token", verifyToken, refreshToken); 

// Route for forgot password
router.post("/forgot-password", forgotPassword); 

// Route for resetting password
router.post("/reset-password", resetPassword); 

// //**Google OAuth Authentication**
// router.get("/auth/google", passport.authenticate("google", { scope: ["profile", "email"] }));

// // **Google OAuth Callback**
// router.get(
//   "/auth/google/callback",
//   passport.authenticate("google", { failureRedirect: "/login", session: false }),
//   (_, res) => {
//     // Successful authentication, redirect or send token
//     res.redirect("/dashboard"); // Change this to your frontend redirect
//   }
// );

export default router; // Export the router
