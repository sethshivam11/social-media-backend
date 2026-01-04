import { Request, Response } from "express";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/AsyncHandler";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { User } from "../models/user.model";
import { Post } from "../models/post.model";
import { Comment } from "../models/comment.model";
import { ReportModel } from "../models/report.model";
import { Story } from "../models/story.model";
import { Chat } from "../models/chat.model";
import { Call } from "../models/call.model";

const login = asyncHandler(async (req: Request, res: Response) => {
  const { username, password } = req.body;

  if (!username || !password) {
    throw new ApiError(400, "Username and Password are required");
  }

  if (username !== process.env.ADMIN_USERNAME) {
    throw new ApiError(400, "Please provide a valid username");
  }

  const hashedPassword = process.env.ADMIN_PASSWORD_HASH;
  const isPasswordValid = bcrypt.compareSync(password, hashedPassword!);

  if (!isPasswordValid) {
    throw new ApiError(400, "Please provide a valid password");
  }

  const token = jwt.sign({ username }, process.env.TOKEN_SECRET as string, {
    expiresIn: "1d",
  });

  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 24 * 60 * 60 * 1000, // 1 day
  });

  return res
    .status(200)
    .json(new ApiResponse(200, { token }, "Login successful"));
});

const dashboardStats = asyncHandler(async (req: Request, res: Response) => {
  const users = await User.countDocuments({ isMailVerified: true });
  const posts = await Post.countDocuments();
  const videos = await Post.countDocuments({ kind: "video" });
  const comments = await Comment.countDocuments();
  const reports = await ReportModel.countDocuments();
  const notVerifiedUsers = await User.countDocuments({
    isMailVerified: false,
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        users,
        posts,
        videos,
        comments,
        reports,
        notVerifiedUsers,
      },
      "Dashboard data fetched successfully"
    )
  );
});

const growth = asyncHandler(async (req: Request, res: Response) => {
  const userGrowth = await User.aggregate([
    {
      $group: {
        _id: "$createdAt",
        count: { $sum: 1 },
      },
    },
    {
      $sort: { _id: 1 },
    },
    {
      $limit: 10,
    },
  ]);
  const postGrowth = await Post.aggregate([
    {
      $group: {
        _id: "$createdAt",
        count: { $sum: 1 },
      },
    },
    {
      $sort: { _id: 1 },
    },
    {
      $limit: 10,
    },
  ]);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { userGrowth, postGrowth },
        "Growth data fetched successfully"
      )
    );
});

const reports = asyncHandler(async (req: Request, res: Response) => {
  const reports = await ReportModel.find().populate({
    path: "user",
    select: "username email avatar",
    model: "user",
    strictPopulate: false,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, { reports }, "Reports fetched successfully"));
});

const getEntity = asyncHandler(async (req: Request, res: Response) => {
  const { entityId, kind } = req.query;

  if (!entityId || !kind) {
    throw new ApiError(400, "Entity ID and kind are required");
  }

  if (kind === "problem") {
    throw new ApiError(400, "No entity associated with problem reports");
  }

  switch (kind) {
    case "post": {
      const post = await Post.findById(entityId).populate({
        model: "user",
        path: "user",
        select: "username email avatar",
        strictPopulate: false,
      });
      if (!post) {
        throw new ApiError(404, "Post not found");
      }
      return res
        .status(200)
        .json(new ApiResponse(200, post, "Post fetched successfully"));
    }
    case "comment": {
      const comment = await Comment.findById(entityId).populate({
        model: "user",
        path: "user",
        select: "username email avatar",
        strictPopulate: false,
      });
      if (!comment) {
        throw new ApiError(404, "Comment not found");
      }
      return res
        .status(200)
        .json(new ApiResponse(200, comment, "Comment fetched successfully"));
    }
    case "user": {
      const user = await User.findById(
        entityId,
        "username email avatar createdAt isMailVerified postsCount followersCount followingCount"
      );
      if (!user) {
        throw new ApiError(404, "User not found");
      }
      return res
        .status(200)
        .json(new ApiResponse(200, user, "User fetched successfully"));
    }
    case "story": {
      const story = await Story.findById(entityId).populate({
        model: "user",
        path: "user",
        select: "username email avatar",
        strictPopulate: false,
      });
      if (!story) {
        throw new ApiError(404, "Story not found");
      }
      return res
        .status(200)
        .json(new ApiResponse(200, story, "Story fetched successfully"));
    }
    case "chat": {
      const chat = await Chat.findById(entityId).populate({
        model: "user",
        path: "users",
        select: "username email avatar",
        strictPopulate: false,
      });
      if (!chat) {
        throw new ApiError(404, "Chat not found");
      }
      return res
        .status(200)
        .json(new ApiResponse(200, chat, "Chat fetched successfully"));
    }
    case "confession": {
      const confession = await Post.findById(entityId).populate({
        model: "user",
        path: "user",
        select: "username email avatar",
        strictPopulate: false,
      });
      if (!confession) {
        throw new ApiError(404, "Confession not found");
      }
      return res
        .status(200)
        .json(
          new ApiResponse(200, confession, "Confession fetched successfully")
        );
    }
    default: {
      throw new ApiError(400, "Invalid kind provided");
    }
  }
});

const deleteReport = asyncHandler(async (req: Request, res: Response) => {
  const { reportId } = req.params;

  const report = await ReportModel.findByIdAndDelete(reportId);

  if (!report) {
    throw new ApiError(404, "Report not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Report deleted successfully"));
});

const users = asyncHandler(async (req: Request, res: Response) => {
  const { query } = req.query;

  const users = await User.find(
    {
      $or: [
        { username: { $regex: `${query}`, $options: "i" } },
        { fullName: { $regex: `${query}`, $options: "i" } },
        { email: { $regex: `${query}`, $options: "i" } },
      ],
    },
    "username email avatar sessions._id isMailVerified createdAt postsCount followersCount followingCount loginType"
  );

  return res
    .status(200)
    .json(new ApiResponse(200, users, "Users fetched successfully"));
});

const contentDistribution = asyncHandler(
  async (req: Request, res: Response) => {
    const posts = await Post.countDocuments({ kind: "image" });
    const videos = await Post.countDocuments({ kind: "video" });
    const stories = await Story.countDocuments();
    const comments = await Comment.countDocuments();

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { posts, videos, stories, comments },
          "Content distribution fetched successfully"
        )
      );
  }
);

const removeUnverifiedUsers = asyncHandler(
  async (req: Request, res: Response) => {
    const result = await User.deleteMany({ isMailVerified: false });

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { removed: result.deletedCount },
          "Unverified users removed successfully"
        )
      );
  }
);

const usersActivity = asyncHandler(async (req: Request, res: Response) => {
  const chats = await Chat.countDocuments({ isGroupChat: true });
  const groups = await Chat.countDocuments({ isGroupChat: false });
  const calls = await Call.countDocuments();
  const videoCalls = await Call.countDocuments({ type: "video" });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { chats, groups, calls, videoCalls },
        "Chats activity fetched successfully"
      )
    );
});

const logout = asyncHandler(async (req: Request, res: Response) => {
  res.clearCookie("token");
  return res.status(200).json(new ApiResponse(200, {}, "Logout successful"));
});

export {
  login,
  dashboardStats,
  growth,
  reports,
  users,
  deleteReport,
  getEntity,
  contentDistribution,
  removeUnverifiedUsers,
  usersActivity,
  logout,
};
