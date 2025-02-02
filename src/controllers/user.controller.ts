import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { User, UserInterface } from "../models/user.model";
import { Request, Response } from "express";
import { asyncHandler } from "../utils/AsyncHandler";
import {
  cleanupFiles,
  deleteFromCloudinary,
  uploadToCloudinary,
} from "../utils/cloudinary";
import { DEFAULT_USER_AVATAR } from "../utils/constants";
import sendEmail from "../helpers/mailer";
import { Follow } from "../models/follow.model";
import { NotificationPreferences } from "../models/notificationpreferences.model";
import { Post } from "../models/post.model";
import { NotificationModel } from "../models/notification.model";

export interface File {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  destination: string;
  filename: string;
  path: string;
  size: number;
}

// helper functions

const removeSensitiveData = (user: UserInterface) => {
  const newUser = user.toObject();

  delete newUser.password;
  delete newUser.sessions;
  delete newUser.verifyCode;
  delete newUser.verifyCodeExpiry;

  return newUser;
};

const generateToken = async (
  userId: string,
  device?: string,
  location?: string
) => {
  try {
    const user = await User.findById(userId);

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    const lastLogin = new Date();
    const token = await user?.generateToken();
    user.sessions = [...user.sessions, { token, device, location, lastLogin }];

    await user.save({ validateBeforeSave: false });

    return token;
  } catch (err) {
    console.log(err);
    throw new ApiError(500, "Something went wrong, while generating token");
  }
};

// Controllers

const registerUser = asyncHandler(async (req: Request, res: Response) => {
  const { fullName, username, email, password } = req.body;

  if (!(fullName || username || email || password)) {
    cleanupFiles();
    throw new ApiError(400, "All fields are required");
  }

  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (existedUser && existedUser.isMailVerified) {
    cleanupFiles();
    throw new ApiError(409, "Username or email already exists");
  }

  if (!existedUser?.isMailVerified) {
    await existedUser?.deleteOne();
  }

  const avatarLocalPath = (req.file as File)?.path;
  let avatar;
  if (avatarLocalPath) {
    avatar = await uploadToCloudinary(avatarLocalPath, "avatars");

    if (!avatar) {
      throw new ApiError(400, "Error while uploading the avatar file");
    }
  }

  const verifyCode = Math.floor(100000 + Math.random() * 900000);
  const verifyCodeExpiry = Date.now() + 600_000;

  const user = await User.create({
    fullName,
    email,
    password,
    username,
    avatar: avatar?.url,
    verifyCode,
    verifyCodeExpiry,
  });

  if (!user) {
    throw new ApiError(400, "Something went wrong while registering the user");
  }

  const newUser = removeSensitiveData(user);

  await sendEmail(email, verifyCode, username);

  return res
    .status(201)
    .json(new ApiResponse(200, newUser, "User registered successfully"));
});

const loginUser = asyncHandler(async (req: Request, res: Response) => {
  const { username, email, password, device, location } = req.body;

  if (!(username || email) || !password) {
    throw new ApiError(400, "Username or email is required");
  }

  const user = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (user.loginType === "google") {
    throw new ApiError(400, "Please login using Google.");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);
  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid passsword");
  }

  const token = await generateToken(user._id, device, location);

  const userObj = removeSensitiveData(user);
  await NotificationModel.create({
    title: "Login attempt",
    description: `New login from ${device ? `${device}, ` : ""}${
      location || "unknown location"
    }`,
    user: user._id,
    link: "/settings/security/login-activity",
  });

  return res
    .status(200)
    .cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: parseInt(process.env.COOKIE_EXPIRY || "31536000"),
    })
    .json(
      new ApiResponse(
        200,
        {
          user: userObj,
          token,
        },
        "User logged in successfully"
      )
    );
});

const handleSocialLogin = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ApiError(401, "User not verified");
  }
  const { _id } = req.user;

  const user = await User.findById(_id);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const token = await generateToken(user._id);
  await NotificationModel.create({
    title: "Login attempt",
    description: `New login from unknown location`,
    user: user._id,
    link: "/settings/security/login-activity",
  });

  return res
    .status(200)
    .cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: parseInt(process.env.COOKIE_EXPIRY || "31536000"),
      sameSite: "lax",
    })
    .redirect(`${process.env.CLIENT_SSO_REDIRECT_URL || "/"}?token=${token}`);
});

const getProfile = asyncHandler(async (req: Request, res: Response) => {
  const { username, userId } = req.query;

  if (!username && !userId) {
    throw new ApiError(400, "Username or user id is required");
  }

  const user = await User.findOne({
    $or: [{ username }, { _id: userId }],
    isMailVerified: true,
  });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const newUser = {
    _id: user._id,
    username: user.username,
    fullName: user.fullName,
    avatar: user.avatar,
    bio: user.bio,
    followersCount: user.followersCount,
    followingCount: user.followingCount,
    postsCount: user.postsCount,
  };

  return res.status(200).json(new ApiResponse(200, newUser, "User found"));
});

const getCurrentUser = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ApiError(401, "User not verified");
  }

  const user = removeSensitiveData(req.user);

  return res.status(200).json(new ApiResponse(200, user, "User found"));
});

const verifyEmail = asyncHandler(async (req: Request, res: Response) => {
  const { code, username } = req.query;

  if (!code || !username) {
    throw new ApiError(400, "Code and username are required");
  }

  const userWithCode = await User.findOne({ username });

  if (!userWithCode) {
    throw new ApiError(404, "User with username not found");
  }

  const isCodeInvalid = userWithCode.verifyCode === code;
  const isCodeExpired = new Date(userWithCode.verifyCodeExpiry) > new Date();

  if (!isCodeInvalid) {
    throw new ApiError(401, "Invalid code");
  }

  if (!isCodeExpired) {
    throw new ApiError(401, "Code has expired, Please request a new one");
  }

  userWithCode.verifyCode = "";
  userWithCode.isMailVerified = true;
  await userWithCode.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, { isMailVerified: true }, "User verified"));
});

const resendEmail = asyncHandler(async (req: Request, res: Response) => {
  const { username, email } = req.query;
  if (!username || typeof username !== "string") {
    throw new ApiError(400, "Username is required");
  }

  if (email && typeof email !== "string") {
    throw new ApiError(400, "Invalid email");
  }

  const user = await User.findOne({ username });
  if (!user) {
    throw new ApiError(404, "Please check username or sign up again");
  }

  const verifyCode = Math.floor(100000 + Math.random() * 900000);
  const verifyCodeExpiry = Date.now() + 600_000;

  user.verifyCode = `${verifyCode}`;
  user.verifyCodeExpiry = new Date(verifyCodeExpiry);

  await user.save({ validateBeforeSave: false });

  await sendEmail(
    email || user.email,
    verifyCode,
    username,
    email ? true : false
  );

  return res.status(200).json(new ApiResponse(200, {}, "Email sent"));
});

const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  const { email, username, code, password } = req.body;

  if (!(email || username) || !code || !password) {
    throw new ApiError(400, "All fields are required");
  }

  const user = await User.findOne({ $or: [{ email }, { username }] });
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const isCodeInvalid = user.verifyCode === code;
  const isCodeExpired = new Date(user.verifyCodeExpiry) > new Date();

  if (!isCodeInvalid) {
    throw new ApiError(401, "Invalid code");
  }
  if (!isCodeExpired) {
    throw new ApiError(401, "Code has expired, Please request a new one");
  }

  user.password = password;
  user.verifyCode = "";
  await user.save({ validateBeforeSave: true });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password was changed successfully"));
});

const logoutUser = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ApiError(401, "User not verified");
  }

  const { _id } = req.user;
  const { firebaseToken } = req.query;
  const { token } =
    req.cookies || req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    throw new ApiError(400, "Token is required");
  }

  const user = await User.findById(_id);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (firebaseToken) {
    const notificationPreference = await NotificationPreferences.findOne({
      user: _id,
    });
    if (notificationPreference) {
      await notificationPreference.updateOne(
        { $pull: { firebaseTokens: firebaseToken } },
        { new: true }
      );
    }
  }

  user.sessions = user.sessions.filter((session) => session.token !== token);
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .clearCookie("token")
    .json(new ApiResponse(200, {}, "User logged out"));
});

const updatePassword = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ApiError(401, "User not verified");
  }
  const { _id, loginType } = req.user;
  if (loginType === "google") {
    throw new ApiError(401, "Google login user cannot update password");
  }

  const { oldPassword, newPassword } = req.body;

  if (!(oldPassword || newPassword)) {
    throw new ApiError(400, "Both passwords are required");
  }

  if (oldPassword === newPassword) {
    throw new ApiError(400, "Old and new passwords cannot be same");
  }

  const user = await User.findById(_id);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const isPasswordValid = user.isPasswordCorrect(oldPassword);
  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid password");
  }

  user.password = newPassword;
  await user.save();

  return res.status(200).json(new ApiResponse(200, {}, "Password was updated"));
});

const updateAvatar = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ApiError(401, "User not verified");
  }
  const { _id } = req.user;

  const avatarLocalPath = (req.file as File)?.path;
  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is required");
  }

  const avatar = await uploadToCloudinary(avatarLocalPath, "avatars");
  if (!avatar) {
    throw new ApiError(
      400,
      "Something went wrong, while uploading to cloudinary"
    );
  }

  // Delete file from cloudinary / record if not deleted
  await deleteFromCloudinary(req.user.avatar);

  const user = await User.findByIdAndUpdate(
    _id,
    { $set: { avatar: avatar.secure_url } },
    { new: true }
  );
  if (!user) {
    throw new ApiError(400, "Something went wrong, while updating avatar");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, { avatar: avatar.secure_url }, "Avatar updated")
    );
});

const removeAvatar = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ApiError(401, "User not verified");
  }

  const { _id } = req.user;

  const user = await User.findById(_id);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  await deleteFromCloudinary(user.avatar as string);

  user.avatar = DEFAULT_USER_AVATAR;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(
      new ApiResponse(200, { avatar: DEFAULT_USER_AVATAR }, "Avatar removed")
    );
});

const updateEmail = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ApiError(401, "User not verified");
  }

  const { _id, loginType } = req.user;
  if (loginType === "google") {
    throw new ApiError(401, "Google login user cannot update email");
  }

  const { email, code } = req.body;

  if (!email) {
    throw new ApiError(400, "Email is required");
  }

  const user = await User.findById(_id);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const existedUser = await User.findOne({ email });
  if (existedUser) {
    throw new ApiError(409, "Please use another email, this email is taken");
  }

  const isCodeInvalid = user.verifyCode === code;
  const isCodeExpired = new Date(user.verifyCodeExpiry) > new Date();

  if (!isCodeInvalid) {
    throw new ApiError(401, "Invalid code");
  }
  if (!isCodeExpired) {
    throw new ApiError(401, "Code has expired, Please request a new one");
  }

  user.email = email;
  user.isMailVerified = true;
  user.verifyCode = "";

  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, { email }, "Email updated, verification sent"));
});

const updateDetails = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ApiError(401, "User not verified");
  }

  const { _id } = req.user;
  const { fullName, username, bio } = req.body;

  const user = await User.findById(_id);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (bio !== undefined) user.bio = bio;
  if (fullName) user.fullName = fullName;
  if (username) {
    const checkUserName = await User.findOne({ username });

    if (checkUserName) {
      throw new ApiError(409, "User with username already exists");
    }
    user.username = username;
  }

  await user.save({ validateBeforeSave: false });

  return res.status(200).json(new ApiResponse(200, {}, "User details updated"));
});

const blockUser = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ApiError(401, "User not verified");
  }
  const { _id } = req.user;

  const { userId, username } = req.query;
  if (!userId && !username) {
    throw new ApiError(400, "Blocked username or user id is required");
  }

  const currentUser = await User.findById(_id);
  const blockUser = await User.findOne({
    $or: [{ _id: userId }, { username }],
  });
  if (!blockUser || !currentUser) {
    throw new ApiError(404, "User not found");
  }

  if (currentUser.blocked.includes(blockUser._id)) {
    throw new ApiError(409, "User already blocked");
  }

  const userFollow = await Follow.findOne({ user: currentUser._id });
  if (userFollow) {
    if (userFollow.followers.includes(blockUser._id)) {
      userFollow.followers = userFollow.followers.filter(
        (follower) => follower !== blockUser._id
      );
      currentUser.followersCount -= 1;
    }
    if (userFollow.followings.includes(blockUser._id)) {
      userFollow.followings = userFollow.followings.filter(
        (following) => following !== blockUser._id
      );
      currentUser.followingCount -= 1;
    }
    await userFollow.save({ validateBeforeSave: false });
  }

  const blockUserFollow = await Follow.findOne({ user: blockUser._id });
  if (blockUserFollow) {
    if (blockUserFollow.followers.includes(blockUser._id)) {
      blockUserFollow.followers = blockUserFollow.followers.filter(
        (follower) => follower !== blockUser._id
      );
      blockUser.followersCount -= 1;
    }
    if (blockUserFollow.followings.includes(blockUser._id)) {
      blockUserFollow.followings = blockUserFollow.followings.filter(
        (following) => following !== blockUser._id
      );
      blockUser.followingCount -= 1;
    }
    await blockUserFollow.save({ validateBeforeSave: false });
  }

  currentUser.blocked = [...currentUser.blocked, blockUser._id];
  await currentUser.save({ validateBeforeSave: false });
  await blockUser.save({ validateBeforeSave: false });

  return res.status(200).json(new ApiResponse(200, {}, "User was blocked"));
});

const unblockUser = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ApiError(401, "User not verified");
  }
  const { _id } = req.user;

  const { username, userId } = req.query;
  if (!userId && !username) {
    throw new ApiError(400, "Unblocked username or user id is required");
  }
  const currentUser = await User.findById(_id);
  const unblockUser = await User.findOne({
    $or: [{ _id: userId }, { username }],
  });
  if (!unblockUser || !currentUser) {
    throw new ApiError(404, "User not found");
  }

  currentUser.blocked = currentUser.blocked.filter(
    (ele) => ele.toString() !== unblockUser._id.toString()
  );
  await currentUser.save({ validateBeforeSave: false });

  return res.status(200).json(new ApiResponse(200, {}, "User was unblocked"));
});

const isUsernameAvailable = asyncHandler(
  async (req: Request, res: Response) => {
    const { username } = req.params;

    if (!username) {
      throw new ApiError(400, "Username is required");
    }
    if (username.length >= 30) {
      throw new ApiError(400, "Username must be less than 30 letters");
    }
    if (username.trim() && !/^[a-z_1-9.]+$/.test(username)) {
      throw new ApiError(400, "Username must contain only lowercase, ., _");
    }
    if (/^\d/.test(username)) {
      throw new ApiError(400, "Username cannot start with a number");
    }
    if (!/[a-z]/.test(username)) {
      throw new ApiError(400, "Username must contain at least one letter");
    }
    if (username.startsWith(".")) {
      throw new ApiError(400, "Username cannot start with a .");
    }
    const reservedPages = [
      "settings",
      "add-story",
      "notifications",
      "search",
      "call",
      "confessions",
      "messages",
      "get-premium",
      "logs",
      "messages",
      "new-post",
      "terms",
      "privacy",
      "about",
      "contact",
      "post",
      "sign-in",
      "sign-up",
      "stories",
      "story",
      "upload-video",
      "verify-code",
      "video",
      "videos",
      "home",
    ];
    if (reservedPages.includes(username)) {
      throw new ApiError(400, "Username is reserved, try another one!");
    }

    const user = await User.findOne({ username });
    if (user && user.isMailVerified) {
      throw new ApiError(400, "Username not available");
    }

    return res.status(200).json(new ApiResponse(200, {}, "Username available"));
  }
);

const searchUsers = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ApiError(401, "User not verified");
  }
  const { blocked } = req.user;
  const { query } = req.query;
  if (!query) {
    throw new ApiError(400, "Username or fullName is required");
  }

  const users = await User.find(
    {
      $or: [
        { username: { $regex: `${query}`, $options: "i" } },
        { fullName: { $regex: `${query}`, $options: "i" } },
      ],
      _id: { $nin: blocked },
      isMailVerified: true,
    },
    "username fullName avatar"
  );
  if (!users || !users.length) {
    throw new ApiError(404, "No users found");
  }

  return res.status(200).json(new ApiResponse(200, users, "Users found"));
});

const getBlockedUsers = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ApiError(401, "User not verified");
  }
  const currentUser = req.user;

  const user = await User.populate(currentUser, {
    path: "blocked",
    select: "username avatar fullName",
    model: "user",
    strictPopulate: false,
  });

  if (!user.blocked || !user.blocked.length) {
    throw new ApiError(404, "No blocked users found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, user.blocked, "Blocked users"));
});

const getFollowSuggestions = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user) {
      throw new ApiError(401, "User not verified");
    }
    const { _id, blocked } = req.user;
    const { max } = req.query;

    const limit = parseInt(max as string) || 5;

    const follow = await Follow.findOne({ user: _id });
    const query = {
      _id: {
        $nin: follow ? [...follow.followings, ...blocked] : blocked,
        $ne: _id,
      },
      isMailVerified: true,
    };

    const users = await User.aggregate([
      { $match: query },
      { $sample: { size: limit } },
      { $project: { username: 1, fullName: 1, avatar: 1 } },
    ]);

    if (!users || !users.length) {
      throw new ApiError(404, "No users found");
    }

    return res
      .status(200)
      .json(new ApiResponse(200, users, "Suggestions found"));
  }
);

const savePost = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ApiError(401, "User not verified");
  }
  const { _id } = req.user;

  const { postId } = req.params;
  if (!postId) {
    throw new ApiError(400, "Post id is required");
  }
  const user = await User.findById(_id);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const post = await Post.findById(postId);
  if (!post) {
    throw new ApiError(404, "Post not found");
  }

  if (user.savedPosts.includes(post._id)) {
    throw new ApiError(404, "Post is already saved");
  }

  await user.updateOne({ $addToSet: { savedPosts: post._id } });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        [...user.savedPosts, post._id],
        "Post saved successfully"
      )
    );
});

const unsavePost = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ApiError(401, "User not verified");
  }
  const { _id } = req.user;

  const { postId } = req.params;
  if (!postId) {
    throw new ApiError(400, "Post id is required");
  }

  const post = await Post.findById(postId, "savedBy");
  if (!post) {
    throw new ApiError(404, "Post not found");
  }

  const user = await User.findById(_id);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (user.savedPosts.length === 0 || !user.savedPosts.includes(post._id)) {
    throw new ApiError(404, "Post is already unsaved");
  }

  await user.updateOne({ $pull: { savedPosts: post._id } });

  return res.status(200).json(
    new ApiResponse(
      200,
      user.savedPosts.filter(
        (savedPost) => savedPost.toString() !== post._id.toString()
      ),
      "Post unsaved successfully"
    )
  );
});

const getSavedPosts = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ApiError(401, "User not verified");
  }
  const { _id } = req.user;

  const populatedUser = await User.findById(_id, "savedBy").populate({
    path: "savedPosts",
    select: "caption media thumbnail kind likesCount commentsCount",
    model: "post",
    strictPopulate: false,
    populate: {
      path: "user",
      select: "username avatar fullName",
      model: "user",
      strictPopulate: false,
    },
  });
  if (
    !populatedUser ||
    !populatedUser.savedPosts ||
    !populatedUser.savedPosts.length
  ) {
    throw new ApiError(404, "No saved posts found");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        populatedUser.savedPosts,
        "Saved posts retrieved successfully"
      )
    );
});

const getSessions = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ApiError(401, "User not verified");
  }
  const { _id } = req.user;
  const token =
    req.cookies?.token || req.header("Authorization")?.replace("Bearer ", "");

  const user = await User.findById(_id, "sessions");
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const sessions = user.sessions.map((session) => {
    if (session.token !== token) {
      session.token = "";
    }
    return session;
  });

  return res
    .status(200)
    .json(new ApiResponse(200, sessions, "Sessions found successfully"));
});

const removeSession = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ApiError(401, "User not verified");
  }
  const { _id } = req.user;
  const { sessionId } = req.params;

  if (!sessionId) {
    throw new ApiError(400, "Session id is required");
  }

  const user = await User.findById(_id);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (
    !user.sessions.some((session) => session?._id?.toString() === sessionId)
  ) {
    throw new ApiError(404, "Session not found");
  }

  user.sessions = user.sessions.filter(
    (session) => session?._id?.toString() !== sessionId
  );
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Session deleted successfully"));
});

const removeAllSessions = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ApiError(401, "User not verified");
  }
  const { _id } = req.user;
  const token =
    req.cookies?.token || req.header("Authorization")?.replace("Bearer ", "");

  const user = await User.findById(_id);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  user.sessions = user.sessions.filter((session) => session.token === token);
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(
      new ApiResponse(200, user.sessions, "All sessions deleted successfully")
    );
});

const clearCookies = asyncHandler(async (req: Request, res: Response) => {
  return res
    .status(200)
    .clearCookie("token")
    .json(new ApiResponse(200, {}, "Cookies cleared"));
});

const removeInvalidUsers = asyncHandler(async (req: Request, res: Response) => {
  const sevenDaysAgo = new Date(new Date().setDate(new Date().getDate() - 7));
  const users = await User.find({
    isMailVerified: false,
    createdAt: { $lt: sevenDaysAgo },
  });

  if (!users || !users.length) {
    throw new ApiError(400, "No invalid users to delete");
  }

  const userIds = users.map((user) => user._id);
  await User.deleteMany({ _id: { $in: userIds } });

  return res
    .status(200)
    .json(
      new ApiResponse(200, {}, `${users.length} invalid users were deleted`)
    );
});

export {
  registerUser,
  loginUser,
  handleSocialLogin,
  getCurrentUser,
  verifyEmail,
  logoutUser,
  updateAvatar,
  removeAvatar,
  forgotPassword,
  updatePassword,
  updateEmail,
  updateDetails,
  getProfile,
  blockUser,
  unblockUser,
  isUsernameAvailable,
  resendEmail,
  searchUsers,
  getBlockedUsers,
  getFollowSuggestions,
  savePost,
  unsavePost,
  getSavedPosts,
  getSessions,
  removeSession,
  clearCookies,
  removeAllSessions,
  removeInvalidUsers,
};
