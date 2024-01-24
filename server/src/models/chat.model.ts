import mongoose, { Schema } from "mongoose"

const chatSchema = new Schema({
    users: [{
        type: Schema.Types.ObjectId,
        ref: "user"
    }],
    isGroupChat: {
        type: Boolean,
        default: false,
    },
    admin: {
        type: Schema.Types.ObjectId,
        ref: "user"
    },
    groupName: {
        type: String,
        default: "personal"
    },
    groupIcon: {
        type: String,
    }
}, {
    timestamps: true
})

export const Chat = mongoose.model("chat", chatSchema)