import React, { lazy, Suspense } from "react";
import { createBrowserRouter, Navigate, Outlet } from "react-router-dom";
import { ProtectedRoute, PublicRoute } from "@/features/auth/components/RouteGuards";
import { ChatAppLayout } from "@/shared/components/layout/ChatAppLayout";
import { SocketProvider } from "@/context/SocketProvider";
import { ErrorBoundary } from "@/shared/components/layout/ErrorBoundary";
import { Loader2 } from "lucide-react";

// AuthPage stays eager as it's the entry point most sessions hit first
import AuthPage from "@/pages/AuthPage";

const DashboardPage = lazy(() => import("@/pages/DashboardPage"));
const GroupDetailsPage = lazy(() => import("@/pages/GroupDetailsPage"));
const AnalyticsPage = lazy(() => import("@/pages/AnalyticsPage"));
const ProfilePage = lazy(() => import("@/pages/ProfilePage"));

function PageSkeleton() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      <Loader2 className="size-8 animate-spin text-primary" />
    </div>
  );
}

function withSuspense(Component: React.LazyExoticComponent<() => JSX.Element>) {
  return (
    <ErrorBoundary>
      <Suspense fallback={<PageSkeleton />}>
        <Component />
      </Suspense>
    </ErrorBoundary>
  );
}

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Navigate to="/dashboard" replace />,
  },
  {
    element: <PublicRoute />,
    children: [
      { path: "login", element: <AuthPage /> },
      { path: "register", element: <AuthPage /> },
    ],
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: (
          <SocketProvider>
            <ChatAppLayout />
          </SocketProvider>
        ),
        children: [
          { path: "dashboard", element: withSuspense(DashboardPage) },
          { path: "groups/:id", element: withSuspense(GroupDetailsPage) },
          { path: "profile", element: withSuspense(ProfilePage) },
          { path: "analytics", element: withSuspense(AnalyticsPage) },
        ],
      },
    ],
  },
]);
