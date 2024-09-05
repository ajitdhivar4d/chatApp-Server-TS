import express from "express";
import { singleAvatar } from "../middlewares/multer.js";
import { registerValidator, validateHandler } from "../lib/validators.js";
import { newUser } from "../controllers/user.js";

const app = express.Router();

// route - /api/v1/user/new
app.post("/new", singleAvatar, registerValidator(), validateHandler, newUser);

export default app;
