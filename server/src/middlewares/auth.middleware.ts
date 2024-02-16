import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken"
import { ApiError } from "../utils/ApiError";
import { User } from "../models/user.model";


const verifyJWT = async (req: Request, _: Response, next: NextFunction) => {
    try {
        const token = req.header("Authorization")?.replace("Bearer ", "") || req.cookies?.accessToken

        if (!token) {
            throw new ApiError(400, "Token is required")
        }

        const decodedToken = await jwt.verify(token, process.env.ACCESS_TOKEN_SECRET as string) as JwtPayload

        if (!decodedToken?._id) {
            throw new ApiError(401, "Invalid token")
        }

        const user = await User.findById(decodedToken._id)

        if (!user) {
            throw new ApiError(400, "User not found")
        }

        const removeSensitiveData = user.toObject()
        delete removeSensitiveData.password
        delete removeSensitiveData.refreshToken

        req.user = removeSensitiveData

        next()

    } catch (error) {
        let message = "Something went wrong while verifying the user"

        if (error instanceof jwt.TokenExpiredError) {
            message = "Token expired!"
        }

        next(error)
    }
}


export default verifyJWT