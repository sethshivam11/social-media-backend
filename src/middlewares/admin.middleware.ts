import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { ApiError } from "../utils/ApiError";

const verifyAdmin = async (req: Request, _: Response, next: NextFunction) => {
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

    if (!decodedToken?.username) {
      throw new ApiError(401, "Invalid token!");
    }

    if (decodedToken.username !== process.env.ADMIN_USERNAME) {
      throw new ApiError(403, "Access denied");
    }

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

export default verifyAdmin;
