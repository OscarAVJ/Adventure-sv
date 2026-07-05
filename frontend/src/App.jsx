import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { useScrollToTop } from "./hooks/useScrollToTop";
import { I18nProvider } from "./i18n/I18nContext";
import { LandingPage } from "./pages/LandingPage";
import { PlannerPage } from "./pages/PlannerPage";

export default function App() {
  return (
    <I18nProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </I18nProvider>
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

