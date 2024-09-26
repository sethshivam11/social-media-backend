import { Request, Response } from "express";
import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/AsyncHandler";
import { NotificationPreferences } from "../models/notificationpreferences.model";
import { ApiResponse } from "../utils/ApiResponse";

const saveFirebaseToken = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ApiError(401, "User not verified");
  }

  const { _id } = req.user;
  const { token } = req.body;

  const savedNotificationPreferences = await NotificationPreferences.findOne({
    user: _id,
  });

  if (!savedNotificationPreferences) {
    await NotificationPreferences.create({
      user: _id,
      firebaseTokens: [token],
    });
    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Token saved successfully"));
  }
  if (!savedNotificationPreferences.firebaseTokens.includes(token)) {
    savedNotificationPreferences.firebaseTokens = [
      ...savedNotificationPreferences.firebaseTokens,
      token,
    ];
  }

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Token saved successfully"));
});

const getNotificationPreferences = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user) {
      throw new ApiError(401, "User not verified");
    }

    const { _id } = req.user;

    const savedNotificationPreferences = await NotificationPreferences.findOne({
      user: _id,
    });

    if (!savedNotificationPreferences) {
      throw new ApiError(404, "Notification preferences not found");
    }

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          savedNotificationPreferences,
          "Notification preferences fetched successfully"
        )
      );
  }
);

const updateNotificationPreferences = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user) {
      throw new ApiError(401, "User not verified");
    }

    const { _id } = req.user;
    const {
      likes,
      comments,
      commentLikes,
      storyLikes,
      newFollowers,
      newMessages,
      newGroups,
      newProducts,
      announcements,
      support,
    } = req.body;

    const savedNotificationPreferences = await NotificationPreferences.findOne({
      user: _id,
    });

    if (!savedNotificationPreferences) {
      throw new ApiError(404, "Notification preferences not found");
    }

    savedNotificationPreferences.pushNotifications.likes =
      likes !== undefined
        ? likes
        : savedNotificationPreferences.pushNotifications.likes;
    savedNotificationPreferences.pushNotifications.comments =
      comments !== undefined
        ? comments
        : savedNotificationPreferences.pushNotifications.comments;
    savedNotificationPreferences.pushNotifications.commentLikes =
      commentLikes !== undefined
        ? commentLikes
        : savedNotificationPreferences.pushNotifications.commentLikes;
    savedNotificationPreferences.pushNotifications.storyLikes =
      storyLikes !== undefined
        ? storyLikes
        : savedNotificationPreferences.pushNotifications.storyLikes;
    savedNotificationPreferences.pushNotifications.newFollowers =
      newFollowers !== undefined
        ? newFollowers
        : savedNotificationPreferences.pushNotifications.newFollowers;
    savedNotificationPreferences.pushNotifications.newMessages =
      newMessages !== undefined
        ? newMessages
        : savedNotificationPreferences.pushNotifications.newMessages;
    savedNotificationPreferences.pushNotifications.newGroups =
      newGroups !== undefined
        ? newGroups
        : savedNotificationPreferences.pushNotifications.newGroups;
    savedNotificationPreferences.emails.newProducts =
      newProducts !== undefined
        ? newProducts
        : savedNotificationPreferences.emails.newProducts;
    savedNotificationPreferences.emails.announcements =
      announcements !== undefined
        ? announcements
        : savedNotificationPreferences.emails.announcements;
    savedNotificationPreferences.emails.support =
      support !== undefined
        ? support
        : savedNotificationPreferences.emails.support;

    await savedNotificationPreferences.save();

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          pushNotifications: {
            likes,
            comments,
            commentLikes,
            storyLikes,
            newFollowers,
            newMessages,
            newGroups,
          },
          emails: {
            newProducts,
            announcements,
            support,
          },
        },
        "Push notification preferences updated successfully"
      )
    );
  }
);

const updateFirebaseToken = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user) {
      throw new ApiError(401, "User not verified");
    }
    const { _id } = req.user;
    const { prevToken, newToken } = req.body;

    const notificationPreference = await NotificationPreferences.findOne({
      user: _id,
    });
    if (!notificationPreference) {
      throw new ApiError(400, "Notification preferences not found");
    }

    notificationPreference.firebaseTokens =
      notificationPreference.firebaseTokens.map((token) => {
        if (token === prevToken) {
          return newToken;
        }
        return token;
      });

    notificationPreference.save();

    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Firebase token updated successfully"));
  }
);

const deleteFirebaseToken = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user) {
      throw new ApiError(401, "User not verified");
    }
    const { _id } = req.user;
    const { token } = req.params;

    const notificationPreference = await NotificationPreferences.findOne({
      user: _id,
    });
    if (!notificationPreference) {
      throw new ApiError(404, "Notification preferences not found");
    }

    notificationPreference.firebaseTokens.filter(
      (prevToken) => prevToken !== token
    );
    notificationPreference.save();

    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Firebase token deleted successfully"));
  }
);

export {
  saveFirebaseToken,
  updateFirebaseToken,
  getNotificationPreferences,
  updateNotificationPreferences,
  deleteFirebaseToken,
};
