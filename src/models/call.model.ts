import mongoose, { Document, ObjectId, Schema } from "mongoose";

interface CallInterface extends Document {
  callee: ObjectId;
  caller: ObjectId;
  type: "video" | "audio";
  duration: number;
  acceptedAt: Date | null;
  endedAt: Date | null;
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
    acceptedAt: {
      type: Date,
      default: null,
    },
    endedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

export const Call = mongoose.model<CallInterface>("call", callSchema);
