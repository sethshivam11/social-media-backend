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

const limit = 20;
let pageNo = 1;

async function getFollowings(userId: string) {
  //  Get users that the logged in user is following
  const follow = await Post.aggregate([
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
          $eq: ["$user", userId],
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
    return [];
  }

  return follow[0].follow.followings;
}

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

    const upload = await uploadToCloudinary(mediaFiles[0].path);
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
        const upload = await uploadToCloudinary(file.path);
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

  const post = await Post.findById(postId);
  if (!post) {
    throw new ApiError(404, "Post not found");
  }

  if (post.user.toString() !== _id.toString()) {
    throw new ApiError(403, "Unauthorized request");
  }

  await deleteFromCloudinary(post.media as string);

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
  const firstPost = await Post.findOne({ user: userId }).populate({
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
    .skip(pageNo === 1 ? 1 : (pageNo - 1) * 20);

  const posts = [firstPost, ...(restPosts || [])];

  return res
    .status(200)
    .json(new ApiResponse(200, posts, "Posts retrieved successfully"));
});

const getPost = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ApiError(401, "User not verified");
  }

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

  const post = await Post.findById(postId).populate({
    model: "user",
    path: "user",
    select: "username avatar fullName followersCount followingCount postsCount",
    strictPopulate: false,
  });

  if (!post) {
    throw new ApiError(404, "Post not found");
  }

  const relatedPosts = await Post.find({
    user: post?.user,
    _id: { $nin: [post._id] },
  }).limit(6);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { post, relatedPosts },
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
  }

  const followings = await getFollowings(_id);

  const totalCount = await Post.countDocuments({
    user: { $in: followings, $nin: blocked },
  });

  // Get posts of the users that the logged in user is following
  const posts = await Post.find({
    user: { $in: followings, $nin: blocked },
  })
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

const explorePosts = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ApiError(401, "User not verified");
  }

  const { _id, blocked } = req.user;
  const { page } = req.query;
  const followings = await getFollowings(_id);

  if (page) {
    pageNo = parseInt(page as string);
    if (pageNo <= 0) {
      pageNo = 1;
    }
  }

  const totalCount = await Post.countDocuments({
    user: { $nin: [...followings, ...blocked] },
  });

  const posts = await Post.find({
    user: { $nin: [...followings, ...blocked] },
  })
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
  const { _id, avatar } = req.user;

  const { postId } = req.params;
  if (!postId) {
    throw new ApiError(400, "Post id is required");
  }

  const post = await Post.findById(postId);
  if (!post) {
    throw new ApiError(404, "Post not found");
  }

  const like = await post.likePost(_id);
  if (typeof like === "string") {
    throw new ApiError(409, like);
  }
  await NotificationModel.create({
    title: `Post Liked`,
    description: `${_id} liked you post`,
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
      body: `${_id} liked your post`,
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

  const post = await Post.findById(postId);
  if (!post) {
    throw new ApiError(404, "Post not found");
  }

  const dislike = await post.dislikePost(_id);
  if (typeof dislike === "string") {
    throw new ApiError(404, dislike);
  }

  await NotificationModel.findOneAndDelete({
    title: "Post Liked",
    user: post.user,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, post, "Post disliked successfully"));
});

export {
  createPost,
  deletePost,
  getUserPosts,
  createFeed,
  likePost,
  dislikePost,
  getPost,
  explorePosts
};
