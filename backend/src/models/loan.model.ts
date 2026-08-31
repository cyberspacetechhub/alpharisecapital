import { Schema, model, Document, Types } from "mongoose";

// ─── Loan Offer (created by Executor) ────────────────────────────────────────

export type InterestType = "flat" | "compound";

export interface ILoanOffer extends Document {
  title: string;
  description?: string;
  interestRate: number;
  interestType: InterestType;
  minAmount: number;
  maxAmount: number;
  durationDays: number;
  isActive: boolean;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const loanOfferSchema = new Schema<ILoanOffer>(
  {
    title: { type: String, required: true },
    description: { type: String },
    interestRate: { type: Number, required: true },
    interestType: { type: String, enum: ["flat", "compound"], default: "flat" },
    minAmount: { type: Number, required: true },
    maxAmount: { type: Number, required: true },
    durationDays: { type: Number, required: true },
    isActive: { type: Boolean, default: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

export const LoanOffer = model<ILoanOffer>("LoanOffer", loanOfferSchema);

// ─── Loan Application (submitted by Trader) ──────────────────────────────────

export type LoanApplicationStatus = "pending" | "approved" | "rejected" | "active" | "repaid";

export interface ILoanApplication extends Document {
  user: Types.ObjectId;
  offer: Types.ObjectId;
  requestedAmount: number;
  amountDue: number;
  repaidAmount: number;
  interestRate: number;
  interestType: InterestType;
  durationDays: number;
  dueDate?: Date;
  status: LoanApplicationStatus;
  approvedBy?: Types.ObjectId;
  approvedAt?: Date;
  rejectionReason?: string;
  meta: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const loanApplicationSchema = new Schema<ILoanApplication>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    offer: { type: Schema.Types.ObjectId, ref: "LoanOffer", required: true },
    requestedAmount: { type: Number, required: true },
    amountDue: { type: Number, required: true },
    repaidAmount: { type: Number, default: 0 },
    interestRate: { type: Number, required: true },
    interestType: { type: String, enum: ["flat", "compound"], required: true },
    durationDays: { type: Number, required: true },
    dueDate: { type: Date },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "active", "repaid"],
      default: "pending",
    },
    approvedBy: { type: Schema.Types.ObjectId, ref: "User" },
    approvedAt: { type: Date },
    rejectionReason: { type: String },
    meta: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

loanApplicationSchema.index({ user: 1, status: 1 });
loanApplicationSchema.index({ offer: 1 });

export const LoanApplication = model<ILoanApplication>("LoanApplication", loanApplicationSchema);
