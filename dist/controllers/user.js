import { compare } from "bcrypt";
import { Types } from "mongoose";
import { CHATAPP_TOKEN } from "../constants/config.js";
import { TryCatch } from "../middlewares/error.js";
import User from "../models/user.js";
import { fileToBuffer } from "../utils/bufferConversion.js";
import { cookieOptions, sendToken, uploadFilesToCloudinary, } from "../utils/features.js";
import { ErrorHandler } from "../utils/utility.js";
import { Chat } from "./../models/chat.js";
import { RequestModel } from "./../models/request.js";
import { getOtherMember } from "../lib/helper.js";
// Create a new user and save it to the database and save token in cookie
export const newUser = TryCatch(async (req, res, next) => {
    const { name, username, password, bio } = req.body;
    const file = req.file;
    if (!file)
        return next(new ErrorHandler("Please Upload Avatar", 400));
    // Convert file to buffer
    const bufferFile = await fileToBuffer(file);
    // Upload file to Cloudinary
    const result = await uploadFilesToCloudinary([bufferFile]);
    const avatar = {
        public_id: result[0].public_id,
        url: result[0].url,
    };
    // Create the user and ensure proper typing
    const userDoc = await User.create({
        name,
        bio,
        username,
        password,
        avatar,
    });
    // Since userDoc is of type Document, we need to assert its type to IUser
    const user = userDoc.toObject();
    sendToken(res, user, 201, "User created");
});
// Login user and save token in a cookie
export const login = TryCatch(async (req, res, next) => {
    const { username, password } = req.body;
    // Find user by username and select password
    const user = await User.findOne({ username }).select("+password");
    if (!user) {
        return next(new ErrorHandler("Invalid Username or Password", 404));
    }
    // Check if the provided password matches the hashed password in the database
    const isMatch = await compare(password, user.password);
    if (!isMatch) {
        return next(new ErrorHandler("Invalid Username or Password", 404));
    }
    // Send token after successful authentication
    sendToken(res, user, 200, `Welcome Back, ${user.name}`);
    console.log("use Login");
});
// Controller to get the authenticated user's profile
export const getMyProfile = TryCatch(async (req, res, next) => {
    // Check if `req.user` is defined
    if (!req.user) {
        return next(new ErrorHandler("User not authenticated", 401));
    }
    // Find the user by ID
    const user = await User.findById(req.user);
    // Handle case where the user is not found
    if (!user) {
        return next(new ErrorHandler("User not found", 404));
    }
    // Return the user profile in the response
    res.status(200).json({
        success: true,
        user,
    });
});
// Logout controller to clear the token cookie and send a response
export const logout = TryCatch(async (req, res, next) => {
    // Clear the token cookie by setting an empty string and maxAge to 0
    res
        .status(200)
        .cookie(CHATAPP_TOKEN, "", {
        ...cookieOptions,
        maxAge: 0, // Immediately expire the cookie
    })
        .json({
        success: true,
        message: "Logged out successfully",
    });
});
//
export const searchUser = TryCatch(async (req, res, next) => {
    const { name = "" } = req.query;
    if (!req.user) {
        return next(new Error("User not authenticated"));
    }
    // Finding All my chats
    const myChats = await Chat.find({ groupChat: false, members: req.user });
    //  extracting All Users from my chats means friends or people I have chatted with
    const allUsersFromMyChats = myChats.flatMap((chat) => chat.members);
    // Finding all users except me and my friends
    const allUsersExceptMeAndFriends = await User.find({
        _id: { $nin: allUsersFromMyChats },
        name: { $regex: name, $options: "i" },
    });
    // Modifying the response
    const users = allUsersExceptMeAndFriends.map(({ _id, name, avatar }) => ({
        _id,
        name,
        avatar: avatar.url,
    }));
    res.status(200).json({
        success: true,
        users,
    });
});
//
export const sendFriendRequest = TryCatch(async (req, res, next) => {
    const { userId } = req.body;
    // Validate userId input
    if (!userId) {
        return next(new ErrorHandler("User ID is required", 400));
    }
    if (!Types.ObjectId.isValid(userId)) {
        return next(new ErrorHandler("Invalid User ID", 400));
    }
    // Check if a request already exists between the users
    const request = await RequestModel.findOne({
        $or: [
            { sender: req.user, receiver: userId },
            { sender: userId, receiver: req.user },
        ],
    });
    if (request)
        return next(new ErrorHandler("Request already sent", 400));
    // Create a new friend request
    await RequestModel.create({
        sender: req.user,
        receiver: userId,
    });
    // Emit an event to notify the receiver of the new friend request
    // emitEvent(req, NEW_REQUEST, [userId]);
    res.status(200).json({
        success: true,
        message: "Friend Request Sent",
    });
});
export const acceptFriendRequest = TryCatch(async (req, res, next) => {
    const { requestId, accept } = req.body;
    // Fetch the request and populate 'sender' and 'receiver' with 'name' and '_id'
    const request = await RequestModel.findById(requestId)
        .populate("sender", "_id name")
        .populate("receiver", "_id name");
    if (!request)
        return next(new ErrorHandler("Request not found", 404));
    // Check if accept is false, meaning reject the friend request
    if (!accept) {
        await request.deleteOne();
        res.status(200).json({
            success: true,
            message: "Friend Request Rejected",
        });
        return;
    }
    // If accepting the friend request
    const members = [
        request.sender._id.toString(),
        request.receiver._id.toString(),
    ];
    await Promise.all([
        Chat.create({
            members,
            name: `${request.sender.name}-${request.receiver.name}`,
        }),
        request.deleteOne(),
    ]);
    //  emitEvent(req, REFETCH_CHATS, members);
    res.status(200).json({
        success: true,
        message: "Friend Request Accepted",
        senderId: request.sender.toString(),
    });
});
export const getMyNotifications = TryCatch(async (req, res, next) => {
    // Fetch requests for the logged-in user (receiver)
    const requests = await RequestModel.find({ receiver: req.user }).populate("sender", "name avatar");
    // Map requests to simplify the response structure
    const allRequests = requests.map(({ _id, sender }) => ({
        _id,
        sender: {
            _id: sender._id,
            name: sender.name,
            avatar: sender.avatar.url, // Access the populated sender's avatar URL
        },
    }));
    res.status(200).json({
        success: true,
        allRequests,
    });
});
export const getMyFriends = async (req, res, next) => {
    const chatId = req.query.chatId;
    // Ensure req.user is defined and convert to ObjectId if it is a string
    if (!req.user) {
        return res.status(400).json({ success: false, message: "User not found" });
    }
    const userId = typeof req.user === "string" ? new Types.ObjectId(req.user) : req.user;
    const chats = await Chat.find({
        members: userId,
        groupChat: false,
    }).populate("members", "name avatar");
    // Use a Set to avoid duplicates
    const uniqueFriends = new Map();
    // Map chats to extract friends information
    chats.forEach(({ members }) => {
        const otherUser = getOtherMember(members, userId);
        // Add the friend to the Map if not already added
        if (!uniqueFriends.has(otherUser._id.toString())) {
            uniqueFriends.set(otherUser._id.toString(), {
                _id: otherUser._id,
                name: otherUser.name,
                avatar: otherUser.avatar.url,
            });
        }
    });
    // Convert unique friends Map to an array
    const friends = Array.from(uniqueFriends.values());
    if (chatId) {
        const chat = await Chat.findById(chatId);
        if (!chat) {
            return res
                .status(404)
                .json({ success: false, message: "Chat not found" });
        }
        const availableFriends = friends.filter((friend) => !chat.members.some((memberId) => memberId.toString() === friend._id.toString()));
        return res.status(200).json({
            success: true,
            friends: availableFriends,
        });
    }
    else {
        return res.status(200).json({
            success: true,
            friends,
        });
    }
};
