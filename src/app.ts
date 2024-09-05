import { v2 as cloudinary } from "cloudinary";
import express, { Request, Response } from "express";
import errorMiddleware from "./middlewares/error.js";
import { config as configDotenv } from "dotenv";
import userRoute from "./routes/user.js";
import { connectDB } from "./utils/features.js";

// Load environment variables from the .env file
configDotenv({
  path: "./.env",
});

// Define the port number for the server to listen on
const port: number = 4000;
const mongoURI = process.env.MONGO_URI || "mongodb://localhost";

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

// Middleware to parse JSON request bodies
app.use(express.json());

// Use the user route for all requests starting with "/api/v1/user"
app.use("/api/v1/user", userRoute);

// Define a route handler for the root URL ("/")
// This will respond with "Hello, TypeScript with Node.js!" when accessed
app.get("/", (req: Request, res: Response): void => {
  res.send("Hello, TypeScript with Node.js!");
});

// Middleware to handle errors
app.use(errorMiddleware);

// Start the server and listen for incoming requests on the specified port
app.listen(port, (): void => {
  // Log a message to the console when the server is successfully running
  console.log(`Server is running on http://localhost:${port}`);
});
