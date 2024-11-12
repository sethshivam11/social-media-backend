import { asyncHandler } from "../utils/AsyncHandler";
import { ApiResponse } from "../utils/ApiResponse";
import { ApiError } from "../utils/ApiError";
import { Request, Response } from "express";
import { Story } from "../models/story.model";
import {
  cleanupFiles,
  deleteFromCloudinary,
  uploadToCloudinary,
} from "../utils/cloudinary";
import { File } from "./user.controller";
import { NotificationModel } from "../models/notification.model";
import sendNotification from "../helpers/firebase";
import { NotificationPreferences } from "../models/notificationpreferences.model";
import { Follow } from "../models/follow.model";
import { v2 as cloudinary } from "cloudinary";
import { Chat } from "../models/chat.model";
import { Message } from "../models/message.model";
import { emitSocketEvent } from "../socket";
import { ChatEventEnum } from "../constants";

const createStory = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    cleanupFiles();
    throw new ApiError(401, "User not verified");
  }
  const { _id, blocked } = req.user;

  const mediaFiles: File[] = req.files as File[];
  if (!mediaFiles || mediaFiles.length === 0) {
    throw new ApiError(400, "Atleast one story is required");
  }

  const prevStories = await Story.findOne({ user: _id });

  const maxStories =
    prevStories?.media.length || 0 + (mediaFiles.length as number);
  if (maxStories > 5) {
    cleanupFiles();
    throw new ApiError(400, "Only 5 stories in a day is allowed");
  }

  if (mediaFiles.some((file) => file.size > 100000000)) {
    cleanupFiles();
    throw new ApiError(400, "Media file size should not exceed 100MB");
  }

  if (mediaFiles.some((file) => !file.mimetype.includes("image"))) {
    cleanupFiles();
    throw new ApiError(400, "Only image files are allowed");
  }

  let media: string[] = [];
  await Promise.all(
    mediaFiles.map(async (file) => {
      const upload = await uploadToCloudinary(file.path, "stories");
      if (upload && upload.secure_url) media.push(upload.secure_url);
    })
  );

  if (media.length === 0) {
    throw new ApiError(400, "Something went wrong, while uploading story");
  }

  if (prevStories && prevStories.media.length > 0) {
    await prevStories.updateOne(
      { $addToSet: { media: { $each: media } }, selfSeen: false },
      { new: true }
    );

    return res
      .status(201)
      .json(new ApiResponse(201, prevStories, "Story uploaded"));
  }

  const story = await Story.create({
    user: _id,
    media,
    blockedTo: blocked,
  });

  if (!story) {
    throw new ApiError(500, "Story not uploaded");
  }

  await story.populate({
    model: "user",
    path: "user",
    select: "username fullName avatar",
    strictPopulate: false,
  });

  return res.status(201).json(new ApiResponse(201, story, "Story uploaded"));
});

const replyStory = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ApiError(401, "User not verified");
  }
  const { _id, username, avatar, fullName } = req.user;

  const { storyId, content } = req.body;
  if (!storyId || !content) {
    throw new ApiError(404, "storyId and message is required");
  }

  const story = await Story.findById(storyId);
  if (!story) {
    throw new ApiError(404, "Story not found");
  }

  const chat = await Chat.findOne({
    users: [_id, story.user],
    isGroupChat: false,
  });

  if (!chat) {
    const newChat = await Chat.create({
      users: [_id, story.user],
      isGroupChat: false,
    });

    if (!newChat) {
      throw new ApiError(404, "Cannot send reply");
    }

    const message = await Message.create({
      content,
      sender: _id,
      chat: newChat._id,
      kind: "message",
      reply: {
        username,
        content: "Replied to your story",
      },
    });

    emitSocketEvent(
      story.user.toString(),
      ChatEventEnum.MESSAGE_RECIEVED_EVENT,
      {
        user: { _id, username, fullName, avatar },
        ...message.toObject(),
      }
    );

    const notificationPreference = await NotificationPreferences.findOne({
      user: _id,
    });
    if (
      notificationPreference?.firebaseTokens.length &&
      notificationPreference.pushNotifications.newMessages
    ) {
      await Promise.all(
        notificationPreference.firebaseTokens.map((token) => {
          sendNotification({
            title: "New Message",
            body: `${username} replied to your story`,
            token,
            image: avatar,
          });
        })
      );
    }

    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Reply sent successfully"));
  }

  const message = await Message.create({
    users: [_id, story.user],
    sender: _id,
    chat: chat._id,
    content,
    kind: "message",
    reply: {
      username,
      content: "Replied to your story",
    },
  });

  emitSocketEvent(story.user.toString(), ChatEventEnum.MESSAGE_RECIEVED_EVENT, {
    user: { _id, username, fullName, avatar },
    ...message.toObject(),
  });

  const notificationPreference = await NotificationPreferences.findOne({
    user: _id,
  });
  if (
    notificationPreference?.firebaseTokens.length &&
    notificationPreference.pushNotifications.newMessages
  ) {
    await Promise.all(
      notificationPreference.firebaseTokens.map((token) => {
        sendNotification({
          title: "New Message",
          body: `${username} replied to your story`,
          token,
          image: avatar,
        });
      })
    );
  }

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Reply sent successfully"));
});

const markSelfSeen = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ApiError(401, "User not verified");
  }
  const { _id } = req.user;

  const story = await Story.findOne({ user: _id });
  if (!story) {
    throw new ApiError(404, "Story not found");
  }

  if (story.selfSeen) {
    throw new ApiError(400, "Story already seen");
  }

  await story.updateOne({ selfSeen: true }, { new: true });

  return res.status(200).json(new ApiResponse(200, {}, "Story seen"));
});

const getStories = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ApiError(401, "User not verified");
  }
  const { _id, blocked } = req.user;

  const follow = await Follow.findOne({ user: _id });
  const followings = follow?.followings || [];

  const stories = await Story.find({
    user: {
      $in: followings,
      $nin: blocked,
    },
    blockedTo: blocked,
  }).populate({
    model: "user",
    path: "user",
    select: "username fullName avatar",
    strictPopulate: false,
  });
  if (!stories || stories.length === 0) {
    throw new ApiError(404, "No stories found");
  }

  return res.status(200).json(new ApiResponse(200, stories, "Stories found"));
});

const getUserStory = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ApiError(401, "User not verified");
  }
  const { _id } = req.user;
  const { userId } = req.query;

  const stories = await Story.findOne({
    user: userId || _id,
  }).populate({
    model: "user",
    path: "likes seenBy user",
    select: "username fullName avatar",
    strictPopulate: false,
  });

  if (!stories) {
    throw new ApiError(404, "No stories found");
  }

  return res.status(200).json(new ApiResponse(200, stories, "Stories found"));
});

const deleteStory = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ApiError(401, "User not verified");
  }
  const { _id } = req.user;
  const { storyId } = req.params;

  const story = await Story.findById(storyId);
  if (!story) {
    throw new ApiError(404, "Story not found");
  }

  if (story.user.toString() !== _id.toString()) {
    throw new ApiError(401, "User not authorized");
  }

  await Promise.all(
    story.media.map(async (link: string) => deleteFromCloudinary(link))
  );
  await story.deleteOne();

  return res.status(200).json(new ApiResponse(200, {}, "Story deleted"));
});

const seenStory = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ApiError(401, "User not verified");
  }
  const { _id } = req.user;
  const { storyId } = req.params;

  const story = await Story.findById(storyId);
  if (!story) {
    throw new ApiError(404, "Story not found");
  }

  if (story.seenBy.includes(_id)) {
    throw new ApiError(400, "Story already seen");
  }

  await story.updateOne({ $push: { seenBy: _id } }, { new: true });
  story.seenBy = [...story.seenBy, _id];

  return res.status(200).json(new ApiResponse(200, {}, "Story seen"));
});

const likeStory = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ApiError(401, "User not verified");
  }
  const { _id, avatar, username } = req.user;
  const { storyId } = req.params;

  const story = await Story.findById(storyId);
  if (!story) {
    throw new ApiError(404, "Story not found");
  }

  if (story.likes.includes(_id)) {
    throw new ApiError(400, "Story already liked");
  }

  await story.updateOne({ $push: { likes: _id } }, { new: true });
  story.likes = [...story.likes, _id];

  if (story.user.toString() === _id.toString()) {
    await NotificationModel.create({
      title: `Story Liked`,
      description: `${username} liked your story`,
      user: story.user,
      entityId: story._id,
      link: `/${username}`,
    });

    const notificationPreference = await NotificationPreferences.findOne({
      user: story.user,
    });
    if (
      notificationPreference?.firebaseTokens.length &&
      notificationPreference?.pushNotifications.storyLikes
    ) {
      await Promise.all(
        notificationPreference.firebaseTokens.map(async (token) => {
          await sendNotification({
            title: "Story Liked`,",
            body: `${_id} liked your story`,
            token,
            image: avatar,
          });
        })
      );
    }
  }

  return res.status(200).json(new ApiResponse(200, {}, "Story liked"));
});

const unlikeStory = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ApiError(401, "User not verified");
  }
  const { _id } = req.user;
  const { storyId } = req.params;

  const story = await Story.findById(storyId);
  if (!story) {
    throw new ApiError(404, "Story not found");
  }

  if (!story.likes.includes(_id)) {
    throw new ApiError(400, "Story already unliked");
  }

  await story.updateOne({ $pull: { likes: _id } }, { new: true });
  await NotificationModel.findOneAndDelete({
    title: `Story Liked`,
    user: story.user,
    entityId: story._id,
  });

  return res.status(200).json(new ApiResponse(200, {}, "Story unliked"));
});

const deleteExpiredImages = asyncHandler(async (_: Request, res: Response) => {
  const result = await cloudinary.search
    .expression(`folder=sociial/stories AND uploaded_at<1d`)
    .max_results(50)
    .execute();

  if (!result) {
    throw new ApiError(
      404,
      "Something went wrong while deleting expired images"
    );
  } else if (result.total_count === 0) {
    return res
      .status(200)
      .json(new ApiResponse(200, {}, "No expired images found"));
  } else {
    await Promise.all(
      result.resources.map((resource: { public_id: string }) =>
        deleteFromCloudinary(resource.public_id)
      )
    );
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        deleted: result.resources.length,
      },
      "Deleted expired images"
    )
  );
});

export {
  getStories,
  markSelfSeen,
  createStory,
  getUserStory,
  replyStory,
  deleteStory,
  seenStory,
  likeStory,
  unlikeStory,
  deleteExpiredImages,
};
