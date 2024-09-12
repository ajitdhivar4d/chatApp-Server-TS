import mongoose, { Schema, model, Types } from "mongoose";
// Define the Mongoose schema for the Chat model
const chatSchema = new Schema({
    name: {
        type: String,
        required: [true, "Chat name is required"], // Added custom validation message
        trim: true, // Trim white spaces
    },
    groupChat: {
        type: Boolean,
        default: false,
    },
    creator: {
        type: Types.ObjectId,
        required: [true, "Creator is required"],
        ref: "User",
        index: true, // Index for faster querying
    },
    members: [
        {
            type: Types.ObjectId,
            ref: "User",
            required: true, // Ensure members field is always an array
            index: true, // Index for faster querying
        },
    ],
}, {
    timestamps: true, // Automatically adds `createdAt` and `updatedAt` fields
});
// Create or reuse the Chat model
export const Chat = mongoose.models.Chat || model("Chat", chatSchema);
