import { Request, Response } from "express";
import { Chat } from "../models/chat.model";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/AsyncHandler";
import { File } from "./user.controller";
import {
  cleanupFiles,
  deleteFromCloudinary,
  uploadToCloudinary,
} from "../utils/cloudinary";
import { ChatEventEnum, DEFAULT_GROUP_ICON } from "../constants";
import { emitSocketEvent } from "../socket";
import mongoose from "mongoose";
import { NotificationModel } from "../models/notification.model";
import sendNotification from "../helpers/firebase";
import { NotificationPreferences } from "../models/notificationpreferences.model";
import { Message } from "../models/message.model";

// limit number of chats for pagination
const limit = 20;
let pageNo = 1;

const createOneToOneChat = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ApiError(401, "User not verified");
  }

  const { _id, fullName, username, avatar } = req.user;
  const { userId } = req.body;
  if (!userId) {
    throw new ApiError(400, "User is required");
  }

  const chatExists = await Chat.findOne({
    users: { $all: [_id, userId] },
    isGroupChat: false,
  });
  if (chatExists) {
    throw new ApiError(400, "Chat already exists");
  }

  const chat = await Chat.create({
    users: [_id, userId],
  });

  if (!chat) {
    throw new ApiError(400, "Something went wrong, while creating chat");
  }
  emitSocketEvent(userId, ChatEventEnum.NEW_CHAT_EVENT, {
    fullName,
    username,
    avatar,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, chat, "Chat created successfully"));
});

const createGroupChat = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ApiError(401, "User not verified");
  }
  const { _id, fullName, username, avatar } = req.user;

  const { participants, groupName } = req.body;
  if (!participants || !groupName) {
    cleanupFiles();
    throw new ApiError(400, "participants and groupName are required");
  }

  if (!(participants instanceof Array)) {
    cleanupFiles();
    throw new ApiError(400, "Participants must be an array");
  }

  let groupIcon = DEFAULT_GROUP_ICON;
  const groupIconLocalPath = (req.file as File)?.path;
  if (groupIconLocalPath) {
    const groupIconData = await uploadToCloudinary(groupIconLocalPath);
    if (!groupIconData) {
      cleanupFiles();
      throw new ApiError(
        500,
        "Something went wrong while uploading group icon"
      );
    }
    groupIcon = groupIconData.secure_url;
  }

  const groupChat = await Chat.create({
    users: [...participants, _id],
    groupName,
    groupIcon,
    admin: [_id],
    isGroupChat: true,
  });

  if (!groupChat) {
    throw new ApiError(400, "Something went wrong, while creating group chat");
  }

  participants.forEach(async (participant: string) => {
    emitSocketEvent(participant, ChatEventEnum.NEW_GROUP_CHAT_EVENT, {
      fullName,
      username,
      avatar,
    });
    await NotificationModel.create({
      title: `New Group Chat`,
      description: `${username} added you to a group`,
      user: participant,
    });

    const notificationPreference = await NotificationPreferences.findOne({
      user: participant,
    });
    if (
      notificationPreference &&
      notificationPreference.firebaseToken &&
      notificationPreference.pushNotifications.newGroups
    ) {
      sendNotification({
        title: "New Group Chat",
        body: `${username} added you to a group`,
        token: notificationPreference.firebaseToken,
      });
    }
  });

  return res
    .status(200)
    .json(new ApiResponse(200, groupChat, "Group chat created successfully"));
});

const getChats = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ApiError(401, "User not verified");
  }
  const { _id, blocked } = req.user;
  const { page } = req.query;

  if (page) {
    pageNo = parseInt(page as string);
  }

  const chats = await Chat.find({
    users: { $in: [_id], $nin: [blocked] },
    isGroupChat: true,
  })
    .populate({
      path: "users",
      select: "name username avatar",
      model: "user",
      strictPopulate: false,
      options: { limit: 2, sort: { updatedAt: -1 } },
    })
    .limit(limit)
    .skip((pageNo - 1) * limit);

  const chatData = await Promise.all(
    chats.map(async (chat) => {
      const lastMessage = await Message.findOne({ chat: chat._id })
        .sort("-createdAt")
        .exec();

      const unreadMessages = await Message.exists({
        chat: chat._id,
        readBy: { $ne: _id },
      });

      return {
        ...chat.toObject(),
        lastMessage: lastMessage ? lastMessage.content : null,
        unreadMessages: !!unreadMessages,
      };
    })
  );

  if (!chats) {
    throw new ApiError(404, "No chats found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, chatData, "Chats fetched successfully"));
});

const addParticipants = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ApiError(401, "User not verified");
  }
  const { _id, fullName, username, avatar } = req.user;

  const { chatId, participants } = req.body;
  if (!chatId || !participants) {
    throw new ApiError(400, "chatId and participants are required");
  }

  const chat = await Chat.findById(chatId);
  if (!chat) {
    throw new ApiError(404, "Chat not found");
  }

  if (!chat.admin.includes(_id)) {
    throw new ApiError(403, "You are not authorized to add participants");
  }
  participants.forEach((participant: string) => {
    const participantId = new mongoose.Schema.Types.ObjectId(participant);
    if (chat.users.includes(participantId)) {
      throw new ApiError(400, "Some participants already exists");
    }
  });

  chat.users = [...chat.users, ...participants];
  await chat.save();
  const participantsInfo = await chat.getParticipantsInfo(participants);

  chat.users.forEach(async (participant) => {
    const participantId = participant.toString();
    if (participantId === _id.toString()) return;
    emitSocketEvent(participantId, ChatEventEnum.NEW_PARTICIPANT_ADDED_EVENT, {
      participantsInfo,
      user: { fullName, avatar, username },
    });
    await NotificationModel.create({
      title: `New Group Chat`,
      description: `${username} added you to a group`,
      user: participant,
    });

    const notificationPreference = await NotificationPreferences.findOne({
      user: participant,
    });
    if (
      notificationPreference &&
      notificationPreference.firebaseToken &&
      notificationPreference.pushNotifications.newGroups
    ) {
      sendNotification({
        title: "New Group Chat",
        body: `${username} added you to a group`,
        token: notificationPreference.firebaseToken,
      });
    }
  });

  return res
    .status(200)
    .json(new ApiResponse(200, chat, "Participants added successfully"));
});

const removeParticipants = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ApiError(401, "User not verified");
  }
  const { _id, fullName, username, avatar } = req.user;

  const { chatId, participants } = req.body;
  if (!chatId || !participants) {
    throw new ApiError(400, "chatId and participants are required");
  }

  const chat = await Chat.findById(chatId);
  if (!chat) {
    throw new ApiError(404, "Chat not found");
  }

  if (!chat.admin.includes(_id)) {
    throw new ApiError(403, "You are not authorized to remove participants");
  }

  participants.forEach((participant: string) => {
    const participantId = new mongoose.Schema.Types.ObjectId(participant);
    if (!chat.users.includes(participantId)) {
      throw new ApiError(400, "Some participants are already not in group");
    }
  });

  await chat.updateOne({ $pull: { users: { $in: participants } } });

  const participantsInfo = await chat.getParticipantsInfo(participants);
  chat.users.forEach((participant) => {
    const participantId = participant.toString();
    if (participantId === _id.toString()) return;
    emitSocketEvent(participantId, ChatEventEnum.PARTICIPANT_REMOVED_EVENT, {
      participantsInfo,
      user: { fullName, avatar, username },
    });
  });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Participants removed successfully"));
});

const updateGroupDetails = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ApiError(401, "User not verified");
  }
  const { _id, username, avatar, fullName } = req.user;

  const { chatId, groupName } = req.body;
  const groupIconLocalPath = (req.file as File)?.path;

  if (!chatId || !(groupIconLocalPath || groupName)) {
    cleanupFiles();
    throw new ApiError(400, "chatId or groupImage is required");
  }

  const chat = await Chat.findById(chatId);
  if (!chat) {
    cleanupFiles();
    throw new ApiError(404, "Chat not found");
  }

  if (!chat.admin.includes(_id)) {
    cleanupFiles();
    throw new ApiError(403, "You are not authorized to update group icon");
  }

  if (groupIconLocalPath) {
    const groupIcon = await uploadToCloudinary(groupIconLocalPath);
    if (!groupIcon) {
      cleanupFiles();
      throw new ApiError(
        500,
        "Something went wrong while uploading group icon"
      );
    }

    await deleteFromCloudinary(chat.groupIcon as string);

    chat.groupIcon = groupIcon.secure_url;
  }

  if (groupName) chat.groupName = groupName;
  await chat.save();

  chat.users.forEach((participant) => {
    const participantId = participant.toString();
    if (participantId === _id.toString()) return;
    emitSocketEvent(participantId, ChatEventEnum.GROUP_DETAILS_UPDATED, {
      chat,
      user: { fullName, avatar, username },
    });
  });

  return res
    .status(200)
    .json(new ApiResponse(200, chat, "Group icon updated successfully"));
});

const deleteGroup = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ApiError(401, "User not verified");
  }
  const { _id, username, avatar, fullName } = req.user;

  const { chatId } = req.params;
  if (!chatId) {
    throw new ApiError(400, "chatId is required");
  }

  const chat = await Chat.findById(chatId);
  if (!chat) {
    throw new ApiError(404, "Group not found");
  }

  if (!chat.admin.includes(_id)) {
    throw new ApiError(403, "You are not authorized to delete group");
  }

  if (chat.groupIcon !== DEFAULT_GROUP_ICON)
    await deleteFromCloudinary(chat.groupIcon as string);
  await chat.deleteOne();

  chat.users.forEach((participant) => {
    const participantId = participant.toString();
    if (participantId === _id.toString()) return;
    emitSocketEvent(participantId, ChatEventEnum.DELETE_GROUP_EVENT, {
      chat,
      user: { fullName, avatar, username },
    });
  });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Group deleted successfully"));
});

const leaveGroup = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ApiError(401, "User not verified");
  }
  const { _id, fullName, avatar, username } = req.user;

  const { chatId } = req.params;
  if (!chatId) {
    throw new ApiError(400, "chatId is required");
  }

  const chat = await Chat.findById(chatId);

  if (!chat) {
    throw new ApiError(404, "Chat not found");
  }

  await chat.updateOne({ $pull: { users: _id, admin: _id } });

  chat.users.forEach((participant) => {
    const participantId = participant.toString();
    if (participantId === _id.toString()) return;
    emitSocketEvent(participantId, ChatEventEnum.GROUP_LEAVE_EVENT, {
      chat,
      user: { fullName, avatar, username },
    });
  });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Group left successfully"));
});

const removeGroupIcon = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ApiError(401, "User not verified");
  }
  const { _id, fullName, avatar, username } = req.user;

  const { chatId } = req.params;
  if (!chatId) {
    throw new ApiError(400, "chatId is required");
  }

  const chat = await Chat.findById(chatId);
  if (!chat) {
    throw new ApiError(404, "Chat not found");
  }

  if (!chat.isGroupChat) {
    throw new ApiError(400, "This is not a group chat");
  }

  if (!chat.admin.includes(_id)) {
    throw new ApiError(403, "You are not authorized to remove group icon");
  }

  if (chat.groupIcon === DEFAULT_GROUP_ICON) {
    throw new ApiError(400, "Group icon is already removed");
  }

  await deleteFromCloudinary(chat.groupIcon as string);

  chat.groupIcon = DEFAULT_GROUP_ICON;
  await chat.save();

  chat.users.forEach((participant) => {
    const participantId = participant.toString();
    if (participantId === _id.toString()) return;
    emitSocketEvent(participantId, ChatEventEnum.GROUP_DETAILS_UPDATED, {
      chat,
      user: { fullName, avatar, username },
    });
  });

  return res
    .status(200)
    .json(new ApiResponse(200, chat, "Group icon removed successfully"));
});

const makeAdmin = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ApiError(401, "User not verified");
  }
  const { _id, username, fullName, avatar } = req.user;

  const { chatId, userId } = req.body;
  if (!chatId || !userId) {
    throw new ApiError(400, "chatId and userId are required");
  }

  const chat = await Chat.findById(chatId);
  if (!chat) {
    throw new ApiError(404, "Chat not found");
  }

  if (!chat.admin.includes(_id)) {
    throw new ApiError(403, "You are not authorized to make admin");
  }

  if (!chat.users.includes(userId)) {
    throw new ApiError(400, "User is not in the group");
  }

  if (chat.admin.includes(userId)) {
    throw new ApiError(400, "User is already an admin");
  }

  chat.admin = [...chat.admin, userId];
  await chat.save();
  const getUsersInParticipants = await chat.getParticipantsInfo([userId]);

  chat.users.forEach((participant) => {
    const participantId = participant.toString();
    if (participant.toString() === _id.toString()) return;
    emitSocketEvent(participantId, ChatEventEnum.NEW_ADMIN_EVENT, {
      admin: getUsersInParticipants,
      user: { fullName, avatar, username },
    });
  });

  return res
    .status(200)
    .json(new ApiResponse(200, chat, "Admin added successfully"));
});

const removeAdmin = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ApiError(401, "User not verified");
  }
  const { _id, fullName, username, avatar } = req.user;

  const { chatId, userId } = req.body;
  if (!chatId || !userId) {
    throw new ApiError(400, "chatId and userId are required");
  }

  const chat = await Chat.findById(chatId);
  if (!chat) {
    throw new ApiError(404, "Chat not found");
  }

  if (!chat.admin.includes(_id)) {
    throw new ApiError(403, "You are not authorized to remove admin");
  }

  if (!chat.users.includes(userId)) {
    throw new ApiError(400, "User is not in the group");
  }

  if (!chat.admin.includes(userId)) {
    throw new ApiError(400, "User is already not an admin");
  }

  await chat.updateOne({ $pull: { admin: userId } }, { new: true });

  const getUsersInParticipants = await chat.getParticipantsInfo([userId]);
  chat.users.forEach((participant) => {
    const participantId = participant.toString();
    if (participantId === _id.toString()) return;
    emitSocketEvent(participantId, ChatEventEnum.ADMIN_REMOVE_EVENT, {
      removed: getUsersInParticipants,
      user: { fullName, avatar, username },
    });
  });

  return res
    .status(200)
    .json(new ApiResponse(200, chat, "Admin removed successfully"));
});

export {
  createOneToOneChat,
  getChats,
  createGroupChat,
  addParticipants,
  removeParticipants,
  deleteGroup,
  updateGroupDetails,
  leaveGroup,
  removeGroupIcon,
  makeAdmin,
  removeAdmin,
};
