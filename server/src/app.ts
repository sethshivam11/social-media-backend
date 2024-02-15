import express, { Request, Response } from "express"
import path from "path"
import cookieParser from "cookie-parser"
import errorHandler from "./middlewares/error.middleware"
import { UserInterface } from "./models/user.model"
import { createServer } from "http"
import { Server } from "socket.io"


declare module "express" {
    interface Request {
        user?: UserInterface
    }
}


const app = express()
const httpServer = createServer(app)

const io = new Server(httpServer)

app.set("io", io)


app.use(express.json({ limit: "50kb" }))
app.use(express.urlencoded({ extended: true, limit: "50kb" }))
app.use(express.static("public"))
app.use(cookieParser())

// Route imports
import userRouter from "./routes/user.route"
import followRouter from "./routes/follow.route"
import initializeSocket from "./socket"



// Routes declarations
app.use("/api/v1/users", userRouter)
app.use("/api/v1/follow", followRouter)



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