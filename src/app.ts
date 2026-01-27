import express from "express";
import cookieParser from "cookie-parser";
import errorHandler from "./middlewares/error.middleware";
import { UserInterface } from "./models/user.model";
import { createServer } from "http";
import { Server } from "socket.io";
import { initializeSocket } from "./socket";
import cors from "cors";
import passport from "passport";
import MongoStore from "connect-mongo";
import session from "express-session";
import "./passport/index";

declare global {
  namespace Express {
    interface User extends UserInterface {}
    interface Request {
      user?: User;
    }
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
    origin: process.env.CORS_ORIGIN?.split(","),
  },
  cookie: true,
});

const corsOptions = {
  origin: process.env.CORS_ORIGIN?.split(","),
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true, limit: "5mb" }));
app.use(express.static("public"));
app.use(cookieParser());

// passport initialization
const store = MongoStore.create({
  mongoUrl: process.env.MONGODB_URI as string,
  collectionName: "sociial",
});

app.use(
  session({
    secret: process.env.SESSION_SECRET || "secret",
    resave: false,
    saveUninitialized: false,
    store,
    cookie: {
      maxAge: parseInt(process.env.COOKIE_EXPIRY || "31536000000"),
      sameSite: "lax",
    },
  }),
);
app.use(passport.initialize());
app.use(passport.session());

// Route imports
import userRouter from "./routes/user.route";
import callRouter from "./routes/call.route";
import followRouter from "./routes/follow.route";
import postRouter from "./routes/post.route";
import commmentRouter from "./routes/comment.route";
import chatRouter from "./routes/chat.route";
import messageRouter from "./routes/message.route";
import storyRouter from "./routes/story.route";
import reportRouter from "./routes/report.route";
import notificationRouter from "./routes/notification.route";
import notificationPreferenceRouter from "./routes/notificationpreference.route";
import confessionRouter from "./routes/confession.route";
import passportRouter from "./routes/passport.route";
import adminRouter from "./routes/admin.route";

// Routes declarations
app.use("/", passportRouter);
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
app.use("/api/v1/admin", adminRouter);

app.get("/", (_, res) => {
  res.json({
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
        }`,
      );
    })
    .catch((error) => {
      console.error(
        `Error reloading at ${new Date().toLocaleString("en-IN")}:`,
        error.message,
      );
    });
}

if (process.env.NODE_ENV === "production") {
  setInterval(
    reloadWebsite,
    parseInt(process.env.RELOAD_INTERVAL as string) || 1000 * 60 * 5,
  );
}
