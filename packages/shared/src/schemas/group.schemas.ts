import { z } from 'zod'

export const createGroupSchema = z.object({
  name: z.string().min(2).max(50),
  description: z.string().max(200).optional(),
  category: z.enum(['TRIP', 'HOME', 'OFFICE', 'FRIENDS', 'OTHER']).default('OTHER'),
  coverImage: z.string().url().optional(),
})

export const updateGroupSchema = createGroupSchema.partial()

export type CreateGroupInput = z.infer<typeof createGroupSchema>
export type UpdateGroupInput = z.infer<typeof updateGroupSchema>