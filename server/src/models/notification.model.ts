import mongoose, { ObjectId, Schema } from "mongoose";

export interface NotificationInterface extends Document {
  title: string;
  description: string;
  user: ObjectId;
  read: boolean;
  type: string;
  link: string;
}

const NotificationSchema: Schema<NotificationInterface> = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "user",
    },
    read: {
      type: Boolean,
      default: false,
    },
    type: {
      type: String,
      default: "info",
    },
    link: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

export const Notification = mongoose.model<NotificationInterface>("notification", NotificationSchema);
