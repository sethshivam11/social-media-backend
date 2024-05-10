import mongoose, { Schema, Document } from "mongoose";
import { User, UserInterface } from "./user.model";
import { DEFAULT_GROUP_ICON } from "../constants";

interface ChatInterface extends Document {
  users: string[];
  isGroupChat: boolean;
  admin: string[];
  groupName: string;
  groupIcon: string;
  lastMessage: string;
  getParticipantsInfo(participants: string[]): UserInterface;
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
      default: "personal",
    },
    groupIcon: {
      type: String,
      default: DEFAULT_GROUP_ICON,
    },
    lastMessage: {
      type: String,
      trim: true,
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

chatSchema.methods.getParticipantsInfo = (participants: string[]) => {
  return User.findById({ $in: participants }).select(
    "fullName username avatar"
  );
};

export const Chat = mongoose.model("chat", chatSchema);
