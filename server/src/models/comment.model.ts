import mongoose, { Schema, Document, ObjectId } from "mongoose"
import { Post } from "./post.model"

interface CommentInterface extends Document {
    user: String,
    post: String,
    content: String,
    likes: String[],
    likesCount: Number,
    like(liker: String): String | Promise<CommentInterface>,
    dislike(disliker: String): String | Promise<CommentInterface>,
    updateCommentsCount(postId: string): Promise<void>
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


commentSchema.methods.updateCommentsCount = async function (postId: string) {
    await Post.findByIdAndUpdate(postId, {
        $inc: { commentsCount: 1 }
    }, { new: true })
    return this
}

commentSchema.methods.like = async function (liker: String) {
    if (this.likes.includes(liker)) {
        return "You have already liked this comment"
    }

    this.likesCount += 1
    this.likes = [...this.likes, liker]
    await this.save()

    return this
}

commentSchema.methods.dislike = async function (disliker: String) {
    if (!this.likes.includes(disliker) || this.likesCount === 0) {
        return "You have already disliked this comment"
    }

    await this.updateOne({ $pull: { likes: disliker }, $inc: { likesCount: -1 } }, { new: true })

    return this
}



export const Comment = mongoose.model<CommentInterface>("comment", commentSchema)