import { v2 as cloudinary } from "cloudinary";
import { Response } from "express";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { v4 as uuid } from "uuid";
import { getBase64, getSockets } from "../lib/helper.js";
import { IUser } from "../models/user.js";
import { Request } from "express";

// Upload multiple files to Cloudinary
export const uploadFilesToCloudinary = async (
  files: Buffer[] = [],
): Promise<{ public_id: string; url: string }[]> => {
  // Create an array of promises for file uploads
  const uploadPromises = files.map((file) => {
    return new Promise<{ public_id: string; url: string }>(
      (resolve, reject) => {
        cloudinary.uploader.upload(
          getBase64(file),
          {
            resource_type: "auto",
            public_id: uuid(),
          },
          (error, result) => {
            if (error) return reject(error);
            resolve({
              public_id: result?.public_id || "",
              url: result?.secure_url || "",
            });
          },
        );
      },
    );
  });

  try {
    // Wait for all upload promises to resolve
    const results = await Promise.all(uploadPromises);
    return results;
  } catch (err) {
    // Type guard to check if 'err' is an instance of Error
    if (err instanceof Error) {
      throw new Error(`Error uploading files to Cloudinary: ${err.message}`);
    } else {
      // Handle unknown error types
      throw new Error(
        "An unknown error occurred while uploading files to Cloudinary.",
      );
    }
  }
};

// export const deleteFilesFromCloudinary = async (public_ids) => {
//   // Delete files from cloudinary
// };

// Define the interface for the user object

// Define the type for the cookie options if you have specific options
interface CookieOptions {
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: "strict" | "lax" | "none";
  maxAge?: number;
}

// Define the cookie options (example)
export const cookieOptions: CookieOptions = {
  httpOnly: true,
  secure:
    process.env.NODE_ENV === "production" ||
    process.env.NODE_ENV === "development",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  maxAge: 24 * 60 * 60 * 1000, // 1 day
};

// Define the sendToken function with type annotations
export const sendToken = (
  res: Response,
  user: IUser,
  code: number,
  message: string,
): Response => {
  // Check for JWT_SECRET in environment variables
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error("JWT_SECRET is not defined in environment variables");
  }

  // Sign the JWT token
  const token = jwt.sign({ _id: user._id }, jwtSecret);

  // Send the token in the cookie and return the response
  return res.status(code).cookie("chatAppTS2024", token, cookieOptions).json({
    success: true,
    user,
    message,
  });
};

// Define the function to connect to the database
export const connectDB = (uri: string): void => {
  mongoose
    .connect(uri, { dbName: "newChat" })
    .then((data) => {
      console.log(`Connected to DB: ${data.connection.host}`);
    })
    .catch((err: unknown) => {
      // Type guard to ensure 'err' is an instance of Error
      if (err instanceof Error) {
        console.error(`Database connection error: ${err.message}`);
      } else {
        console.error(
          "An unknown error occurred while connecting to the database.",
        );
      }
      process.exit(1); // Exit the process with an error code
    });
};

// Emit event to users
export const emitEvent = (
  req: Request,
  event: string,
  users: string[],
  data?: any,
): boolean => {
  const io = req.app.get("io");
  const usersSocket = getSockets(users);
  console.log("emitEvent", usersSocket);
  console.log("event", event);
  console.log("data", data);
  io.to(usersSocket).emit(event, data);
  return true;
};
