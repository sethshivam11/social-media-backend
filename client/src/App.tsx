import "./App.css";
import { Route, Routes, BrowserRouter } from "react-router-dom";
import LoginPage from "./components/LoginPage";
import Home from "./components/Home";


function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Home />} path="/" />
        <Route element={<LoginPage />} path="/login" />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
