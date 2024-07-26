import mongoose from "mongoose";
import { Follow, FollowInterface } from "../models/follow.model";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/AsyncHandler";
import { Request, Response } from "express";
import { NotificationModel } from "../models/notification.model";
import { NotificationPreferences } from "../models/notificationpreferences.model";
import sendNotification from "../helpers/firebase";

// limit number of followers for pagination
const limit = 20;
let pageNo = 1;

const follow = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ApiError(400, "User not verified");
  }
  const { _id, username } = req.user;

  const { followee } = req.params;
  if (!followee) {
    throw new ApiError(400, "Followee is required");
  }

  const followeeId = new mongoose.Schema.Types.ObjectId(followee);
  const follow: FollowInterface | null = await Follow.findOne({ user: _id });

  // Create new follow if null
  if (!follow) {
    const newFollow = await Follow.create({
      user: _id,
      followings: [followeeId],
    });

    if (!newFollow) {
      throw new ApiError(
        400,
        "Something went wrong, while updating the followers"
      );
    }
    await newFollow.follow(followeeId);
    await NotificationModel.create({
      title: `New Follower`,
      description: `${username} started following you`,
      user: followeeId,
    });

    const notificationPreference = await NotificationPreferences.findOne({
      user: followeeId,
    });
    if (
      notificationPreference &&
      notificationPreference.firebaseToken &&
      notificationPreference.pushNotifications.newFollowers
    ) {
      sendNotification({
        title: "New Follower",
        body: `${username} started following you`,
        token: notificationPreference.firebaseToken,
      });
    }

    return res
      .status(200)
      .json(new ApiResponse(200, newFollow, "Followed user"));
  }

  // Update follow if found
  else {
    if (follow.followings.includes(followeeId)) {
      throw new ApiError(409, "Follower already followed");
    }
    follow.followings = [...follow.followings, followeeId];

    await follow.save().then(async () => await follow.follow(followeeId));

    return res.status(200).json(new ApiResponse(200, follow, "Followed user"));
  }
});

const unfollow = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ApiError(400, "User not verified");
  }
  const { _id, username } = req.user;

  const { unfollowee } = req.params;
  if (!unfollowee) {
    throw new ApiError(400, "Unfollowee is required");
  }

  const unfolloweeId = new mongoose.Schema.Types.ObjectId(unfollowee);
  const follow: FollowInterface | null = await Follow.findOne({ user: _id });

  if (!follow) {
    throw new ApiError(404, "Follow not found");
  }

  if (!follow.followings.includes(unfolloweeId)) {
    throw new ApiError(404, "Follower already unfollowed");
  }

  await follow
    .updateOne({ $pull: { followings: unfollowee } }, { new: true })
    .then(async () => await follow.unfollow(unfolloweeId));
  await NotificationModel.findOneAndDelete({
    user: unfolloweeId,
    title: `New Follower`,
  });

  return res.status(200).json(new ApiResponse(200, {}, "Unfollowed user"));
});

const getFollowers = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ApiError(400, "User not verified");
  }
  const { _id } = req.user;
  const { page } = req.query;

  if (page) {
    pageNo = parseInt(page as string);
    if (pageNo <= 0) {
      pageNo = 1;
    }
  }

  const follow: FollowInterface | null = await Follow.findOne({ user: _id })
    .populate({
      path: "followers",
      select: "fullName username avatar",
      model: "user",
      strictPopulate: false,
    })
    .limit(limit)
    .skip((pageNo - 1) * limit);

  if (!follow) {
    throw new ApiError(404, "Followers not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, follow.followers, "Followers found"));
});

const getFollowing = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ApiError(400, "User not verified");
  }
  const { _id } = req.user;
  const { page } = req.query;

  if (page) {
    pageNo = parseInt(page as string);
    if (pageNo <= 0) {
      pageNo = 1;
    }
  }

  const follow: FollowInterface | null = await Follow.findOne({ user: _id })
    .populate({
      path: "followings",
      select: "fullName username avatar",
      model: "user",
      strictPopulate: false,
    })
    .limit(limit)
    .skip((pageNo - 1) * limit);

  if (!follow) {
    throw new ApiError(404, "Followings not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, follow.followings, "Followings found"));
});

const getSuggestions = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ApiError(401, "User not verified");
  }

  const { all } = req.query;
  const { _id } = req.user;

  const user = await Follow.find({
    user: { $nin: [_id] },
    $limit: all ? 30 : 5,
  }).populate({
    path: "user",
    select: "fullName username avatar",
    model: "user",
    strictPopulate: false,
  });

  if (!user) {
    throw new ApiError(404, "No suggestions found");
  }

  return res.status(200).json(new ApiResponse(200, user, "Suggestions found"));
});

export { follow, unfollow, getFollowers, getFollowing, getSuggestions };
