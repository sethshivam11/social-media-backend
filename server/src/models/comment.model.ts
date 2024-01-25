import mongoose, { Schema, Document } from "mongoose"

interface CommentInterface extends Document {
    user: String,
    post: String,
    content: String,
    likes: String[],
    likesCount: Number
}

const commentSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        required: true,
    },
    post: {
        type: Schema.Types.ObjectId,
        required: true,
    },
    content: {
        type: String,
        required: true,
    },
    likes: [{
        type: Schema.Types.ObjectId,
        ref: "user"
    }],
    likesCount: {
        type: Number,
        default: 0
    },
}, {
    timestamps: true,
})

export const Comment = mongoose.model<CommentInterface>("comment", commentSchema)