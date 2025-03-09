import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import compression from "compression";
import rateLimit from "express-rate-limit";
import morgan from "morgan";
import path from "path";
import { fileURLToPath } from 'url';
import { dirname } from 'path';


// Import route modules
import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/users.routes.js";
import postRoutes from "./routes/post.routes.js";
import messageRoutes from "./routes/message.routes.js";
import followRoutes from "./routes/follow.routes.js";
import videoChatSessionRoutes from "./routes/video.routes.js";
import activityRoute from "./routes/activity.routes.js";
import likesRoute from "./routes/likes.routes.js";
import commentsRoute from "./routes/comment.routes.js";

// Import custom middleware
import { errorHandler } from "./middlewares/errorHandler.middleware.js";
import { notFoundHandler } from "./middlewares/errorHandler.middleware.js";

// Load environment variables
import dotenv from "dotenv";
dotenv.config();

const app = express();

// Defining constants
const NODE_ENV = process.env.NODE_ENV || "development";
const isProd = NODE_ENV === "production";
const CORS_ORIGIN = process.env.CORS_ORIGIN || "https://project-shnut-three.vercel.app";

// Request logging
app.use(morgan(isProd ? "combined" : "dev"));

// Security middlewares
app.use(
  helmet({
    contentSecurityPolicy: isProd ? undefined : false,
  })
);

// Disable caching for auth routes middleware
const noCacheMiddleware = (req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
};

// Rate limiting to prevent abuse
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: "Too many requests from this IP, please try again after 15 minutes"
});

// Apply rate limiting to authentication routes
app.use("/api/auth", apiLimiter);

// CORS configuration
// const corsOptions = {
//   origin: function (origin, callback) {
//     const allowedOrigins = [
//       CORS_ORIGIN,
//       'http://localhost:5173',
//       'https://project-shnut-three.vercel.app'
//     ];
    
//     // Allow requests with no origin (like mobile apps, curl requests, etc)
//     if (!origin || allowedOrigins.indexOf(origin) !== -1) {
//       callback(null, true);
//     } else {
//       console.warn(`CORS blocked request from: ${origin}`);
//       callback(new Error('Not allowed by CORS'));
//     }
//   },
//   credentials: true,
//   methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
//   allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
//   maxAge: 86400 // 24 hours
// };

// app.use(cors(corsOptions));

// Options preflight for all routes
// app.options('*', cors(corsOptions));

// Request parsing middlewares
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());

// Response compression
app.use(compression());

// Health check endpoint
app.get("/health", (_, res) => {
  res.status(200).json({ status: "ok", environment: NODE_ENV });
});

// Apply no-cache middleware to auth routes
app.use("/api/auth", noCacheMiddleware);

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/follow", followRoutes);
app.use("/api/video", videoChatSessionRoutes);
app.use("/api/activity", activityRoute);
app.use("/api", likesRoute);
app.use("/api/comments", commentsRoute);




// Get the current directory path
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Serve frontend
// if (NODE_ENV === "production") {
// console.log(__filename)
//   app.use(express.static(path.join(__dirname, "./dist")));

//   app.get("*", (req, res) =>
//       res.sendFile(
//           path.resolve(__dirname, "./", "dist", "index.html")
//       )
//   );
// } else {
//   app.get("/", (req, res) => res.send("Please set to production"));
// }

// Handle 404 errors
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

export default app;