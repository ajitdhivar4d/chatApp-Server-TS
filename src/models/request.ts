import mongoose, { Document, Model, Schema, Types, model } from "mongoose";
import { IUser } from "./user.js";

// Define a TypeScript interface for the Request document
interface IRequest extends Document {
  status: "pending" | "accepted" | "rejected";
  sender: Types.ObjectId | IUser; // Adjusted for population
  receiver: Types.ObjectId | IUser; // Adjusted for population
  createdAt: Date;
  updatedAt: Date;
}

// Define the Mongoose schema for the Request model
const RequestSchema = new Schema<IRequest>(
  {
    status: {
      type: String,
      default: "pending",
      enum: ["pending", "accepted", "rejected"], // Status can only be one of these values
      required: [true, "Status is required"], // Add custom validation message
    },
    sender: {
      type: Types.ObjectId, //
      ref: "User",
      required: [true, "Sender is required"], // Add custom validation message
      index: true, // Index to improve query performance
    },
    receiver: {
      type: Types.ObjectId, //
      ref: "User",
      required: [true, "Receiver is required"], // Add custom validation message
      index: true, // Index to improve query performance
    },
  },
  {
    timestamps: true, // Automatically adds `createdAt` and `updatedAt` fields
  },
);

// Ensure that each pair of sender and receiver is unique
RequestSchema.index({ sender: 1, receiver: 1 }, { unique: true });

// Create or reuse the Request model
export const RequestModel: Model<IRequest> =
  mongoose.models.Request || model<IRequest>("Request", RequestSchema);
