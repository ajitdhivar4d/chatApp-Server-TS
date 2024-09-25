import { v2 as cloudinary } from "cloudinary";
import cookieParser from "cookie-parser";
import cors from "cors";
import { config as configDotenv } from "dotenv";
import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import errorMiddleware from "./middlewares/error.js";
import { connectDB } from "./utils/features.js";
import { corsOptions } from "./constants/config.js";
import adminRoute from "./routes/admin.js";
import chatRoute from "./routes/chat.js";
import userRoute from "./routes/user.js";
import { socketAuthenticator } from "./middlewares/auth.js";
// Load environment variables from the .env file
configDotenv({
    path: "./.env",
});
// Define the port number for the server to listen on
const port = 4000;
const mongoURI = process.env.MONGO_URI || "mongodb://localhost";
export const adminSecretKey = process.env.ADMIN_SECRET_KEY || "adsasdsdfsdfsdfd";
export const userSocketIDs = new Map();
// Connect to the MongoDB database
connectDB(mongoURI);
// Configure Cloudinary with credentials from environment variables
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});
// Create an Express application
const app = express();
//Socket.io Code
const server = createServer(app);
const io = new Server(server, {
    cors: corsOptions,
});
app.set("io", io);
// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(cors(corsOptions));
//
app.use("/api/v1/user", userRoute);
app.use("/api/v1/chat", chatRoute);
app.use("/api/v1/admin", adminRoute);
// Define a route handler for the root URL ("/")
// This will respond with "Hello, TypeScript with Node.js!" when accessed
app.get("/", (req, res) => {
    res.send("Hello, TypeScript with Node.js!");
});
// Apply the authentication middleware
io.use((socket, next) => {
    socketAuthenticator(socket, next);
});
io.on("connection", (socket) => {
    const authSocket = socket;
    console.log("Server - User Connected", authSocket.id);
    const user = authSocket.user;
    userSocketIDs.set(user._id.toString(), authSocket.id);
    authSocket.on("disconnect", () => {
        userSocketIDs.delete(user._id.toString());
        console.log("User Disconnected", authSocket.id);
    });
});
// Middleware to handle errors
app.use(errorMiddleware);
// Start the server and listen for incoming requests on the specified port
server.listen(port, () => {
    // Log a message to the console when the server is successfully running
    console.log(`Server is running on http://localhost:${port}`);
});
