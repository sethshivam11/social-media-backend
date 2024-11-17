import mongoose, { ObjectId, Schema } from "mongoose";

export interface NotificationInterface extends Document {
  title: string;
  description: string;
  user: ObjectId;
  entityId: string;
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
    entityId: String,
    link: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

export const NotificationModel = mongoose.model<NotificationInterface>("notification", NotificationSchema);
