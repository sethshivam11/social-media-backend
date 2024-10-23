import mongoose, { Schema, Document, ObjectId } from "mongoose";

interface MessageInterface extends Document {
  sender: ObjectId;
  chat: ObjectId;
  content: string;
  kind?: "message" | "location" | "image" | "video" | "audio" | "document" | "post";
  reacts: { content: string; user: ObjectId }[];
  reply?: {
    username: string;
    content: string;
  };
  post?: ObjectId;
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
    kind: {
      type: String,
      default: "message",
      enum: [
        "message",
        "location",
        "image",
        "video",
        "audio",
        "document",
        "post",
      ],
    },
    reply: {
      username: String,
      content: String,
    },
    post: {
      type: Schema.Types.ObjectId,
      ref: "post",
    },
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
  },
  {
    timestamps: true,
  }
);

export const Message = mongoose.model<MessageInterface>(
  "message",
  messageSchema
);
