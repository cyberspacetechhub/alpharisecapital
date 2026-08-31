import { Schema, model, Document } from "mongoose";

export interface IInvestmentPlan extends Document {
  name: string;
  minAmount: number;
  maxAmount: number;
  roiPercent: number;
  durationDays: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const investmentPlanSchema = new Schema<IInvestmentPlan>(
  {
    name: { type: String, required: true, unique: true },
    minAmount: { type: Number, required: true },
    maxAmount: { type: Number, required: true },
    roiPercent: { type: Number, required: true },
    durationDays: { type: Number, required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const InvestmentPlan = model<IInvestmentPlan>("InvestmentPlan", investmentPlanSchema);
