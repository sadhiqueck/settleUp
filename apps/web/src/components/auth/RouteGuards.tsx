import { useEffect } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useUserProfile } from "@/hooks/useUser";
import { Loader2 } from "lucide-react";

export function ProtectedRoute() {
  const { data: user, isLoading, isError } = useUserProfile();

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

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  // If there's an error fetching the user (e.g., 401 Unauthorized), or no user data, redirect to login
  if (isError || !user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

export function PublicRoute() {
  const { data: user, isLoading } = useUserProfile();

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  // If user is already logged in, redirect them away from the public route (e.g., /login)
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
