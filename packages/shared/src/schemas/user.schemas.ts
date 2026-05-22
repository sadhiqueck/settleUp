import { z } from 'zod';
import { VPA_REGEX } from './vpa.schema';

export const updateProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  avatarUrl: z.string().url('Must be a valid URL').optional(),
  vpa: z
    .string()
    .regex(VPA_REGEX, 'Enter a valid UPI ID (e.g. yourname@upi)')
    .optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
