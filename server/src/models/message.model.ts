import mongoose, { Schema, Document } from "mongoose"
import { Chat } from "./chat.model"

interface MessageInterface extends Document {
    sender: String,
    chat: String,
    content: String,
    viewOnce: Boolean,
    reacts: { content: string, user: string }[],
    attachments: string[]
}

const messageSchema = new Schema({
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
        required: true,
    },
    attachments:
        [{
            url: String,
        }],
    reacts: Array,
    readBy: [{
        type: Schema.Types.ObjectId,
        ref: "user",
    }]
}, {
    timestamps: true,
})

messageSchema.pre("save", async function (next) {
    const chat = await Chat.findById(this.chat)
    if (!chat) {
        return
    }
    if (this.content) {
        chat.lastMessage = this.content
    }
    else {
        chat.lastMessage = "Attachment"
    }
    await chat.save()
})

export const Message = mongoose.model<MessageInterface>("message", messageSchema)