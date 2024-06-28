import mongoose, { Schema, Document, ObjectId } from "mongoose";
import { Post } from "./post.model";

interface CommentInterface extends Document {
  user: ObjectId;
  post: ObjectId;
  content: string;
  likes: ObjectId[];
  likesCount: number;
  updateCommentsCount(postId: ObjectId, count: number): Promise<void>;
}

const commentSchema: Schema<CommentInterface> = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    post: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    likes: [
      {
        type: Schema.Types.ObjectId,
        ref: "user",
      },
    ],
    likesCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

commentSchema.methods.updateCommentsCount = async function (
  postId: ObjectId,
  count: number
) {
  await Post.findByIdAndUpdate(
    postId,
    {
      $inc: { commentsCount: count },
    },
    { new: true }
  );
  return this;
};

export const Comment = mongoose.model<CommentInterface>("comment", commentSchema);
