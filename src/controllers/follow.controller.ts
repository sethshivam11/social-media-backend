import { Follow } from "../models/follow.model";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/AsyncHandler";
import { Request, Response } from "express";
import { NotificationModel } from "../models/notification.model";
import { NotificationPreferences } from "../models/notificationpreferences.model";
import sendNotification from "../helpers/firebase";
import { User } from "../models/user.model";

const follow = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ApiError(400, "User not verified");
  }
  const currentUser = req.user;

  const { userId, username } = req.query;
  if (!userId && !username) {
    throw new ApiError(400, "Followee is required");
  }
  if (username === currentUser.username || userId === currentUser._id) {
    throw new ApiError(400, "You can't follow yourself");
  }

  const followeeDetails = await User.findOne({
    $or: [{ _id: userId }, { username }],
  }).select("fullName username avatar");
  if (!followeeDetails) {
    throw new ApiError(404, "Something went wrong, while following");
  }

  const followeeId = followeeDetails._id;
  const follow = await Follow.findOne({ user: currentUser._id });

  // Create new follow if null
  if (!follow) {
    const newFollow = await Follow.create({
      user: currentUser._id,
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
      description: `${currentUser.username} started following you`,
      user: followeeId,
    });

    const notificationPreference = await NotificationPreferences.findOne({
      user: followeeId,
    });
    if (
      notificationPreference &&
      notificationPreference.firebaseTokens &&
      notificationPreference.firebaseTokens.length &&
      notificationPreference.pushNotifications.newFollowers
    ) {
      notificationPreference.firebaseTokens.forEach((token) => {
        sendNotification({
          title: "New Follower",
          body: `${currentUser.username} started following you`,
          token,
        });
      });
    }

    return res
      .status(200)
      .json(new ApiResponse(200, { follow: followeeDetails }, "Followed user"));
  }

  // Update follow if found
  else {
    if (follow.followings.includes(followeeId)) {
      throw new ApiError(409, "Follower already followed");
    }
    follow.followings = [...follow.followings, followeeId];

    await follow.save().then(async () => await follow.follow(followeeId));
    await NotificationModel.create({
      title: `New Follower`,
      description: `${currentUser.username} started following you`,
      user: followeeId,
    });

    const notificationPreference = await NotificationPreferences.findOne({
      user: followeeId,
    });
    if (
      notificationPreference &&
      notificationPreference.firebaseTokens &&
      notificationPreference.firebaseTokens.length &&
      notificationPreference.pushNotifications.newFollowers
    ) {
      notificationPreference.firebaseTokens.forEach((token) => {
        sendNotification({
          title: "New Follower",
          body: `${currentUser.username} started following you`,
          token,
        });
      });
    }

    return res
      .status(200)
      .json(new ApiResponse(200, { follow: followeeDetails }, "Followed user"));
  }
});

const unfollow = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ApiError(400, "User not verified");
  }
  const { _id } = req.user;

  const { userId, username } = req.query;
  if (!userId && !username) {
    throw new ApiError(400, "Unfollowee is required");
  }
  if (userId === _id || username === req.user.username) {
    throw new ApiError(400, "You can't unfollow yourself");
  }

  const unfolloweeDetails = await User.findOne({
    $or: [{ _id: userId }, { username }],
  }).select("fullName username avatar");
  if (!unfolloweeDetails) {
    throw new ApiError(404, "Something went wrong, while unfollowing");
  }

  const follow = await Follow.findOne({ user: _id });

  if (!follow) {
    throw new ApiError(404, "Follow not found");
  }

  if (!follow.followings.includes(unfolloweeDetails._id)) {
    throw new ApiError(404, "Follower already unfollowed");
  }

  await follow
    .updateOne({ $pull: { followings: unfolloweeDetails._id } }, { new: true })
    .then(async () => await follow.unfollow(unfolloweeDetails._id));
  await NotificationModel.findOneAndDelete({
    user: unfolloweeDetails._id,
    title: `New Follower`,
  });

  return res
    .status(200)
    .json(
      new ApiResponse(200, { unfollow: unfolloweeDetails }, "Unfollowed user")
    );
});

const getFollowers = asyncHandler(async (req: Request, res: Response) => {
  const { userId, username } = req.query;
  if (!userId && !username) {
    throw new ApiError(400, "User is required");
  }

  const user = await User.findOne({ $or: [{ _id: userId }, { username }] });
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const follow = await Follow.findOne({ user: user._id }, "followers").populate(
    {
      path: "followers",
      select: "fullName username avatar",
      model: "user",
      strictPopulate: false,
    }
  );

  if (!follow || !follow.followers.length) {
    throw new ApiError(404, "Followers not found");
  }

  return res.status(200).json(new ApiResponse(200, follow, "Followers found"));
});

const getFollowings = asyncHandler(async (req: Request, res: Response) => {
  const { userId, username } = req.query;
  if (!userId && !username) {
    throw new ApiError(400, "User is required");
  }

  const user = await User.findOne({ $or: [{ _id: userId }, { username }] });
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const follow = await Follow.findOne(
    { user: user._id },
    "followings"
  ).populate({
    path: "followings",
    select: "fullName username avatar",
    model: "user",
    strictPopulate: false,
  });

  if (!follow || !follow.followings.length) {
    throw new ApiError(404, "Followers not found");
  }

  return res.status(200).json(new ApiResponse(200, follow, "Followers found"));
});

export { follow, unfollow, getFollowers, getFollowings };
