import mongoose, { Schema, Document, ObjectId } from "mongoose"
import { Post } from "./post.model"

interface CommentInterface extends Document {
    user: String,
    post: String,
    content: String,
    likes: String[],
    likesCount: Number,
    updateCommentsCount(postId: string, count: number): Promise<void>
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


commentSchema.methods.updateCommentsCount = async function (postId: string, count: number) {
    await Post.findByIdAndUpdate(postId, {
        $inc: { commentsCount: count }
    }, { new: true })
    return this
}



export const Comment = mongoose.model<CommentInterface>("comment", commentSchema)