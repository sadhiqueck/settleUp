import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import AuthPage from "./pages/AuthPage";
import DashboardPage from "./pages/DashboardPage";
import GroupDetailsPage from "./pages/GroupDetailsPage";
import ProfilePage from "./pages/ProfilePage";
import AnalyticsPage from "./pages/AnalyticsPage";
import { ProtectedRoute, PublicRoute } from "./components/auth/RouteGuards";
import { ChatAppLayout } from "./components/layout/ChatAppLayout";

function App() {
  return (
    <>
      <Toaster richColors position="top-center" />
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        <Route element={<PublicRoute />}>
          <Route path="/login" element={<AuthPage />} />
          <Route path="/register" element={<AuthPage />} />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route element={<ChatAppLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/groups/:id" element={<GroupDetailsPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
          </Route>
        </Route>
      </Routes>
    </>
  );
}

export default App;
