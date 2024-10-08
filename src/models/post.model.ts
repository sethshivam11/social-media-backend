import mongoose, { Schema, Document, ObjectId } from "mongoose";
import { User } from "./user.model";

interface PostInterface extends Document {
  user: ObjectId;
  caption: string;
  media: string[];
  kind: "image" | "video";
  likes: ObjectId[];
  likesCount: number;
  commentsCount: number;
  thumbnail?: string;
  updatePostCount(): Promise<PostInterface>;
}

const postSchema: Schema<PostInterface> = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    caption: {
      type: String,
      trim: true,
      default: "",
    },
    media: [String],
    kind: {
      type: String,
      default: "image",
    },
    likes: [{ type: Schema.Types.ObjectId, ref: "user" }],
    likesCount: {
      type: Number,
      default: 0,
    },
    commentsCount: {
      type: Number,
      default: 0,
    },
    thumbnail: String,
  },
  {
    timestamps: true,
  }
);

postSchema.methods.updatePostCount = async function () {
  await User.findByIdAndUpdate(
    this.user,
    {
      $inc: { postsCount: 1 },
    },
    { new: true }
  );
  return this;
};

export const Post = mongoose.model<PostInterface>("post", postSchema);
