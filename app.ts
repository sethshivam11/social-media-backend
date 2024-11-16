import express, { Request, Response } from "express";
import cookieParser from "cookie-parser";
import errorHandler from "./src/middlewares/error.middleware";
import { UserInterface } from "./src/models/user.model";
import { createServer } from "http";
import { Server } from "socket.io";
import { initializeSocket } from "./src/socket";
import cors from "cors";

declare module "express" {
  interface Request {
    user?: UserInterface;
  }
}

declare module "socket.io" {
  interface Socket {
    user?: UserInterface;
  }
}

const app = express();
const httpServer = createServer(app);

export const io = new Server(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGIN,
  },
  cookie: true,
});

const corsOptions = {
  origin: process.env.CORS_ORIGIN,
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
  allowedHeaders: "*",
};

app.use(cors(corsOptions));
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true, limit: "5mb" }));
app.use(express.static("public"));
app.use(cookieParser());

// Route imports
import userRouter from "./src/routes/user.route";
import callRouter from "./src/routes/call.route";
import followRouter from "./src/routes/follow.route";
import postRouter from "./src/routes/post.route";
import commmentRouter from "./src/routes/comment.route";
import chatRouter from "./src/routes/chat.route";
import messageRouter from "./src/routes/message.route";
import storyRouter from "./src/routes/story.route";
import reportRouter from "./src/routes/report.route";
import notificationRouter from "./src/routes/notification.route";
import notificationPreferenceRouter from "./src/routes/notificationpreference.route";
import confessionRouter from "./src/routes/confession.route";

// Routes declarations
app.use("/api/v1/users", userRouter);
app.use("/api/v1/calls", callRouter);
app.use("/api/v1/follow", followRouter);
app.use("/api/v1/posts", postRouter);
app.use("/api/v1/comments", commmentRouter);
app.use("/api/v1/chats", chatRouter);
app.use("/api/v1/messages", messageRouter);
app.use("/api/v1/stories", storyRouter);
app.use("/api/v1/report", reportRouter);
app.use("/api/v1/notifications", notificationRouter);
app.use("/api/v1/notificationPreferences", notificationPreferenceRouter);
app.use("/api/v1/confessions", confessionRouter);

app.get("/", (_: Request, res: Response) => {
  return res.json({
    success: true,
    status: 200,
    data: {},
    message: "App is running",
  });
});

initializeSocket(io);

app.use(errorHandler);

export default httpServer;

// Reload website every 5 minutes (or provided time)
function reloadWebsite() {
  fetch((process.env.PUBLIC_URL as string) || "https://sociial.onrender.com")
    .then((response) => {
      console.log(
        `Reloaded at ${new Date().toLocaleString("en-IN")}: Status Code ${
          response.status
        }`
      );
    })
    .catch((error) => {
      console.error(
        `Error reloading at ${new Date().toLocaleString("en-IN")}:`,
        error.message
      );
    });
}

if (process.env.NODE_ENV === "production") {
  setInterval(
    reloadWebsite,
    parseInt(process.env.RELOAD_INTERVAL as string) || 1000 * 60 * 5
  );
}
