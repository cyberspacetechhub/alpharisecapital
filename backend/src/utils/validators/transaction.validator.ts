import { z } from "zod";

export const depositSchema = z.object({
  amount: z.number().positive("Amount must be positive"),
  methodId: z.string().min(1, "Deposit method is required"),
  proofUrl: z.string().url("Invalid proof URL").optional(),
});

export const withdrawalSchema = z.object({
  amount: z.number().positive("Amount must be positive"),
  methodId: z.string().min(1, "Withdrawal method is required"),
  accountDetails: z.record(z.string(), z.string()).optional(),
});

export const investmentSchema = z.object({
  planId: z.string().min(1, "Investment plan is required"),
  amount: z.number().positive("Amount must be positive"),
});

export type DepositInput = z.infer<typeof depositSchema>;
export type WithdrawalInput = z.infer<typeof withdrawalSchema>;
export type InvestmentInput = z.infer<typeof investmentSchema>;
