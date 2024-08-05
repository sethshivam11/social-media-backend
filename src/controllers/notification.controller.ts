import { Request, Response } from "express";
import { asyncHandler } from "../utils/AsyncHandler";
import { ApiError } from "../utils/ApiError";
import { NotificationModel } from "../models/notification.model";
import { ApiResponse } from "../utils/ApiResponse";

const limit = 20;
let pageNo = 1;

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

const getNotifications = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ApiError(401, "User not verified");
  }
  const { _id } = req.user;
  const { page } = req.query;

  if (page) {
    pageNo = parseInt(page as string);
    if (pageNo <= 0) {
      pageNo = 1;
    }
  }

  const notifications = await NotificationModel.find({ user: _id })
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(pageNo === 1 ? 1 : (pageNo - 1) * limit);

  if (!notifications || notifications.length === 0) {
    throw new ApiError(404, "Notification not found");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, notifications, "Notification read successfully")
    );
});

const deleteNotification = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ApiError(401, "User not verified");
  }
  const { _id } = req.user;
  const { notificationId } = req.params;

  const notification = await NotificationModel.findById(notificationId);
  if (!notification) {
    throw new ApiError(404, "Notification not found");
  }

  if (notification.user.toString() !== _id.toString()) {
    throw new ApiError(401, "You are not allowed to delete this notification");
  }

  await NotificationModel.findByIdAndDelete(notificationId);

  return res
    .status(200)
    .json(
      new ApiResponse(200, notification, "Notification deleted successfully")
    );
});

export { readNotification, getNotifications, deleteNotification };
