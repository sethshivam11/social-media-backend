import { asyncHandler } from "../utils/AsyncHandler";
import { ApiError } from "../utils/ApiError";
import { Request, Response } from "express";
import { ApiResponse } from "../utils/ApiResponse";
import { Post } from "../models/post.model";
import { File } from "./user.controller";
import { deleteFromCloudinary, recordFileLink, uploadToCloudinary } from "../utils/cloudinary";
import { follow } from "./follow.controller";

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
        media: media.secure_url
    })
    await post.updatePostCount()

    if (!post) {
        throw new ApiError(400, "Something went wrong, while posting")
    }

    return res.status(201).json(
        new ApiResponse(200, post, "Post created successfully")
    )
})

const deletePost = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
        throw new ApiError(401, "User not verified")
    }

    const { _id } = req.user
    const { postId } = req.params
    if (!postId) {
        throw new ApiError(400, "Post id is required")
    }

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
        const { userId } = req.params
        if (!userId) {
            throw new ApiError(400, "User id is required")
        }

        // first post with user's details 
        const firstPost = await Post.findOne({ user: userId })
            .populate({
                path: "user",
                model: "user",
                select: "username fullName avatar followingCount followersCount postsCount isBlueTick",
                strictPopulate: false
            }).sort({ createdAt: -1 })
        if (!firstPost) {
            throw new ApiError(404, "No posts found")
        }

        // rest posts without user's details
        const restPosts = await Post.find({ user: userId }).sort({ createdAt: -1 }).skip(1)
        const posts = [firstPost, ...restPosts || []]

        return res.status(200).json(
            new ApiResponse(200, posts, "Posts retrieved successfully")
        )
    })

const getPost = asyncHandler(
    async (req: Request, res: Response) => {
        if (!req.user) {
            throw new ApiError(401, "User not verified")
        }

        const { postId } = req.params
        if (!postId) {
            throw new ApiError(400, "Post id is required")
        }

        const post = await Post.findById(postId)
            .populate({
                model: "user",
                path: "user",
                select: "username avatar fullName followersCount followingCount postsCount",
                strictPopulate: false
            })

        if (!post) {
            throw new ApiError(404, "Post not found")
        }

        return res.status(200).json(
            new ApiResponse(200, post, "Post retrieved successfully")
        )
    })

const createFeed = asyncHandler(
    async (req: Request, res: Response) => {
        if (!req.user) {
            throw new ApiError(401, "User not verified")
        }

        const posts = await Post.find()
        .populate({
            path: "user",
            model: "user",
            select: "username avatar",
            strictPopulate: false
        }).sort({ createdAt: -1 })
        if (!posts || posts.length === 0) {
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

        const { postId } = req.params
        if (!postId) {
            throw new ApiError(400, "Post id is required")
        }

        const post = await Post.findById(postId)
        if (!post) {
            throw new ApiError(404, "Post not found")
        }

        const like = await post.likePost(_id)
        if (typeof like === "string") {
            throw new ApiError(409, like)
        }

        return res.status(200).json(
            new ApiResponse(200, post, "Post liked successfully")
        )
    })

const dislikePost = asyncHandler(
    async (req: Request, res: Response) => {
        if (!req.user) {
            throw new ApiError(401, "User not verified")
        }
        const { _id } = req.user

        const { postId } = req.params
        if (!postId) {
            throw new ApiError(400, "Post id is required")
        }

        const post = await Post.findById(postId)
        if (!post) {
            throw new ApiError(404, "Post not found")
        }

        const dislike = await post.dislikePost(_id)
        if (typeof dislike === "string") {
            throw new ApiError(404, dislike)
        }

        return res.status(200).json(
            new ApiResponse(200, post, "Post liked successfully")
        )
    })

export { createPost, deletePost, getUserPosts, createFeed, likePost, dislikePost, getPost }