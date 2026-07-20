import { apiClient } from "@/shared/lib/apiClient";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { User, UpdateProfileInput } from "@fettl/shared";
import { disconnectSocket } from "@/shared/lib/socket";
import { toast } from "sonner";

const userKeys = {
  profile: ["user", "profile"] as const,
};

async function fetchUserProfile(): Promise<User> {
  const { data } = await apiClient.get<User>("/users/me", {
    headers: {
      "Cache-Control": "no-cache, no-store, must-revalidate",
      Pragma: "no-cache",
      Expires: "0",
    },
  });
  return data;
}

async function updateUserProfile(payload: UpdateProfileInput): Promise<User> {
  const { data } = await apiClient.patch<User>("/users/me", payload);
  return data;
}

async function logoutUser(): Promise<void> {
  await apiClient.post("/auth/logout");
}

export function useUserProfile() {
  return useQuery({
    queryKey: userKeys.profile,
    queryFn: fetchUserProfile,
    staleTime: 1000 * 60 * 5,
    retry: false, // don't retry 401s so route guards resolve quickly
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateUserProfile,
    onSuccess: (updatedUser) => {
      // Writes the server-confirmed response into the cache directly.
      queryClient.setQueryData(userKeys.profile, updatedUser);
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: logoutUser,
    onSuccess: () => {
      disconnectSocket();
      queryClient.clear();
      window.location.href = "/login";
    },
    onError: (error) => {
      console.error("Logout failed:", error);
      toast.error("Failed to log out. Please try clearing your cookies.");
      // Fallback: force clear cache anyway
      disconnectSocket();
      queryClient.clear();
      setTimeout(() => {
        window.location.href = "/login";
      }, 100);
    },
  });
}