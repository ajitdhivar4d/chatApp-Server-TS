import express from "express";
import { isAuthenticated } from "../middlewares/auth.js";
import { addMemberValidator, chatIdValidator, newGroupValidator, removeMemberValidator, renameValidator, sendAttachmentsValidator, validateHandler, } from "../lib/validators.js";
import { addMembers, deleteChat, getChatDetails, getMessages, getMyChats, getMyGroups, leaveGroup, newGroupChat, removeMember, renameGroup, sendAttachments, } from "../controllers/chat.js";
import { attachmentsMulter } from "../middlewares/multer.js";
const app = express.Router();
// After here user must be logged in to access the routes
app.use(isAuthenticated);
//route - /api/v1/chat/new
app.post("/new", newGroupValidator(), validateHandler, newGroupChat);
//route - /api/v1/chat/my
app.get("/my", getMyChats);
//route - /api/v1/chat/my/groups
app.get("/my/groups", getMyGroups);
//route - /api/v1/chat/addmembers
app.put("/addmembers", addMemberValidator(), validateHandler, addMembers);
//route - /api/v1/chat/removemember
app.put("/removemember", removeMemberValidator(), validateHandler, removeMember);
//route - /api/v1/chat/leave/:id
app.delete("/leave/:id", chatIdValidator(), validateHandler, leaveGroup);
//route - /api/v1/chat/message
app.post("/message", attachmentsMulter, sendAttachmentsValidator(), validateHandler, sendAttachments);
//route - /api/v1/chat/message/:id
app.get("/message/:id", chatIdValidator(), validateHandler, getMessages);
//route - /api/v1/chat/:id
app
    .route("/:id")
    .get(chatIdValidator(), validateHandler, getChatDetails)
    .put(renameValidator(), validateHandler, renameGroup)
    .delete(chatIdValidator(), validateHandler, deleteChat);
export default app;
