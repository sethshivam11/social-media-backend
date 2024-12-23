import { Server, Socket } from "socket.io";
import { ChatEventEnum } from "../utils/constants";
import jwt from "jsonwebtoken";
import { ApiError } from "../utils/ApiError";
import { User } from "../models/user.model";
import { io } from "../app";

let onlineUsers: string[] = [];

const chatJoinEvent = (socket: Socket) => {
  socket.on(ChatEventEnum.NEW_CHAT_EVENT, (chatId) => {
    console.log("New chat event chatId: ", chatId);
    socket.join(chatId);
  });
};
const typingEvent = (socket: Socket) => {
  socket.on(ChatEventEnum.TYPING_EVENT, (chatId) => {
    console.log(`chatId: ${chatId} is typing`);
    socket.in(chatId).emit(ChatEventEnum.TYPING_EVENT, chatId);
  });
};
const stopTypingEvent = (socket: Socket) => {
  socket.on(ChatEventEnum.STOP_TYPING_EVENT, (chatId) => {
    console.log(`chatId: ${chatId} stopped typing`);
    socket.in(chatId).emit(ChatEventEnum.STOP_TYPING_EVENT, chatId);
  });
};
const newGroupChatEvent = (socket: Socket) => {
  socket.on(ChatEventEnum.NEW_GROUP_CHAT_EVENT, (chatId) => {
    socket.in(chatId).emit(ChatEventEnum.NEW_CHAT_EVENT, chatId);
    console.log("New group chat event chatId: ", chatId);
    socket.join(chatId);
  });
};
const callEvent = (socket: Socket) => {
  socket.on(ChatEventEnum.NEW_CALL_EVENT, ({ userId, data }) => {
    socket.in(userId).emit(ChatEventEnum.NEW_CALL_EVENT, { userId, data });
    console.log("New call event userId: ", userId);
  });
};
const callHandshakeEvent = (socket: Socket) => {
  socket.on(ChatEventEnum.CALL_HANDSHAKE_EVENT, ({ userId, offer }) => {
    socket.in(userId).emit(ChatEventEnum.CALL_HANDSHAKE_EVENT, offer);
    console.log("Call handshake event to:", userId);
  });
};
const callAcceptedEvent = (socket: Socket) => {
  socket.on(ChatEventEnum.CALL_ACCEPTED_EVENT, ({ userId, answer }) => {
    socket.in(userId).emit(ChatEventEnum.CALL_ACCEPTED_EVENT, answer);
    console.log("Call accepted event userId: ", userId);
  });
};
const callAudioEvent = (socket: Socket) => {
  socket.on(ChatEventEnum.CALL_AUDIO_EVENT, ({ callId, audio }) => {
    socket.in(callId).emit(ChatEventEnum.CALL_AUDIO_EVENT, {
      callId,
      audio,
    });
    console.log(
      `Call audio turned ${audio ? "on" : "off"} event callId: `,
      callId
    );
  });
};
const callVideoEvent = (socket: Socket) => {
  socket.on(ChatEventEnum.CALL_VIDEO_EVENT, ({ callId, video }) => {
    socket.in(callId).emit(ChatEventEnum.CALL_VIDEO_EVENT, {
      callId,
      video,
    });
    console.log(
      `Call video turned ${video ? "on" : "off"} event callId: `,
      callId
    );
  });
};
const callCameraSwitchEvent = (socket: Socket) => {
  socket.on(ChatEventEnum.CALL_CAMERA_SWITCH_EVENT, (callId) => {
    socket.in(callId).emit(ChatEventEnum.CALL_CAMERA_SWITCH_EVENT, callId);
    console.log("Call camera switched event callId: ", callId);
  });
};

const initializeSocket = (io: Server) => {
  return io.on("connection", async (socket: Socket) => {
    try {
      const token = socket.handshake.headers.authorization?.replace(
        "Bearer ",
        ""
      );
      if (!token) {
        throw new ApiError(401, "Unauthorized handshake, token not found");
      }

      const decodedToken = (await jwt.verify(
        token,
        process.env.TOKEN_SECRET as string
      )) as jwt.JwtPayload;

      const user = await User.findById(decodedToken._id);

      if (!user) {
        throw new ApiError(401, "Unauthorized handshake, user not found");
      }

      socket.user = user;
      socket.join(user?._id.toString());

      onlineUsers.push(socket.user._id.toString());
      io.emit(ChatEventEnum.GET_USERS, onlineUsers);

      socket.emit(ChatEventEnum.CONNECTED_EVENT);
      console.log("User connected 🚀, userId:", user._id.toString());

      chatJoinEvent(socket);
      typingEvent(socket);
      stopTypingEvent(socket);
      newGroupChatEvent(socket);
      callEvent(socket);
      callHandshakeEvent(socket);
      callAcceptedEvent(socket);
      callAudioEvent(socket);
      callVideoEvent(socket);
      callCameraSwitchEvent(socket);

      socket.on(ChatEventEnum.DISCONNECT_EVENT, () => {
        console.log(
          "User disconnected 🚫, userId:",
          socket.user?._id.toString()
        );
        onlineUsers = onlineUsers.filter(
          (userId) => userId !== socket.user?._id.toString()
        );
        if (socket.user?._id) {
          socket.leave(socket.user._id.toString());
        }
        io.emit(ChatEventEnum.GET_USERS, onlineUsers);
      });

      socket.on(ChatEventEnum.OFFLINE_EVENT, () => {
        console.log(
          "User went offline 🚫, userId:",
          socket.user?._id.toString()
        );
        onlineUsers = onlineUsers.filter(
          (userId) => userId !== socket.user?._id.toString()
        );
        io.emit(ChatEventEnum.GET_USERS, onlineUsers);
      });
    } catch (err) {
      socket.emit(
        ChatEventEnum.SOCKET_ERROR_EVENT,
        (err as ApiError)?.message ||
          "Something went wrong while connecting to the socket"
      );
      socket.disconnect();
    }
  });
};

const emitSocketEvent = (roomId: string, event: string, payload: any) => {
  io.in(roomId).emit(event, payload);
};

export { initializeSocket, emitSocketEvent };
