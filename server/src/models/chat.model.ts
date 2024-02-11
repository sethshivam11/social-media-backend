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
    groupName: {
        type: String,
        default: "personal"
    },
    groupIcon: String,
}, {
    timestamps: true
})

export const Chat = mongoose.model<ChatInterface>("chat", chatSchema)