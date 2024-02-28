import { Request, Response } from "express";
import { Chat } from "../models/chat.model";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/AsyncHandler";
import { File } from "./user.controller";
import { deleteFromCloudinary, recordFileLink, uploadToCloudinary } from "../utils/cloudinary";
import { ChatEventEnum, DEFAULT_GROUP_ICON } from "../constants";
import { emitSocketEvent } from "../socket";


// limit number of chats for pagination
const limit = 20;
let pageNo = 1;

const createOneToOneChat = asyncHandler(
    async (req: Request, res: Response) => {
        if (!req.user) {
            throw new ApiError(401, "User not verified")
        }

        const { _id, fullName, username, avatar } = req.user
        const { receiverId } = req.body
        if (!receiverId) {
            throw new ApiError(400, "receiverId is required")
        }

        const chatExists = await Chat.findOne({ users: { $in: [_id, receiverId] }, isGroupChat: false })
        if (chatExists) {
            throw new ApiError(400, "Chat already exists")
        }

        const chat = await Chat.create({
            users: [_id, receiverId],
        })

        if (!chat) {
            throw new ApiError(400, "Something went wrong, while creating chat")
        }
        emitSocketEvent(_id, ChatEventEnum.NEW_CHAT_EVENT, { fullName, username, avatar })

        return res.status(200).json(
            new ApiResponse(200, chat, "Chat created successfully")
        )
    })

const createGroupChat = asyncHandler(
    async (req: Request, res: Response) => {
        if (!req.user) {
            throw new ApiError(401, "User not verified")
        }
        const { _id, fullName, username, avatar } = req.user

        const { participants, groupName, admin } = req.body
        if (!participants || !groupName) {
            throw new ApiError(400, "participants and groupName are required")
        }

        if (!(participants instanceof Array)) {
            throw new ApiError(400, "Participants must be an array")
        }

        let groupIcon = DEFAULT_GROUP_ICON
        const groupIconLocalPath = (req.file as File)?.path
        if (groupIconLocalPath) {
            const groupIconData = await uploadToCloudinary(groupIconLocalPath)
            if (!groupIconData) {
                throw new ApiError(500, "Something went wrong while uploading group icon")
            }
            groupIcon = groupIconData.secure_url
        }


        const groupChat = await Chat.create({
            users: [...participants, _id],
            groupName,
            groupIcon,
            admin: [...admin || [], _id],
            isGroupChat: true
        })

        if (!groupChat) {
            throw new ApiError(400, "Something went wrong, while creating group chat")
        }
        emitSocketEvent(groupChat._id, ChatEventEnum.NEW_CHAT_EVENT, { fullName, username, avatar })

        return res.status(200).json(
            new ApiResponse(200, groupChat, "Group chat created successfully")
        )
    })

const getChats = asyncHandler(
    async (req: Request, res: Response) => {
        if (!req.user) {
            throw new ApiError(401, "User not verified")
        }
        const { _id } = req.user
        const { page } = req.query

        if (page) {
            pageNo = parseInt(page as string)
        }

        const chats = await Chat.find({ users: _id })
            .populate({
                path: "users",
                select: "name username avatar",
                model: "user",
                strictPopulate: false,
                options: { limit: 2, sort: { updatedAt: -1 } }
            })
            .limit(limit)
            .skip((pageNo - 1) * limit)

        if (!chats) {
            throw new ApiError(404, "No chats found")
        }

        return res.status(200).json(
            new ApiResponse(200, chats, "Chats fetched successfully")
        )
    })

const addParticipants = asyncHandler(
    async (req: Request, res: Response) => {
        if (!req.user) {
            throw new ApiError(401, "User not verified")
        }
        const { _id, fullName, username, avatar } = req.user

        const { chatId, participants } = req.body
        if (!chatId || !participants) {
            throw new ApiError(400, "chatId and participants are required")
        }

        const chat = await Chat.findById(chatId)
        if (!chat) {
            throw new ApiError(404, "Chat not found")
        }

        if (!chat.admin.includes(_id)) {
            throw new ApiError(403, "You are not authorized to add participants")
        }
        participants.forEach((participant: string) => {
            if (chat.users.includes(participant)) {
                throw new ApiError(400, "Some participants already exists")
            }
        })

        chat.users = [...chat.users, ...participants]
        await chat.save()
        const participantsInfo = await chat.getParticipantsInfo(participants)

        emitSocketEvent(chat._id, ChatEventEnum.NEW_PARTICIPANT_ADDED_EVENT, { participantsInfo, user: { fullName, avatar, username } })

        return res.status(200).json(
            new ApiResponse(200, chat, "Participants added successfully")
        )
    })

const removeParticipants = asyncHandler(
    async (req: Request, res: Response) => {
        if (!req.user) {
            throw new ApiError(401, "User not verified")
        }
        const { _id, fullName, username, avatar } = req.user

        const { chatId, participants } = req.body
        if (!chatId || !participants) {
            throw new ApiError(400, "chatId and participants are required")
        }

        const chat = await Chat.findById(chatId)
        if (!chat) {
            throw new ApiError(404, "Chat not found")
        }

        if (!chat.admin.includes(_id)) {
            throw new ApiError(403, "You are not authorized to remove participants")
        }

        participants.forEach((participant: string) => {
            if (!chat.users.includes(participant)) {
                throw new ApiError(400, "Some participants are already not in group")
            }
        })

        await chat.updateOne({ $pull: { users: { $in: participants } } })

        const participantsInfo = await chat.getParticipantsInfo(participants)
        emitSocketEvent(chat._id, ChatEventEnum.NEW_PARTICIPANT_ADDED_EVENT, { participantsInfo, user: { fullName, username, avatar } })

        return res.status(200).json(
            new ApiResponse(200, {}, "Participants removed successfully")
        )
    })

const updateGroupDetails = asyncHandler(
    async (req: Request, res: Response) => {
        if (!req.user) {
            throw new ApiError(401, "User not verified")
        }
        const { _id } = req.user

        const { chatId, groupName } = req.body
        const groupIconLocalPath = (req.file as File)?.path

        if (!chatId || !(groupIconLocalPath || groupName)) {
            throw new ApiError(400, "chatId or groupImage is required")
        }

        const chat = await Chat.findById(chatId)
        if (!chat) {
            throw new ApiError(404, "Chat not found")
        }

        if (!chat.admin.includes(_id)) {
            throw new ApiError(403, "You are not authorized to update group icon")
        }

        if (groupIconLocalPath) {
            const groupIcon = await uploadToCloudinary(groupIconLocalPath)
            if (!groupIcon) {
                throw new ApiError(500, "Something went wrong while uploading group icon")
            }

            const deletePreviousIcon = await deleteFromCloudinary(chat.groupIcon as string)
            if (!deletePreviousIcon) {
                recordFileLink(chat.groupIcon as string)
            }

            chat.groupIcon = groupIcon.secure_url
        }

        if (groupName) chat.groupName = groupName
        await chat.save()

        emitSocketEvent(chat._id, ChatEventEnum.GROUP_DETAILS_UPDATED, chat)

        return res.status(200).json(
            new ApiResponse(200, chat, "Group icon updated successfully")
        )
    })

const deleteGroup = asyncHandler(
    async (req: Request, res: Response) => {
        if (!req.user) {
            throw new ApiError(401, "User not verified")
        }
        const { _id } = req.user

        const { chatId } = req.params
        if (!chatId) {
            throw new ApiError(400, "chatId is required")
        }

        const chat = await Chat.findById(chatId)
        if (!chat) {
            throw new ApiError(404, "Group not found")
        }

        if (!chat.admin.includes(_id)) {
            throw new ApiError(403, "You are not authorized to delete group")
        }

        await chat.deleteOne()

        emitSocketEvent(chat._id, ChatEventEnum.GROUP_DETAILS_UPDATED, chat)

        return res.status(200).json(
            new ApiResponse(200, {}, "Group deleted successfully")
        )
    })

const leaveGroup = asyncHandler(
    async (req: Request, res: Response) => {
        if (!req.user) {
            throw new ApiError(401, "User not verified")
        }
        const { _id } = req.user

        const { chatId } = req.params
        if (!chatId) {
            throw new ApiError(400, "chatId is required")
        }

        await Chat.findByIdAndUpdate(chatId,
            { $pull: { users: _id, admin: _id } },
            { new: true })

        emitSocketEvent(chatId, ChatEventEnum.GROUP_LEAVE_EVENT, { chatId })

        return res.status(200).json(
            new ApiResponse(200, {}, "Group left successfully")
        )
    })

const removeGroupIcon = asyncHandler(
    async (req: Request, res: Response) => {
        if (!req.user) {
            throw new ApiError(401, "User not verified")
        }
        const { _id } = req.user

        const { chatId } = req.params
        if (!chatId) {
            throw new ApiError(400, "chatId is required")
        }

        const chat = await Chat.findById(chatId)
        if (!chat) {
            throw new ApiError(404, "Chat not found")
        }

        if (!chat.isGroupChat) {
            throw new ApiError(400, "This is not a group chat")
        }

        if (!chat.admin.includes(_id)) {
            throw new ApiError(403, "You are not authorized to remove group icon")
        }

        if (chat.groupIcon === DEFAULT_GROUP_ICON) {
            throw new ApiError(400, "Group icon is already removed")
        }

        const deletePreviousIcon = await deleteFromCloudinary(chat.groupIcon as string)
        if (!deletePreviousIcon) {
            recordFileLink(chat.groupIcon as string)
        }

        chat.groupIcon = DEFAULT_GROUP_ICON
        await chat.save()

        emitSocketEvent(chat._id, ChatEventEnum.GROUP_DETAILS_UPDATED, chat)

        return res.status(200).json(
            new ApiResponse(200, chat, "Group icon removed successfully")
        )
    })

const makeAdmin = asyncHandler(
    async (req: Request, res: Response) => {
        if (!req.user) {
            throw new ApiError(401, "User not verified")
        }
        const { _id } = req.user

        const { chatId, userId } = req.body
        if (!chatId || !userId) {
            throw new ApiError(400, "chatId and userId are required")
        }

        const chat = await Chat.findById(chatId)
        if (!chat) {
            throw new ApiError(404, "Chat not found")
        }

        if (!chat.admin.includes(_id)) {
            throw new ApiError(403, "You are not authorized to make admin")
        }

        if (!chat.users.includes(userId)) {
            throw new ApiError(400, "User is not in the group")
        }

        if (chat.admin.includes(userId)) {
            throw new ApiError(400, "User is already an admin")
        }

        chat.admin = [...chat.admin, userId]
        await chat.save()
        const getUsersInParticipants = await chat.getParticipantsInfo([userId])

        emitSocketEvent(chat._id, ChatEventEnum.NEW_ADMIN_EVENT, getUsersInParticipants)

        return res.status(200).json(
            new ApiResponse(200, chat, "Admin added successfully")
        )
    })

const removeAdmin = asyncHandler(
    async (req: Request, res: Response) => {
        if (!req.user) {
            throw new ApiError(401, "User not verified")
        }
        const { _id } = req.user

        const { chatId, userId } = req.body
        if (!chatId || !userId) {
            throw new ApiError(400, "chatId and userId are required")
        }

        const chat = await Chat.findById(chatId)
        if (!chat) {
            throw new ApiError(404, "Chat not found")
        }

        if (!chat.admin.includes(_id)) {
            throw new ApiError(403, "You are not authorized to make admin")
        }

        if (!chat.users.includes(userId)) {
            throw new ApiError(400, "User is not in the group")
        }

        if (!chat.admin.includes(userId)) {
            throw new ApiError(400, "User is already not an admin")
        }

        await chat.updateOne({ $pull: { admin: userId } }, { new: true })

        const getUsersInParticipants = await chat.getParticipantsInfo([userId])
        emitSocketEvent(chat._id, ChatEventEnum.NEW_ADMIN_EVENT, getUsersInParticipants)

        return res.status(200).json(
            new ApiResponse(200, chat, "Admin added successfully")
        )
    })


export { createOneToOneChat, getChats, createGroupChat, addParticipants, removeParticipants, deleteGroup, updateGroupDetails, leaveGroup, removeGroupIcon, makeAdmin, removeAdmin }