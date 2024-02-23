import { Request, Response } from "express";
import { asyncHandler } from "../utils/AsyncHandler";
import { ApiError } from "../utils/ApiError";
import { Comment } from "../models/comment.model";
import { ApiResponse } from "../utils/ApiResponse";

const limit = 20;
let pageNo = 1;

const getAllComments = asyncHandler(
    async (req: Request, res: Response) => {
        if (!req.user) {
            throw new ApiError(401, "User not verified")
        }
        const { postId } = req.params
        const { page } = req.query
        if (!postId) {
            throw new ApiError(400, "Post id is required")
        }
        if (page) {
            pageNo = parseInt(page as string)
            if (pageNo <= 0) {
                pageNo = 1
            }
        }

        const comments = await Comment.find({ post: postId })
            .limit(limit)
            .skip((pageNo - 1) * limit)
        if (!comments || comments.length === 0) {
            throw new ApiError(404, "No comments found")
        }

        return res.status(201).json(
            new ApiResponse(200, comments, "Comments retrieved successfully")
        )
    })

const createComment = asyncHandler(
    async (req: Request, res: Response) => {
        if (!req.user) {
            throw new ApiError(401, "User not verified")
        }
        const { _id } = req.user
        const { postId, content } = req.body
        if (!postId || !content) {
            throw new ApiError(400, "Post id is required")
        }

        const comment = await Comment.create({
            post: postId,
            user: _id,
            content
        })
        if (!comment) {
            throw new ApiError(400, "Something went wrong, while creating comment")
        }
        await comment.updateCommentsCount(postId)

        return res.status(200).json(
            new ApiResponse(200, comment, "Comment created successfully")
        )
    })

const deleteComment = asyncHandler(
    async (req: Request, res: Response) => {
        if (!req.user) {
            throw new ApiError(401, "User not verified")
        }
        const { _id } = req.user

        const { commentId } = req.params
        if (!commentId) {
            throw new ApiError(400, "Comment id is required")
        }

        const comment = await Comment.findById(commentId)
        if (!comment) {
            throw new ApiError(404, "Comment not found")
        }

        if (comment.user.toString() !== _id.toString()) {
            throw new ApiError(401, "You are not authorized to delete this comment")
        }

        await comment.deleteOne()

        return res.status(200).json(
            new ApiResponse(200, {}, "Comment deleted successfully")
        )
    })

const likeComment = asyncHandler(
    async (req: Request, res: Response) => {
        if (!req.user) {
            throw new ApiError(401, "User not verified")
        }
        const { _id } = req.user

        const { commentId } = req.params
        if (!commentId) {
            throw new ApiError(400, "Comment id is required")
        }

        const comment = await Comment.findById(commentId)
        if (!comment) {
            throw new ApiError(404, "Comment not found")
        }

        const like = await comment.like(_id)
        if (typeof like === "string") {
            throw new ApiError(400, like)
        }

        return res.status(200).json(
            new ApiResponse(200, like, "Comment liked successfully")
        )
    })

const dislikeComment = asyncHandler(
    async (req: Request, res: Response) => {
        if (!req.user) {
            throw new ApiError(401, "User not verified")
        }
        const { _id } = req.user

        const { commentId } = req.params
        if (!commentId) {
            throw new ApiError(400, "Comment id is required")
        }

        const comment = await Comment.findById(commentId)
        if (!comment) {
            throw new ApiError(404, "Comment not found")
        }

        const dislike = await comment.dislike(_id)
        if (typeof dislike === "string") {
            throw new ApiError(400, dislike)
        }

        return res.status(200).json(
            new ApiResponse(200, dislike, "Comment disliked successfully")
        )
    })

export { getAllComments, createComment, deleteComment, likeComment, dislikeComment }