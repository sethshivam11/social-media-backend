import { asyncHandler } from "../utils/AsyncHandler";
import { ApiResponse } from "../utils/ApiResponse";
import { ApiError } from "../utils/ApiError";
import { Request, Response } from "express";
import { Story } from "../models/story.model";
import { deleteFromCloudinary, uploadToCloudinary } from "../utils/cloudinary";
import { File } from "./user.controller";
import { NotificationModel } from "../models/notification.model";
import sendNotification from "../helpers/firebase";
import { NotificationPreferences } from "../models/notificationpreferences.model";

const createStory = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ApiError(401, "User not verified");
  }
  const { _id, blocked } = req.user;
  const { captions, tags } = req.body;

  if (!req.files || req.files.length === 0) {
    throw new ApiError(400, "Atleast one media file is required");
  }

  let media = [];
  const files: File[] = req.files as File[];
  const saveToCloudinary = await Promise.all(
    files.map(async (file: File) => uploadToCloudinary(file.path, true))
  );

  media = saveToCloudinary.map((file, index) => {
    if (!file?.secure_url) return { url: "", caption: "" };
    return { url: file?.secure_url, caption: captions ? captions[index] : "" };
  });

  if (media.length === 0) {
    throw new ApiError(400, "Something went wrong, while uploading story");
  }

  const story = await Story.create({
    user: _id,
    media,
    tags,
    blockedTo: blocked,
  });

  if (!story) {
    throw new ApiError(500, "Story not uploaded");
  }

  return res.status(201).json(new ApiResponse(201, story, "Story uploaded"));
});

const getStories = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ApiError(401, "User not verified");
  }
  const { _id, blocked } = req.user;

  const follow = await Story.aggregate([
    {
      $lookup: {
        from: "follows",
        localField: "user",
        foreignField: "user",
        as: "follow",
      },
    },
    {
      $match: {
        $expr: {
          $eq: ["$user", _id],
        },
      },
    },
    {
      $unwind: "$follow",
    },
    {
      $project: {
        follow: 1,
      },
    },
    {
      $limit: 1,
    },
  ]);

  if (follow.length === 0 || follow[0].follow.followings.length === 0) {
    throw new ApiError(404, "User not following anyone");
  }

  const stories = await Story.find({
    user: {
      $in: follow[0].follow.followings,
      $nin: blocked,
    },
    blockedTo: { $nin: [_id] },
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
  const { storyId } = req.params;

  const stories = await Story.find({ user: storyId });
  if (!stories || stories.length === 0) {
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
  const mediaFiles: string[] = story.media.map((media) => media.url);

  await Promise.all(
    mediaFiles.map(async (link: string) => deleteFromCloudinary(link))
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

  return res.status(200).json(new ApiResponse(200, story, "Story seen"));
});

const likeStory = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ApiError(401, "User not verified");
  }
  const { _id, avatar } = req.user;
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

  await NotificationModel.create({
    title: `Story Liked`,
    description: `${_id} liked your story`,
    user: story.user,
  });

  const notificationPreference = await NotificationPreferences.findOne({
    user: story.user,
  });
  if (
    notificationPreference &&
    notificationPreference.firebaseToken &&
    notificationPreference.pushNotifications.storyLikes
  ) {
    sendNotification({
      title: "Story Liked`,",
      body: `${_id} liked your story`,
      token: notificationPreference.firebaseToken,
      image: avatar,
    });
  }

  return res.status(200).json(new ApiResponse(200, story, "Story liked"));
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
  await NotificationModel.create({
    title: `Story Liked`,
    user: story.user,
  });

  return res.status(200).json(new ApiResponse(200, {}, "Story unliked"));
});

export {
  getStories,
  createStory,
  getUserStory,
  deleteStory,
  seenStory,
  likeStory,
  unlikeStory,
};
