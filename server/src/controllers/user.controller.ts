import { ApiError } from "../utils/ApiError"
import { ApiResponse } from "../utils/ApiResponse"
import { User } from "../models/user.model"
import { Request, Response } from "express"
import { asyncHandler } from "../utils/AsyncHandler"
import { uploadToCloudinary } from "../utils/cloudinary"

interface File {
    fieldname: string,
    originalname: string,
    encoding: string,
    mimetype: string,
    destination: string,
    filename: string,
    path: string,
    size: number
}

const generateAccessAndRefreshToken = async (userId: string) => {
    try {
        const user = await User.findById(userId)

        if (!user) {
            return { accessToken: "", refreshToken: "" }
        }

        const accessToken = await user?.generateAccessToken()
        const refreshToken = await user?.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })

        return { accessToken, refreshToken }

    } catch (err) {
        throw new ApiError(500, "Something went wrong, while generating access and refresh tokens")
    }
}

const options = {
    httpOnly: true,
    secure: true
}

const registerUser = asyncHandler(
    async (req: Request, res: Response) => {
        const { fullName, username, email, password } = req.body

        if ([fullName, username, email, password].some((field) => 
            field?.trim() === ""
        )) {
            throw new ApiError(400, "All fields are required")
        }

        const existedUser = await User.findOne({
            $or: [{ username }, { email }]
        })

        if (existedUser) {
            throw new ApiError(409, "User username or email already exists")
        }

        const avatarLocalPath = (req.file as File)?.path

        if (!avatarLocalPath) {
            throw new ApiError(400, "Avatar file is required")
        }

        const avatar = await uploadToCloudinary(avatarLocalPath)

        if (!avatar) {
            throw new ApiError(400, "Error while uploading the avatar file")
        }

        const user = await User.create({
            fullName,
            email,
            password,
            username,
            avatar: avatar?.url
        })

        if (!user) {
            throw new ApiError(400, "Something went wrong while registering the user")
        }

        return res.status(201).json(
            new ApiResponse(200, user, "User registered successfully")
        )
    }
)

const loginUser = asyncHandler(
    async (req: Request, res: Response) => {

        const { username, email, password } = req.body

        if (!(username || email)) {
            throw new ApiError(400, "Username or email is required")
        }

        const user = await User.findOne({
            $or: [{ username }, { email }]
        })

        if (!user) {
            throw new ApiError(404, "User does not exists")
        }

        const isPasswordValid = await user.isPasswordCorrect(password)
        if (!isPasswordValid) {
            throw new ApiError(401, "Invalid credentials")
        }

        user.password = ""
        const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id)

        return res
            .status(201)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", refreshToken, options)
            .json(
                new ApiResponse(200, {
                    user,
                    accessToken,
                    refreshToken
                }, "User logged in successfully")
            )
    })


export {
    registerUser,
    loginUser,
}