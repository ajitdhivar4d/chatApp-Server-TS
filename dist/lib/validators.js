import { body, param, validationResult } from "express-validator";
import { ErrorHandler } from "../utils/utility.js";
export const validateHandler = (req, res, next) => {
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
// Validator function for login
export const loginValidator = () => [
    body("username", "Please Enter Username").notEmpty(),
    body("password", "Please Enter Password").notEmpty(),
];
// Validator function for sending a friend request
export const sendRequestValidator = () => [
    body("userId", "Please Enter User ID").notEmpty(),
];
// Validator function for accepting a friend request
export const acceptRequestValidator = () => [
    body("requestId", "Please Enter Request ID").notEmpty(),
    body("accept")
        .notEmpty()
        .withMessage("Please Add Accept")
        .isBoolean()
        .withMessage("Accept must be a boolean"),
];
// Validator function
export const newGroupValidator = () => [
    body("name", "Please Enter Name").notEmpty(),
    body("members")
        .notEmpty()
        .withMessage("Please Enter Members")
        .isArray({ min: 2, max: 100 })
        .withMessage("Members must be 2-100"),
];
//
export const addMemberValidator = () => [
    body("chatId", "Please Enter Chat ID").notEmpty(),
    body("members")
        .notEmpty()
        .withMessage("Please Enter Members")
        .isArray({ min: 1, max: 97 })
        .withMessage("Members must be 1-97"),
];
//
export const removeMemberValidator = () => [
    body("chatId", "Please Enter Chat ID").notEmpty(),
    body("userId", "Please Enter User ID").notEmpty(),
];
//
export const chatIdValidator = () => [
    param("id", "Please Enter Chat ID").notEmpty(),
];
//
export const sendAttachmentsValidator = () => [
    body("chatId", "Please Enter Chat ID").notEmpty(),
];
//
export const renameValidator = () => [
    param("id", "Please Enter Chat ID").notEmpty(),
    body("name", "Please Enter New Name").notEmpty(),
];
//
export const adminLoginValidator = () => [
    body("secretKey", "Please Enter Secret Key").notEmpty(),
];
