import "./App.css";
import { Routes, Route, Navigate } from "react-router-dom";
import Homepage from "./components/Homepage";
import LoginPage from "./components/LoginPage";
import Navbar from "./components/Navbar";
import MessagesPage from "./components/MessagesPage";
import ProfilePage from "./components/ProfilePage";
import SignupPage from "./components/SignupPage";
import { useUser } from "./context/UserProvider";
import { Toaster } from "@/components/ui/toaster"

function App() {
  const { isLoggedIn } = useUser();
  return (
    <>
      <Navbar />
      <Toaster />
      <Routes>
        {/* Public Routes */}
        <Route element={<LoginPage />} path="/sign-in" />
        <Route element={<SignupPage />} path="/sign-up" />
        <Route
          element={<Homepage />}
          path="/verify"
        />

        {/* Private Routes */}
        <Route
          element={isLoggedIn ? <Homepage /> : <Navigate to="/sign-in" />}
          path="/"
        />
        <Route
          element={isLoggedIn ? <MessagesPage /> : <Navigate to="/sign-in" />}
          path="/messages"
        />
        <Route
          element={isLoggedIn ? <ProfilePage /> : <Navigate to="/sign-in" />}
          path="/profile"
        />
      </Routes>
    </>
  );
}

export default App;
