import mongoose, { Schema, Document } from "mongoose"
import { React } from "./react.model"

interface PostInterface extends Document {
    user: String,
    caption: String,
    media: String,
    tags: String[],
    reactsCount: Number,
    commentsCount: Number,
    likePost(liker: string): Promise<PostInterface>
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
    reactsCount: {
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

postSchema.methods.likePost = async function (userId: String) {
    this.reactsCount += 1
    await this.save()
    await React.create({
        user: userId,
        post: this._id
    })
    return this
}

export const Post = mongoose.model<PostInterface>("post", postSchema)