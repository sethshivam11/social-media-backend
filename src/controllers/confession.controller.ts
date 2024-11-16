import { Request, Response } from "express";
import { asyncHandler } from "../utils/AsyncHandler";
import { ApiError } from "../utils/ApiError";
import { File } from "./user.controller";
import { deleteFromCloudinary, uploadToCloudinary } from "../utils/cloudinary";
import { Confession } from "../models/confession.model";
import { ApiResponse } from "../utils/ApiResponse";
import { emitSocketEvent } from "../socket";
import { ChatEventEnum } from "../constants";
import { NotificationPreferences } from "../models/notificationpreferences.model";
import sendNotification from "../helpers/firebase";
import { NotificationModel } from "../models/notification.model";

const sendMessage = asyncHandler(async (req: Request, res: Response) => {
  const { content, reciever } = req.body;
  if (!content || !reciever) {
    throw new ApiError(400, "Content and reciever are required");
  }

  const attachmentLocalFile = req.file as File;
  let attachment: {
    url: string;
    kind: "image" | "video";
  } = {
    url: "",
    kind: "image",
  };

  if (attachmentLocalFile) {
    if (attachmentLocalFile.size > 52428800) {
      throw new ApiError(400, "Please upload a file of size less than 50MB");
    }

    if (
      !(
        attachmentLocalFile.mimetype.includes("image") ||
        attachmentLocalFile.mimetype.includes("video")
      )
    ) {
      throw new ApiError(400, "Only image and video files are allowed");
    }

    const upload = await uploadToCloudinary(
      attachmentLocalFile?.path,
      "confessions"
    );
    if (upload?.secure_url) {
      attachment = {
        url: upload.secure_url,
        kind: attachmentLocalFile.mimetype.includes("video")
          ? "video"
          : "image",
      };
    }
  }

  const message = await Confession.create({
    reciever,
    content,
    attachment: attachment.url ? attachment : undefined,
  });
  if (!message) {
    throw new ApiError(500, "Message not sent");
  }

  emitSocketEvent(
    reciever,
    ChatEventEnum.CONFESSION_RECIEVED_EVENT,
    message
  );

  await NotificationModel.create({
    title: "New Confession",
    description: "You recieved a new confession",
    user: reciever,
    link: "/confessions",
  });

  const notificationPreference = await NotificationPreferences.findOne({
    user: reciever,
  });
  if (
    notificationPreference?.firebaseTokens.length &&
    notificationPreference.pushNotifications.newGroups
  ) {
    await Promise.all(
      notificationPreference.firebaseTokens.map((token) => {
        sendNotification({
          title: "New Message",
          body: "You recieved a new confession",
          token,
        });
      })
    );
  }

  return res
    .status(200)
    .json(new ApiResponse(200, message, "Message sent successfully"));
});

const getMessages = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ApiError(401, "User not verified");
  }
  const { _id } = req.user;

  const messages = await Confession.find({ reciever: _id });
  if (!messages || !messages.length) {
    throw new ApiError(404, "No messages found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, messages, "Messages retrieved successfully"));
});

const deleteMessage = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ApiError(401, "User not verified");
  }
  const { _id } = req.user;

  const { messageId } = req.params;
  if (!messageId) {
    throw new ApiError(400, "Message ID is required");
  }

  const message = await Confession.findById(messageId);
  if (!message) {
    throw new ApiError(404, "Message not found");
  }

  if (message.reciever.toString() !== _id.toString()) {
    throw new ApiError(403, "You are not authorized to delete this message");
  }

  if (message.attachment) {
    await deleteFromCloudinary(message.attachment.url);
  }

  await message.deleteOne();
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Message deleted successfully"));
});

export { sendMessage, getMessages, deleteMessage };
