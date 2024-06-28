import mongoose, { Schema, Document, ObjectId } from "mongoose";

interface ReportInterface extends Document {
  username: ObjectId;
  message: string;
  images?: string[];
}

const reportSchema: Schema<ReportInterface> = new Schema({
  username: { type: Schema.Types.ObjectId, required: true },
  message: { type: String, required: true, trim: true },
  images: [String],
});

export const ReportModel = mongoose.model<ReportInterface>(
  "report",
  reportSchema
);
