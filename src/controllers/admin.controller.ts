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
import { DEFAULT_USER_AVATAR } from "../utils/constants";
import { deleteFromCloudinary } from "../utils/cloudinary";
import { Message } from "../models/message.model";

const login = asyncHandler(async (req: Request, res: Response) => {
  const { username, password } = req.body;

  if (!username || !password) {
    throw new ApiError(400, "Username and Password are required");
  }

  if (username !== process.env.ADMIN_USERNAME) {
    throw new ApiError(400, "Please provide a valid username");
  }

  const hashedPassword = process.env.ADMIN_PASSWORD_HASH;
  const isPasswordValid = await bcrypt.compare(password, hashedPassword!);

  if (!isPasswordValid) {
    throw new ApiError(400, "Please provide a valid password");
  }

  const token = jwt.sign({ username }, process.env.TOKEN_SECRET as string, {
    expiresIn: "1d",
  });

  return res
    .status(200)
    .cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    })
    .json(new ApiResponse(200, { token }, "Login successful"));
});

const dashboardStats = asyncHandler(async (req: Request, res: Response) => {
  const posts = await Post.countDocuments();
  const videos = await Post.countDocuments({ kind: "video" });
  const comments = await Comment.countDocuments();

  const likes = await Post.aggregate([
    {
      $project: {
        likesCount: { $size: "$likes" },
      },
    },
    {
      $group: {
        _id: null,
        count: { $sum: "$likesCount" },
      },
    },
  ]);
  const likesTrend = await Post.aggregate([
    {
      $group: {
        _id: {
          month: {
            $dateTrunc: {
              date: "$createdAt",
              unit: "month",
            },
          },
          likes: "$likes",
        },
      },
    },
    {
      $project: {
        likesCount: { $size: "$_id.likes" },
      },
    },
    {
      $group: {
        _id: {
          likes: "$_id.likesCount",
          month: "$_id.month",
        },
        count: { $sum: 1 },
      },
    },
    { $sort: { "_id.month": -1 } },
    { $limit: 2 },
  ]);
  const likesThisMonth = likesTrend[0]?.count || 0;
  const likesLastMonth = likesTrend[1]?.count || 0;
  const likesChange =
    likesLastMonth === 0
      ? 100
      : ((likesThisMonth - likesLastMonth) / likesLastMonth) * 100;

  const commentTrend = await Comment.aggregate([
    {
      $group: {
        _id: {
          $dateTrunc: {
            date: "$createdAt",
            unit: "month",
          },
        },
        count: { $sum: 1 },
      },
    },
    {
      $sort: { _id: -1 },
    },
    {
      $limit: 2,
    },
  ]);
  const commentsThisMonth = commentTrend[0]?.count || 0;
  const commentsLastMonth = commentTrend[1]?.count || 0;
  const commentChange =
    commentsLastMonth === 0
      ? 100
      : ((commentsThisMonth - commentsLastMonth) / commentsLastMonth) * 100;

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        posts: {
          total: posts,
          videos,
        },
        likes: {
          total: likes[0]?.count || 0,
          change: likesChange,
        },
        comments: {
          total: comments,
          change: commentChange,
        },
      },
      "Dashboard data fetched successfully",
    ),
  );
});

const userStats = asyncHandler(async (req: Request, res: Response) => {
  const users = await User.countDocuments();
  const unverifiedUsers = await User.countDocuments({
    isMailVerified: false,
  });

  const connectedUsers = await User.countDocuments({
    $or: [{ followersCount: { $gte: 1 } }, { followingCount: { $gte: 1 } }],
  });
  const connectedUsersTrend = await User.aggregate([
    {
      $match: {
        $or: [{ followersCount: { $gte: 1 } }, { followersCount: { $gte: 1 } }],
      },
    },
    {
      $group: {
        _id: {
          $dateTrunc: {
            date: "$createdAt",
            unit: "month",
          },
        },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: -1 } },
    { $limit: 2 },
  ]);
  const connectedThisMonth = connectedUsersTrend[0]?.count || 0;
  const connectedLastMonth = connectedUsersTrend[1]?.count || 0;
  const connectedChange =
    connectedLastMonth === 0
      ? 100
      : ((connectedThisMonth - connectedLastMonth) / connectedLastMonth) * 100;

  const activeUsers = await User.aggregate([
    { $unwind: "$sessions" },
    {
      $group: {
        _id: {
          month: {
            $dateTrunc: {
              date: "$sessions.createdAt",
              unit: "month",
            },
          },
          user: "$_id",
        },
      },
    },
    {
      $group: {
        _id: "$_id.month",
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: -1 } },
    { $limit: 2 },
  ]);
  const usersThisMonth = activeUsers[0]?.count || 0;
  const usersLastMonth = activeUsers[1]?.count || 0;
  const userChange =
    usersLastMonth === 0
      ? 100
      : ((usersThisMonth - usersLastMonth) / usersLastMonth) * 100;

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        total: users,
        verified: users - unverifiedUsers,
        unverified: unverifiedUsers,
        active: { current: usersThisMonth, change: userChange },
        connected: { total: connectedUsers, change: connectedChange },
      },
      "User Stats found successfully",
    ),
  );
});

const growth = asyncHandler(async (req: Request, res: Response) => {
  const { query } = req.query;
  const values = ["daily", "weekly", "monthly", "yearly"];

  let period = "weekly";

  if (typeof query === "string" && values.includes(query)) {
    period = query;
  }

  const userGrowth = await User.aggregate([
    {
      $group: {
        _id: {
          $dateTrunc: {
            date: "$createdAt",
            unit:
              period === "yearly"
                ? "year"
                : period === "monthly"
                  ? "month"
                  : period === "weekly"
                    ? "week"
                    : "day",
          },
        },
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
        _id: {
          $dateTrunc: {
            date: "$createdAt",
            unit:
              period === "yearly"
                ? "year"
                : period === "monthly"
                  ? "month"
                  : period === "weekly"
                    ? "week"
                    : "day",
          },
        },
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
        { user: userGrowth, post: postGrowth },
        "Growth data fetched successfully",
      ),
    );
});

const reports = asyncHandler(async (req: Request, res: Response) => {
  const reports = await ReportModel.find().populate({
    path: "user",
    select: "username email avatar fullName",
    model: "user",
    strictPopulate: false,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, reports, "Reports fetched successfully"));
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
        "username email avatar createdAt isMailVerified loginType",
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
          new ApiResponse(200, confession, "Confession fetched successfully"),
        );
    }
    default: {
      throw new ApiError(400, "Invalid kind provided");
    }
  }
});

const deleteReport = asyncHandler(async (req: Request, res: Response) => {
  const { reportId } = req.params;

  const report = await ReportModel.findById(reportId);

  if (!report) {
    throw new ApiError(404, "Report not found");
  }

  if (report.images && report.images.length > 0) {
    await Promise.all(
      report.images.map((image) => deleteFromCloudinary(image)),
    );
  }

  await report.deleteOne();

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Report deleted successfully"));
});

const users = asyncHandler(async (req: Request, res: Response) => {
  const savedUsers = await User.find(
    {},
    "username email avatar sessions._id isMailVerified createdAt loginType",
  );

  const safeUsers = savedUsers.map((user) => ({
    ...user.toObject(),
    sessions: user?.sessions?.length || 0,
  }));

  return res
    .status(200)
    .json(new ApiResponse(200, safeUsers, "Users fetched successfully"));
});

const contentDistribution = asyncHandler(
  async (req: Request, res: Response) => {
    const posts = await Post.countDocuments({ kind: "image" });
    const videos = await Post.countDocuments({ kind: "video" });
    const comments = await Comment.countDocuments();
    const calls = await Call.countDocuments();
    const callsDistribution = await Call.aggregate([
      {
        $group: {
          _id: "$type",
          count: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    const audio = callsDistribution[0]?.count || 0;
    const video = callsDistribution[1]?.count || 0;

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          posts,
          videos,
          comments,
          calls,
          callsDistribution: {
            audio,
            video,
          },
        },
        "Content distribution fetched successfully",
      ),
    );
  },
);

const analytics = asyncHandler(async (req: Request, res: Response) => {
  const registrations = await User.aggregate([
    {
      $project: {
        month: {
          $dateTrunc: {
            date: "$createdAt",
            unit: "month",
          },
        },
      },
    },
    {
      $group: {
        _id: "$month",
        count: { $sum: 1 },
      },
    },
    {
      $sort: { _id: -1 },
    },
    {
      $limit: 2,
    },
  ]);
  const likes = await Post.aggregate([
    {
      $project: {
        likesCount: { $size: "$likes" },
      },
    },
    {
      $count: "count",
    },
  ]);
  const comments = await Comment.countDocuments();
  const saves = await User.aggregate([
    {
      $project: {
        saves: { $size: "$savedPosts" },
      },
    },
    {
      $count: "count",
    },
  ]);
  const chats = await Chat.countDocuments({ isGroupChat: false });
  const groups = await Chat.countDocuments({ isGroupChat: true });

  const newRegistrations = registrations[0]?.count || 0;
  const lastMonth = registrations[1]?.count || 0;
  const percentageChange =
    lastMonth === 0 ? 100 : ((newRegistrations - lastMonth) / lastMonth) * 100;

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        registrations: { newRegistrations, percentage: percentageChange },
        engagement: {
          likes: likes[0]?.count || 0,
          comments,
          saves: saves[0]?.count || 0,
        },
        chats: { direct: chats, groups },
      },
      "Analytics found successfully",
    ),
  );
});

const messageAnalytics = asyncHandler(async (req: Request, res: Response) => {
  const trend = await Message.aggregate([
    {
      $group: {
        _id: {
          $dateTrunc: {
            date: "$createdAt",
            unit: "month",
          },
        },
        count: { $sum: 1 },
      },
    },
    {
      $sort: { _id: -1 },
    },
  ]);
  const type = await Message.aggregate([
    {
      $group: {
        _id: "$kind",
        count: { $sum: 1 },
      },
    },
  ]);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { trend, type },
        "Message Analytics found successfully",
      ),
    );
});

const removeUnverifiedUsers = asyncHandler(
  async (req: Request, res: Response) => {
    const users = await User.find({ isMailVerified: false });

    let avatars: string[] = [];
    users?.map((user) => {
      if (
        user.avatar !== DEFAULT_USER_AVATAR &&
        user.avatar !== "/sociial-avatar.svg"
      ) {
        avatars.push(user.avatar);
      }
    });

    await Promise.all(avatars.map((avatar) => deleteFromCloudinary(avatar!)));
    const result = await User.deleteMany({ isMailVerified: false });

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { removed: result.deletedCount },
          "Unverified users removed successfully",
        ),
      );
  },
);

const logout = asyncHandler(async (req: Request, res: Response) => {
  res.clearCookie("token");
  return res.status(200).json(new ApiResponse(200, {}, "Logout successful"));
});

export {
  login,
  dashboardStats,
  userStats,
  growth,
  reports,
  users,
  deleteReport,
  getEntity,
  contentDistribution,
  analytics,
  messageAnalytics,
  removeUnverifiedUsers,
  logout,
};
