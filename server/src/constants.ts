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
        GROUP_NAME_UPDATE_EVENT: "updateGroupName",
        GROUP_DELETE_EVENT: "deleteGroup",
    })

export const PostEventEnum = "newPost"

export const DB_NAME = "sociial"

export const DEFAULT_USER_AVATAR = "https://res.cloudinary.com/dv3qbj0bn/image/upload/v1708096087/sociial/tpfx0gzsk7ywiptsb6vl.png"

export const DEFAULT_GROUP_ICON = "https://res.cloudinary.com/dv3qbj0bn/image/upload/v1708097524/sociial/ikuname8uljxeasstnjy.png"

export const UserRoleEnum = Object.freeze(
    {
        ADMIN: "admin",
        USER: "user"
    })