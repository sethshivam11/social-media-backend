import { Request, Response } from "express";
import { Chat } from "../models/chat.model";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/AsyncHandler";
import { File } from "./user.controller";

const createPersonalChat = asyncHandler(
    async (req: Request, res: Response) => {
        if (!req.user) {
            throw new ApiError(401, "User not verified")
        }

        const { _id } = req.user
        const { receiverId } = req.body

        const chat = await Chat.create({
            users: [_id, receiverId],
        })

        if (!chat) {
            throw new ApiError(400, "Something went wrong, while creating chat")
        }

        return res.status(200).json(
            new ApiResponse(200, chat, "Chat created successfully")
        )
    })

const createGroupChat = asyncHandler(
    async (req: Request, res: Response) => {
        if(!req.user){
            throw new ApiError(401, "User not verified")
        }
        const { _id } = req.user

        const { users, groupName, groupIcon, admin } = req.body
        
    })

const getChats = asyncHandler(
    async (req: Request, res: Response) => {
        if (!req.user) {
            throw new ApiError(401, "User not verified")
        }
        const { _id } = req.user

        const chats = await Chat.findOne({ users: _id }).populate({
            path: "user",
            model: "user",
            select: "fullName avatar username",
            strictPopulate: false
        })

        if(!chats) {
            throw new ApiError(404, "No chats found")
        }

        return res.status(200).json(
            new ApiResponse(200, chats, "Chats fetched successfully")
        )
    })



export { createPersonalChat, getChats }