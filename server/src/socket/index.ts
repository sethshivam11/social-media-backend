import { Server, Socket } from "socket.io";
import { ChatEventEnum } from "../constants";
import jwt from "jsonwebtoken"
import { ApiError } from "../utils/ApiError";
import { User } from "../models/user.model";
import { io } from "../app";

const chatJoinEvent = (socket: Socket) => {
    socket.on(ChatEventEnum.NEW_CHAT_EVENT, (chatId) => {
        console.log("New chat event chatId: ", chatId)
        socket.join(chatId)
    })
}

const typingEvent = (socket: Socket) => {
    socket.on(ChatEventEnum.TYPING_EVENT, (chatId) => {
        console.log(`chatId: ${chatId} is typing`)
        socket.in(chatId).emit(ChatEventEnum.TYPING_EVENT, chatId)
    })
}

const stopTypingEvent = (socket: Socket) => {
    socket.on(ChatEventEnum.STOP_TYPING_EVENT, (chatId) => {
        socket.in(chatId).emit(ChatEventEnum.STOP_TYPING_EVENT, chatId)
    })
}

const groupNameUpdated = (socket: Socket) => {
    socket.on(ChatEventEnum.GROUP_NAME_UPDATE_EVENT, (chatId) => {
        console.log(`Group name updated by ${chatId}`)
        socket.in(chatId).emit(ChatEventEnum.GROUP_NAME_UPDATE_EVENT, chatId)
    })
}

const newGroupChatEvent = (socket: Socket) => {
    socket.on(ChatEventEnum.NEW_GROUP_CHAT_EVENT, (chatId) => {
        socket.in(chatId).emit(ChatEventEnum.NEW_CHAT_EVENT, chatId)
        console.log("New group chat event chatId: ", chatId)
        socket.join(chatId)
    })
}

const initializeSocket = (io: Server) => {

    return io.on("connection", async (socket: Socket) => {
        try {
            let accessToken = ""
            let refreshToken = "";
            io.engine.on("headers", async (headers, request) => {
                if (!request.headers.cookie) return;
                const cookies = request.headers.cookie.split("; ")
                accessToken = cookies[0].replace("accessToken=", "")
                refreshToken = cookies[1].replace("refreshToken=", "")
                const decodedToken = await jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET as string) as jwt.JwtPayload

                const user = await User.findById(decodedToken._id)

                if (!user) {
                    throw new ApiError(401, "Unauthorized handshake, user not found")
                }

                socket.user = user
                socket.join(user?._id.toString())
                socket.emit(ChatEventEnum.CONNECTED_EVENT)
                console.log("User connected 🚀, userId: ", user._id.toString())
            });


            chatJoinEvent(socket)
            typingEvent(socket)
            groupNameUpdated(socket)
            stopTypingEvent(socket)
            newGroupChatEvent(socket)

            socket.on(ChatEventEnum.DISCONNECT_EVENT, () => {
                console.log("User disconnected 🚫, userId: ", socket.user?._id);
                if (socket.user?._id) {
                    socket.leave(socket.user._id);
                }
            });
        } catch (err) {
            if (err instanceof jwt.TokenExpiredError) {
                throw new ApiError(401, "Unauthorized handshake, token expired")
            }
            else if (err instanceof jwt.JsonWebTokenError) {
                throw new ApiError(401, "Unauthorized handshake, invalid token")
            }
            else {
                throw new ApiError(500, "Internal server error")
            }
        }
    });
}

const emitSocketEvent = (roomId: string, event: string, payload: any) => {
    io.in(roomId).emit(event, payload)
};

export {
    initializeSocket,
    emitSocketEvent
}