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
        const { postId, comment } = req.body
        if (!postId || !comment) {
            throw new ApiError(400, "Post id and comment are required")
        }

        const newComment = await Comment.create({
            post: postId,
            user: _id,
            content: comment
        })
        if (!newComment) {
            throw new ApiError(400, "Something went wrong, while creating comment")
        }

        await newComment.updateCommentsCount(postId, 1)

        return res.status(200).json(
            new ApiResponse(200, newComment, "Comment created successfully")
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
        await comment.updateCommentsCount(comment.post as string, -1)

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

        await comment.updateOne({ $push: { likes: _id }, $inc: { likesCount: 1 } }, { new: true })
        comment.likes = [...comment.likes, _id]
        comment.likesCount = comment.likesCount as number + 1

        return res.status(200).json(
        new ApiResponse(200, comment, "Comment liked successfully")
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

        await comment.updateOne({ $pull: { likes: _id }, $inc: { likesCount: -1 } }, { new: true })
        comment.likes = comment.likes.filter((id) => id.toString() !== _id.toString())
        comment.likesCount = comment.likesCount as number - 1
        
        return res.status(200).json(
            new ApiResponse(200, comment, "Comment disliked successfully")
        )
    })

export { getAllComments, createComment, deleteComment, likeComment, dislikeComment }