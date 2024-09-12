import express from "express";
import {
  acceptRequestValidator,
  loginValidator,
  registerValidator,
  sendRequestValidator,
  validateHandler,
} from "../lib/validators.js";
import {
  acceptFriendRequest,
  getMyFriends,
  getMyNotifications,
  getMyProfile,
  login,
  logout,
  newUser,
  searchUser,
  sendFriendRequest,
} from "../controllers/user.js";
import { isAuthenticated } from "../middlewares/auth.js";
import { singleAvatar } from "../middlewares/multer.js";

const app = express.Router();

// route - /api/v1/user/new
app.post("/new", singleAvatar, registerValidator(), validateHandler, newUser);

// route - /api/v1/user/login
app.post("/login", loginValidator(), validateHandler, login);

// After here user must be logged in to access the routes

app.use(isAuthenticated);

// route - /api/v1/user/me
app.get("/me", getMyProfile);

// route - /api/v1/user/logout
app.get("/logout", logout);

// route - /api/v1/user/search
app.get("/search", searchUser);

// route - /api/v1/user/sendrequest
app.put(
  "/sendrequest",
  sendRequestValidator(),
  validateHandler,
  sendFriendRequest,
);

// route - /api/v1/user/acceptrequest
app.put(
  "/acceptrequest",
  acceptRequestValidator(),
  validateHandler,
  acceptFriendRequest,
);

// route - /api/v1/user/notifications
app.get("/notifications", getMyNotifications);

// route - /api/v1/user/friends
app.get("/friends", getMyFriends);

export default app;
