import { z } from "zod";

export const updateProfileSchema = z.object({
  bio: z.string().max(300).optional(),
  country: z.string().optional(),
  timezone: z.string().optional(),
  phone: z.string().min(7).optional(),
  // trader-specific
  tradingExperience: z.enum(["beginner", "intermediate", "expert"]).optional(),
  preferredAssets: z.array(z.string()).optional(),
});

export const kycSubmitSchema = z.object({
  documents: z.array(z.string().url("Each document must be a valid URL")).min(1, "At least one document required"),
});

export const walletLinkSchema = z.object({
  type: z.enum(["crypto", "bank"] as const),
  label: z.string().min(1, "Label is required"),
  details: z.record(z.string(), z.string()),
  isPrimary: z.boolean().optional().default(false),
});

export const sendMessageSchema = z.object({
  recipientId: z.string().min(1, "Recipient is required"),
  subject: z.string().min(1, "Subject is required"),
  body: z.string().min(1, "Message body is required"),
  relatedModel: z.enum(["Transaction", "Loan", "Position"]).optional(),
  relatedId: z.string().optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type KycSubmitInput = z.infer<typeof kycSubmitSchema>;
export type WalletLinkInput = z.infer<typeof walletLinkSchema>;
export type SendMessageInput = z.infer<typeof sendMessageSchema>;
