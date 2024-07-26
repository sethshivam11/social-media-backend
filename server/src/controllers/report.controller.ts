import { Request, Response } from "express";
import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/AsyncHandler";
import { ReportModel } from "../models/report.model";
import { ApiResponse } from "../utils/ApiResponse";

export const createReport = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ApiError(401, "User not verified");
  }

  const { title, description, kind, entityId, images } = req.body;

  if (!title || !description || !kind || !entityId) {
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
});
