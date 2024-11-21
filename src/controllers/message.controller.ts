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
import { ChatEventEnum } from "../utils/constants";
import mongoose from "mongoose";
import { NotificationPreferences } from "../models/notificationpreferences.model";
import sendNotification from "../helpers/firebase";
import { Chat } from "../models/chat.model";

const fetchUsersInChat = (chatId: mongoose.ObjectId) => Chat.findById(chatId);

const sendMessage = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    cleanupFiles();
    throw new ApiError(401, "User not verified");
  }
  const { _id, username, avatar } = req.user;

  const attachmentLocalFile = req.file as File;
  const { message, chatId, kind, reply, post } = req.body;

  if (!(message || attachmentLocalFile || post) || !chatId) {
    throw new ApiError(
      400,
      "Message, post or attachment and chatId is required"
    );
  }

  let messageKind:
    | "image"
    | "video"
    | "audio"
    | "document"
    | "message"
    | "post"
    | "location" = kind;
  let content = message;

  if (attachmentLocalFile) {
    const upload = await uploadToCloudinary(
      attachmentLocalFile.path,
      "messages"
    );
    if (upload && upload.secure_url) {
      content = upload.secure_url;
      switch (attachmentLocalFile.mimetype.split("/")[0]) {
        case "image":
          messageKind = "image";
          break;
        case "video":
          messageKind = "video";
          break;
        case "audio":
          messageKind = "audio";
          break;
        default:
          messageKind = "document";
          break;
      }
    }
  }

  const msg = await Message.create({
    content,
    chat: chatId,
    sender: _id,
    kind: kind || messageKind,
    post,
    reply: {
      username: reply ? username : undefined,
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

const sharePost = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ApiError(401, "User not verified");
  }
  const { _id, username, avatar, fullName } = req.user;

  const { postId, people } = req.body;
  if (!postId || !people || people.length === 0) {
    throw new ApiError(400, "ChatId and postId are required");
  }

  const chats = await Chat.find({
    users: { $all: [_id], $in: people },
    isGroupChat: false,
  });

  const chatMap = new Map();
  chats.map((chat) => {
    const otherUser = chat.users.find(
      (user) => user.toString() !== _id.toString()
    );
    if (otherUser) chatMap.set(otherUser.toString(), chat);
  });

  await Promise.all(
    people.map(async (user: string) => {
      let chat = chatMap.get(user);
      if (!chat) {
        chat = await Chat.create({
          users: [_id, user],
          isGroupChat: false,
        });
      }

      const message = await Message.create({
        kind: "post",
        sender: _id,
        post: postId,
        chat: chat._id,
      });

      emitSocketEvent(user, ChatEventEnum.MESSAGE_RECIEVED_EVENT, {
        user: { _id, username, fullName, avatar },
        ...message.toObject(),
      });

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
              body: `${username} shared a post`,
              token,
              image: avatar,
            });
          })
        );
      }
    })
  );

  return res.status(200).json(new ApiResponse(200, {}, "Post shared"));
});

const reactMessage = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ApiError(401, "User not verified");
  }
  const { _id, avatar, fullName, username } = req.user;

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
        user: { _id, username, fullName, avatar },
        content: reaction.content,
        chat: message.chat,
        messageId: message._id,
        message: {
          content:
            message.content.length > 30
              ? `${message.content.slice(0, 30)}...`
              : message.content,
          kind: message.kind,
        },
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
  if (
    message.kind === "image" ||
    message.kind === "video" ||
    message.kind === "audio" ||
    message.kind === "document"
  ) {
    await deleteFromCloudinary(message.content);
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

  const { chatId } = req.query;
  if (!chatId) {
    throw new ApiError(400, "ChatId is required");
  }

  const messages = await Message.find({ chat: chatId })
    .populate({
      path: "post",
      select: "media kind thumbnail caption user",
      model: "post",
      populate: {
        path: "user",
        model: "user",
        select: "username fullName avatar",
        strictPopulate: false,
      },
      strictPopulate: false,
    })
    .populate("sender reacts", "username fullName avatar")
    .sort({ createdAt: 1 });
  // .populate("post", "media kind thumbnail caption user")

  if (messages.length === 0 || !messages) {
    throw new ApiError(404, "No messages found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, messages, "Messages fetched"));
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
  sharePost,
  reactMessage,
  deleteMessage,
  unreactMessage,
  updateMessage,
};
