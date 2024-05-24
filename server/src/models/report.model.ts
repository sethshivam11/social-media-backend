import mongoose, { Schema, Document } from "mongoose";

interface ReportInterface extends Document {
  username: string;
  message: string;
  images: string[];
}

const reportSchema: Schema<ReportInterface> = new Schema({
  username: { type: String, required: true },
  message: { type: String, required: true },
  images: [String],
});

export default mongoose.model<ReportInterface>("Report", reportSchema);
