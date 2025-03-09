/**
 * Global error handling middleware
 * Provides consistent error response format across the application
 */
const errorHandler = (err, req, res, next) => {
    // Log error for server-side debugging
    console.error(`[ERROR] ${err.stack || err}`);

    // Get status code from error if it exists, default to 500
    const statusCode = err.statusCode || 500;

    // Prepare error response
    const errorResponse = {
        success: false,
        error: {
            message: err.message || "Internal Server Error",
            ...(process.env.NODE_ENV === "development" && { stack: err.stack })
        }
    };

    // Add validation errors if they exist
    if (err.errors) {
        errorResponse.error.details = err.errors;
    }

    // Send error response
    res.status(statusCode).json(errorResponse);
};

/**
 * Not Found (404) handler middleware
 * Custom middleware to handle undefined routes
 */
const notFoundHandler = (req, res, next) => {
    const error = new Error(`Not Found - ${req.originalUrl}`);
    error.statusCode = 404;
    next(error); // Forward to error handler
};

export {
    errorHandler,
    notFoundHandler
}