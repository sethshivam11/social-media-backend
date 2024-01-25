import mongoose, { Schema, Document } from "mongoose"

interface ReactionInterface extends Document {
    content: String
    user: String
}

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

export const Reactions = mongoose.model<ReactionInterface>("reaction", reactionSchema)