import jwt from "jsonwebtoken";
import { adminSecretKey } from "../app.js";
import { CHATAPP_ADMIN_TOKEN } from "../constants/config.js";
import { TryCatch } from "../middlewares/error.js";
import { Chat } from "../models/chat.js";
import { Message } from "../models/message.js";
import User from "../models/user.js";
import { cookieOptions } from "../utils/features.js";
import { ErrorHandler } from "../utils/utility.js";
/**
 * @description Handles admin login by validating the secret key and issuing a JWT token.
 */
export const adminLogin = TryCatch(async (req, res, next) => {
    const { secretKey } = req.body;
    // Validate secret key
    if (secretKey !== adminSecretKey) {
        return next(new ErrorHandler("Invalid Admin Key", 401));
    }
    // Generate JWT token
    const token = jwt.sign(secretKey, process.env.JWT_SECRET || "");
    // Send response with a cookie containing the token
    res
        .status(200)
        .cookie(CHATAPP_ADMIN_TOKEN, token, {
        ...cookieOptions,
        maxAge: 1000 * 60 * 15, // Token expiration time (15 minutes)
    })
        .json({
        success: true,
        message: "Authenticated Successfully, Welcome BOSS",
    });
});
/**
 * @description Handles admin logout by clearing the admin token cookie.
 */
export const adminLogout = TryCatch(async (req, res, next) => {
    res
        .status(200)
        .cookie(CHATAPP_ADMIN_TOKEN, "", {
        ...cookieOptions,
        maxAge: 0, // Clear the cookie
    })
        .json({
        success: true,
        message: "Logged Out Successfully",
    });
});
/**
 * @description Middleware to ensure that only admin users can access certain routes.
 */
export const adminOnly = (req, res, next) => {
    const token = req.cookies[CHATAPP_ADMIN_TOKEN];
    // Check for token presence
    if (!token) {
        return next(new ErrorHandler("Only Admin can access this route", 401));
    }
    try {
        // Verify token and check secret key
        const secretKey = jwt.verify(token, process.env.JWT_SECRET || "");
        if (secretKey !== adminSecretKey) {
            return next(new ErrorHandler("Only Admin can access this route", 401));
        }
        next(); // Proceed if validation passes
    }
    catch (error) {
        next(new ErrorHandler("Invalid token", 401));
    }
};
/**
 * @description Returns admin-specific data.
 */
export const getAdminData = (req, res, next) => {
    res.status(200).json({
        admin: true,
    });
};
/**
 * @description Retrieves all users and their statistics (group and friend counts).
 */
export const allUsers = TryCatch(async (req, res, next) => {
    // Fetch all users
    const users = await User.find({});
    // Transform user data
    const transformedUsers = await Promise.all(users.map(async ({ name, username, avatar, _id }) => {
        const [groups, friends] = await Promise.all([
            Chat.countDocuments({ groupChat: true, members: _id }),
            Chat.countDocuments({ groupChat: false, members: _id }),
        ]);
        return {
            name,
            username,
            avatar: avatar.url,
            _id,
            groups,
            friends,
        };
    }));
    res.status(200).json({
        status: "success",
        users: transformedUsers,
    });
});
/**
 * @description Retrieves all chats and their details.
 */
export const allChats = TryCatch(async (req, res) => {
    // Fetch all chats with populated members and creator
    const chats = await Chat.find({})
        .populate("members", "name avatar")
        .populate("creator", "name avatar");
    // Transform chat data
    const transformedChats = await Promise.all(chats.map(async ({ members, _id, groupChat, name, creator }) => {
        const totalMessages = await Message.countDocuments({ chat: _id });
        return {
            _id,
            groupChat,
            name,
            avatar: members.slice(0, 3).map((member) => member.avatar.url),
            members: members.map(({ _id, name, avatar }) => ({
                _id,
                name,
                avatar: avatar.url,
            })),
            creator: {
                name: creator?.name || "None",
                avatar: creator?.avatar.url || "",
            },
            totalMembers: members.length,
            totalMessages,
        };
    }));
    res.status(200).json({
        status: "success",
        chats: transformedChats,
    });
});
/**
 * @description Retrieves all messages and their details.
 */
export const allMessages = TryCatch(async (req, res, next) => {
    // Fetch all messages with populated sender and chat
    const messages = await Message.find({})
        .populate("sender", "name avatar")
        .populate("chat", "groupChat");
    // Transform message data
    const transformedMessages = messages.map(({ content, attachments, _id, sender, createdAt, chat }) => ({
        _id,
        attachments,
        content,
        createdAt,
        chat: chat._id,
        groupChat: chat.groupChat,
        sender: {
            _id: sender._id,
            name: sender.name,
            avatar: sender.avatar.url,
        },
    }));
    res.status(200).json({
        success: true,
        messages: transformedMessages,
    });
});
/**
 * @description Retrieves dashboard statistics including message counts over the last 7 days.
 */
export const getDashboardStats = TryCatch(async (req, res) => {
    // Fetch counts for groups, users, messages, and total chats
    const [groupsCount, usersCount, messagesCount, totalChatsCount] = await Promise.all([
        Chat.countDocuments({ groupChat: true }),
        User.countDocuments(),
        Message.countDocuments(),
        Chat.countDocuments(),
    ]);
    const today = new Date();
    const last7Days = new Date();
    last7Days.setDate(last7Days.getDate() - 7);
    // Fetch messages created in the last 7 days
    const last7DaysMessages = await Message.find({
        createdAt: {
            $gte: last7Days,
            $lte: today,
        },
    }).select("createdAt");
    // Prepare a chart of message counts for the last 7 days
    const messages = new Array(7).fill(0);
    const dayInMilliseconds = 1000 * 60 * 60 * 24;
    last7DaysMessages.forEach((message) => {
        const indexApprox = (today.getTime() - message.createdAt.getTime()) / dayInMilliseconds;
        const index = Math.floor(indexApprox);
        messages[6 - index]++;
    });
    // Return statistics
    const stats = {
        groupsCount,
        usersCount,
        messagesCount,
        totalChatsCount,
        messagesChart: messages,
    };
    res.status(200).json({
        success: true,
        stats,
    });
});
