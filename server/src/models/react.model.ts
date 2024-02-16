import mongoose, { Schema, Document } from "mongoose"

interface ReactInterface extends Document {
    content: String
    user: String
}

const reactSchema = new Schema({
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

export const React = mongoose.model<ReactInterface>("react", reactSchema)