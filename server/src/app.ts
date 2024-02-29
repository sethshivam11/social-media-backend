import express, { Request, Response } from "express"
import path from "path"
import cookieParser from "cookie-parser"
import errorHandler from "./middlewares/error.middleware"
import { UserInterface } from "./models/user.model"
import { createServer } from "http"
import { Server } from "socket.io"
import { initializeSocket } from "./socket"


declare module "express" {
    interface Request {
        user?: UserInterface;
    }
}

declare module "socket.io" {
    interface Socket {
        user?: UserInterface,
    }
}

const app = express()
const httpServer = createServer(app)

export const io = new Server(httpServer, {
    cors: {
        origin: process.env.CORS_ORIGIN
    },
    cookie: true
})



app.use(express.json({ limit: "5mb" }))
app.use(express.urlencoded({ extended: true, limit: "5mb" }))
app.use(express.static("public"))
app.use(cookieParser())

// Route imports
import userRouter from "./routes/user.route"
import followRouter from "./routes/follow.route"
import postRouter from "./routes/post.route"
import commmentRouter from "./routes/comment.route"
import chatRouter from "./routes/chat.route"
import messageRouter from "./routes/message.route"
import storyRouter from "./routes/story.route"

// Routes declarations
app.use("/api/v1/users", userRouter)
app.use("/api/v1/follow", followRouter)
app.use("/api/v1/posts", postRouter)
app.use("/api/v1/comments", commmentRouter)
app.use("/api/v1/chats", chatRouter)
app.use("/api/v1/messages", messageRouter)
app.use("/api/v1/stories", storyRouter)


// Deployment
const __dirname1 = path.resolve()

if (process.env.NODE_ENV === "production") {
    app.use(express.static(path.join(__dirname1, "client", "dist")))
    app.get("*", (_: Request, res: Response) => {
        res.sendFile(path.resolve(__dirname1, "client", "dist", "index.html"))
    })
}

else {
    app.get("/", (_: Request, res: Response) => {
        res.send("App is under development!")
    })
}

initializeSocket(io)

app.use(errorHandler)

export default httpServer