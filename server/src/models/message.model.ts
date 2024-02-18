import mongoose, { Schema, Document } from "mongoose"

interface MessageInterface extends Document {
    sender: String,
    chat: String,
    content: String,
    viewOnce: Boolean,
    reacts: { content: string, user: string }[],
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

export const Message = mongoose.model<MessageInterface>("message", messageSchema)