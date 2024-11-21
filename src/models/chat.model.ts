import mongoose, { Schema, Document, ObjectId } from "mongoose";
import { User } from "./user.model";
import { DEFAULT_GROUP_ICON } from "../utils/constants";

interface ChatInterface extends Document {
  users: ObjectId[];
  isGroupChat: boolean;
  admin: ObjectId[];
  groupName: string;
  groupIcon: string;
  description: string;
  lastMessage: ObjectId | null;
  getParticipantsInfo(participants: string[]): {
    _id: ObjectId;
    username: string;
    fullName: string;
    avatar: string;
  };
}

const chatSchema: Schema<ChatInterface> = new Schema(
  {
    users: [
      {
        type: Schema.Types.ObjectId,
        ref: "user",
      },
    ],
    isGroupChat: {
      type: Boolean,
      default: false,
    },
    admin: [
      {
        type: Schema.Types.ObjectId,
        ref: "user",
      },
    ],
    groupName: {
      type: String,
      trim: true,
    },
    groupIcon: {
      type: String,
      default: DEFAULT_GROUP_ICON,
    },
    description: String,
    lastMessage: {
      type: Schema.Types.ObjectId,
      ref: "message",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

chatSchema.pre("save", function (next) {
  if (!this.isGroupChat) {
    this.groupIcon = "";
  }
  next();
});

chatSchema.methods.getParticipantsInfo = (
  participants: string[] | ObjectId[]
) => {
  return Promise.all(
    participants.map((participant) =>
      User.findById(participant, "avatar username fullName")
    )
  );
};

export const Chat = mongoose.model<ChatInterface>("chat", chatSchema);
