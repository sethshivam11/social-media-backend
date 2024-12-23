import { Request, Response } from "express";
import { asyncHandler } from "../utils/AsyncHandler";
import { ApiError } from "../utils/ApiError";
import { Comment } from "../models/comment.model";
import { ApiResponse } from "../utils/ApiResponse";
import { NotificationModel } from "../models/notification.model";
import { NotificationPreferences } from "../models/notificationpreferences.model";
import sendNotification from "../helpers/firebase";

const getAllComments = asyncHandler(async (req: Request, res: Response) => {
  const { postId } = req.params;
  if (!postId) {
    throw new ApiError(400, "Post id is required");
  }

  const comments = await Comment.find({ post: postId }).populate({
    path: "user",
    model: "user",
    select: "username avatar fullName",
    strictPopulate: false,
  });
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
  const { _id, username, avatar, fullName } = req.user;
  const { postId, content } = req.body;
  if (!postId || !content) {
    throw new ApiError(400, "Post id and comment are required");
  }

  const comment = await Comment.create({
    post: postId,
    user: _id,
    content,
  });
  if (!comment) {
    throw new ApiError(400, "Something went wrong, while creating comment");
  }

  await comment.updateCommentsCount(postId, 1);

  if (comment.user.toString() !== _id.toString()) {
    await NotificationModel.create({
      title: "New Comment",
      description: `${username} commented on your post`,
      user: _id,
      entityId: comment._id,
      link: `/post/${postId}`,
      type: "comment",
    });

    const notificationPreference = await NotificationPreferences.findOne({
      user: comment.user,
    });
    if (
      notificationPreference?.firebaseTokens.length &&
      notificationPreference.pushNotifications.comments
    ) {
      await Promise.all(
        notificationPreference.firebaseTokens.map((token) => {
          sendNotification({
            title: "New Comment",
            body: `${username} commented on your post`,
            token,
            image: avatar,
          });
        })
      );
    }
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { ...comment.toObject(), user: { _id, username, avatar, fullName } },
        "Comment created successfully"
      )
    );
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

  const comment = await Comment.findById(commentId).populate({
    model: "post",
    path: "post",
    select: "user",
    strictPopulate: false,
  });

  if (!comment) {
    throw new ApiError(404, "Comment not found");
  }

  if (
    comment.user.toString() !== _id.toString() &&
    ("user" in comment.post &&
      comment.post.user &&
      comment.post.user.toString() !== _id.toString())
  ) {
    throw new ApiError(401, "You are not authorized to delete this comment");
  }
  
  await comment.deleteOne();
  await comment.updateCommentsCount(comment.post, -1);

  await NotificationModel.findOneAndDelete({
    user: comment.user,
    entityId: commentId,
    link: `/post/${comment.post}`,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Comment deleted successfully"));
});

const likeComment = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ApiError(401, "User not verified");
  }
  const { _id, username, avatar } = req.user;

  const { commentId } = req.params;
  if (!commentId) {
    throw new ApiError(400, "Comment id is required");
  }

  const comment = await Comment.findById(commentId);
  if (!comment) {
    throw new ApiError(404, "Comment not found");
  }

  if (comment.likes.includes(_id)) {
    throw new ApiError(400, "You have already liked this comment");
  }
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
      description: `${username} liked your comment`,
      user: comment.user,
      link: `/posts/${comment.post}`,
    });

    const notificationPreference = await NotificationPreferences.findOne({
      user: comment.user,
    });
    if (
      notificationPreference?.firebaseTokens.length &&
      notificationPreference.pushNotifications.commentLikes
    ) {
      await Promise.all(
        notificationPreference.firebaseTokens.map((token) => {
          sendNotification({
            title: "Comment Liked",
            body: `Your comment was liked by @${username}`,
            token,
            image: avatar,
          });
        })
      );
    }
  }

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Comment liked successfully"));
});

const unlikeComment = asyncHandler(async (req: Request, res: Response) => {
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

  if (!comment.likes.includes(_id)) {
    throw new ApiError(400, "You have already unliked this comment");
  }
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

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Comment unliked successfully"));
});

const getCommentLikes = asyncHandler(async (req: Request, res: Response) => {
  const { commentId } = req.params;
  if (!commentId) {
    throw new ApiError(400, "Comment id is required");
  }

  const comment = await Comment.findOne({ _id: commentId }).populate({
    path: "likes",
    model: "user",
    select: "username avatar fullName",
    strictPopulate: false,
  });

  if (!comment) {
    throw new ApiError(404, "Comment not found");
  }

  if (!comment.likes || !comment.likes.length) {
    throw new ApiError(404, "No likes found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, comment.likes, "Likes retrieved successfully"));
});

export {
  getAllComments,
  createComment,
  deleteComment,
  likeComment,
  unlikeComment,
  getCommentLikes,
};
