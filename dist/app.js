"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
// Create an Express application
const app = (0, express_1.default)();
// Define the port number for the server to listen on
const port = 4000;
// Define a route handler for the root URL ("/")
// This will respond with "Hello, TypeScript with Node.js!" when accessed
app.get("/", (req, res) => {
    res.send("Hello, TypeScript with Node.js!");
});
// Start the server and listen for incoming requests on the specified port
app.listen(port, () => {
    // Log a message to the console when the server is successfully running
    console.log(`Server is running on http://localhost:${port}`);
});
