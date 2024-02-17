import mongoose, { Schema, Document } from "mongoose"

interface ChatInterface extends Document {
    users: String[],
    isGroupChat: Boolean,
    admin: String[],
    groupName: String,
    groupIcon: String
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

export const Chat = mongoose.model<ChatInterface>("chat", chatSchema)