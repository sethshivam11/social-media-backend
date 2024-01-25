import express, { Request, Response } from "express"
import path from "path"
import cookieParser from "cookie-parser"

const app = express()

app.use(express.json({ limit: "50kb" }))
app.use(express.urlencoded({ extended: true, limit: "50kb" }))
app.use(express.static("public"))
app.use(cookieParser())

// Route imports
import userRouter from "./routes/user.route"



// Routes declarations
app.use("/api/v1/users", userRouter)



// Deployments
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

export default app