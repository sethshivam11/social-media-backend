import React from "react"
import ChatContext, { Chat } from "./ChatContext"

const ChatProvider = (props: React.PropsWithChildren<{}>) => {
    const [chats, setChats] = React.useState<Chat[]>([])
    const [page, setPage] = React.useState(1)

    function fetchChats() {
        fetch(`/api/v1/chats/get?page=${page}}`)
            .then(parsed => parsed.json())
            .then(response => {
                if (response.success) {
                    return setChats(response.data)
                }
                return response.message
            })
            .catch(err => {
                console.log(err)
                return "Something went wrong"
            })
    }

    function newChat(reciever: string) {
        fetch(`/api/v1/chats/new/${reciever}`, {
            method: "POST"
        })
            .then(parsed => parsed.json())
            .then(response => {
                if (response.success) {
                    return fetchChats()
                }
                return response.message
            })
            .catch(err => {
                console.log(err)
                return "Something went wrong"
            })
    }

    function newGroupChat(group: { participants: string[], groupName: string, groupIcon?: File, admin: string }) {
        const formData = new FormData()
        formData.append("participants", JSON.stringify(group.participants))
        formData.append("groupName", group.groupName)
        if (group.groupIcon) {
            formData.append("groupIcon", group.groupIcon)
        }
        formData.append("admin", group.admin)
        fetch("/api/v1/chats/newGroup", {
            method: "POST",
            body: formData
        })
            .then(parsed => parsed.json())
            .then(response => {
                if (response.success) {
                    return fetchChats()
                }
                return response.message
            })
            .catch(err => {
                console.log(err)
                return "Something went wrong"
            })
    }

    function addParticipants(participants: string[], chatId: string) {
        fetch("/api/v1/chats/addParticipants", {
            method: "PATCH",
            body: JSON.stringify({ participants, chatId })
        })
            .then(parsed => parsed.json())
            .then(response => {
                if (response.success) {
                    return fetchChats()
                }
                return response.message
            })
            .catch(err => {
                console.log(err)
                return "Something went wrong"
            })
    }

    function removeParticipants(participants: string[], chatId: string) {
        fetch("/api/v1/chats/removeParticipants", {
            method: "PATCH",
            body: JSON.stringify({ participants, chatId })
        })
            .then(parsed => parsed.json())
            .then(response => {
                if (response.success) {
                    return fetchChats()
                }
                return response.message
            })
            .catch(err => {
                console.log(err)
                return "Something went wrong"
            })
    }

    function updateGroup(group: { groupName?: string, groupIcon?: File }, chatId: string) {
        const formData = new FormData()
        if (group.groupIcon) {
            formData.append("groupImage", group.groupIcon)
        }
        if (group.groupName) {
            formData.append("groupName", group.groupName)
        }
        formData.append("chatId", chatId)
        fetch("/api/v1/chats/updateGroup", {
            method: "PUT",
            body: formData
        })
            .then(parsed => parsed.json())
            .then(response => {
                if (response.success) {
                    return fetchChats()
                }
                return response.message
            })
            .catch(err => {
                console.log(err)
                return "Something went wrong"
            })
    }

    function removeGroupIcon(chatId: string) {
        fetch(`/api/v1/chats/removeGroupImage/${chatId}`, {
            method: "PATCH"
        })
            .then(parsed => parsed.json())
            .then(response => {
                if (response.success) {
                    return fetchChats()
                }
                return response.message
            })
            .catch(err => {
                console.log(err)
                return "Something went wrong"
            })
    }

    function leaveGroup(chatId: string) {
        fetch(`/api/v1/chats/leaveGroup/${chatId}`, {
            method: "GET"
        })
            .then(parsed => parsed.json())
            .then(response => {
                if (response.success) {
                    return fetchChats()
                }
                return response.message
            })
            .catch(err => {
                console.log(err)
                return "Something went wrong"
            })
    }

    function deleteGroup(chatId: string) {
        fetch(`/api/v1/chats/deleteGroup/${chatId}`, {
            method: "DELETE"
        })
            .then(parsed => parsed.json())
            .then(response => {
                if (response.success) {
                    return fetchChats()
                }
                return response.message
            })
            .catch(err => {
                console.log(err)
                return "Something went wrong"
            })
    }

    function makeAdmin(chatId: string, userId: string) {
        fetch("/api/v1/chats/makeAdmin", {
            method: "PATCH",
            body: JSON.stringify({ chatId, userId })
        })
            .then(parsed => parsed.json())
            .then(response => {
                if (response.success) {
                    return fetchChats()
                }
                return response.message
            })
            .catch(err => {
                console.log(err)
                return "Something went wrong"
            })
    }

    function removeAdmin(chatId: string, userId: string) {
        fetch("/api/v1/chats/removeAdmin", {
            method: "PATCH",
            body: JSON.stringify({ chatId, userId })
        })
            .then(parsed => parsed.json())
            .then(response => {
                if (response.success) {
                    return fetchChats()
                }
                return response.message
            })
            .catch(err => {
                console.log(err)
                return "Something went wrong"
            })
    }
    
    return (
        <ChatContext.Provider value={{ chats, fetchChats, newChat, newGroupChat, addParticipants, removeParticipants, updateGroup, removeGroupIcon, leaveGroup, deleteGroup, makeAdmin, removeAdmin, setPage, page }}>
            {props.children}
        </ChatContext.Provider>
    )
}
export default ChatProvider

export const useChats = React.useContext(ChatContext)