// Define the error middleware function
const errorMiddleware = (err, req, res, next) => {
    // Default message and status code if not provided
    err.message || (err.message = "Internal Server Error");
    err.statusCode || (err.statusCode = 500);
    // Handle MongoDB duplicate key errors
    if (err.code === 11000) {
        const error = Object.keys(err.keyPattern || {}).join(",");
        err.message = `Duplicate field - ${error}`;
        err.statusCode = 400;
    }
    // Handle MongoDB cast errors
    if (err.name === "CastError") {
        const errorPath = err.path;
        err.message = `Invalid Format of ${errorPath}`;
        err.statusCode = 400;
    }
    // Prepare the response object
    const response = {
        success: false,
        message: err.message,
    };
    // Include the full error stack in development mode
    if (process.env.NODE_ENV === "DEVELOPMENT") {
        response.error = err; // Add error details to the response object
    }
    // Send the JSON response with the appropriate status code
    return res.status(err.statusCode).json(response);
};
export default errorMiddleware;
export const TryCatch = (passedFunc) => async (req, res, next) => {
    try {
        // Ensure that we handle both synchronous and asynchronous functions properly
        await Promise.resolve(passedFunc(req, res, next));
    }
    catch (error) {
        next(error);
    }
};
