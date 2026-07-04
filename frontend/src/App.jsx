import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { useScrollToTop } from "./hooks/useScrollToTop";
import { LandingPage } from "./pages/LandingPage";
import { PlannerPage } from "./pages/PlannerPage";

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}

function AppRoutes() {
  useScrollToTop();

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/planner" element={<PlannerPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

