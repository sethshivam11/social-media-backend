import { Server, Socket } from "socket.io";
import { ChatEventEnum } from "../constants";

const chatJoinEvent = (socket: Socket) => {
    socket.on(ChatEventEnum.NEW_CHAT_EVENT, (chatId) => {
        console.log("New chat event chatId: ", chatId)
    })
}

const typingEvent = (socket: Socket) => {
    socket.on(ChatEventEnum.TYPING_EVENT, (chatId) => {
        console.log(`chatId: ${chatId} is typing`)
    })
}

const groupNameUpdated = (socket: Socket) => {
    socket.on(ChatEventEnum.GROUP_NAME_UPDATE_EVENT, (chatId) => {
        console.log(`Group name updated by ${chatId}`)
    })
}

const initializeSocket = async (io: Server) => {

    return io.on("connection", (socket: Socket) => {
        console.log("User connected");
        socket.on("disconnect", () => {
            console.log("User disconnected");
        });

        chatJoinEvent(socket)

        typingEvent(socket)

        groupNameUpdated(socket)
    });
}

export default initializeSocket