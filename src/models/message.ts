import mongoose, { Document, Schema, model, Types } from "mongoose";
import { IUser } from "./user.js";
import { IChat } from "./chat.js";

// Define the Attachment interface
interface IAttachment extends Document {
  public_id: string;
  url: string;
}

// Define the Message interface
interface IMessage extends Document {
  content: string;
  attachments: IAttachment[];
  sender: Types.ObjectId | IUser;
  chat: Types.ObjectId | IChat;
}

// Create a Mongoose schema for the Attachment sub-schema
const attachmentSchema = new Schema<IAttachment>({
  public_id: {
    type: String,
    required: [true, "Public ID is required"], // Custom error message
  },
  url: {
    type: String,
    required: [true, "URL is required"], // Custom error message
  },
});

// Create a Mongoose schema for the Message model
const messageSchema = new Schema<IMessage>(
  {
    content: String,
    attachments: {
      type: [attachmentSchema], // Use the Attachment schema as a sub-schema
      validate: {
        validator: function (v: IAttachment[]) {
          // Validate that there are attachments if required
          // Example validation: Ensure there is at least one attachment
          return v.length > 0;
        },
        message: "At least one attachment is required", // Custom error message
      },
    },
    sender: {
      type: Types.ObjectId,
      ref: "User",
      required: [true, "Sender is required"], // Custom error message
    },
    chat: {
      type: Types.ObjectId,
      ref: "Chat",
      required: [true, "Chat is required"], // Custom error message
    },
  },
  {
    timestamps: true,
  },
);

// Create or get the Message model
export const Message =
  mongoose.models.Message || model<IMessage>("Message", messageSchema);
