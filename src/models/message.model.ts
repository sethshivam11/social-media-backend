import mongoose, { Schema, Document, ObjectId } from "mongoose";

interface MessageInterface extends Document {
  sender: ObjectId;
  chat: ObjectId;
  content: string;
  kind?: "message" | "location" | "call" | "media" | "audio" | "document";
  reacts: { content: string; user: ObjectId }[];
  attachment: {
    url: string;
    kind: "image" | "video" | "audio" | "document";
  };
  reply?: {
    username: string;
    content: string;
  };
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
    attachment: {
      url: String,
      kind: String,
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
