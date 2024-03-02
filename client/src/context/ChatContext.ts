import React from "react"

export interface Chat {
    _id: string,
    users: string[],
    isGroupChat: boolean,
    admin: string[],
    groupName: string,
    groupIcon: string,
    lastMessage: string
}

interface ChatContext {
    chats: Chat[],
    newChat: Function,
    newGroupChat: Function,
    fetchChats: Function,
    addParticipants: Function,
    removeParticipants: Function,
    updateGroup: Function,
    removeGroupIcon: Function,
    leaveGroup: Function,
    deleteGroup: Function,
    makeAdmin: Function,
    removeAdmin: Function,
    setPage: React.Dispatch<React.SetStateAction<number>>,
    page: number
}

const ChatContext = React.createContext<ChatContext>({
    chats: [],
    newChat: (recieverId: string) => { recieverId },
    newGroupChat: (group: { participants: string[], groupName: string, groupIcon?: File, admin: string }) => { group },
    fetchChats: (page: number) => { page },
    addParticipants: (participants: string[], chatId: string) => { participants; chatId },
    removeParticipants: (participants: string[], chatId: string) => { participants; chatId },
    updateGroup: (group: { groupName?: string, groupIcon?: File, }, chatId: string) => { group; chatId },
    removeGroupIcon: () => { },
    leaveGroup: (chatId: string) => { chatId },
    deleteGroup: (chatId: string) => { chatId },
    makeAdmin: (chatId: string, userId: string) => { chatId; userId },
    removeAdmin: (chatId: string, userId: string) => { chatId; userId },
    setPage: () => { },
    page: 1,
})

export default ChatContext