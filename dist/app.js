import { v2 as cloudinary } from "cloudinary";
import cookieParser from "cookie-parser";
import { config as configDotenv } from "dotenv";
import express from "express";
import errorMiddleware from "./middlewares/error.js";
import { connectDB } from "./utils/features.js";
import userRoute from "./routes/user.js";
import chatRoute from "./routes/chat.js";
import adminRoute from "./routes/admin.js";
// Load environment variables from the .env file
configDotenv({
    path: "./.env",
});
// Define the port number for the server to listen on
const port = 4000;
const mongoURI = process.env.MONGO_URI || "mongodb://localhost";
export const adminSecretKey = process.env.ADMIN_SECRET_KEY || "adsasdsdfsdfsdfd";
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
// Middleware
app.use(express.json());
app.use(cookieParser());
//
app.use("/api/v1/user", userRoute);
app.use("/api/v1/chat", chatRoute);
app.use("/api/v1/admin", adminRoute);
// Define a route handler for the root URL ("/")
// This will respond with "Hello, TypeScript with Node.js!" when accessed
app.get("/", (req, res) => {
    res.send("Hello, TypeScript with Node.js!");
});
// Middleware to handle errors
app.use(errorMiddleware);
// Start the server and listen for incoming requests on the specified port
app.listen(port, () => {
    // Log a message to the console when the server is successfully running
    console.log(`Server is running on http://localhost:${port}`);
});
