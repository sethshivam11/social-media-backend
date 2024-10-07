import { Request, Response } from "express";
import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/AsyncHandler";
import { Message } from "../models/message.model";
import { File } from "./user.controller";
import {
  cleanupFiles,
  deleteFromCloudinary,
  uploadToCloudinary,
} from "../utils/cloudinary";
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
    cleanupFiles();
    throw new ApiError(401, "User not verified");
  }
  const { _id, username, avatar } = req.user;

  const attachmentLocalFile = req.file as File;
  const { message, chatId, kind, reply } = req.body;

  if (!(message || attachmentLocalFile) || !chatId) {
    throw new ApiError(400, "Message or attachment and chatId is required");
  }

  let attachment: {
    url: string;
    kind: "image" | "video" | "audio" | "document";
  } | null = null;
  if (attachmentLocalFile) {
    const upload = await uploadToCloudinary(
      attachmentLocalFile.path,
      "messages"
    );
    if (upload && upload.secure_url) {
      attachment = { kind: "document", url: upload.secure_url };
      switch (attachmentLocalFile.mimetype.split("/")[0]) {
        case "image":
          attachment.kind = "image";
          break;
        case "video":
          attachment.kind = "video";
          break;
        case "audio":
          attachment.kind = "audio";
          break;
        default:
          attachment.kind = "document";
          break;
      }
    }
  }

  const msg = await Message.create({
    content: message,
    chat: chatId,
    sender: _id,
    kind,
    attachment,
    reply: {
      username,
      content: reply,
    },
  });

  if (!msg) {
    throw new ApiError(500, "Message not sent");
  }
  await msg.populate("sender", "username fullName avatar");

  await Chat.findByIdAndUpdate(
    chatId,
    {
      $set: {
        lastMessage: msg._id,
      },
    },
    { new: true }
  );

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
        notificationPreference?.firebaseTokens.length &&
        notificationPreference.pushNotifications.newMessages
      ) {
        await Promise.all(
          notificationPreference.firebaseTokens.map((token) => {
            sendNotification({
              title: "New Message",
              body: message
                ? `${username}: ${message}`
                : `You have a new message from ${username}`,
              token,
              image: avatar,
            });
          })
        );
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

  const { content } = req.body;
  const { messageId } = req.params;

  if (!messageId) {
    throw new ApiError(400, "MessageId is required");
  }

  const message = await Message.findById(messageId);
  if (!message) {
    throw new ApiError(404, "Message not found");
  }

  const reaction = {
    content: content || "❤️",
    user: _id,
  };

  if (
    message.reacts.some((react) => react.user.toString() === _id.toString())
  ) {
    message.reacts = message.reacts.map((react) => {
      if (react.user.toString() === _id.toString()) {
        react.content = reaction.content;
      }
      return react;
    });
    await message.save();
  } else {
    await message.updateOne({ $push: { reacts: reaction } }, { new: true });
  }

  const chats = await fetchUsersInChat(message.chat);
  if (chats) {
    chats.users.forEach(async (user) => {
      if (user.toString() === _id.toString()) return;
      emitSocketEvent(user.toString(), ChatEventEnum.NEW_REACT_EVENT, {
        user: _id,
        content: reaction.content,
        chat: message.chat,
        messageId: message._id,
      });
    });
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        content: reaction.content,
        user: _id,
      },
      "Reacted to message"
    )
  );
});

const unreactMessage = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ApiError(401, "User not verified");
  }
  const { _id } = req.user;

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
        user: _id,
        chat: message.chat,
        messageId: message._id,
      });
    });
  }

  return res.status(200).json(new ApiResponse(200, {}, "Message unreacted"));
});

const deleteMessage = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ApiError(401, "User not verified");
  }
  const { _id } = req.user;

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
  if (message.attachment.url) {
    await deleteFromCloudinary(message.attachment.url);
  }

  await message.deleteOne();
  await Chat.findByIdAndUpdate(
    message.chat,
    {
      $set: { lastMessage: null },
    },
    { new: true }
  );

  const chats = await fetchUsersInChat(message.chat);
  if (chats) {
    chats.users.forEach(async (user) => {
      if (user.toString() === _id.toString()) return;
      emitSocketEvent(
        user.toString(),
        ChatEventEnum.MESSAGE_DELETE_EVENT,
        message
      );
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

  const messagesCount = await Message.countDocuments({ chat: chatId });
  const messages = await Message.find({ chat: chatId })
    .populate("sender reacts", "username fullName avatar")
    .sort({ createdAt: 1 })
    .limit(limit)
    .skip((pageNo - 1) * limit);

  if (messages.length === 0 || !messages) {
    throw new ApiError(404, "No messages found");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, { messages, max: messagesCount }, "Messages fetched")
    );
});

const updateMessage = asyncHandler(async (req: Request, res: Response) => {
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

const getReacts = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ApiError(401, "User not verified");
  }

  const { messageId } = req.params;

  const message = await Message.findOne({ _id: messageId }, "reacts").populate({
    model: "user",
    path: "reacts.user",
    select: "username fullName avatar",
    strictPopulate: false,
  });

  if (!message) {
    throw new ApiError(404, "Message not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, message.reacts, "Reacts fetched"));
});

export {
  getReacts,
  getMessages,
  sendMessage,
  reactMessage,
  deleteMessage,
  unreactMessage,
  updateMessage,
};
