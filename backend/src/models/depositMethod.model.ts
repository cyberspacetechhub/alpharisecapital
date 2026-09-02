import { Schema, model, Document } from "mongoose";

export interface IDepositMethod extends Document {
  name: string;
  type: "crypto" | "bank";
  image?: string;
  details: Record<string, string>;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const depositMethodSchema = new Schema<IDepositMethod>(
  {
    name: { type: String, required: true, unique: true },
    type: { type: String, enum: ["crypto", "bank"], required: true },
    image: { type: String, default: "" },
    details: { type: Map, of: String, required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const DepositMethod = model<IDepositMethod>("DepositMethod", depositMethodSchema);
