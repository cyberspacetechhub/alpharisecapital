import { Schema, model, Document, Types } from "mongoose";

export type TransactionType = "deposit" | "withdrawal" | "investment" | "reinvestment" | "loan_disbursement" | "loan_repayment";
export type TransactionStatus = "pending" | "approved" | "rejected" | "completed" | "matured" | "reinvested";

export interface ITransaction extends Document {
  user: Types.ObjectId;
  type: TransactionType;
  amount: number;
  status: TransactionStatus;
  reference: string;
  methodId?: Types.ObjectId;
  planId?: Types.ObjectId;
  planSnapshot?: {
    name: string;
    roiPercent: number;
    durationDays: number;
    minAmount: number;
    maxAmount: number;
  };
  isReinvestment: boolean;
  reinvestedAmount?: number;
  earningsAtReinvest?: number;
  expiresAt?: Date;
  meta: Record<string, unknown>;
  reviewedBy?: Types.ObjectId;
  reviewedAt?: Date;
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const transactionSchema = new Schema<ITransaction>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, enum: ["deposit", "withdrawal", "investment", "reinvestment", "loan_disbursement", "loan_repayment"], required: true },
    amount: { type: Number, required: true },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "completed", "matured", "reinvested"],
      default: "pending",
    },
    reference: { type: String, required: true, unique: true },
    methodId: { type: Schema.Types.ObjectId },
    planId: { type: Schema.Types.ObjectId, ref: "InvestmentPlan" },
    planSnapshot: {
      name: { type: String },
      roiPercent: { type: Number },
      durationDays: { type: Number },
      minAmount: { type: Number },
      maxAmount: { type: Number },
    },
    isReinvestment: { type: Boolean, default: false },
    reinvestedAmount: { type: Number },
    earningsAtReinvest: { type: Number },
    expiresAt: { type: Date },
    meta: { type: Schema.Types.Mixed, default: {} },
    reviewedBy: { type: Schema.Types.ObjectId, ref: "User" },
    reviewedAt: { type: Date },
    rejectionReason: { type: String },
  },
  { timestamps: true }
);

transactionSchema.index({ user: 1, type: 1 });
transactionSchema.index({ status: 1 });
transactionSchema.index({ reference: 1 });

export const Transaction = model<ITransaction>("Transaction", transactionSchema);
