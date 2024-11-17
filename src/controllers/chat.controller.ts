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
import { NotificationModel } from "../models/notification.model";
import sendNotification from "../helpers/firebase";
import { NotificationPreferences } from "../models/notificationpreferences.model";
import { Message } from "../models/message.model";

const createOneToOneChat = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ApiError(401, "User not verified");
  }

  const { _id, username, avatar, fullName } = req.user;
  const { userId } = req.body;
  if (!userId) {
    throw new ApiError(400, "User is required");
  }

  const chatExists = await Chat.findOne({
    users: { $all: [_id, userId] },
    isGroupChat: false,
  });
  if (chatExists) {
    await chatExists.populate({
      path: "users",
      select: "fullName username avatar",
      model: "user",
      strictPopulate: false,
    });

    return res
      .status(200)
      .json(new ApiResponse(200, chatExists, "Chat already exists"));
  }

  const chat = await Chat.create({
    users: [_id, userId],
    populate: {
      path: "users",
      select: "fullName username avatar",
      model: "user",
      strictPopulate: false,
    },
  });

  if (!chat) {
    throw new ApiError(400, "Something went wrong, while creating chat");
  }

  const populatedUsers = await chat.populate<{ users: { _id: string }[] }>({
    path: "users",
    select: "fullName username avatar",
    model: "user",
    strictPopulate: false,
  });

  emitSocketEvent(userId, ChatEventEnum.NEW_CHAT_EVENT, {
    chat: {
      ...populatedUsers.toObject(),
      users: populatedUsers.users.filter(
        (user) => user._id.toString() !== userId.toString()
      ),
    },
    user: { _id, username, fullName, avatar },
  });

  populatedUsers.users = populatedUsers.users.filter(
    (user) => user._id.toString() !== _id.toString()
  );

  return res
    .status(200)
    .json(new ApiResponse(200, populatedUsers, "Chat created successfully"));
});

const createGroupChat = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ApiError(401, "User not verified");
  }
  const { _id, username, avatar, fullName } = req.user;

  const { groupName, groupDescription } = req.body;
  let { participants } = req.body;

  if (!participants || !groupName) {
    cleanupFiles();
    throw new ApiError(400, "participants and groupName are required");
  }

  if (typeof participants === "string") {
    participants = [participants];
  }

  let groupIcon = DEFAULT_GROUP_ICON;
  const groupIconLocalPath = (req.file as File)?.path;
  if (groupIconLocalPath) {
    const groupIconData = await uploadToCloudinary(
      groupIconLocalPath,
      "avatars"
    );
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
    description: groupDescription,
  });

  if (!groupChat) {
    throw new ApiError(400, "Something went wrong, while creating group chat");
  }

  const populatedUsers = await groupChat.populate<{ users: { _id: string }[] }>(
    {
      path: "users",
      select: "fullName username avatar",
      model: "user",
      strictPopulate: false,
    }
  );

  participants.forEach(async (participant: string) => {
    const filteredUsers = populatedUsers.users.filter(
      (user) => user._id.toString() !== participant
    );
    emitSocketEvent(participant, ChatEventEnum.NEW_GROUP_CHAT_EVENT, {
      chat: { ...populatedUsers.toObject(), users: filteredUsers },
      user: {
        _id,
        username,
        avatar,
        fullName,
      },
    });
    if (participant !== _id) {
      await NotificationModel.create({
        title: `New Group`,
        description: `${username} added you to ${groupName || "a Group"}`,
        user: participant,
        link: `/messages/${groupChat._id}`,
      });
    }

    const notificationPreference = await NotificationPreferences.findOne({
      user: participant,
    });
    if (
      notificationPreference?.firebaseTokens.length &&
      notificationPreference.pushNotifications.newGroups
    ) {
      await Promise.all(
        notificationPreference.firebaseTokens.map((token) => {
          sendNotification({
            title: "New Group Chat",
            body: `${username} added you to a group`,
            token,
            image: avatar,
          });
        })
      );
    }
  });

  populatedUsers.users = populatedUsers.users.filter(
    (user) => user._id.toString() !== _id.toString()
  );

  return res
    .status(200)
    .json(
      new ApiResponse(200, populatedUsers, "Group chat created successfully")
    );
});

const getChats = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ApiError(401, "User not verified");
  }

  const { _id, blocked } = req.user;

  const chats = await Chat.aggregate([
    { $match: { users: { $in: [_id] } } },
    { $sort: { updatedAt: -1 } },
    {
      $lookup: {
        from: "users",
        localField: "users",
        foreignField: "_id",
        as: "users",
        pipeline: [
          {
            $project: { avatar: 1, username: 1, fullName: 1 },
          },
        ],
      },
    },
    {
      $lookup: {
        from: "messages",
        localField: "lastMessage",
        foreignField: "_id",
        as: "lastMessage",
        pipeline: [
          {
            $project: { content: 1, kind: 1, createdAt: 1 },
          },
        ],
      },
    },
    { $unwind: { path: "$lastMessage", preserveNullAndEmptyArrays: true } },
    {
      $addFields: {
        users: {
          $filter: {
            input: "$users",
            as: "user",
            cond: { $ne: ["$$user._id", _id] },
          },
        },
      },
    },
    {
      $addFields: {
        user: {
          $cond: {
            if: { $eq: ["$isGroupChat", false] },
            then: {
              $filter: {
                input: "$users",
                as: "user",
                cond: {
                  $and: [
                    { $ne: ["$$user._id", _id] },
                    { $not: { $in: ["$$user._id", blocked] } },
                  ],
                },
              },
            },
            else: "$users",
          },
        },
      },
    },
    {
      $project: {
        "users.password": 0,
      },
    },
  ]);

  if (!chats || !chats.length) {
    throw new ApiError(404, "No chats found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, chats, "Chats fetched successfully"));
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

  const participantsToAdd: string[] = [];
  participants.map((participant: string) => {
    if (!chat.users.some((user) => user.toString() === participant))
      participantsToAdd.push(participant);
  });

  if (participantsToAdd.length === 0) {
    throw new ApiError(400, "Participants already added");
  }

  await chat.updateOne({ $addToSet: { users: { $each: participantsToAdd } } });
  const participantsInfo = await chat.getParticipantsInfo(participantsToAdd);

  chat.users.forEach(async (participant) => {
    const participantId = participant.toString();
    if (participantId === _id.toString()) return;
    emitSocketEvent(participantId, ChatEventEnum.NEW_PARTICIPANT_ADDED_EVENT, {
      participants: participantsInfo,
      chat,
      user: { _id, fullName, avatar, username },
    });
  });

  participantsToAdd.forEach(async (participant) => {
    await NotificationModel.create({
      entityId: chat._id,
      title: `New Group`,
      description: `${username} added you to ${chat.groupName || "a Group"}`,
      user: participant,
      link: `/messages/${chat._id}`,
    });

    const notificationPreference = await NotificationPreferences.findOne({
      user: participant,
    });

    if (
      notificationPreference &&
      notificationPreference.firebaseTokens &&
      notificationPreference.firebaseTokens.length &&
      notificationPreference.pushNotifications.newGroups
    ) {
      await Promise.all(
        notificationPreference.firebaseTokens.map((token) => {
          sendNotification({
            title: "New Group Chat",
            body: `${username} added you to a group`,
            token,
            image: avatar,
          });
        })
      );
    }
  });

  return res
    .status(200)
    .json(
      new ApiResponse(200, participantsInfo, "Participants added successfully")
    );
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

  const participantsToRemove: string[] = [];
  participants.map((participant: string) => {
    if (chat.users.some((user) => user.toString() === participant))
      participantsToRemove.push(participant);
  });

  if (participantsToRemove.length === 0) {
    throw new ApiError(400, "Participants already removed");
  }

  await chat.updateOne({
    $pull: {
      users: { $in: participantsToRemove },
      admin: { $in: participantsToRemove },
    },
  });

  const participantsInfo = await chat.getParticipantsInfo(participantsToRemove);
  chat.users.forEach((participant) => {
    const participantId = participant.toString();
    if (participantId === _id.toString()) return;
    emitSocketEvent(participantId, ChatEventEnum.PARTICIPANT_REMOVED_EVENT, {
      participants: participantsToRemove,
      chat,
      user: { _id, fullName, avatar, username },
    });
  });

  participantsToRemove.forEach(async (participant) => {
    await NotificationModel.create({
      entityId: chat._id,
      title: `Removed from ${chat.groupName || "Group"}`,
      description: `${username} removed you`,
      user: participant,
      link: "/messages"
    });

    const notificationPreference = await NotificationPreferences.findOne({
      user: participant,
    });

    if (
      notificationPreference &&
      notificationPreference.firebaseTokens &&
      notificationPreference.firebaseTokens.length &&
      notificationPreference.pushNotifications.newGroups
    ) {
      await Promise.all(
        notificationPreference.firebaseTokens.map((token) => {
          sendNotification({
            title: "New Group Chat",
            body: `${username} removed you from a group`,
            token,
            image: avatar,
          });
        })
      );
    }
  });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        participantsInfo,
        "Participants removed successfully"
      )
    );
});

const updateGroupDetails = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ApiError(401, "User not verified");
  }
  const { _id, username, avatar, fullName } = req.user;

  const { chatId, groupName, description } = req.body;
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
    const groupIcon = await uploadToCloudinary(groupIconLocalPath, "avatars");
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
  if (description || description === "") chat.description = description;
  await chat.save();

  chat.users.forEach((participant) => {
    const participantId = participant.toString();
    if (participantId === _id.toString()) return;
    emitSocketEvent(participantId, ChatEventEnum.GROUP_DETAILS_UPDATED, {
      chat,
      user: { _id, fullName, avatar, username },
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

  const messages = await Message.find({ "attachment.url": { $exists: true } });
  await Promise.all(
    messages.map((message) => {
      if (
        message?.kind === "image" ||
        message?.kind === "video" ||
        message?.kind === "audio" ||
        message?.kind === "document"
      ) {
        deleteFromCloudinary(message.content);
      }
    })
  );
  await Message.deleteMany({ chat: chat._id });

  if (chat.groupIcon !== DEFAULT_GROUP_ICON)
    await deleteFromCloudinary(chat.groupIcon as string);

  await chat.deleteOne();

  chat.users.forEach(async (participant) => {
    const participantId = participant.toString();
    if (participantId === _id.toString()) return;
    emitSocketEvent(participantId, ChatEventEnum.GROUP_DELETE_EVENT, {
      chat,
      user: { _id, fullName, avatar, username },
    });
    if (participantId !== _id.toString()) {
      await NotificationModel.create({
        entityId: chat._id,
        title: "Group Deleted",
        description: `${username} deleted ${chat.groupName || "the group"}`,
        user: participant,
        link: "/messages"
      });
    }
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

  if (chat.users.length === 1) {
    const messages = await Message.find({
      "attachment.url": { $exists: true },
    });
    await Promise.all(
      messages.map((message) => {
        if (
          message?.kind === "image" ||
          message?.kind === "video" ||
          message?.kind === "audio" ||
          message?.kind === "document"
        ) {
          deleteFromCloudinary(message.content);
        }
      })
    );

    await Message.deleteMany({ chat: chat._id });
    await chat.deleteOne();

    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Group left successfully"));
  } else if (chat.users.length === 2) {
    const filteredUsers = chat.users.filter(
      (user) => user.toString() !== _id.toString()
    );
    chat.users = filteredUsers;
    chat.admin = filteredUsers;
    await chat.save();
  } else {
    chat.users = chat.users.filter(
      (user) => user.toString() !== _id.toString()
    );
    chat.admin = chat.admin.filter(
      (user) => user.toString() !== _id.toString()
    );

    if (chat.admin.length === 0) {
      chat.admin = [chat.users[0]];
    }
    await chat.save();
  }

  chat.users.forEach((participant) => {
    const participantId = participant.toString();
    if (participantId === _id.toString()) return;
    emitSocketEvent(participantId, ChatEventEnum.GROUP_LEAVE_EVENT, {
      chat,
      user: { _id, fullName, avatar, username },
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
      user: { _id, fullName, avatar, username },
    });
  });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { image: chat.groupIcon },
        "Group icon removed successfully"
      )
    );
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
      newAdmins: getUsersInParticipants,
      chat,
      user: { _id, fullName, avatar, username },
    });
  });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Admin added successfully"));
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
      removedAdmins: getUsersInParticipants,
      user: { _id, fullName, avatar, username },
    });
  });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Admin removed successfully"));
});

const getMembers = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ApiError(401, "User not verified");
  }
  const { _id } = req.user;

  const { chatId } = req.params;
  const chat = await Chat.findById(chatId, "users").populate({
    path: "users",
    select: "fullName username avatar",
    model: "user",
    strictPopulate: false,
  });
  if (!chat) {
    throw new ApiError(404, "Chat not found");
  }

  if (!chat.users.includes(_id)) {
    throw new ApiError(403, "You are not authorized to view members");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, chat.users, "Members fetched successfully"));
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
  getMembers,
};
