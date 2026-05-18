import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import axios from "axios";
import { apiClient } from "@/lib/apiClient";
import type { CreateExpenseInput } from "@settleup/shared";

export const useAddExpense = (groupId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (expenseData: CreateExpenseInput) => {
      const { data } = await apiClient.post(
        `/groups/${groupId}/expenses`,
        expenseData
      );
      return data;
    },
    onSuccess: () => {
      toast.success("Expense added successfully!");
      queryClient.invalidateQueries({ queryKey: ["group", groupId] });
    },
    onError: (error: unknown) => {
      if (axios.isAxiosError(error)) {
        toast.error(
          error.response?.data?.message ||
            "Failed to add expense. Please try again."
        );
      } else {
        toast.error("An unexpected error occurred.");
      }
    },
  });
};
