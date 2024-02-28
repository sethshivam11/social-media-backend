import mongoose, { Schema, Document } from "mongoose"
import { User, UserInterface } from "./user.model"

interface ChatInterface extends Document {
    users: String[],
    isGroupChat: Boolean,
    admin: String[],
    groupName: String,
    groupIcon: String,
    getParticipantsInfo(participants: string[]): UserInterface
}

const chatSchema = new Schema({
    users: [{
        type: Schema.Types.ObjectId,
        ref: "user"
    }],
    isGroupChat: {
        type: Boolean,
        default: false,
    },
    admin: [{
        type: Schema.Types.ObjectId,
        ref: "user"
    }],
    latestMessage: {
        type: Schema.Types.ObjectId,
        ref: "message"
    },
    groupName: {
        type: String,
        default: "personal"
    },
    groupIcon: {
        type: String,
        default: "https://res.cloudinary.com/dv3qbj0bn/image/upload/v1708097524/sociial/ikuname8uljxeasstnjy.png"
    },
}, {
    timestamps: true
})

chatSchema.pre("save", function (next) {
    if (!this.isGroupChat) {
        this.groupIcon = ""
    }
    next();
})

chatSchema.methods.getParticipantsInfo = (participants: string[]) => {
    return User.findById({ $in: participants }).select("fullName username avatar")
}

export const Chat = mongoose.model<ChatInterface>("chat", chatSchema)