import mongoose, { Schema } from "mongoose"

const reactionSchema = new Schema({
    content: {
        type: String,
    },
    user: {
        type: Schema.Types.ObjectId,
        required: true,
    },
}, {
    timestamps: true,
})

export const Reactions = mongoose.model("reaction", reactionSchema)