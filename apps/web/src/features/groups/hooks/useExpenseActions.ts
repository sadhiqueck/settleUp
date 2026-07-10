import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import axios from "axios";
import { apiClient } from "@/shared/lib/apiClient";
import type { UpdateExpenseInput } from "@settleup/shared";

/* ─── Update Expense (metadata only) ─── */

export const useUpdateExpense = (groupId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      expenseId,
      data,
    }: {
      expenseId: string;
      data: UpdateExpenseInput;
    }) => {
      const { data: result } = await apiClient.patch(
        `/groups/${groupId}/expenses/${expenseId}`,
        data,
      );
      return result;
    },
    onSuccess: () => {
      toast.success("Expense updated successfully!");
      queryClient.invalidateQueries({ queryKey: ["group", groupId] });
    },
    onError: (error: unknown) => {
      if (axios.isAxiosError(error)) {
        toast.error(
          error.response?.data?.message ||
            "Failed to update expense. Please try again.",
        );
      } else {
        toast.error("An unexpected error occurred.");
      }
    },
  });
};

/* ─── Delete Expense ─── */

export const useDeleteExpense = (groupId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (expenseId: string) => {
      const { data } = await apiClient.delete(
        `/groups/${groupId}/expenses/${expenseId}`,
      );
      return data;
    },
    onSuccess: () => {
      toast.success("Expense deleted. Balances have been updated.");
      queryClient.invalidateQueries({ queryKey: ["group", groupId] });
    },
    onError: (error: unknown) => {
      if (axios.isAxiosError(error)) {
        toast.error(
          error.response?.data?.message ||
            "Failed to delete expense. Please try again.",
        );
      } else {
        toast.error("An unexpected error occurred.");
      }
    },
  });
};
