import { z } from "zod";

/** Standard Indian UPI VPA regex: alphanumeric/dot/dash handle + @ + bank code */
export const VPA_REGEX = /^[0-9A-Za-z.-]{2,256}@[A-Za-z]{2,64}$/;

export const vpaSchema = z.object({
  vpa: z
    .string()
    .min(1, "UPI ID is required")
    .regex(VPA_REGEX, "Enter a valid UPI ID (e.g. yourname@upi)"),
});

export type VpaInput = z.infer<typeof vpaSchema>;