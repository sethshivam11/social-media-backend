import mongoose, { Schema, Document, ObjectId } from "mongoose";
import { Like } from "./like.model";
import { User } from "./user.model";

interface Like extends Document {
  user: ObjectId;
  post: ObjectId;
  content: string;
}

interface PostInterface extends Document {
  user: ObjectId;
  caption: string;
  media: string;
  kind: "image" | "video";
  likesCount: number;
  commentsCount: number;
  likePost(liker: ObjectId): Promise<PostInterface>;
  dislikePost(disliker: ObjectId): Promise<PostInterface>;
  post(): Promise<PostInterface>;
  updatePostCount(): Promise<PostInterface>;
  getLikes(postId: ObjectId): Promise<Like[]>;
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
    media: [String],
    kind: {
      type: String,
      default: "image",
    },
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

postSchema.methods.getLikes = async function (postId: ObjectId) {
  const likes = await Like.findOne({ post: postId }).populate({
    model: "user",
    path: "user",
    select: "fullName username avatar",
    strictPopulate: false,
  });
  return likes;
};

export const Post = mongoose.model<PostInterface>("post", postSchema);
