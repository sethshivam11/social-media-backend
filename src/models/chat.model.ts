import mongoose, { Schema, Document, ObjectId } from "mongoose";
import { User, UserInterface } from "./user.model";
import { DEFAULT_GROUP_ICON } from "../constants";
import { Message } from "./message.model";
import { deleteFromCloudinary } from "../utils/cloudinary";

interface ChatInterface extends Document {
  users: ObjectId[];
  isGroupChat: boolean;
  admin: ObjectId[];
  groupName: string;
  groupIcon: string;
  getParticipantsInfo(participants: string[]): UserInterface;
  deleteMessages(): Promise<void>;
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

chatSchema.methods.deleteMessages = async function () {
  const messages = await Message.find({ chat: this._id });
  if (messages) {
    await Promise.all(
      messages.map((message) => {
        if (message.attachment.url) {
          deleteFromCloudinary(message.attachment.url);
        }
      })
    );
    await Message.deleteMany({ chat: this._id });
  }
};

export const Chat = mongoose.model<ChatInterface>("chat", chatSchema);
