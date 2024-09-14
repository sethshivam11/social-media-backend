import { Request, Response } from "express";
import { asyncHandler } from "../utils/AsyncHandler";
import { ApiError } from "../utils/ApiError";
import { Comment } from "../models/comment.model";
import { ApiResponse } from "../utils/ApiResponse";
import { NotificationModel } from "../models/notification.model";
import { NotificationPreferences } from "../models/notificationpreferences.model";
import sendNotification from "../helpers/firebase";

const getAllComments = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ApiError(401, "User not verified");
  }
  const { postId } = req.params;
  if (!postId) {
    throw new ApiError(400, "Post id is required");
  }

  const comments = await Comment.find({ post: postId });
  if (!comments || comments.length === 0) {
    throw new ApiError(404, "No comments found");
  }

  return res
    .status(201)
    .json(new ApiResponse(200, comments, "Comments retrieved successfully"));
});

const createComment = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ApiError(401, "User not verified");
  }
  const { _id, username } = req.user;
  const { postId, comment } = req.body;
  if (!postId || !comment) {
    throw new ApiError(400, "Post id and comment are required");
  }

  const notificationPreference = await NotificationPreferences.findOne({
    user: _id,
  });
  if (
    notificationPreference &&
    notificationPreference.firebaseTokens &&
    notificationPreference.firebaseTokens.length &&
    notificationPreference.pushNotifications.comments
  ) {
    notificationPreference.firebaseTokens.forEach((token) => {
      sendNotification({
        title: "New Comment",
        body: `${username} commented on your post`,
        token,
      });
    });
  }

  const newComment = await Comment.create({
    post: postId,
    user: _id,
    content: comment,
  });
  if (!newComment) {
    throw new ApiError(400, "Something went wrong, while creating comment");
  }

  await NotificationModel.create({
    title: "New Comment",
    description: `${username} commented on your post`,
    user: _id,
    entityId: newComment._id,
    link: `/posts/${postId}`,
    type: "comment",
  });

  await newComment.updateCommentsCount(postId, 1);

  return res
    .status(200)
    .json(new ApiResponse(200, newComment, "Comment created successfully"));
});

const deleteComment = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ApiError(401, "User not verified");
  }
  const { _id } = req.user;

  const { commentId } = req.params;
  if (!commentId) {
    throw new ApiError(400, "Comment id is required");
  }

  const comment = await Comment.findById(commentId);
  if (!comment) {
    throw new ApiError(404, "Comment not found");
  }

  if (comment.user.toString() !== _id.toString()) {
    throw new ApiError(401, "You are not authorized to delete this comment");
  }

  await comment.deleteOne();
  await comment.updateCommentsCount(comment.post, -1);

  await NotificationModel.findOneAndDelete({
    user: comment.user,
    entityId: commentId,
    link: `/posts/${comment.post}`,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Comment deleted successfully"));
});

const likeComment = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ApiError(401, "User not verified");
  }
  const { _id, username } = req.user;

  const { commentId } = req.params;
  if (!commentId) {
    throw new ApiError(400, "Comment id is required");
  }

  const comment = await Comment.findById(commentId);
  if (!comment) {
    throw new ApiError(404, "Comment not found");
  }

  if (!comment.likes.includes(_id)) {
    await comment.updateOne(
      { $push: { likes: _id }, $inc: { likesCount: 1 } },
      { new: true }
    );
    comment.likes = [...comment.likes, _id];
    comment.likesCount = (comment.likesCount as number) + 1;

    if (comment.user.toString() !== _id.toString()) {
      await NotificationModel.create({
        title: `Comment Liked`,
        entityId: commentId,
        description: `Your comment was liked by @${username}`,
        user: comment.user,
        link: `/posts/${comment.post}`,
      });
    }

    const notificationPreference = await NotificationPreferences.findOne({
      user: comment.user,
    });
    if (
      notificationPreference &&
      notificationPreference.firebaseTokens &&
      notificationPreference.firebaseTokens.length &&
      notificationPreference.pushNotifications.commentLikes
    ) {
      notificationPreference.firebaseTokens.forEach((token) => {
        sendNotification({
          title: "New Group Chat",
          body: `${username} added you to a group`,
          token,
        });
      });
    }
  }

  return res
    .status(200)
    .json(new ApiResponse(200, comment, "Comment liked successfully"));
});

const dislikeComment = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ApiError(401, "User not verified");
  }
  const { _id } = req.user;

  const { commentId } = req.params;
  if (!commentId) {
    throw new ApiError(400, "Comment id is required");
  }

  const comment = await Comment.findById(commentId);
  if (!comment) {
    throw new ApiError(404, "Comment not found");
  }

  if (comment.likes.includes(_id)) {
    await comment.updateOne(
      { $pull: { likes: _id }, $inc: { likesCount: -1 } },
      { new: true }
    );
    comment.likes = comment.likes.filter(
      (id) => id.toString() !== _id.toString()
    );
    comment.likesCount = comment.likesCount - 1;
    await NotificationModel.deleteOne({
      entityId: commentId,
      title: `Comment Liked`,
      user: comment.user,
    });
  }

  return res
    .status(200)
    .json(new ApiResponse(200, comment, "Comment disliked successfully"));
});

export {
  getAllComments,
  createComment,
  deleteComment,
  likeComment,
  dislikeComment,
};
