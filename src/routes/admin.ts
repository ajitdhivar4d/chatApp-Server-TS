import express from "express";
import {
  adminLogin,
  adminLogout,
  adminOnly,
  allChats,
  allMessages,
  allUsers,
  getAdminData,
  getDashboardStats,
} from "../controllers/admin.js";
import { adminLoginValidator, validateHandler } from "../lib/validators.js";

const app = express.Router();

// route - /api/v1/admin/verify
app.post("/verify", adminLoginValidator(), validateHandler, adminLogin);

// route - /api/v1/admin/logout
app.get("/logout", adminLogout);

// // Only Admin Can Accecss these Routes

app.use(adminOnly);

// route - /api/v1/admin
app.get("/", getAdminData);

// route - /api/v1/admin/users
app.get("/users", allUsers);

// route - /api/v1/admin/chats
app.get("/chats", allChats);

// route - /api/v1/admin/messages
app.get("/messages", allMessages);

app.get("/stats", getDashboardStats);

export default app;
