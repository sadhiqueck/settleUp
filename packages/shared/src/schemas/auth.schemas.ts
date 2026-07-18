import { z } from 'zod';

// ─── Shared Fields ────────────────────────────────────────

const emailField = z
  .string()
  .email('Invalid email format')
  .regex(
    /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
    'Must be a valid email address',
  );

// ─── Passwordless Auth ────────────────────────────────────

export const passwordlessStartSchema = z.object({
  email: emailField,
});

export const verifyOtpSchema = z.object({
  email: emailField,
  otp: z
    .string()
    .length(6, 'OTP must be 6 digits')
    .regex(/^\d{6}$/, 'OTP must contain only digits'),
});

export const verifyMagicLinkSchema = z.object({
  token: z.string().min(1, 'Token is required'),
});

export type PasswordlessStartInput = z.infer<typeof passwordlessStartSchema>;
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;
export type VerifyMagicLinkInput = z.infer<typeof verifyMagicLinkSchema>;
