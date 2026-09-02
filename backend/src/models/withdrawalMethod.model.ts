import { Schema, model, Document } from "mongoose";

export interface IWithdrawalMethod extends Document {
  name: string;
  type: "crypto" | "bank";
  image?: string;
  details: Record<string, string>;
  minAmount: number;
  maxAmount: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const withdrawalMethodSchema = new Schema<IWithdrawalMethod>(
  {
    name: { type: String, required: true, unique: true },
    type: { type: String, enum: ["crypto", "bank"], required: true },
    image: { type: String, default: "" },
    details: { type: Map, of: String, required: true },
    minAmount: { type: Number, required: true },
    maxAmount: { type: Number, required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const WithdrawalMethod = model<IWithdrawalMethod>("WithdrawalMethod", withdrawalMethodSchema);
