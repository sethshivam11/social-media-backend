import { Request, Response } from "express";
import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/AsyncHandler";
import { ReportModel } from "../models/report.model";
import { ApiResponse } from "../utils/ApiResponse";
import { cleanupFiles, uploadToCloudinary } from "../utils/cloudinary";

export const createReport = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user) {
      cleanupFiles();
      throw new ApiError(401, "User not verified");
    }

    const { title, description, kind, entityId } = req.body;
    const imageFileLocalPath = req.file?.path;
    let images: string[] = [];
    if (imageFileLocalPath) {
      const uploadedImage = await uploadToCloudinary(
        imageFileLocalPath,
        "reports"
      );
      if (uploadedImage) {
        images.push(uploadedImage.secure_url);
      }
    }

    if (!title || !description || !kind || !entityId) {
      cleanupFiles();
      throw new ApiError(400, "Missing required fields");
    }

    const report = ReportModel.create({
      title,
      description,
      kind,
      entityId,
      images,
    });
    if (!report) {
      throw new ApiError(401, "Something went wrong, while reporting");
    }

    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Report was submitted successfully"));
  }
);
