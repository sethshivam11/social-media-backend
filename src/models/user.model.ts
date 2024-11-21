import mongoose, { Schema, Document, ObjectId } from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { DEFAULT_USER_AVATAR } from "../utils/constants";

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
  verifyCode: string;
  verifyCodeExpiry: Date;
  sessions: {
    _id?: ObjectId;
    token: string;
    device?: string;
    location?: string;
    createdAt?: Date;
    lastLogin?: Date;
  }[];
  savedPosts: ObjectId[];
  isPasswordCorrect(password: string): boolean;
  generateToken(): string;
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
      default: "",
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
    sessions: [
      {
        token: {
          type: String,
          required: true,
        },
        device: {
          type: String,
          default: "Unknown",
        },
        location: {
          type: String,
        },
        createdAt: {
          type: Date,
          default: Date.now(),
        },
        lastActivity: {
          type: Date,
          default: Date.now(),
        },
      },
    ],
    savedPosts: [
      {
        type: Schema.Types.ObjectId,
        ref: "post",
      },
    ],
    blocked: [
      {
        type: Schema.Types.ObjectId,
        ref: "user",
      },
    ],
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

userSchema.methods.generateToken = async function () {
  return jwt.sign(
    {
      _id: this._id,
      fullName: this.fullName,
      email: this.email,
      username: this.username,
    },
    process.env.TOKEN_SECRET as string
  );
};

export const User = mongoose.model<UserInterface>("user", userSchema);
