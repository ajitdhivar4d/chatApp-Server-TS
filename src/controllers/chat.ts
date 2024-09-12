import { Types } from "mongoose";
import { getOtherMember } from "../lib/helper.js";
import { TryCatch } from "../middlewares/error.js";
import { Chat } from "../models/chat.js";
import { Message } from "../models/message.js";
import User, { IUser } from "../models/user.js";
import { fileToBuffer } from "../utils/bufferConversion.js";
import { uploadFilesToCloudinary } from "../utils/features.js";
import { ErrorHandler } from "../utils/utility.js";

export const newGroupChat = TryCatch(async (req, res, next) => {
  const { name, members } = req.body;

  const allMembers = [...members, req.user];

  await Chat.create({
    name,
    groupChat: true,
    creator: req.user,
    members: allMembers,
  });

  //   emitEvent(req, ALERT, allMembers, `Welcome to ${name} group`);
  //   emitEvent(req, REFETCH_CHATS, members);

  res.status(201).json({
    success: true,
    message: "Group Created",
  });
});

export const getMyChats = TryCatch(async (req, res, next) => {
  if (!req.user) {
    res.status(400).json({ success: false, message: "User not authenticated" });
    return;
  }

  const userId =
    typeof req.user === "string" ? new Types.ObjectId(req.user) : req.user;

  // Find all chats that the user is a member of and populate the members field
  const chats = await Chat.find({ members: userId }).populate<{
    members: IUser[];
  }>("members", "name avatar");

  const transformedChats = chats.map(({ _id, name, members, groupChat }) => {
    const otherMember = getOtherMember(members, userId);

    return {
      _id,
      groupChat,
      avatar: groupChat
        ? members.slice(0, 3).map((member) => member.avatar?.url) // Ensure optional chaining for avatar
        : [otherMember?.avatar?.url], // Ensure optional chaining for avatar
      name: groupChat ? name : otherMember?.name,
      members: members.reduce((prev: string[], curr: IUser) => {
        if (curr._id.toString() !== req.user?.toString()) {
          prev.push(curr.id);
        }
        return prev;
      }, []),
    };
  });

  res.status(200).json({
    success: true,
    chats: transformedChats,
  });
});

//
export const getMyGroups = TryCatch(async (req, res, next) => {
  if (!req.user) {
    res.status(400).json({ success: false, message: "User not authenticated" });
    return;
  }

  const userId =
    typeof req.user === "string" ? new Types.ObjectId(req.user) : req.user;

  // Find all group chats that the user is a member of and also the creator
  const chats = await Chat.find({
    members: userId,
    groupChat: true,
    creator: userId,
  }).populate<{
    members: IUser[];
  }>("members", "name avatar");

  const groups = chats.map(({ members, _id, groupChat, name }) => ({
    _id,
    groupChat,
    name,
    avatar: members.slice(0, 3).map((member) => member.avatar?.url), // Optional chaining for avatar
  }));

  res.status(200).json({
    success: true,
    groups,
  });
});

//
export const addMembers = TryCatch(async (req, res, next) => {
  const { chatId, members } = req.body;

  if (!req.user) {
    res.status(400).json({ success: false, message: "User not authenticated" });
    return;
  }

  const userId =
    typeof req.user === "string" ? new Types.ObjectId(req.user) : req.user;

  // Find the chat by ID
  const chat = await Chat.findById(chatId);

  if (!chat) return next(new ErrorHandler("Chat not found", 404));

  if (!chat.groupChat)
    return next(new ErrorHandler("This is not a group chat", 400));

  if (!chat.creator) {
    return next(new ErrorHandler("Chat creator not found", 500));
  }

  if (chat.creator.toString() !== userId.toString())
    return next(new ErrorHandler("You are not allowed to add members", 403));
  const allNewMembersPromise = members.map((i: IUser) =>
    User.findById(i, "name"),
  );

  const allNewMembers = await Promise.all(allNewMembersPromise);

  const uniqueMembers = allNewMembers
    .filter((i) => !chat.members.includes(i._id.toString()))
    .map((i) => i._id);

  chat.members.push(...uniqueMembers);

  if (chat.members.length > 100)
    return next(new ErrorHandler("Group members limit reached", 400));

  await chat.save();

  const allUsersName = allNewMembers.map((i) => i.name).join(", ");

  //   emitEvent(
  //     req,
  //     ALERT,
  //     chat.members,
  //     `${allUsersName} has been added in the group`,
  //   );

  //   emitEvent(req, REFETCH_CHATS, chat.members);

  res.status(200).json({
    success: true,
    message: `Members added successfully ${allUsersName}`,
  });
});

//
export const removeMember = TryCatch(async (req, res, next) => {
  const { userId, chatId } = req.body;

  const [chat, userThatWillBeRemoved] = await Promise.all([
    Chat.findById(chatId),
    User.findById(userId, "name"),
  ]);

  console.log(userThatWillBeRemoved);

  if (!chat) return next(new ErrorHandler("Chat not found", 404));

  if (!chat.groupChat)
    return next(new ErrorHandler("This is not a group chat", 400));

  if (!chat.creator) {
    return next(new ErrorHandler("Chat creator not found", 500));
  }

  if (!req.user) {
    res.status(400).json({ success: false, message: "User not authenticated" });
    return;
  }

  if (chat.creator.toString() !== req.user.toString())
    return next(new ErrorHandler("You are not allowed to add members", 403));

  if (chat.members.length <= 3)
    return next(new ErrorHandler("Group must have at least 3 members", 400));

  const allChatMembers = chat.members.map((i) => i.toString());

  console.log(allChatMembers);

  chat.members = chat.members.filter(
    (member) => member.toString() !== userId.toString(),
  );

  await chat.save();

  // emitEvent(req, ALERT, chat.members, {
  //   message: `${userThatWillBeRemoved.name} has been removed from the group`,
  //   chatId,
  // });

  // emitEvent(req, REFETCH_CHATS, allChatMembers);

  res.status(200).json({
    success: true,
    message: "Member removed successfully",
  });
});

//
export const leaveGroup = TryCatch(async (req, res, next) => {
  const chatId = req.params.id;

  const chat = await Chat.findById(chatId);

  if (!chat) return next(new ErrorHandler("Chat not found", 404));

  if (!chat.groupChat)
    return next(new ErrorHandler("This is not a group chat", 400));

  if (!chat.creator) {
    return next(new ErrorHandler("Chat creator not found", 500));
  }

  if (!req.user) {
    res.status(400).json({ success: false, message: "User not authenticated" });
    return;
  }

  const userId =
    typeof req.user === "string" ? new Types.ObjectId(req.user) : req.user;

  const remainingMembers = chat.members.filter(
    (member) => member.toString() !== userId.toString(),
  );

  if (remainingMembers.length < 3)
    return next(new ErrorHandler("Group must have at least 3 members", 400));

  if (chat.creator.toString() === userId.toString()) {
    const randomElement = Math.floor(Math.random() * remainingMembers.length);
    const newCreator = remainingMembers[randomElement];
    chat.creator = newCreator;
  }

  chat.members = remainingMembers;

  const [user] = await Promise.all([
    User.findById(userId, "name"),
    chat.save(),
  ]);

  console.log(user);

  // emitEvent(req, ALERT, chat.members, {
  //   chatId,
  //   message: `User ${user.name} has left the group`,
  // });

  res.status(200).json({
    success: true,
    message: "Leave Group Successfully",
  });
});

//
export const sendAttachments = TryCatch(async (req, res, next) => {
  const { chatId } = req.body;

  const files = req.files || [];

  const fileLength = Number(files.length);

  if (fileLength < 1)
    return next(new ErrorHandler("Please Upload Attachments", 400));

  if (fileLength > 5)
    return next(new ErrorHandler("Files Can't be more than 5", 400));

  const [chat, me] = await Promise.all([
    Chat.findById(chatId),
    User.findById(req.user, "name"),
  ]);

  if (!chat) return next(new ErrorHandler("Chat not found", 404));

  // Convert files to buffers
  const bufferFiles = await Promise.all(
    (files as Express.Multer.File[]).map(
      async (file) => await fileToBuffer(file),
    ),
  );

  // Upload files to Cloudinary
  const attachments = await uploadFilesToCloudinary(bufferFiles);

  if (!me) return next(new ErrorHandler("User not found", 404));

  const messageForDB = {
    content: "",
    attachments,
    sender: me._id,
    chat: chatId,
  };

  const messageForRealTime = {
    ...messageForDB,
    sender: {
      _id: me._id,
      name: me.name,
    },
  };

  console.log(messageForRealTime);

  const message = await Message.create(messageForDB);

  // emitEvent(req, NEW_MESSAGE, chat.members, {
  //   message: messageForRealTime,
  //   chatId,
  // });

  // emitEvent(req, NEW_MESSAGE_ALERT, chat.members, { chatId });

  res.status(200).json({
    success: true,
    message,
  });
});

//
export const getMessages = TryCatch(async (req, res, next) => {
  const chatId = req.params.id;
  const page = parseInt(req.query.page as string, 10) || 1; // Default to page 1 if not provided

  if (page < 1) {
    return next(new ErrorHandler("Page number must be greater than 0", 400));
  }

  const resultPerPage = 20;
  const skip = (page - 1) * resultPerPage;

  // Validate chatId and req.user
  if (!Types.ObjectId.isValid(chatId)) {
    return next(new ErrorHandler("Invalid chat ID", 400));
  }

  const chat = await Chat.findById(chatId);

  if (!chat) return next(new ErrorHandler("Chat not found", 404));

  if (!req.user) {
    return next(new ErrorHandler("User not authenticated", 401));
  }

  // Ensure req.user is an ObjectId and check if the user is in the chat members
  const userId = req.user as unknown as Types.ObjectId; // Type assertion to ObjectId
  if (!chat.members.includes(userId)) {
    return next(
      new ErrorHandler("You are not allowed to access this chat", 403),
    );
  }

  // Fetch messages and count total messages
  const [messages, totalMessagesCount] = await Promise.all([
    Message.find({ chat: chatId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(resultPerPage)
      .populate("sender", "name")
      .lean(), // `.lean()` for better performance when only reading data
    Message.countDocuments({ chat: chatId }),
  ]);

  const totalPages = Math.ceil(totalMessagesCount / resultPerPage) || 0;

  res.status(200).json({
    success: true,
    messages: messages.reverse(),
    totalPages,
  });
});

//
export const getChatDetails = TryCatch(async (req, res, next) => {
  const chatId = req.params.id;
  const populate = req.query.populate === "true";

  // Validate chatId
  if (!Types.ObjectId.isValid(chatId)) {
    return next(new ErrorHandler("Invalid chat ID", 400));
  }

  // Fetch chat and handle population
  let chat;

  if (populate) {
    chat = await Chat.findById(chatId)
      .populate<{ members: IUser[] }>("members", "name avatar")
      .lean();

    if (!chat) return next(new ErrorHandler("Chat not found", 404));

    // Transform members array if populated
    const transformedMembers = chat.members.map(({ _id, name, avatar }) => ({
      _id,
      name,
      avatar: avatar?.url || "", // Ensure avatar is a string, default to empty string
    }));

    res.status(200).json({
      success: true,
      chat: { ...chat, members: transformedMembers },
    });
  } else {
    chat = await Chat.findById(chatId).lean();

    if (!chat) return next(new ErrorHandler("Chat not found", 404));

    res.status(200).json({
      success: true,
      chat,
    });
  }
});

//
export const renameGroup = TryCatch(async (req, res, next) => {
  const chatId = req.params.id;
  const { name } = req.body;

  // Validate chatId
  if (!Types.ObjectId.isValid(chatId)) {
    return next(new ErrorHandler("Invalid chat ID", 400));
  }

  // Validate name
  if (!name || typeof name !== "string" || name.trim() === "") {
    return next(new ErrorHandler("Invalid group name", 400));
  }

  // Fetch chat
  const chat = await Chat.findById(chatId);

  if (!chat) return next(new ErrorHandler("Chat not found", 404));

  if (!chat.groupChat)
    return next(new ErrorHandler("This is not a group chat", 400));

  // Check if chat.creator exists and is valid
  if (!chat.creator) {
    return next(new ErrorHandler("Chat creator not found", 500));
  }

  // Validate authenticated user
  if (!req.user) {
    res.status(400).json({ success: false, message: "User not authenticated" });
    return;
  }

  // Check if the authenticated user is the chat creator
  if (chat.creator.toString() !== req.user.toString())
    return next(
      new ErrorHandler("You are not allowed to rename the group", 403),
    );

  // Rename group
  chat.name = name;

  // Save chat
  await chat.save();

  // emitEvent(req, REFETCH_CHATS, chat.members);

  res.status(200).json({
    success: true,
    message: "Group renamed successfully",
  });
});

//
export const deleteChat = TryCatch(async (req, res, next) => {
  const chatId = req.params.id;

  // Validate chatId
  if (!Types.ObjectId.isValid(chatId)) {
    return next(new ErrorHandler("Invalid chat ID", 400));
  }

  const chat = await Chat.findById(chatId);

  if (!chat) return next(new ErrorHandler("Chat not found", 404));

  const members = chat.members;
  console.log(members);

  // Validate authenticated user
  if (!req.user) {
    res.status(400).json({ success: false, message: "User not authenticated" });
    return;
  }

  if (chat.groupChat && chat.creator?.toString() !== req.user.toString())
    return next(
      new ErrorHandler("You are not allowed to delete the group", 403),
    );

  const userId = req.user as unknown as Types.ObjectId; // Type assertion to ObjectId

  if (!chat.groupChat && !chat.members.includes(userId)) {
    return next(
      new ErrorHandler("You are not allowed to delete the chat", 403),
    );
  }

  //   Here we have to delete All Messages as well as attachments or files from cloudinary

  // const messagesWithAttachments = await Message.find({
  //   chat: chatId,
  //   attachments: { $exists: true, $ne: [] },
  // });

  // const public_ids = [];

  // messagesWithAttachments.forEach(({ attachments }) =>
  //   attachments.forEach(({ public_id }) => public_ids.push(public_id)),
  // );

  await Promise.all([
    // deleteFilesFromCloudinary(public_ids),
    chat.deleteOne(),
    Message.deleteMany({ chat: chatId }),
  ]);

  // emitEvent(req, REFETCH_CHATS, members);

  res.status(200).json({
    success: true,
    message: "Chat deleted successfully",
  });
});
