import { z } from "zod";

export const investmentPlanSchema = z.object({
  name: z.string().min(1, "Plan name is required"),
  minAmount: z.number().positive("Min amount must be positive"),
  maxAmount: z.number().positive("Max amount must be positive"),
  roiPercent: z.number().positive("ROI must be positive"),
  durationDays: z.number().int().positive("Duration must be a positive integer"),
  isActive: z.boolean().optional().default(true),
});

export const depositMethodSchema = z.object({
  name: z.string().min(1, "Method name is required"),
  type: z.enum(["crypto", "bank"] as const),
  details: z.record(z.string(), z.string()),
  isActive: z.boolean().optional().default(true),
});

export const withdrawalMethodSchema = z.object({
  name: z.string().min(1, "Method name is required"),
  type: z.enum(["crypto", "bank"] as const),
  details: z.record(z.string(), z.string()),
  minAmount: z.number().positive("Min amount must be positive"),
  maxAmount: z.number().positive("Max amount must be positive"),
  isActive: z.boolean().optional().default(true),
});

export const loanOfferSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  interestRate: z.number().positive("Interest rate must be positive"),
  interestType: z.enum(["flat", "compound"]),
  minAmount: z.number().positive("Min amount must be positive"),
  maxAmount: z.number().positive("Max amount must be positive"),
  durationDays: z.number().int().positive("Duration must be a positive integer"),
  isActive: z.boolean().optional().default(true),
});

export const loanApplicationSchema = z.object({
  offerId: z.string().min(1, "Loan offer is required"),
  requestedAmount: z.number().positive("Amount must be positive"),
});

export const upgradeLoanLimitSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  loanLimit: z.number().positive("Loan limit must be positive"),
  creditScore: z.number().min(0).max(1000).optional(),
});

export const updateGeneralLoanLimitSchema = z.object({
  generalLoanLimit: z.number().nonnegative("General loan limit must be non-negative"),
});

export const positionSchema = z.object({
  pair: z.string().min(1, "Trading pair is required"),
  direction: z.enum(["long", "short"]),
  amount: z.number().positive("Amount must be positive"),
  leverage: z.number().min(1).max(100).optional().default(1),
  stopLoss: z.number().positive().optional(),
  takeProfit: z.number().positive().optional(),
  durationMinutes: z.number().int().positive("Duration must be a positive integer"),
});

export const upgradePlanSchema = z.object({
  newPlanId: z.string().min(1, "New plan ID is required"),
});

export type InvestmentPlanInput = z.infer<typeof investmentPlanSchema>;
export type DepositMethodInput = z.infer<typeof depositMethodSchema>;
export type WithdrawalMethodInput = z.infer<typeof withdrawalMethodSchema>;
export type LoanOfferInput = z.infer<typeof loanOfferSchema>;
export type LoanApplicationInput = z.infer<typeof loanApplicationSchema>;
export type UpgradeLoanLimitInput = z.infer<typeof upgradeLoanLimitSchema>;
export type PositionInput = z.infer<typeof positionSchema>;
export type UpgradePlanInput = z.infer<typeof upgradePlanSchema>;
