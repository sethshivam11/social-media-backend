import mongoose, { ObjectId, Schema } from "mongoose";

interface StoryInterface extends Document {
  user: ObjectId;
  media: string[];
  seenBy: ObjectId[];
  likes: ObjectId[];
  blockedTo: ObjectId[];
  createdAt: Date;
}

const storySchema: Schema<StoryInterface> = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: "user",
  },
  media: {
    type: [String],
    minlength: 1
  },
  likes: [
    {
      type: Schema.Types.ObjectId,
      ref: "user",
    },
  ],
  blockedTo: [
    {
      type: Schema.Types.ObjectId,
      ref: "user",
    },
  ],
  seenBy: [
    {
      type: Schema.Types.ObjectId,
      ref: "user",
    },
  ],
  createdAt: {
    type: Date,
    expires: 86400,
    default: Date.now,
  },
});

export const Story = mongoose.model<StoryInterface>("story", storySchema);
