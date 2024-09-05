import express from "express";

// Create an Express application
const app = express();

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
