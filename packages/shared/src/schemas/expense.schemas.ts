import { z } from 'zod'

const splitSchema = z.object({
  userId: z.string(),
  amount: z.number().positive().optional(),
  percentage: z.number().min(0).max(100).optional(),
  shares: z.number().int().positive().optional(),
})

export const createExpenseSchema = z.object({
  title: z.string().min(1, "Title is required").max(100, "Title is too long").refine((val) => val.trim().split(/\s+/).length <= 5, {
    message: "Title must be 5 words or less",
  }),
  amount: z.number().positive(),
  paidById: z.string(),
  category: z
    .enum(['FOOD', 'TRANSPORT', 'ACCOMMODATION', 'SHOPPING', 'ENTERTAINMENT', 'UTILITIES', 'OTHER'])
    .default('OTHER'),
  splitMethod: z.enum(['EQUAL', 'EXACT', 'PERCENTAGE', 'SHARES', 'ITEMIZED']).default('EQUAL'),
  date: z.string().datetime(),
  notes: z.string().max(500).optional(),
  receiptUrl: z.string().url().optional(),
  splits: z.array(splitSchema).min(1),
})

export const updateExpenseSchema = createExpenseSchema.partial()

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>
export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>