import mongoose, { Schema, Document } from "mongoose"

interface PostInterface extends Document {
    user: String,
    caption: String,
    media: String,
    tags: String[],
    likesCount: Number,
    commentsCount: Number
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

export const Post = mongoose.model<PostInterface>("post", postSchema)