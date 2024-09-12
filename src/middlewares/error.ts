import { Request, Response, NextFunction } from "express";

// Define a custom error type that extends the built-in Error type
interface CustomError extends Error {
  statusCode?: number;
  code?: number;
  keyPattern?: { [key: string]: any };
  path?: string;
}

// Define a type for the response object including the optional 'error' property
interface ErrorResponse {
  success: boolean;
  message: string;
  error?: any; // Add the optional error property here
}

// Define the error middleware function
const errorMiddleware = (
  err: CustomError,
  req: Request,
  res: Response,
  next: NextFunction,
): Response => {
  // Default message and status code if not provided
  err.message ||= "Internal Server Error";
  err.statusCode ||= 500;

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
  const response: ErrorResponse = {
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

// export const TryCatch =
//   (passedFunc: RequestHandler): RequestHandler =>
//   async (req: Request, res: Response, next: NextFunction): Promise<void> => {
//     try {
//       // Ensure that we handle both synchronous and asynchronous functions properly
//       await Promise.resolve(passedFunc(req, res, next));
//     } catch (error) {
//       next(error);
//     }
//   };

export const TryCatch = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void> | void,
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
