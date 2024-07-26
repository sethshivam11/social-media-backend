import { Request, Response } from "express";
import { asyncHandler } from "../utils/AsyncHandler";
import { ApiError } from "../utils/ApiError";
import { NotificationModel } from "../models/notification.model";
import { ApiResponse } from "../utils/ApiResponse";

const readNotification = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ApiError(401, "User not verified");
  }

  const { _id } = req.user;

  const notifications = await NotificationModel.find({
    user: _id,
    read: false,
  });
  if (!notifications || notifications.length === 0) {
    throw new ApiError(404, "Notification not found");
  }

  notifications.forEach(async (notification) => {
    await NotificationModel.findByIdAndUpdate(notification._id, {
      read: true,
    });
  });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Notification read successfully"));
});

export { readNotification };
