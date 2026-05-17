import { apiClient } from "@/lib/apiClient";
import type { CreateExpenseInput } from "@settleup/shared";
import { useMutation, useQueryClient } from "@tanstack/react-query";

async function createExpense(groupId: string, payload: CreateExpenseInput) {
  const { data } = await apiClient.post(`/groups/${groupId}/expenses`, payload);
  return data;
}

export function useCreateExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createExpense,
    onSuccess: (_, variables) => [
      queryClient.invalidateQueries({
        queryKey: ["groups", variables.groupId, "expenses"],
      }),
    ],
  });
}
