import mongoose, { Schema } from "mongoose";

interface media {
    url: string,
    caption: string,
}

interface StoryInterface {
    user: string,
    media: media[],
    caption: string,
    seenBy: string[],
    tags: string[],
    likes: string[],
    blockedTo: string[],
}

function validateMinLength(array: string[]) {
    return array.length >= 1
}

const storySchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: "user"
    },
    media: {
        type: [
            {
                url: {
                    type: String,
                    required: true,
                },
                caption: {
                    type: String,
                    trim: true,
                },
            }
        ],
        validate: [validateMinLength, "Minimum one file is required"]
    },
    tags: [{
        type: Schema.Types.ObjectId,
        ref: "user"
    }],
    likes: Array,
    blockedTo: Array,
    seenBy: [{
        type: Schema.Types.ObjectId,
        ref: "user"
    }],
}, {
    timestamps: true,
    expireAfterSeconds: 86400
})

export const Story = mongoose.model<StoryInterface>("story", storySchema)
