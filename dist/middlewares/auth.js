import cookie from "cookie";
import jwt from "jsonwebtoken";
import { CHATAPP_TOKEN } from "../constants/config.js";
import User from "../models/user.js";
import { ErrorHandler } from "../utils/utility.js";
import { TryCatch } from "./error.js";
// Middleware to check if the user is authenticated
export const isAuthenticated = TryCatch(async (req, res, next) => {
    const token = req.cookies[CHATAPP_TOKEN]; // Retrieve token from cookies
    if (!token) {
        return next(new ErrorHandler("Please login to access this route", 401));
    }
    try {
        // Verify the token and extract user data
        const decodedData = jwt.verify(token, process.env.JWT_SECRET || "");
        req.user = decodedData._id; // Assuming `_id` is the user identifier in the token
        next(); // Proceed to the next middleware or route handler
    }
    catch (error) {
        return next(new ErrorHandler("Invalid or expired token, please login again", 401));
    }
});
export const socketAuthenticator = async (socket, next) => {
    try {
        // Parse cookies from the socket request headers
        const cookies = cookie.parse(socket.request.headers.cookie || "");
        // Get the authToken from parsed cookies
        const authToken = cookies[CHATAPP_TOKEN];
        if (!authToken) {
            return next(new ErrorHandler("Please login to access this route", 401));
        }
        // Verify the JWT token
        const decodedData = jwt.verify(authToken, process.env.JWT_SECRET || "");
        // Fetch the user from the database
        const user = await User.findById(decodedData._id);
        if (!user) {
            return next(new ErrorHandler("Please login to access this route", 401));
        }
        // Attach the user to the socket instance
        socket.user = user;
        // Continue to the next middleware or handler
        return next();
    }
    catch (error) {
        console.log(error);
        return next(new ErrorHandler("Please login to access this route", 401));
    }
};
