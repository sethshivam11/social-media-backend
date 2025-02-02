import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { ApiError } from "../utils/ApiError";
import { User } from "../models/user.model";

const verifyJWT = async (req: Request, _: Response, next: NextFunction) => {
  try {
    const token =
      req.cookies?.token || req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      throw new ApiError(400, "Token is required");
    }

    const decodedToken = (await jwt.verify(
      token,
      process.env.TOKEN_SECRET as string
    )) as JwtPayload;

    if (!decodedToken?._id) {
      throw new ApiError(401, "Invalid token!");
    }

    const user = await User.findById(decodedToken._id, "-password");

    if (!user) {
      throw new ApiError(400, "User not found");
    }

    if (!user.isMailVerified) {
      throw new ApiError(401, `Mail not verified for: ${user.username}`);
    }

    const isLoggedIn = user.sessions.some((session) => session.token === token);
    if (!isLoggedIn) {
      throw new ApiError(401, "Invalid token!");
    }

    user.sessions = [];
    req.user = user;

    next();
  } catch (error) {
    if (
      error instanceof jwt.JsonWebTokenError ||
      error instanceof jwt.NotBeforeError
    ) {
      error.message = "Invalid token!";
    }

    next(error);
  }
};

export default verifyJWT;
