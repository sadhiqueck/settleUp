import { useEffect } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useUserProfile } from "@/hooks/useUser";
import { Loader2 } from "lucide-react";
import { VpaOnboardingModal } from "./VpaOnboardingModal";

export function ProtectedRoute() {
  const { data: user, isLoading, isError } = useUserProfile();
  const localUser = localStorage.getItem("user");

  useEffect(() => {
    // Prevent Back/Forward Cache (bfcache) from showing stale protected pages
    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        window.location.reload();
      }
    };
    window.addEventListener("pageshow", handlePageShow);
    return () => window.removeEventListener("pageshow", handlePageShow);
  }, []);

  // If there is no user in localStorage (e.g. they logged out) AND we aren't currently
  // loading a fresh query, immediately redirect to login (prevents history back button stale state)
  if (!localUser && !isLoading) {
    return <Navigate to="/login" replace />;
  }

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  // If there's an error fetching the user (e.g., 401 Unauthorized), or no user data, redirect to login
  if (isError || !user) {
    // Sync localStorage status
    localStorage.removeItem("user");
    return <Navigate to="/login" replace />;
  }

  return (
    <>
      {/* Show VPA onboarding modal if user hasn't set their UPI ID yet */}
      <VpaOnboardingModal isOpen={!user.vpa} />
      <Outlet />
    </>
  );
}

export function PublicRoute() {
  const { data: user, isLoading } = useUserProfile();
  const localUser = localStorage.getItem("user");

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  // If user is already logged in AND exists in localStorage, redirect them away from the public route (e.g., /login)
  if (user && localUser) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
