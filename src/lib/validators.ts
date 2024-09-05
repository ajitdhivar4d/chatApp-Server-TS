import { body, validationResult } from "express-validator";
import { Request, Response, NextFunction } from "express";
import { ErrorHandler } from "../utils/utility.js";

export const validateHandler = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const errors = validationResult(req);

  // If there are no errors, proceed to the next middleware
  if (errors.isEmpty()) {
    return next();
  }

  // Map errors to a single string of error messages
  const errorMessages = errors
    .array()
    .map((error) => error.msg)
    .join(", ");

  // Pass the error to the next middleware or error handler
  next(new ErrorHandler(errorMessages, 400));
};

// Validator function for user registration
export const registerValidator = () => [
  body("name", "Please Enter Name").notEmpty(),
  body("username", "Please Enter Username").notEmpty(),
  body("bio", "Please Enter Bio").notEmpty(),
  body("password", "Please Enter Password").notEmpty(),
];
