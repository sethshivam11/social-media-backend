import mongoose, { Schema, Document, ObjectId } from "mongoose";
import { Like } from "./like.model";
import { User } from "./user.model";

interface PostInterface extends Document {
  user: ObjectId;
  caption: string;
  media: string;
  tags: ObjectId[];
  likesCount: number;
  commentsCount: number;
  likePost(liker: ObjectId): Promise<PostInterface>;
  dislikePost(disliker: ObjectId): Promise<PostInterface>;
  post(): Promise<PostInterface>;
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
    },
    media: {
      type: String,
      required: true,
    },
    tags: [
      {
        type: Schema.Types.ObjectId,
        ref: "user",
      },
    ],
    likesCount: {
      type: Number,
      default: 0,
    },
    commentsCount: {
      type: Number,
      default: 0,
    },
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

postSchema.methods.likePost = async function (liker: ObjectId) {
  const react = await Like.findOne({ user: liker, post: this._id });
  if (react) {
    return "You have already liked this post";
  }

  await Like.create({
    user: liker,
    post: this._id,
  });

  this.likesCount += 1;
  await this.save();

  return this;
};

postSchema.methods.dislikePost = async function (disliker: ObjectId) {
  const react = await Like.findOne({ user: disliker, post: this._id });

  if (!react) {
    return "You have already disliked this post";
  }

  if (this.reactsCount > 0) {
    this.reactsCount -= 1;
  }

  await this.save();
  await react.deleteOne();

  return this;
};

export const Post = mongoose.model<PostInterface>("post", postSchema);
