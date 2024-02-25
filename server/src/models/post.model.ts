import mongoose, { Schema, Document } from "mongoose"
import { Like } from "./like.model"
import { User } from "./user.model"

interface PostInterface extends Document {
    user: String,
    caption: String,
    media: String,
    tags: String[],
    likesCount: Number,
    commentsCount: Number,
    likePost(liker: string): Promise<PostInterface> | string,
    dislikePost(disliker: string): Promise<PostInterface> | string,
    post(): Promise<PostInterface>,
    updatePostCount(): Promise<PostInterface>,
}

const postSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        required: true,
    },
    caption: {
        type: String,
    },
    media: {
        type: String,
        required: true
    },
    tags: [{
        type: Schema.Types.ObjectId,
        ref: "user"
    }],
    likesCount: {
        type: Number,
        default: 0
    },
    commentsCount: {
        type: Number,
        default: 0
    },
}, {
    timestamps: true
})

postSchema.methods.updatePostCount = async function () {
    await User.findByIdAndUpdate(
        this.user,
        {
            $inc: { postsCount: 1 }
        },
        { new: true })
    return this
}

postSchema.methods.likePost = async function (liker: String) {
    const react = await Like.findOne({ user: liker, post: this._id })
    if (react) {
        return "You have already liked this post"
    }

    await Like.create({
        user: liker,
        post: this._id
    })

    this.likesCount += 1
    await this.save()

    return this
}

postSchema.methods.dislikePost = async function (disliker: String) {
    const react = await Like.findOne({ user: disliker, post: this._id })

    if (!react) {
        return "You have already disliked this post"
    }

    if (this.reactsCount > 0) {
        this.reactsCount -= 1
    }

    await this.save()
    await react.deleteOne()

    return this
}




export const Post = mongoose.model<PostInterface>("post", postSchema)