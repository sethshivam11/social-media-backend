import React from 'react';
import { io } from 'socket.io-client';

interface Message {
    sender: String,
    chat: String,
    content: String,
    viewOnce: Boolean,
    reacts: { content: string, user: string }[],
    attachments: string[]
}

interface SocketContext {

}

const cors = import.meta.env.VITE_CORS_ORIGIN
const token = localStorage.getItem("sociial-accessToken")
const socket = io(cors, {
    extraHeaders: {
        "Authorization": `Bearer ${token}`
    }
})
React.useEffect(() => {

    if (!token) return console.log("No token found")
    console.log(token)
    socket.on("connect", () => {
        console.log("Connected")
    })

    socket.on("socketError", (err: string) => {
        console.log(err)
    })
    
    socket.on("messageRecieved", (message: Message) => {
        console.log(message)
    })
})

const SocketContext = React.createContext<SocketContext>({

});