import mongoose, {Schema} from "mongoose"

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
    likesCount: Number,
    commentsCount: Number,
}, {
    timestamps: true
})

export const Post = mongoose.model("post", postSchema)