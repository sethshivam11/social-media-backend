import mongoose, { Document, ObjectId, Schema } from "mongoose";

interface CallInterface extends Document {
  callee: ObjectId;
  caller: ObjectId;
  type: "video" | "audio";
  duration: number;
  lastPinged: Date;
  createdAt: Date;
}

const callSchema: Schema<CallInterface> = new Schema(
  {
    caller: {
      type: Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    callee: {
      type: Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    type: {
      type: String,
      enum: ["video", "audio"],
      required: true,
    },
    lastPinged: {
      type: Date,
      default: Date.now(),
    },
    duration: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

export const Call = mongoose.model<CallInterface>("call", callSchema);
