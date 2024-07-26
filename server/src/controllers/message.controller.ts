import { Request, Response } from "express";
import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/AsyncHandler";
import { Message } from "../models/message.model";
import { File } from "./user.controller";
import { deleteFromCloudinary, uploadToCloudinary } from "../utils/cloudinary";
import { ApiResponse } from "../utils/ApiResponse";
import { emitSocketEvent } from "../socket";
import { ChatEventEnum } from "../constants";
import mongoose from "mongoose";
import { NotificationPreferences } from "../models/notificationpreferences.model";
import sendNotification from "../helpers/firebase";
import { Chat } from "../models/chat.model";

// limit number of messages for pagination
const limit = 40;
let pageNo = 1;

const fetchUsersInChat = (chatId: mongoose.ObjectId) => Chat.findById(chatId);

const sendMessage = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ApiError(401, "User not verified");
  }
  const { _id, username, avatar } = req.user;

  const attachmentsLocalPath = (req.file as File)?.path;
  const { message, chatId, kind } = req.body;

  if (!(message || attachmentsLocalPath) || !chatId) {
    throw new ApiError(400, "Message and chatId is required");
  }

  let attachment = "";
  if (attachmentsLocalPath) {
    const uploadObject = await uploadToCloudinary(attachmentsLocalPath);
    attachment = uploadObject?.url || "";
  }

  const msg = await Message.create({
    content: message,
    chat: chatId,
    sender: _id,
    kind,
    attachment,
  });

  if (!msg) {
    throw new ApiError(500, "Message not sent");
  }

  const chats = await fetchUsersInChat(chatId);
  if (chats) {
    chats.users.forEach(async (user) => {
      if (user.toString() === _id.toString()) return;
      emitSocketEvent(
        user.toString(),
        ChatEventEnum.MESSAGE_RECIEVED_EVENT,
        msg
      );
      const notificationPreference = await NotificationPreferences.findOne({
        user,
      });
      if (
        notificationPreference &&
        notificationPreference.firebaseToken &&
        notificationPreference.pushNotifications.newMessages
      ) {
        sendNotification({
          title: "New Message",
          body: message
            ? `${username}: ${message}`
            : `You have a new message from ${username}`,
          token: notificationPreference.firebaseToken,
          image: avatar,
        });
      }
    });
  }

  return res.status(201).json(new ApiResponse(201, msg, "Message sent"));
});

const reactMessage = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ApiError(401, "User not verified");
  }
  const { _id, fullName, avatar, username } = req.user;

  const { messageId, content } = req.body;
  if (!messageId) {
    throw new ApiError(400, "MessageId is required");
  }

  const message = await Message.findById(messageId);
  if (!message) {
    throw new ApiError(404, "Message not found");
  }

  message.reacts.forEach(
    (react: { content: string; user: mongoose.ObjectId }) => {
      if (react.user.toString() === _id.toString()) {
        throw new ApiError(400, "You already reacted to this message");
      }
    }
  );

  const reacts = {
    content: content || "❤️",
    user: _id.toString(),
  };
  message.reacts = [reacts, ...(message.reacts || [])];

  await message.save();

  const chats = await fetchUsersInChat(message.chat);
  if (chats) {
    chats.users.forEach(async (user) => {
      if (user.toString() === _id.toString()) return;
      emitSocketEvent(user.toString(), ChatEventEnum.NEW_REACT_EVENT, {
        user: { fullName, content, username, avatar },
        react: reacts,
      });
    });
  }

  return res.status(200).json(new ApiResponse(200, message, "Message reacted"));
});

const unreactMessage = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ApiError(401, "User not verified");
  }
  const { _id, fullName, avatar, username } = req.user;

  const { messageId } = req.params;
  if (!messageId) {
    throw new ApiError(400, "Message is required");
  }

  const message = await Message.findById(messageId);
  if (!message) {
    throw new ApiError(404, "Message not found");
  }

  const exists = message.reacts.some(
    (react: { user: mongoose.ObjectId }) =>
      react.user.toString() === _id.toString()
  );
  if (!exists) {
    throw new ApiError(400, "You already unreacted to this message");
  }

  await message.updateOne(
    { $pull: { reacts: { user: _id.toString() } } },
    { new: true }
  );

  const chats = await fetchUsersInChat(message.chat);
  if (chats) {
    chats.users.forEach(async (user) => {
      if (user.toString() === _id.toString()) return;
      emitSocketEvent(user.toString(), ChatEventEnum.NEW_UNREACT_EVENT, {
        user: { fullName, avatar, username },
        unreact: true,
      });
    });
  }

  return res.status(200).json(new ApiResponse(200, {}, "Message unreacted"));
});

const deleteMessage = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ApiError(401, "User not verified");
  }
  const { _id, fullName, avatar, username } = req.user;

  const { messageId } = req.params;
  if (!messageId) {
    throw new ApiError(400, "Message is required");
  }

  const message = await Message.findById(messageId);
  if (!message) {
    throw new ApiError(404, "Message not found");
  }

  if (message.sender.toString() !== _id.toString()) {
    throw new ApiError(403, "You can't delete this message");
  }
  await deleteFromCloudinary(message.attachment);

  await message.deleteOne();

  const chats = await fetchUsersInChat(message.chat);
  if (chats) {
    chats.users.forEach(async (user) => {
      if (user.toString() === _id.toString()) return;
      emitSocketEvent(user.toString(), ChatEventEnum.MESSAGE_DELETE_EVENT, {
        user: { fullName, avatar, username },
        message: messageId,
      });
    });
  }

  return res.status(200).json(new ApiResponse(200, {}, "Message deleted"));
});

const getMessages = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ApiError(401, "User not verified");
  }

  const { chatId, page } = req.query;
  if (!chatId) {
    throw new ApiError(400, "ChatId is required");
  }

  if (page) {
    pageNo = parseInt(page as string);
    if (pageNo <= 0) {
      pageNo = 1;
    }
  }

  const messages = await Message.find({ chat: chatId })
    .populate("sender", "username avatar")
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip((pageNo - 1) * limit);

  if (messages.length === 0 || !messages) {
    throw new ApiError(404, "No messages found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, messages, "Messages fetched"));
});

const editMessageContent = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ApiError(401, "User not verified");
  }
  const { _id, fullName, username, avatar } = req.user;

  const { messageId, content } = req.body;
  if (!messageId || !content) {
    throw new ApiError(400, "Message and content are required");
  }

  const message = await Message.findById(messageId);
  if (!message) {
    throw new ApiError(404, "Message not found");
  }

  if (message.sender.toString() !== _id.toString()) {
    throw new ApiError(403, "You can't edit this message");
  }

  message.content = content;
  await message.save();

  const chats = await fetchUsersInChat(message.chat);
  if (chats) {
    chats.users.forEach(async (user) => {
      if (user.toString() === _id.toString()) return;
      emitSocketEvent(user.toString(), ChatEventEnum.NEW_EDIT_EVENT, {
        user: { fullName, avatar, username },
        message,
      });
    });
  }

  return res.status(200).json(new ApiResponse(200, message, "Message edited"));
});

const getReactions = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ApiError(401, "User not verified");
  }

  const { messageId } = req.params;
  const { page } = req.query;
  if (!messageId) {
    throw new ApiError(400, "Message is required");
  }

  if (page) {
    pageNo = parseInt(page as string);
    if (pageNo <= 0) {
      pageNo = 1;
    }
  }

  const message = await Message.findById(messageId)
    .populate({
      path: "reacts",
      select: "content",
      populate: {
        path: "user",
        select: "username avatar",
      },
      strictPopulate: false,
    })
    .limit(limit)
    .skip((pageNo - 1) * limit);

  if (!message) {
    throw new ApiError(404, "Message not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, message.reacts, "Reactions fetched"));
});

export {
  sendMessage,
  reactMessage,
  unreactMessage,
  deleteMessage,
  getMessages,
  editMessageContent,
  getReactions,
};
