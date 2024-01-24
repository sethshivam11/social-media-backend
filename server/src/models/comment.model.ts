import mongoose, {Schema} from "mongoose"

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
    likes: {
        type: Schema.Types.ObjectId,
    },
    likesCount: {
        type: Number,
        default: 0
    },
},{
    timestamps: true,
})

export const Comment = mongoose.model("comment", commentSchema)