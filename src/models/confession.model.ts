import mongoose, { ObjectId, Schema } from "mongoose";

interface Confession extends Document {
  reciever: ObjectId;
  content: string;
  attachment: {
    url: string;
    type: "image" | "video";
  };
  createdAt: Date;
}

const confessionSchema: Schema<Confession> = new Schema(
  {
    reciever: {
      type: Schema.Types.ObjectId,
      ref: "user",
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    attachment: {
      url: String,
      kind: {
        type: String,
        enum: ["image", "video"],
      },
    },
  },
  {
    timestamps: true,
  }
);

export const Confession = mongoose.model<Confession>(
  "confession",
  confessionSchema
);
