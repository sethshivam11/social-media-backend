import { asyncHandler } from "../utils/AsyncHandler";
import { ApiError } from "../utils/ApiError";
import { Request, Response } from "express";
import { ApiResponse } from "../utils/ApiResponse";
import { Post } from "../models/post.model";
import { File } from "./user.controller";
import { deleteFromCloudinary, recordFileLink, uploadToCloudinary } from "../utils/cloudinary";

const createPost = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
        throw new ApiError(401, "User not verified")
    }

    const { _id } = req.user

    const { caption, tags } = req.body

    const mediaFilePath = (req.file as File)?.path

    if (!mediaFilePath) {
        throw new ApiError(404, "Post image is required")
    }

    const media = await uploadToCloudinary(mediaFilePath)

    if (!media) {
        throw new ApiError(400, "Something went wrong, while uploading post media")
    }

    const post = await Post.create({
        user: _id,
        caption,
        tags,
        media
    })

    if (!post) {
        throw new ApiError(400, "Something went wrong, while posting")
    }

    return res.status(200).json(
        new ApiResponse(200, post, "Post created successfully")
    )
})

const deletePost = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
        throw new ApiError(401, "User not verified")
    }

    const { _id } = req.user
    const { postId } = req.params

    const post = await Post.findById(postId)
    if (!post) {
        throw new ApiError(404, "Post not found")
    }

    if (post.user.toString() !== _id.toString()) {
        throw new ApiError(403, "Unauthorized request")
    }

    const deletePost = await deleteFromCloudinary(post.media as string)
    if (!deletePost) {
        recordFileLink(post.media as string)
    }

    await post.deleteOne()

    return res.status(200).json(
        new ApiResponse(200, {}, "Post deleted successfully")
    )
})

const getUserPosts = asyncHandler(
    async (req: Request, res: Response) => {
        if (!req.user) {
            throw new ApiError(401, "User not verified")
        }
        const { _id } = req.user

        const posts = await Post.find({ user: _id }).sort({ createdAt: -1 })
        if (!posts) {
            throw new ApiError(404, "No posts found")
        }

        return res.status(200).json(
            new ApiResponse(200, posts, "Posts retrieved successfully")
        )
    })

const createFeed = asyncHandler(
    async (req: Request, res: Response) => {
        if (!req.user) {
            throw new ApiError(401, "User not verified")
        }
        const { _id } = req.user

        const posts = await Post.find().populate({
            path: "user",
            model: "user",
            select: "username avatar",
            strictPopulate: false
        }).sort({ createdAt: -1 })
        if (!posts) {
            throw new ApiError(404, "No posts found")
        }

        return res.status(200).json(
            new ApiResponse(200, posts, "Posts retrieved successfully")
        )
    })

const likePost = asyncHandler(
    async (req: Request, res: Response) => {
        if (!req.user) {
            throw new ApiError(401, "User not verified")
        }
        const { _id } = req.user
        const { postId, liker } = req.body

        const post = await Post.findById(postId)
        if(!post){
            throw new ApiError(404, "Post not found")
        }

        await post.likePost(liker)
    })

export { createPost, deletePost, getUserPosts, createFeed }