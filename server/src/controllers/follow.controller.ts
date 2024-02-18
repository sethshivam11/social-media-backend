import { Follow, FollowInterface } from "../models/follow.model";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/AsyncHandler";
import { Request, Response } from "express";

const follow = asyncHandler(
    async (req: Request, res: Response) => {
        if (!req.user) {
            throw new ApiError(400, "User not verified")
        }
        const { _id } = req.user

        const { followee } = req.body
        if (!followee) {
            throw new ApiError(400, "Followee is required")
        }

        const follow: FollowInterface | null = await Follow.findOne({ user: _id })

        // Create new follow if null
        if (!follow) {
            const newFollow = await Follow.create({
                user: _id,
                followings: [followee]
            })

            if (!newFollow) {
                throw new ApiError(400, "Something went wrong, while updating the followers")
            }
            await newFollow.follow(followee)

            return res.status(200).json(
                new ApiResponse(200, newFollow, "Followed user")
            )
        }

        // Update follow if found
        else {
            if (follow.followings.includes(followee)) {
                throw new ApiError(409, "Follower already followed")
            }
            follow.followings = [...follow.followings, followee]

            await follow.save().then(async () =>
                await follow.follow(followee))

            return res.status(200).json(
                new ApiResponse(200, follow, "Followed user")
            )
        }
    })

const unfollow = asyncHandler(
    async (req: Request, res: Response) => {
        if (!req.user) {
            throw new ApiError(400, "User not verified")
        }
        const { _id } = req.user

        const { unfollowee } = req.body
        if (!unfollowee) {
            throw new ApiError(400, "Unfollowee is required")
        }

        const follow: FollowInterface | null = await Follow.findOne({ user: _id })

        if (!follow) {
            throw new ApiError(404, "Follow not found")
        }

        if (!follow.followings.includes(unfollowee)) {
            throw new ApiError(404, "Follower already unfollowed")
        }

        await follow.updateOne({ $pull: { followings: unfollowee } }, { new: true })
            .then(async () =>
                await follow.unfollow(unfollowee)
            )

        return res.status(200).json(
            new ApiResponse(200, {}, "Unfollowed user")
        )
    })

const getFollowers = asyncHandler(
    async (req: Request, res: Response) => {
        if (!req.user) {
            throw new ApiError(400, "User not verified")
        }
        const { _id } = req.user

        const follow: FollowInterface | null = await Follow.findOne({ user: _id }).populate({
            path: "followers",
            select: "fullName username avatar",
            model: "user",
            strictPopulate: false
        })
        if (!follow) {
            throw new ApiError(404, "Followers not found")
        }

        return res.status(200).json(
            new ApiResponse(200, follow.followers, "Followers found")
        )
    })

const getFollowing = asyncHandler(
    async (req: Request, res: Response) => {
        if (!req.user) {
            throw new ApiError(400, "User not verified")
        }
        const { _id } = req.user

        const follow: FollowInterface | null = await Follow.findOne({ user: _id }).populate({
            path: "followings",
            select: "fullName username avatar",
            model: "user",
            strictPopulate: false
        })

        if (!follow) {
            throw new ApiError(404, "Followings not found")
        }

        return res.status(200).json(
            new ApiResponse(200, follow.followings, "Followings found")
        )
    })

export {
    follow,
    unfollow,
    getFollowers,
    getFollowing
}