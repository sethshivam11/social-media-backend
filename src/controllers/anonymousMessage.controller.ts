import { Request, Response } from "express";
import { asyncHandler } from "../utils/AsyncHandler";
import { ApiError } from "../utils/ApiError";
import { File } from "./user.controller";
import { deleteFromCloudinary, uploadToCloudinary } from "../utils/cloudinary";
import { AnonymousMessage } from "../models/anonymousMessage.model";
import { ApiResponse } from "../utils/ApiResponse";
import { emitSocketEvent } from "../socket";
import { ChatEventEnum } from "../constants";
import { NotificationPreferences } from "../models/notificationpreferences.model";
import sendNotification from "../helpers/firebase";

const sendMessage = asyncHandler(async (req: Request, res: Response) => {
  const { content, reciever } = req.body;
  if (!content || !reciever) {
    throw new ApiError(400, "Content and reciever are required");
  }

  const attachmentLocalFile = req.file as File;
  let attachment: string | undefined;

  if (attachmentLocalFile) {
    const upload = await uploadToCloudinary(
      attachmentLocalFile?.path,
      "anonymous-messages"
    );
    attachment = upload?.secure_url;
  }

  const message = await AnonymousMessage.create({
    reciever,
    content,
    attachment,
  });
  if (!message) {
    throw new ApiError(500, "Message not sent");
  }

  emitSocketEvent(
    reciever,
    ChatEventEnum.ANONYMOUS_MESSAGE_RECIEVED_EVENT,
    message
  );
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
          body: `You recieved an anonymous message`,
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

  const messages = await AnonymousMessage.find({ reciever: _id });
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

  const message = await AnonymousMessage.findById(messageId);
  if (!message) {
    throw new ApiError(404, "Message not found");
  }

  if (message.reciever.toString() !== _id.toString()) {
    throw new ApiError(403, "You are not authorized to delete this message");
  }

  if (message.attachment) {
    await deleteFromCloudinary(message.attachment);
  }

  await message.deleteOne();
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Message deleted successfully"));
});

export { sendMessage, getMessages, deleteMessage };
