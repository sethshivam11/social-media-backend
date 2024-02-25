import { asyncHandler } from "../utils/AsyncHandler";
import { ApiError } from "../utils/ApiError";
import { Request, Response } from "express";
import { ApiResponse } from "../utils/ApiResponse";
import { Post } from "../models/post.model";
import { File } from "./user.controller";
import { deleteFromCloudinary, recordFileLink, uploadToCloudinary } from "../utils/cloudinary";

const limit = 20;
let pageNo = 1;

const createPost = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
        throw new ApiError(401, "User not verified")
    }

    const { _id } = req.user

    const { caption, tags } = req.body

    const mediaFilePath = (req.file as File)?.path

    if (!(mediaFilePath || caption)) {
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
        const { page } = req.query
        if (!userId) {
            throw new ApiError(400, "User id is required")
        }
        if (page) {
            pageNo = parseInt(page as string)
            if (pageNo <= 0) {
                pageNo = 1
            }
        }

        // first post with user's details 
        const firstPost = await Post.findOne({ user: userId })
            .populate({
                path: "user",
                model: "user",
                select: "username fullName avatar followingCount followersCount postsCount isBlueTick",
                strictPopulate: false
            })

        if (!firstPost) {
            throw new ApiError(404, "No posts found")
        }

        // rest posts without user's details
        const restPosts = await Post.find({ user: userId })
            .sort({ createdAt: -1 })
            .limit(limit)
            .skip(pageNo === 1 ? 1 : (pageNo - 1) * 20)

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

        const { page } = req.query
        if (page) {
            pageNo = parseInt(page as string)
            if (pageNo <= 0) {
                pageNo = 1
            }
        }

        const post = await Post.findById(postId)
            .populate({
                model: "user",
                path: "user",
                select: "username avatar fullName followersCount followingCount postsCount",
                strictPopulate: false
            })
            .limit(limit)
            .skip((pageNo - 1) * 20)

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
        const { _id, blocked } = req.user
        const { page } = req.query

        if (page) {
            pageNo = parseInt(page as string)
            if (pageNo <= 0) {
                pageNo = 1
            }
        }

        //  Get users that the logged in user is following
        const follow = await Post.aggregate([
            {
                $lookup: {
                    from: "follows",
                    localField: "user",
                    foreignField: "user",
                    as: "follow"
                }
            },
            {
                $match: {
                    $expr: {
                        $eq: ["$user", _id]
                    }
                }
            },
            {
                $unwind: "$follow"
            },
            {
                $project: {
                    follow: 1,
                }
            },
            {
                $limit: 1,
            },
        ])

        if (follow.length === 0 || follow[0].follow.followings.length === 0) {
            throw new ApiError(404, "No posts found")
        }

        // Get posts of the users that the logged in user is following
        const posts = await Post.find({
            user: { $in: follow[0]?.follow?.followings, $nin: blocked },
        })
            .populate({
                model: "user",
                path: "user",
                select: "username avatar fullName",
                strictPopulate: false
            })
            .limit(limit)
            .skip((pageNo - 1) * limit)

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
            new ApiResponse(200, post, "Post disliked successfully")
        )
    })

const addToTags = asyncHandler(
    async (req: Request, res: Response) => {
        if (!req.user) {
            throw new ApiError(401, "User not verified")
        }
        const { _id } = req.user

        const { postId, tags } = req.body
        if (!postId || !tags) {
            throw new ApiError(400, "Post id and tagged users is required")
        }

        if (!(tags instanceof Array)) {
            throw new ApiError(400, "Tagged user must be an array")
        }

        const post = await Post.findById(postId)
        if (!post) {
            throw new ApiError(404, "Post not found")
        }

        if (post.user.toString() !== _id.toString()) {
            throw new ApiError(403, "Unauthorized request")
        }

        tags.forEach((tag: string) => {
            if (post.tags.includes(tag)) {
                throw new ApiError(409, "Some users already tagged")
            }
        })

        post.tags = [...post.tags, ...tags]
        await post.save()

        return res.status(200).json(
            new ApiResponse(200, post, "Users added to tags")
        )
    })

const removeFromTags = asyncHandler(
    async (req: Request, res: Response) => {
        if (!req.user) {
            throw new ApiError(401, "User not verified")
        }
        const { _id } = req.user

        const { postId, tags } = req.body
        if (!postId || !tags) {
            throw new ApiError(400, "Post id and tagged user is required")
        }

        if (!(tags instanceof Array)) {
            throw new ApiError(400, "Tagged user must be an array")
        }

        const post = await Post.findById(postId)
        if (!post) {
            throw new ApiError(404, "Post not found")
        }

        if (post.user.toString() !== _id.toString()) {
            throw new ApiError(403, "Unauthorized request")
        }

        await post.updateOne({ $pull: { tags: { $in: tags } } }, { new: true })

        return res.status(200).json(
            new ApiResponse(200, {}, "Users removed from tags")
        )
    })

export { createPost, deletePost, getUserPosts, createFeed, likePost, dislikePost, getPost, addToTags, removeFromTags }