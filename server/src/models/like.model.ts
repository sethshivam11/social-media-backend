import mongoose, { Schema, Document } from "mongoose"

interface LikeInterface extends Document {
    content: String
    user: String
}

const likeSchema = new Schema({
    content: {
        type: String,
        default: "❤️"
    },
    user: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: "user"
    },
    post: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: "post"
    }
}, {
    timestamps: true,
})

export const Like = mongoose.model<LikeInterface>("like", likeSchema)