import mongoose, { Schema, Document, ObjectId } from "mongoose";

interface LikeInterface extends Document {
  content: string;
  user: ObjectId;
  post: ObjectId;
}

const likeSchema: Schema<LikeInterface> = new Schema(
  {
    content: {
      type: String,
      default: "❤️",
    },
    user: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "user",
    },
    post: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "post",
    },
  },
  {
    timestamps: true,
  }
);

export const Like = mongoose.model("like", likeSchema);
