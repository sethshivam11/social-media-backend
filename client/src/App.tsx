import "./App.css";
import { Routes, Route, Navigate } from "react-router-dom";
import HomePage from "./components/Pages/Homepage";
import LoginPage from "./components/Pages/LoginPage";
import TopNavbar from "./components/TopNavbar";
import MessagesPage from "./components/Pages/MessagesPage";
import ProfilePage from "./components/Pages/ProfilePage";
import SignupPage from "./components/Pages/SignupPage";
import { useUser } from "./context/UserProvider";
import { Toaster } from "@/components/ui/toaster";
import VerifyCodePage from "./components/Pages/VerifyCodePage";
import ForgotPasswordPage from "./components/Pages/ForgotPasswordPage";
import Layout from "./components/Layout";
import SearchPage from "./components/Pages/SearchPage";
import CreatePost from "./components/Pages/CreatePost";

function App() {
  const { isLoggedIn } = useUser();
  return (
    <>
      {!isLoggedIn && <TopNavbar />}
      <Toaster />
      <Routes>
        {/* Public Routes */}
        <Route
          element={isLoggedIn ? <Navigate to="/" /> : <LoginPage />}
          path="/sign-in"
        />
        <Route
          element={isLoggedIn ? <Navigate to="/" /> : <ForgotPasswordPage />}
          path="/forgot-password"
        />
        <Route
          element={isLoggedIn ? <Navigate to="/" /> : <SignupPage />}
          path="/sign-up"
        />
        <Route
          element={isLoggedIn ? <Navigate to="/" /> : <VerifyCodePage />}
          path="/verify"
        />

        {/* Private Routes */}
        <Route path="/" element={<Layout />}>
          <Route
            element={isLoggedIn ? <HomePage /> : <Navigate to="/sign-in" />}
            path="/"
          />
          <Route
            element={isLoggedIn ? <SearchPage /> : <Navigate to="/sign-in" />}
            path="/search"
          />
          <Route
            element={isLoggedIn ? <MessagesPage /> : <Navigate to="/sign-in" />}
            path="/messages"
          />
          <Route
            element={isLoggedIn ? <CreatePost /> : <Navigate to="/sign-in" />}
            path="/create"
          />
          <Route
            element={isLoggedIn ? <ProfilePage /> : <Navigate to="/sign-in" />}
            path="/profile"
          />
        </Route>
      </Routes>
    </>
  );
}

export default App;
