import "./App.css";
import { Routes, Route } from "react-router-dom";
import Homepage from "./components/Homepage";

function App() {
  return (
    <Routes>
      <Route element={<Homepage />} path="/home" />
    </Routes>
  );
}

export default App;
