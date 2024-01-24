import mongoose, { Schema } from "mongoose"

const userSchema = new Schema({
    avatar: {
        type: String,
    },
    fullName: {
        type: String,
        required: true,
        trim: true,
    },
    username: {
        type: String,
        required: true,
        trim: true,
        unique: true,
        index: true,
    },
    email: {
        type: String,
        required: true,
        trim: true,
        index: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    bio: {
        type: String,
    },
    followingCount: {
        type: Number,
        default: 0
    },
    followersCount: {
        type: Number,
        default: 0
    },
    posts: [{
        type: Schema.Types.ObjectId,
        ref: "post"
    }],
    chats: [{
        type: Schema.Types.ObjectId,
        ref: "chats"
    }],
    isBlueTick: {
        type: Boolean,
        default: false,
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    accessToken: String,
    refreshToken: String,
},
{
    timestamps: true
})

export const User = mongoose.model("user", userSchema)