import { NextFunction, Request, Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { CHATAPP_TOKEN } from "../constants/config.js";
import { ErrorHandler } from "../utils/utility.js";
import { TryCatch } from "./error.js";

// Middleware to check if the user is authenticated
export const isAuthenticated = TryCatch(
  async (req: Request, res: Response, next: NextFunction) => {
    const token = req.cookies[CHATAPP_TOKEN]; // Retrieve token from cookies

    if (!token) {
      return next(new ErrorHandler("Please login to access this route", 401));
    }

    try {
      // Verify the token and extract user data
      const decodedData = jwt.verify(
        token,
        process.env.JWT_SECRET || "",
      ) as JwtPayload;

      req.user = decodedData._id; // Assuming `_id` is the user identifier in the token

      next(); // Proceed to the next middleware or route handler
    } catch (error) {
      return next(
        new ErrorHandler("Invalid or expired token, please login again", 401),
      );
    }
  },
);
