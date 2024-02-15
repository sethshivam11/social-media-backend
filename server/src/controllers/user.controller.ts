import { ApiError } from "../utils/ApiError"
import { ApiResponse } from "../utils/ApiResponse"
import { User, UserInterface } from "../models/user.model"
import { Request, Response } from "express"
import { asyncHandler } from "../utils/AsyncHandler"
import { deleteFromCloudinary, uploadToCloudinary, recordFileLink } from "../utils/cloudinary"
import jwt from "jsonwebtoken"

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


const options = {
    httpOnly: true,
    secure: true
}

const generateAccessAndRefreshToken = async (userId: string) => {
    try {
        const user = await User.findById(userId)

        if (!user) {
            throw new ApiError(404, "User not found")
        }

        const accessToken = await user?.generateAccessToken()
        const refreshToken = await user?.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })

        return { accessToken, refreshToken }

    } catch (err) {
        console.log(err)
        throw new ApiError(500, "Something went wrong, while generating access and refresh tokens")
    }
}

const registerUser = asyncHandler(
    async (req: Request, res: Response) => {
        const { fullName, username, email, password } = req.body

        if ([fullName, username, email, password].some((field) =>
            field?.trim() === ""
        ) || !(fullName || username || email || password)
        ) {
            throw new ApiError(400, "All fields are required")
        }

        const existedUser = await User.findOne({
            $or: [{ username }, { email }]
        })

        if (existedUser) {
            throw new ApiError(409, "User username or email already exists")
        }

        const avatarLocalPath = (req.file as File)?.path

        if (avatarLocalPath) {
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
        user.password = ""
        user.refreshToken = ""

        return res.status(201).json(
            new ApiResponse(200, user, "User registered successfully")
        )
    }
)

const loginUser = asyncHandler(
    async (req: Request, res: Response) => {

        const { username, email, password } = req.body

        if (!(username || email) || !password) {
            throw new ApiError(400, "Username or email is required")
        }

        const user = await User.findOne({
            $or: [{ username }, { email }]
        })

        if (!user) {
            throw new ApiError(404, "User not found")
        }

        const isPasswordValid = await user.isPasswordCorrect(password)
        if (!isPasswordValid) {
            throw new ApiError(401, "Invalid passsword")
        }

        user.password = ""
        user.refreshToken = ""
        const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id)

        return res
            .status(200)
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

const getCurrentUser = asyncHandler(
    async (req: Request, res: Response) => {
        if (!req.user) {
            throw new ApiError(401, "User not verified")
        }

        return res.status(200).json(
            new ApiResponse(200, req.user, "User found")
        )

    })

const verifyEmail = asyncHandler(
    async (req: Request, res: Response) => {
        if (!req.user) {
            throw new ApiError(401, "User not verified")
        }
        const { _id } = req.user

        const user = await User.findByIdAndUpdate(_id,
            { $set: { isMailVerified: true } },
            { new: true })

        if (!user) {
            throw new ApiError(404, "User not found")
        }
        user.password = ""
        user.refreshToken = ""

        return res.status(200).json(
            new ApiResponse(200, user, "User verified")
        )
    })

const logoutUser = asyncHandler(
    async (req: Request, res: Response) => {

        if (!req.user) {
            throw new ApiError(401, "User not verified")
        }

        const { _id } = req.user

        const user = await User.findById(_id)
        if (!user) {
            throw new ApiError(404, "User not found")
        }

        user.password = ""
        user.refreshToken = ""

        return res.status(200).json(
            new ApiResponse(200, user, "User logged out")
        )
    })

const updatePassword = asyncHandler(
    async (req: Request, res: Response) => {
        if (!req.user) {
            throw new ApiError(401, "User not verified")
        }
        const { _id } = req.user

        const { oldPassword, newPassword } = req.body
        if (!(oldPassword || newPassword)) {
            throw new ApiError(400, "Both passwords are required")
        }

        const user = await User.findById(_id)
        if (!user) {
            throw new ApiError(404, "User not found")
        }

        const isPasswordValid = user.isPasswordCorrect(oldPassword)
        if (!isPasswordValid) {
            throw new ApiError(401, "Invalid password")
        }

        user.password = newPassword
        await user.save()
        user.password = ""
        user.refreshToken = ""

        return res.status(200).json(
            new ApiResponse(200, user, "Password was changed")
        )
    })

const updateAvatar = asyncHandler(
    async (req: Request, res: Response) => {
        if (!req.user) {
            throw new ApiError(401, "User not verified")
        }
        const { _id } = req.user

        const avatarLocalPath = (req.file as File)?.path
        if (!avatarLocalPath) {
            throw new ApiError(400, "Avatar file is required")
        }

        const avatar = await uploadToCloudinary(avatarLocalPath)
        if (!avatar) {
            throw new ApiError(400, "Something went wrong, while uploading to cloudinary")
        }

        // Delete file from cloudinary / record if not deleted
        const deletePrevAvatar = await deleteFromCloudinary(req.user.avatar as string)
        if (!deletePrevAvatar) {
            recordFileLink(req.user.avatar as string)
        }

        const user = await User.findByIdAndUpdate(_id, { $set: { avatar: avatar.secure_url } }, { new: true })
        if (!user) {
            throw new ApiError(400, "Something went wrong, while updating avatar")
        }

        user.password = ""
        user.refreshToken = ""

        return res.status(200).json(
            new ApiResponse(200, user, "Avatar updated")
        )
    })

const updateDetails = asyncHandler(
    async (req: Request, res: Response) => {
        if (!req.user) {
            throw new ApiError(401, "User not verified")
        }

        const { _id } = req.user
        const { fullName, email, username, bio } = req.body

        const user = await User.findById(_id)
        if (!user) {
            throw new ApiError(404, "User not found")
        }

        if (fullName) user.fullName = fullName
        if (bio) user.bio = bio

        if (email) {
            const checkEmail = await User.findOne({ email })

            if (checkEmail) {
                throw new ApiError(409, "User with this email already exists")
            }
            user.email = email
        }

        if (username) {
            const checkUserName = await User.findOne({ username })

            if (checkUserName) {
                throw new ApiError(409, "User with username already exists")
            }
            user.username = username
        }

        await user.save({ validateBeforeSave: false })

        user.password = ""
        user.refreshToken = ""

        return res.status(200).json(
            new ApiResponse(200, user, "user details updated")
        )
    })

const updateBlueTickStatus = asyncHandler(
    async (req: Request, res: Response) => {
        if (!req.user) {
            throw new ApiError(401, "User not verified")
        }
        const { _id } = req.user

        const user = await User.findById(_id)
        if (!user) {
            throw new ApiError(404, "User not found")
        }

        user.isBlueTick = true

        await user.save({ validateBeforeSave: false })

        user.password = ""
        user.refreshToken = ""

        return res.status(200).json(
            new ApiResponse(200, user, "User's blue tick updated")
        )
    })

const blockUser = asyncHandler(
    async (req: Request, res: Response) => {
        if (!req.user) {
            throw new ApiError(401, "User not verified")
        }
        const { _id } = req.user

        const { blockUserId } = req.params
        if (!blockUserId) {
            throw new ApiError(400, "Blocked user is required")
        }

        const user = await User.findById(_id)
        if (!user) {
            throw new ApiError(404, "User not found")
        }

        user.blocked = [...user.blocked, blockUserId]
        await user.save({ validateBeforeSave: false })

        user.password = ""
        user.refreshToken = ""

        return res.status(200).json(
            new ApiResponse(200, user, "User was blocked")
        )
    })

const unblockUser = asyncHandler(
    async (req: Request, res: Response) => {
        if (!req.user) {
            throw new ApiError(401, "User not verified")
        }
        const { _id } = req.user

        const { unblockUserId } = req.params
        if (!unblockUserId) {
            throw new ApiError(400, "Unblocked user is required")
        }

        const user = await User.findById(_id)
        if (!user) {
            throw new ApiError(404, "User not found")
        }

        user.blocked = user.blocked.filter((blockedUser) => blockedUser !== unblockUserId)
        user.save({ validateBeforeSave: false })

        user.password = ""
        user.refreshToken = ""

        return res.status(200).json(
            new ApiResponse(200, user, "User was unblocked")
        )
    })

const renewAccessToken = asyncHandler(
    async (req: Request, res: Response) => {
        const { refreshToken } = req.body
        if (!refreshToken) {
            throw new ApiError(400, "Refresh token is required")
        }

        const decodedToken = await jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET as string) as jwt.JwtPayload
        if (!decodedToken?._id) {
            throw new ApiError(401, "Invalid token")
        }

        const user = await User.findById(decodedToken._id)
        if (!user) {
            throw new ApiError(401, "User not found")
        }

        if (user.refreshToken !== refreshToken) {
            throw new ApiError(201, "Refresh token mismatch")
        }

        const accessToken = await user.generateAccessToken()
        if (!accessToken) {
            throw new ApiError(400, "Something went wrong, while renewing accessToken")
        }

        user.password = ""
        user.refreshToken = ""

        return res.status(200).json(
            new ApiResponse(200, {
                user, accessToken
            }, "Access token was renewed")
        )
    })

const isUsernameAvailable = asyncHandler(
    async (req: Request, res: Response) => {
        const { username } = req.params

        const user = await User.findOne({ username })
        if (user) {
            throw new ApiError(400, "Username not available")
        }

        return res.status(200).json(
            new ApiResponse(200, {}, "Username available")
        )
    })

export {
    registerUser,
    loginUser,
    getCurrentUser,
    verifyEmail,
    logoutUser,
    updateAvatar,
    updatePassword,
    updateDetails,
    updateBlueTickStatus,
    blockUser,
    unblockUser,
    renewAccessToken,
    isUsernameAvailable
}