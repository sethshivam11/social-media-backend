import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import ChatProvider from "./context/ChatProvider.tsx";
import PostProvider from "./context/PostProvider.tsx";
import UserProvider from "./context/UserProvider.tsx";
import SocketProvider from "./context/SocketProvider.tsx";
import { BrowserRouter } from "react-router-dom";
import { ThemeProvider } from "./context/ThemeProvider.tsx";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <ThemeProvider>
    <BrowserRouter>
      <UserProvider>
        <PostProvider>
          <ChatProvider>
            <SocketProvider>
              <App />
            </SocketProvider>
          </ChatProvider>
        </PostProvider>
      </UserProvider>
    </BrowserRouter>
  </ThemeProvider>
);
