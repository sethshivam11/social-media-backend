import { asyncHandler } from "../utils/AsyncHandler";
import { ApiError } from "../utils/ApiError";
import { Request, Response } from "express";
import { ApiResponse } from "../utils/ApiResponse";
import { Post } from "../models/post.model";
import { File } from "./user.controller";
import {
  cleanupFiles,
  deleteFromCloudinary,
  uploadToCloudinary,
} from "../utils/cloudinary";
import { NotificationModel } from "../models/notification.model";
import { NotificationPreferences } from "../models/notificationpreferences.model";
import sendNotification from "../helpers/firebase";
import { Follow } from "../models/follow.model";
import mongoose from "mongoose";
import { Comment } from "../models/comment.model";

const limit = 20;
let pageNo = 1;

const createPost = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    cleanupFiles();
    throw new ApiError(401, "User not verified");
  }

  const { _id } = req.user;

  const { caption, kind } = req.body;

  const mediaFiles = req.files as File[];
  if (!mediaFiles || !mediaFiles.length) {
    cleanupFiles();
    throw new ApiError(404, "Post image or video is required");
  }
  let media: string[] = [];

  if (kind === "video") {
    if (!mediaFiles[0].mimetype.includes("video")) {
      cleanupFiles();
      throw new ApiError(400, "Invalid media file type");
    }

    const upload = await uploadToCloudinary(mediaFiles[0].path, "videos");
    if (upload && upload.secure_url) media.push(upload.secure_url);

    if (!media || !media.length) {
      throw new ApiError(
        400,
        "Something went wrong, while uploading post media"
      );
    }

    const post = await Post.create({
      user: _id,
      caption,
      media,
      kind: "video",
    });
    await post.updatePostCount();

    if (!post) {
      throw new ApiError(400, "Something went wrong, while posting");
    }

    return res
      .status(201)
      .json(new ApiResponse(200, post, "Post created successfully"));
  }

  await Promise.all(
    mediaFiles.map(async (file) => {
      if (file.mimetype.includes("image")) {
        const upload = await uploadToCloudinary(file.path, "posts");
        if (upload && upload.secure_url) media.push(upload.secure_url);
      }
    })
  );

  if (!media || !media.length) {
    cleanupFiles();
    throw new ApiError(400, "Something went wrong, while uploading post media");
  }

  const post = await Post.create({
    user: _id,
    caption,
    media,
    kind: "image",
  });
  await post.updatePostCount();

  if (!post) {
    throw new ApiError(400, "Something went wrong, while posting");
  }

  return res
    .status(201)
    .json(new ApiResponse(200, post, "Post created successfully"));
});

const deletePost = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ApiError(401, "User not verified");
  }

  const { _id } = req.user;
  const { postId } = req.params;
  if (!postId) {
    throw new ApiError(400, "Post id is required");
  }

  const post = await Post.findById(postId, "-likes");
  if (!post) {
    throw new ApiError(404, "Post not found");
  }

  if (post.user.toString() !== _id.toString()) {
    throw new ApiError(403, "Unauthorized request");
  }

  await Promise.all(
    post.media.map(async (media) => deleteFromCloudinary(media))
  );
  await Comment.deleteMany({ post: postId });
  await post.deleteOne();

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Post deleted successfully"));
});

const getUserPosts = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ApiError(401, "User not verified");
  }
  const { userId } = req.params;
  const { page } = req.query;
  if (!userId) {
    throw new ApiError(400, "User id is required");
  }
  if (page) {
    pageNo = parseInt(page as string);
    if (pageNo <= 0) {
      pageNo = 1;
    }
  }

  // first post with user's details
  const firstPost = await Post.findOne({ user: userId }, "-likes").populate({
    path: "user",
    model: "user",
    select: "username fullName avatar followingCount followersCount postsCount",
    strictPopulate: false,
  });

  if (!firstPost) {
    throw new ApiError(404, "No posts found");
  }

  // rest posts without user's details
  const restPosts = await Post.find({ user: userId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(pageNo === 1 ? 1 : (pageNo - 1) * limit);

  const posts = [firstPost, ...(restPosts || [])];

  return res
    .status(200)
    .json(new ApiResponse(200, posts, "Posts retrieved successfully"));
});

const getPost = asyncHandler(async (req: Request, res: Response) => {
  const { postId } = req.params;
  if (!postId) {
    throw new ApiError(400, "Post id is required");
  }

  const { page } = req.query;
  if (page) {
    pageNo = parseInt(page as string);
    if (pageNo <= 0) {
      pageNo = 1;
    }
  }

  const post = await Post.findById(postId, "-likes").populate({
    model: "user",
    path: "user",
    select: "username avatar fullName followersCount followingCount postsCount",
    strictPopulate: false,
  });

  if (!post) {
    throw new ApiError(404, "Post not found");
  }

  // const relatedPosts = await Post.find({
  //   user: post?.user,
  //   _id: { $nin: [post._id] },
  // }).limit(6);

  return res
    .status(200)
    .json(new ApiResponse(200, { post }, "Post retrieved successfully"));
});

const createFeed = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ApiError(401, "User not verified");
  }

  const { _id, blocked } = req.user;
  const { page } = req.query;

  if (page) {
    pageNo = parseInt(page as string);
    if (pageNo <= 0) {
      pageNo = 1;
    }
  }
  console.log(_id, blocked);

  const follow = await Follow.findOne({ user: _id });
  const followings = follow?.followings || [];

  const totalCount = await Post.countDocuments({
    user: { $in: [], $nin: [] },
  });

  // Get posts of the users that the logged in user is following
  const posts = await Post.find(
    {
      user: { $in: followings, $nin: blocked },
    },
    "-likes"
  )
    .populate({
      model: "user",
      path: "user",
      select: "username avatar fullName",
      strictPopulate: false,
    })
    .limit(limit)
    .skip((pageNo - 1) * limit);

  if (!posts || posts.length === 0) {
    throw new ApiError(404, "No posts found");
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        posts,
        max: totalCount,
        page: pageNo,
      },
      "Posts retrieved successfully"
    )
  );
});

const explorePosts = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ApiError(401, "User not verified");
  }
  const { _id, blocked } = req.user;
  const { page } = req.query;

  const follow = await Follow.findOne({ user: _id });
  const followings = follow?.followings || [];

  if (page) {
    pageNo = parseInt(page as string);
    if (pageNo <= 0) {
      pageNo = 1;
    }
  }

  const totalCount = await Post.countDocuments({
    user: { $nin: [...followings, ...blocked] },
  });

  const posts = await Post.find(
    {
      user: { $nin: [...followings, ...blocked] },
    },
    "-likes"
  )
    .populate({
      model: "user",
      path: "user",
      select: "user fullName avatar",
      strictPopulate: false,
    })
    .limit(pageNo)
    .skip((pageNo - 1) * limit);

  if (!posts || posts.length === 0) {
    throw new ApiError(404, "No posts found");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { posts, max: totalCount },
        "Posts retrieved successfully"
      )
    );
});

const likePost = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ApiError(401, "User not verified");
  }
  const { _id, avatar, username } = req.user;

  const { postId } = req.params;
  if (!postId) {
    throw new ApiError(400, "Post id is required");
  }

  const post = await Post.findById(postId, "likes likesCount user");
  if (!post) {
    throw new ApiError(404, "Post not found");
  }

  if (!post.likes.includes(_id)) {
    post.likes = [...post.likes, _id];
    post.likesCount += 1;
    post.save();
  }

  await NotificationModel.create({
    title: `Post Liked`,
    entityId: postId,
    description: `${username} liked your post`,
    user: post.user,
  });

  const notificationPreference = await NotificationPreferences.findOne({
    user: post.user,
  });
  if (
    notificationPreference &&
    notificationPreference.firebaseToken &&
    notificationPreference.pushNotifications.likes
  ) {
    sendNotification({
      title: "Post Liked",
      body: `${username} liked your post`,
      token: notificationPreference.firebaseToken,
      image: avatar,
    });
  }

  return res
    .status(200)
    .json(new ApiResponse(200, post, "Post liked successfully"));
});

const dislikePost = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ApiError(401, "User not verified");
  }
  const { _id } = req.user;

  const { postId } = req.params;
  if (!postId) {
    throw new ApiError(400, "Post id is required");
  }

  const post = await Post.findById(postId, "likes likesCount user");
  if (!post) {
    throw new ApiError(404, "Post not found");
  }

  if (post.likes.includes(_id)) {
    post.likes = post.likes.filter(
      (like) => like.toString() !== _id.toString()
    );
    post.likesCount -= 1;
    post.save();
  }

  await NotificationModel.findOneAndDelete({
    title: "Post Liked",
    entityId: postId,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, post, "Post disliked successfully"));
});

const getLikes = asyncHandler(async (req: Request, res: Response) => {
  const { postId } = req.params;
  if (!postId) {
    throw new ApiError(400, "Post id is required");
  }

  const post = await Post.findById(postId, "likes likesCount").populate({
    model: "user",
    path: "likes",
    select: "avatar fullName username",
    strictPopulate: false,
  });

  if (!post || !post.likes.length) {
    throw new ApiError(404, "No likes found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, post.likes, "Likes retrieved successfully"));
});

export {
  createPost,
  deletePost,
  getUserPosts,
  createFeed,
  likePost,
  dislikePost,
  getPost,
  explorePosts,
  getLikes,
};
