import mongoose, { ObjectId, Schema } from "mongoose";

interface AnonymousMessage extends Document {
  reciever: ObjectId;
  content: string;
  attachment: string;
  createdAt: Date;
}

const anonymousMessageSchema: Schema<AnonymousMessage> = new Schema(
  {
    reciever: {
      type: Schema.Types.ObjectId,
      ref: "user",
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    attachment: {
      type: String,
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

export const AnonymousMessage = mongoose.model<AnonymousMessage>(
  "anonymousmessage",
  anonymousMessageSchema
);
