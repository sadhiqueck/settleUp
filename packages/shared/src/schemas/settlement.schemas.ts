import { z } from 'zod'

export const createSettlementSchema = z.object({
  payerId: z.string().min(1),
  receiverId: z.string().min(1),
  amount: z.number().int("Amount must be in paise (integer)").positive(),
  note: z.string().max(200).optional(),
})

export type CreateSettlementInput = z.infer<typeof createSettlementSchema>
