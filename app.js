import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import compression from "compression";
import rateLimit from "express-rate-limit";
import morgan from "morgan";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";


// Get current directory name (ES module equivalent of __dirname)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

// Security middlewares - Modified to allow CSS and JS
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" }
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

// Serve static files from the React build directory with explicit MIME types
if (isProd) {
  // Assume the React app is built and located in the 'frontend/dist' directory
  // Change this path if your build output is in a different location
  const buildPath = path.resolve(__dirname, './dist');
  
  // Custom middleware to set the correct MIME types
  app.use((req, res, next) => {
    // Skip for API routes
    if (req.path.startsWith('/api/')) {
      return next();
    }
    
    const filePath = path.join(buildPath, req.path);
    
    // Skip for files that don't exist or directories
    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      return next();
    }
    
    // Set appropriate MIME types based on file extension
    if (req.path.endsWith('.css')) {
      res.set('Content-Type', 'text/css');
    } else if (req.path.endsWith('.js')) {
      // For JavaScript module scripts
      res.set('Content-Type', 'application/javascript');
    } else if (req.path.endsWith('.mjs')) {
      // Explicit ES modules
      res.set('Content-Type', 'application/javascript');
    } else if (req.path.endsWith('.svg')) {
      res.set('Content-Type', 'image/svg+xml');
    } else if (req.path.endsWith('.json')) {
      res.set('Content-Type', 'application/json');
    }
    
    // Continue to static file serving
    next();
  });
  
  // Serve static files
  app.use(express.static(buildPath));
  
  // Direct access to assets (for debugging purposes)
  app.get('/assets/*', (req, res, next) => {
    const filePath = path.join(buildPath, req.path);
    if (fs.existsSync(filePath)) {
      if (req.path.endsWith('.css')) {
        res.set('Content-Type', 'text/css');
      } else if (req.path.endsWith('.js')) {
        res.set('Content-Type', 'application/javascript');
      }
      res.sendFile(filePath);
    } else {
      next();
    }
  });

  // Handle direct requests to specific files with proper MIME types
  app.get('*.js', (req, res, next) => {
    const filePath = path.join(buildPath, req.path);
    if (fs.existsSync(filePath)) {
      res.set('Content-Type', 'application/javascript');
      res.sendFile(filePath);
    } else {
      next();
    }
  });
  
  app.get('*.css', (req, res, next) => {
    const filePath = path.join(buildPath, req.path);
    if (fs.existsSync(filePath)) {
      res.set('Content-Type', 'text/css');
      res.sendFile(filePath);
    } else {
      next();
    }
  });

  // All other GET requests not handled before will return the React app
  app.get('*', (req, res) => {
    // Skip API routes
    if (req.path.startsWith('/api/')) {
      return notFoundHandler(req, res);
    }
    
    res.sendFile(path.resolve(buildPath, 'index.html'));
  });
} else {
  // In development, let the React dev server handle the frontend
  // and let the notFoundHandler handle 404s for the API
  app.use(notFoundHandler);
}

// Global error handler
app.use(errorHandler);

export default app;