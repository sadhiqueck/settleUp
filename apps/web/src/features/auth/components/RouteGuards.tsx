import { useEffect } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useUserProfile } from "@/shared/hooks/useUser";
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

  if (isError || !user) {
    return <Navigate to="/login" replace />;
  }

  // If they haven't finished onboarding, force them to onboarding
  if (!user.isOnboarded) {
    return <Navigate to="/onboarding" replace />;
  }

  return <Outlet />;
}

export function OnboardingRoute() {
  const { data: user, isLoading, isError } = useUserProfile();

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isError || !user) {
    return <Navigate to="/login" replace />;
  }

  // If they ARE onboarded, they shouldn't be here
  if (user.isOnboarded) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}

export function PublicRoute() {
  const { data: user, isLoading, isError } = useUserProfile();

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  // If they are logged in and we have user data (and no error), go to dashboard
  if (user && !isError) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
