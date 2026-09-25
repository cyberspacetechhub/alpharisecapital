import { Schema, model, Document, Types } from "mongoose";

export type AccountServiceType =
  | "maintenance"
  | "withdrawal_restriction"
  | "multiple_withdrawal"
  | "account_freeze"
  | "debit_freeze"
  | "security_update"
  | "upgrade_trading_plan"
  | "kyc";

export interface IAccountServicePlanSnapshot {
  id?: Types.ObjectId;
  name: string;
  roiPercent?: number;
  durationDays?: number;
  amount?: number;
  minAmount?: number;
}

export interface IAccountService extends Document {
  user: Types.ObjectId;
  serviceType: AccountServiceType;
  title: string;
  message: string;
  requiresPayment: boolean;
  paymentAmount: number;
  currentPlan?: IAccountServicePlanSnapshot;
  targetPlan?: IAccountServicePlanSnapshot;
  status: "active" | "resolved";
  resolvedAt?: Date;
  createdBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const accountServiceSchema = new Schema<IAccountService>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    serviceType: {
      type: String,
      enum: [
        "maintenance",
        "withdrawal_restriction",
        "multiple_withdrawal",
        "account_freeze",
        "debit_freeze",
        "security_update",
        "upgrade_trading_plan",
        "kyc",
      ],
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    requiresPayment: { type: Boolean, default: false },
    paymentAmount: { type: Number, default: 0 },
    currentPlan: {
      id: { type: Schema.Types.ObjectId },
      name: { type: String },
      roiPercent: { type: Number },
      durationDays: { type: Number },
      amount: { type: Number },
      minAmount: { type: Number },
    },
    targetPlan: {
      id: { type: Schema.Types.ObjectId },
      name: { type: String },
      roiPercent: { type: Number },
      durationDays: { type: Number },
      amount: { type: Number },
      minAmount: { type: Number },
    },
    status: {
      type: String,
      enum: ["active", "resolved"],
      default: "active",
      index: true,
    },
    resolvedAt: { type: Date },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

export const AccountService = model<IAccountService>("AccountService", accountServiceSchema);
