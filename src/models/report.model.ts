import mongoose, { Schema, Document, ObjectId } from "mongoose";

interface ReportInterface extends Document {
  user: ObjectId;
  title: string;
  description: string;
  kind:
    | "post"
    | "comment"
    | "user"
    | "chat"
    | "problem"
    | "story"
    | "confession";
  entityId: string;
  images?: string[];
}

const reportSchema: Schema<ReportInterface> = new Schema({
  entityId: { type: String },
  user: { type: Schema.Types.ObjectId, required: true },
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true, trim: true },
  kind: { type: String, required: true },
  images: [String],
});

export const ReportModel = mongoose.model<ReportInterface>(
  "report",
  reportSchema
);
