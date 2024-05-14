import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { User, UserInterface } from "../models/user.model";
import { Request, Response } from "express";
import { asyncHandler } from "../utils/AsyncHandler";
import { deleteFromCloudinary, uploadToCloudinary } from "../utils/cloudinary";
import jwt from "jsonwebtoken";
import { DEFAULT_USER_AVATAR } from "../constants";
import sendEmail from "../helpers/mailer";

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

// Helper functions and objects

const options = {
  httpOnly: true,
  secure: true,
};

const removeSensitiveData = (user: UserInterface) => {
  const newUser = user.toObject();
  delete newUser.password;
  delete newUser.refreshToken;

  return newUser;
};

const generateAccessAndRefreshToken = async (userId: string) => {
  try {
    const user = await User.findById(userId);

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    const accessToken = await user?.generateAccessToken();
    const refreshToken = await user?.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (err) {
    console.log(err);
    throw new ApiError(
      500,
      "Something went wrong, while generating access and refresh tokens"
    );
  }
};

// Controllers

const registerUser = asyncHandler(async (req: Request, res: Response) => {
  const { fullName, username, email, password } = req.body;

  if (!(fullName || username || email || password)) {
    throw new ApiError(400, "All fields are required");
  }

  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (existedUser && existedUser.isMailVerified) {
    throw new ApiError(409, "Username or email already exists");
  }

  if (!existedUser?.isMailVerified) {
    await existedUser?.deleteOne();
  }

  const avatarLocalPath = (req.file as File)?.path;
  let avatar;
  if (avatarLocalPath) {
    avatar = await uploadToCloudinary(avatarLocalPath);

    if (!avatar) {
      throw new ApiError(400, "Error while uploading the avatar file");
    }
  }

  const verifyCode = Math.floor(Math.random() * 900000);
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
  const { username, email, password } = req.body;

  if (!(username || email) || !password) {
    throw new ApiError(400, "Username or email is required");
  }

  const user = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);
  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid passsword");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user._id
  );

  const userObj = removeSensitiveData(user);

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: userObj,
          accessToken,
          refreshToken,
        },
        "User logged in successfully"
      )
    );
});

const getCurrentUser = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ApiError(401, "User not verified");
  }

  return res.status(200).json(new ApiResponse(200, req.user, "User found"));
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
  await userWithCode.save();

  return res.status(200).json(new ApiResponse(200, {}, "User verified"));
});

const resendEmail = asyncHandler(async (req: Request, res: Response) => {
  const { username } = req.query;
  if (!username || username === "") {
    throw new ApiError(400, "Username is required");
  }

  const user = await User.findOne({ username });
  if (!user) {
    throw new ApiError(404, "Please check username or sign up again");
  }

  const verifyCode = Math.floor(Math.random() * 900000);
  const verifyCodeExpiry = Date.now() + 600_000;

  user.verifyCode = `${verifyCode}`;
  user.verifyCodeExpiry = new Date(verifyCodeExpiry);

  await user.save();

  await sendEmail(user.email, verifyCode, username as string);

  return res.status(200).json(new ApiResponse(200, {}, "Email sent"));
});

const logoutUser = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ApiError(401, "User not verified");
  }

  const { _id } = req.user;

  const user = await User.findById(_id);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  user.refreshToken = "";
  await user.save({ validateBeforeSave: false });

  return res.status(200).json(new ApiResponse(200, {}, "User logged out"));
});

const updatePassword = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ApiError(401, "User not verified");
  }
  const { _id } = req.user;

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

  const newUser = removeSensitiveData(user);

  return res
    .status(200)
    .json(new ApiResponse(200, newUser, "Password was changed"));
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

  const avatar = await uploadToCloudinary(avatarLocalPath);
  if (!avatar) {
    throw new ApiError(
      400,
      "Something went wrong, while uploading to cloudinary"
    );
  }

  // Delete file from cloudinary / record if not deleted
  await deleteFromCloudinary(req.user.avatar as string);

  const user = await User.findByIdAndUpdate(
    _id,
    { $set: { avatar: avatar.secure_url } },
    { new: true }
  );
  if (!user) {
    throw new ApiError(400, "Something went wrong, while updating avatar");
  }

  const newUser = removeSensitiveData(user);

  return res.status(200).json(new ApiResponse(200, newUser, "Avatar updated"));
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

  const newUser = removeSensitiveData(user);

  return res.status(200).json(new ApiResponse(200, newUser, "Avatar removed"));
});

const updateDetails = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ApiError(401, "User not verified");
  }

  const { _id } = req.user;
  const { fullName, email, username, bio } = req.body;

  const user = await User.findById(_id);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (!(bio === undefined)) user.bio = bio;
  if (fullName) user.fullName = fullName;

  if (email) {
    const checkEmail = await User.findOne({ email });

    if (checkEmail) {
      throw new ApiError(409, "User with this email already exists");
    }
    user.email = email;
  }

  if (username) {
    const checkUserName = await User.findOne({ username });

    if (checkUserName) {
      throw new ApiError(409, "User with username already exists");
    }
    user.username = username;
  }

  await user.save({ validateBeforeSave: false });

  const newUser = removeSensitiveData(user);

  return res
    .status(200)
    .json(new ApiResponse(200, newUser, "User details updated"));
});

const updateBlueTickStatus = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user) {
      throw new ApiError(401, "User not verified");
    }
    const { _id } = req.user;

    const user = await User.findById(_id);
    if (!user) {
      throw new ApiError(404, "User not found");
    }

    user.isBlueTick = true;

    await user.save({ validateBeforeSave: false });

    const newUser = removeSensitiveData(user);

    return res
      .status(200)
      .json(new ApiResponse(200, newUser, "User's blue tick updated"));
  }
);

const blockUser = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ApiError(401, "User not verified");
  }
  const { _id } = req.user;

  const { blockUserId } = req.params;
  if (!blockUserId) {
    throw new ApiError(400, "Blocked user is required");
  }

  const user = await User.findById(_id);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (user.blocked.includes(blockUserId)) {
    throw new ApiError(409, "User already blocked");
  }

  user.blocked = [...user.blocked, blockUserId];
  await user.save({ validateBeforeSave: false });

  const newUser = removeSensitiveData(user);

  return res
    .status(200)
    .json(new ApiResponse(200, newUser, "User was blocked"));
});

const unblockUser = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ApiError(401, "User not verified");
  }
  const { _id } = req.user;

  const { unblockUserId } = req.params;
  if (!unblockUserId) {
    throw new ApiError(400, "Unblocked user is required");
  }

  const user = await User.findById(_id);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  user.blocked = user.blocked.filter(
    (ele) => ele.toString() !== unblockUserId.toString()
  );
  await user.save({ validateBeforeSave: false });

  const newUser = removeSensitiveData(user);

  return res
    .status(200)
    .json(new ApiResponse(200, newUser, "User was unblocked"));
});

const renewAccessToken = asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken } = req.cookies || req.body;
  if (!refreshToken) {
    throw new ApiError(400, "Refresh token is required");
  }

  const decodedToken = (await jwt.verify(
    refreshToken,
    process.env.REFRESH_TOKEN_SECRET as string
  )) as jwt.JwtPayload;
  if (!decodedToken?._id) {
    throw new ApiError(401, "Invalid token");
  }

  const user = await User.findById(decodedToken._id);
  if (!user) {
    throw new ApiError(401, "User not found");
  }

  if (user.refreshToken !== refreshToken) {
    throw new ApiError(201, "Refresh token mismatch");
  }

  const accessToken = await user.generateAccessToken();
  if (!accessToken) {
    throw new ApiError(400, "Something went wrong, while renewing accessToken");
  }

  const newUser = removeSensitiveData(user);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        user: newUser,
        accessToken,
      },
      "Access token was renewed"
    )
  );
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
    if (username.startsWith(".")) {
      throw new ApiError(400, "Username cannot start with a .");
    }

    const user = await User.findOne({ username });
    if (user && user.isMailVerified) {
      throw new ApiError(400, "Username not available");
    }

    return res.status(200).json(new ApiResponse(200, {}, "Username available"));
  }
);

export {
  registerUser,
  loginUser,
  getCurrentUser,
  verifyEmail,
  logoutUser,
  updateAvatar,
  removeAvatar,
  updatePassword,
  updateDetails,
  updateBlueTickStatus,
  blockUser,
  unblockUser,
  renewAccessToken,
  isUsernameAvailable,
  resendEmail,
};
