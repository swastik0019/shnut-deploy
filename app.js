import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
// import session from "express-session";
// import passport from "./config/passport.js";

// Import route handlers for different API endpoints
import authRoutes from "./routes/auth.routes.js"; // Authentication routes (e.g., login, signup)
import userRoutes from "./routes/users.routes.js"; // User-related routes (e.g., get/update profile)
import postRoutes from "./routes/post.routes.js"; // Content-related routes (e.g., upload, fetch, delete)
import messageRoutes from "./routes/message.routes.js" //Message-related routes (eg., send/receive messages)
import onBoardingRoutes from "./routes/onboarding.routes.js" //Onboarding related routes (eg., upload avatar)
import followRoutes from "./routes/follow.routes.js" 
// import paymentRoutes from "./routes/payment.routes.js"
import videoChatSessionRoutes from "./routes/video.routes.js" 
import activityRoute from "./routes/activity.routes.js" 
import path from "path";
import { fileURLToPath } from 'url';
import { dirname } from 'path';




dotenv.config();

const app = express();

// **Configure CORS middleware to allow requests from specific origins**
app.use(
  cors({
    // origin: process.env.CORS_ORIGIN,
    origin:  process.env.CORS_ORIGIN || "https://project-shnut-three.vercel.app",
    credentials: true, // Allow credentials like cookies or authorization headers
  })
);

// **Middleware to parse incoming data**
app.use(express.json()); // Parse incoming JSON data
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded data (e.g., form submissions)
app.use(cookieParser()); // Parse cookies in incoming requests
// app.use(
//   session({
//     secret: process.env.SESSION_SECRET,
//     resave: false,
//     saveUninitialized: false,
//   })
// );

// app.use(passport.initialize());
// app.use(passport.session());

// **Define API routes**
app.use("/api/auth", authRoutes); // Public routes for authentication (e.g., login, signup, logout)
app.use("/api/users", userRoutes); // Routes for user profile management
app.use("/api/posts", postRoutes); // Routes for content upload, retrieval, and deletion
app.use("/api/messages", messageRoutes); //Routes for sending/receiving messages
app.use("/api/onboarding", onBoardingRoutes); //Routes for sending/receiving messages
app.use("/api/follow", followRoutes); //Routes for followers/following
// app.use("/api/payment", paymentRoutes); //Routes for payment(to be added in future)
app.use("/api/video", videoChatSessionRoutes); //Routes for payment
app.use("/api/activity", activityRoute); //Routes for payment



// Get the current directory path
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);


const NODE_ENV = "production";
// Serve frontend
if (NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "./dist")));

  app.get("*", (req, res) =>
      res.sendFile(
          path.resolve(__dirname, "./", "dist", "index.html")
      )
  );
} else {
  app.get("/", (req, res) => res.send("Please set to production"));
}


// **Fallback route to handle requests to undefined endpoints**
app.use((_, res) => {
  res.status(404).json({ error: "Endpoint not found" }); // Respond with a 404 error message
});

// Export the Express app for use in other files (e.g., server.js)
export default app;
