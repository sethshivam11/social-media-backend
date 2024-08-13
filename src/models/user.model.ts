import mongoose, { Schema, Document, ObjectId } from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { DEFAULT_USER_AVATAR } from "../constants";

export interface UserInterface extends Document {
  avatar: string;
  fullName: string;
  username: string;
  email: string;
  password?: string;
  bio: string;
  blocked: ObjectId[];
  followingCount: number;
  followersCount: number;
  postsCount: number;
  isMailVerified: boolean;
  refreshToken?: string;
  verifyCode: string;
  verifyCodeExpiry: Date;
  isPasswordCorrect(password: string): boolean;
  generateRefreshToken(): string;
  generateAccessToken(): string;
}

const userSchema: Schema<UserInterface> = new Schema(
  {
    avatar: {
      type: String,
      default: DEFAULT_USER_AVATAR,
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
      default: 0,
    },
    followersCount: {
      type: Number,
      default: 0,
    },
    postsCount: {
      type: Number,
      default: 0,
    },
    isMailVerified: {
      type: Boolean,
      default: false,
    },
    verifyCode: String,
    verifyCodeExpiry: Date,
    blocked: [
      {
        type: Schema.Types.ObjectId,
        ref: "user",
      },
    ],
    refreshToken: String,
  },
  {
    timestamps: true,
  }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password as string, 10);
});

userSchema.methods.isPasswordCorrect = async function (password: string) {
  return await bcrypt.compare(password, this.password);
};

userSchema.methods.generateAccessToken = async function () {
  return await jwt.sign(
    {
      _id: this._id,
      fullName: this.fullName,
      email: this.email,
      username: this.username,
    },
    process.env.ACCESS_TOKEN_SECRET as string,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY as string,
    }
  );
};

userSchema.methods.generateRefreshToken = async function () {
  return await jwt.sign(
    {
      _id: this._id,
      fullName: this.fullName,
      email: this.email,
      username: this.username,
    },
    process.env.REFRESH_TOKEN_SECRET as string,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY as string,
    }
  );
};

export const User = mongoose.model<UserInterface>("user", userSchema);
