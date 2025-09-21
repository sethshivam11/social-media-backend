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
import { Comment } from "../models/comment.model";
import { User } from "../models/user.model";

const limit = 20;
let pageNo = 1;

const createPost = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    cleanupFiles();
    throw new ApiError(401, "User not verified");
  }

  const { _id } = req.user;

  const { caption } = req.body;

  const mediaFiles = req.files as File[];
  if (!mediaFiles || !mediaFiles.length) {
    cleanupFiles();
    throw new ApiError(404, "Post image or video is required");
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
    populate: {
      model: "user",
      path: "user",
      select: "username fullName avatar",
      strictPopulate: false,
    },
  });
  await post.updatePostCount();

  if (!post) {
    throw new ApiError(400, "Something went wrong, while posting");
  }

  return res
    .status(201)
    .json(new ApiResponse(200, post, "Post created successfully"));
});

const createVideoPost = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ApiError(401, "User not verified");
  }
  const { _id } = req.user;
  const { caption } = req.body;

  const videoFiles = req.files as File[];
  const video = {
    media: "",
    thumbnail: "",
  };

  if (videoFiles.some((file) => file.size > 100000000)) {
    cleanupFiles();
    throw new ApiError(400, "Media file size should not exceed 100MB");
  }

  videoFiles.forEach(async (file) => {
    file.mimetype.includes("video")
      ? (video.media = file.path)
      : (video.thumbnail = file.path);
    file.mimetype.includes("image")
      ? (video.thumbnail = file.path)
      : (video.media = file.path);
  });

  if (!video.media || !video.thumbnail) {
    cleanupFiles();
    throw new ApiError(400, "Video or thumbnail files are required");
  }

  const videoUpload = await uploadToCloudinary(video.media, "videos");
  if (videoUpload && videoUpload.secure_url) {
    video.media = videoUpload.secure_url;
  }
  const uploadThumbnail = await uploadToCloudinary(video.thumbnail, "posts");
  if (uploadThumbnail && uploadThumbnail.secure_url) {
    video.thumbnail = uploadThumbnail.secure_url;
  }

  if (!video.media || !video.thumbnail) {
    cleanupFiles();
    await deleteFromCloudinary(video.media);
    await deleteFromCloudinary(video.thumbnail);
    throw new ApiError(400, "Something went wrong, while uploading post media");
  }

  const post = await Post.create({
    user: _id,
    caption,
    media: [video.media],
    kind: "video",
    thumbnail: video.thumbnail,
    populate: {
      model: "user",
      path: "user",
      select: "username fullName avatar",
      strictPopulate: false,
    },
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

  const post = await Post.findById(postId);
  if (!post) {
    throw new ApiError(404, "Post not found");
  }

  if (post.user.toString() !== _id.toString()) {
    throw new ApiError(403, "Unauthorized request");
  }

  await Promise.all(
    post.media.map(async (media) => deleteFromCloudinary(media))
  );
  if (post.thumbnail) {
    await deleteFromCloudinary(post.thumbnail || "");
  }

  await Comment.deleteMany({ post: postId });
  await post.deleteOne();

  await User.updateOne(
    { _id },
    {
      $inc: { postsCount: -1 },
    }
  );

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Post deleted successfully"));
});

const getUserPosts = asyncHandler(async (req: Request, res: Response) => {
  const { userId, username } = req.query;
  if (!userId && !username) {
    throw new ApiError(400, "Username or userId is required");
  }

  const user = await User.findOne({ $or: [{ _id: userId }, { username }] });
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const posts = await Post.find({
    user: user._id,
  })
    .populate({
      model: "user",
      path: "user",
      select: "avatar fullName username",
      strictPopulate: false,
    })
    .populate("likesPreview")
    .sort({ createdAt: -1 });

  return res
    .status(200)
    .json(new ApiResponse(200, posts, "Posts retrieved successfully"));
});

const getPost = asyncHandler(async (req: Request, res: Response) => {
  const { postId } = req.params;
  if (!postId) {
    throw new ApiError(400, "Post id is required");
  }

  const post = await Post.findById(postId)
    .populate({
      model: "user",
      path: "user",
      select:
        "username avatar fullName followersCount followingCount postsCount",
      strictPopulate: false,
    })
    .populate("likesPreview");

  if (!post) {
    throw new ApiError(404, "Post not found");
  }

  const relatedPosts = await Post.find({
    user: post.user,
    _id: { $nin: [post._id] },
  })
    .limit(6)
    .sort("-createdAt");

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        post,
        relatedPosts,
      },
      "Post retrieved successfully"
    )
  );
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
  } else {
    pageNo = 1;
  }

  const follow = await Follow.findOne({ user: _id });
  const followings = follow?.followings || [];

  const totalCount = await Post.countDocuments({
    user: { $in: [...followings, _id], $nin: blocked },
  });

  // Get posts of the users that the logged in user is following and the user itself
  const posts = await Post.find({
    user: { $in: [...followings, _id], $nin: blocked },
  })
    .populate({
      model: "user",
      path: "user",
      select: "username avatar fullName",
      strictPopulate: false,
    })
    .populate("likesPreview")
    .sort("-createdAt")
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

const videoFeed = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ApiError(401, "User not verified");
  }
  const { blocked } = req.user;

  const posts = await Post.find({
    user: { $nin: [...blocked] },
    kind: "video",
  })
    .populate({
      model: "user",
      path: "user",
      select: "username fullName avatar",
      strictPopulate: false,
    })
    .populate("likesPreview")
    .sort("-createdAt");

  if (!posts || posts.length === 0) {
    throw new ApiError(404, "No posts found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, posts, "Posts retrieved successfully"));
});

const getVideoPost = asyncHandler(async (req: Request, res: Response) => {
  const { postId } = req.params;
  if (!postId) {
    throw new ApiError(400, "Post id is required");
  }

  const post = await Post.findById(postId)
    .populate({
      model: "user",
      path: "user",
      select: "username fullName avatar",
      strictPopulate: false,
    })
    .populate("likesPreview");

  if (!post) {
    throw new ApiError(404, "Post not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, post, "Video retrieved successfully"));
});

const explorePosts = asyncHandler(async (req: Request, res: Response) => {
  const { page, userId } = req.query;
  if (page) {
    pageNo = parseInt(page as string);
    if (pageNo <= 0) {
      pageNo = 1;
    }
  } else {
    pageNo = 1;
  }

  const data: {
    posts: object[];
    max: number;
    page: number;
  } = {
    posts: [],
    max: 0,
    page: pageNo,
  };

  const user = await User.findById(userId || null);
  if (user) {
    const { _id, blocked } = user;
    const follow = await Follow.findOne({ user: _id });
    const followings = follow?.followings || [];

    const totalCount = await Post.countDocuments({
      user: { $nin: [...followings, _id, ...blocked] },
    });

    // Get posts of the users that the logged in user is not following
    const posts = await Post.find({
      user: { $nin: [...followings, _id, ...blocked] },
    })
      .populate({
        model: "user",
        path: "user",
        select: "username fullName avatar",
        strictPopulate: false,
      })
      .populate("likesPreview")
      .sort("-createdAt")
      .limit(limit)
      .skip((pageNo - 1) * limit);

    if (!posts || posts.length === 0) {
      throw new ApiError(404, "No posts found");
    }

    data.posts = posts;
    data.max = totalCount;
  } else {
    const totalCount = await Post.countDocuments();

    const posts = await Post.find()
      .populate({
        model: "user",
        path: "user",
        select: "username fullName avatar",
        strictPopulate: false,
      })
      .populate("likesPreview")
      .sort("-createdAt")
      .limit(limit)
      .skip((pageNo - 1) * limit);

    if (!posts || posts.length === 0) {
      throw new ApiError(404, "No posts found");
    }

    data.posts = posts;
    data.max = totalCount;
  }

  return res
    .status(200)
    .json(new ApiResponse(200, data, "Posts retrieved successfully"));
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

  if (post.user.toString() !== _id.toString()) {
    await NotificationModel.create({
      title: `Post Liked`,
      entityId: postId,
      description: `${username} liked your post`,
      user: post.user,
      link: `/post/${postId}`,
    });

    const notificationPreference = await NotificationPreferences.findOne({
      user: post.user,
    });
    if (
      notificationPreference?.firebaseTokens.length &&
      notificationPreference.pushNotifications.likes
    ) {
      await Promise.all(
        notificationPreference.firebaseTokens.map((token) => {
          sendNotification({
            title: "Post Liked",
            body: `${username} liked your post`,
            token,
            image: avatar,
          });
        })
      );
    }
  }

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Post liked successfully"));
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
    .json(new ApiResponse(200, {}, "Post disliked successfully"));
});

const getLikes = asyncHandler(async (req: Request, res: Response) => {
  const { postId } = req.params;
  if (!postId) {
    throw new ApiError(400, "Post id is required");
  }

  const post = await Post.findById(postId, "likes").populate({
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
  createVideoPost,
  deletePost,
  getUserPosts,
  createFeed,
  likePost,
  videoFeed,
  getVideoPost,
  dislikePost,
  getPost,
  explorePosts,
  getLikes,
};
