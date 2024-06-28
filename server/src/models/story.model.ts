import mongoose, { ObjectId, Schema } from "mongoose";

interface media {
  url: string;
  caption: string;
}

interface StoryInterface extends Document {
  user: ObjectId;
  media: media[];
  caption: string;
  seenBy: ObjectId[];
  tags: ObjectId[];
  likes: ObjectId[];
  blockedTo: ObjectId[];
  createdAt: Date;
}

function validateMinLength(array: string[]) {
  return array.length >= 1;
}

const storySchema: Schema<StoryInterface> = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: "user",
  },
  media: {
    type: [
      {
        url: {
          type: String,
          required: true,
        },
        caption: {
          type: String,
          trim: true,
        },
      },
    ],
    validate: [validateMinLength, "Minimum one file is required"],
  },
  tags: [
    {
      type: Schema.Types.ObjectId,
      ref: "user",
    },
  ],
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
