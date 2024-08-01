import mongoose, { Schema, Document, ObjectId } from "mongoose";

interface MessageInterface extends Document {
  sender: ObjectId;
  chat: ObjectId;
  content: string;
  kind?: "message" | "location" | "call" | "media" | "audio" | "document";
  reacts: { content: string; user: ObjectId }[];
  attachments: {
    url: string;
    type: "image" | "video" | "audio" | "document";
  }[];
  readBy: ObjectId[];
}

const messageSchema: Schema<MessageInterface> = new Schema(
  {
    sender: {
      type: Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    chat: {
      type: Schema.Types.ObjectId,
      ref: "chat",
      required: true,
    },
    content: {
      type: String,
      trim: true,
    },
    attachments: [
      {
        url: String,
        type: String,
      },
    ],
    reacts: [
      {
        content: {
          type: String,
          default: "❤️",
          trim: true,
        },
        user: {
          type: Schema.Types.ObjectId,
          ref: "user",
          required: true,
        },
      },
    ],
    readBy: [
      {
        type: Schema.Types.ObjectId,
        ref: "user",
        required: true,
      },
    ],
  },
  {
    timestamps: true,
  }
);

export const Message = mongoose.model<MessageInterface>(
  "message",
  messageSchema
);
