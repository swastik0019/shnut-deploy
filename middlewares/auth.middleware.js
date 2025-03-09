import jwt from "jsonwebtoken"; // Import jsonwebtoken for token verification
import { User } from "../models/user.model.js";

// **Middleware to verify JWT token**
// This middleware checks if the request has a valid JWT token.
const verifyToken = async (req, res, next) => {

  const token = req.cookies.token || req.headers.authorization?.split(" ")[1];

  console.log("Token from cookies:", token); // Check the token value

  if (!token) {
    return res.status(401).json({ error: "Access denied. No token provided." });
  }

  try {
    // Decode the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("Decoded Token:", decoded); // Log decoded payload

    // Fetch the user from the database
    const user = await User.findById(decoded.userId).select("-password");
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    console.log("Fetched User:", user); // Log fetched user
    req.user = user; // Attach user to request

    next(); // Proceed to the next middleware
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Token has expired." });
    }
    console.error("Error in token verification:", err);
    res.status(500).json({ error: "Invalid token." });
  }
};

// **Middleware to check user roles**
// This middleware checks if the user has the required role to access a route.
const checkRole = (roles) => (req, res, next) => {
  // console.log("User role:", req.user.role);
  if (!req.user || !roles.includes(req.user.role)) {
    return res
      .status(403)
      .json({ error: "Access denied. Insufficient permissions." }); // Return error if user does not have required role
  }
  next(); // Proceed to the next middleware or route handler
};

export { verifyToken, checkRole };
