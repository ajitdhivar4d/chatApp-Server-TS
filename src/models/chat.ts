import mongoose, { Document, model, Model, Schema, Types } from "mongoose";

// Define the TypeScript interface for the Chat Document
export interface IChat extends Document {
  _id: string;
  name: string;
  groupChat: boolean;
  creator?: Types.ObjectId;
  members: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

// Define the Mongoose schema for the Chat model
const chatSchema = new Schema<IChat>(
  {
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
  },
  {
    timestamps: true, // Automatically adds `createdAt` and `updatedAt` fields
  },
);

// Create or reuse the Chat model
export const Chat: Model<IChat> =
  mongoose.models.Chat || model<IChat>("Chat", chatSchema);
