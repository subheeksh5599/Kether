import { Routes, Route } from "react-router-dom";
import Landing from "./components/Landing";
import DashboardPage from "./components/DashboardPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/dashboard" element={<DashboardPage />} />
    </Routes>
  );
}
