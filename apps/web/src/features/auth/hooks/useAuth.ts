import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

import { apiClient } from "@/shared/lib/apiClient";

export function useAuth() {
  const sendOtp = useMutation({
    mutationFn: async (email: string) => {
      const response = await apiClient.post('/auth/passwordless/start', { email });
      return response.data;
    },
    onSuccess: (_, email) => {
      toast.success(`Verification code sent to ${email}`);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to send verification code. Please try again.");
    },
  });

  const verifyOtp = useMutation({
    mutationFn: async ({ email, otp }: { email: string; otp: string }) => {
      const response = await apiClient.post('/auth/passwordless/verify', { email, otp });
      return response.data;
    },
    onSuccess: () => {
      toast.success("Successfully verified!");
    },
    onError: (error) => {
      toast.error(error.message || "Invalid code. Please try again.");
    },
  });

  const loginWithGoogle = () => {
    // Redirect the browser directly to the backend NestJS endpoint
    // The backend will handle the Google redirect, and then redirect back to the frontend with the token.
    const googleAuthUrl = import.meta.env.VITE_API_URL 
      ? `${import.meta.env.VITE_API_URL}/auth/google` 
      : "http://localhost:3000/api/auth/google"; // Fallback for local dev
    
    window.location.href = googleAuthUrl;
  };

  return {
    sendOtp,
    verifyOtp,
    loginWithGoogle,
  };
}
