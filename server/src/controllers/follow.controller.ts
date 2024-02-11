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

        const { followee } = req.params
        if (!followee) {
            throw new ApiError(400, "Follower is required")
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
                new ApiResponse(200, newFollow, "Follower updated")
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
                new ApiResponse(200, follow, "Follow updated")
            )
        }
    })

const unfollow = asyncHandler(
    async (req: Request, res: Response) => {
        if (!req.user) {
            throw new ApiError(400, "User not verified")
        }
        const { _id } = req.user

        const { unfollowee } = req.params
        if (!unfollowee) {
            throw new ApiError(400, "Following is required")
        }

        const follow: FollowInterface | null = await Follow.findOne({ user: _id })

        if (!follow) {
            throw new ApiError(404, "Follow not found")
        }

        if (!follow.followings.includes(unfollowee)) {
            throw new ApiError(404, "Follower already unfollowed")
        }

        follow.followings = follow.followings.filter((follower) => follower !== unfollowee)

        await follow.save().then(async () =>
            await follow.unfollow(unfollowee)
        )

        return res.status(200).json(
            new ApiResponse(200, follow, "Following updated")
        )
    })


export {
    follow,
    unfollow
}