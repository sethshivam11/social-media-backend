export const ChatEventEnum = Object.freeze(
    {
        CONNECTED_EVENT: "connected",
        DISCONNECT_EVENT: "disconnected",
        TYPING_EVENT: "typing",
        STOP_TYPING_EVENT: "stopTyping",
        NEW_GROUP_CHAT_EVENT: "newGroup",
        NEW_CHAT_EVENT: "newChat",
        SOCKET_ERROR_EVENT: "socketError",
        MESSAGE_RECIEVED_EVENT: "messageRecieved",
        GROUP_NAME_UPDATE_EVENT: "updateGroupName"
    })

export const UserRoleEnum = Object.freeze(
    {
        ADMIN: "admin",
        USER: "user"
    })