import mongoose, { Schema, Document } from "mongoose"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"

export interface UserInterface extends Document {
    avatar: String
    fullName: String
    username: String,
    email: String
    password: String
    bio: String
    blocked: string[],
    followingCount: Number
    followersCount: Number
    isBlueTick: Boolean
    isMailVerified: Boolean
    refreshToken: String,
    isPasswordCorrect(password: string): boolean,
    generateRefreshToken(): string,
    generateAccessToken(): string,
}


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
    isBlueTick: {
        type: Boolean,
        default: false,
    },
    isMailVerified: {
        type: Boolean,
        default: false
    },
    blocked: [{
        type: Schema.Types.ObjectId,
        ref: "user"
    }],
    refreshToken: String,
},
    {
        timestamps: true
    })


userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next()
    this.password = await bcrypt.hash(this.password, 10)
})

userSchema.methods.isPasswordCorrect = async function (password: string) {
    return await bcrypt.compare(password, this.password)
}

userSchema.methods.generateAccessToken = async function () {
    return await jwt.sign({
        _id: this._id,
        fullName: this.fullName,
        email: this.email,
        username: this.username
    },
        process.env.ACCESS_TOKEN_SECRET as string,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY as string
        })
}

userSchema.methods.generateRefreshToken = async function () {
    return await jwt.sign({
        _id: this._id,
        fullName: this.fullName,
        email: this.email,
        username: this.username
    },
        process.env.REFRESH_TOKEN_SECRET as string,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY as string
        })
}

export const User = mongoose.model<UserInterface>("user", userSchema)