import { Schema, model, Document, Types } from "mongoose";

export type WalletType = "crypto" | "bank";

export interface IWalletLink extends Document {
  user: Types.ObjectId;
  type: WalletType;
  label: string;
  details: Record<string, string>;
  isPrimary: boolean;
  isVerified: boolean;
  verifiedBy?: Types.ObjectId;
  verifiedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const walletLinkSchema = new Schema<IWalletLink>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, enum: ["crypto", "bank"], required: true },
    label: { type: String, required: true },
    details: { type: Map, of: String, required: true },
    isPrimary: { type: Boolean, default: false },
    isVerified: { type: Boolean, default: false },
    verifiedBy: { type: Schema.Types.ObjectId, ref: "User" },
    verifiedAt: { type: Date },
  },
  { timestamps: true }
);

walletLinkSchema.index({ user: 1 });

export const WalletLink = model<IWalletLink>("WalletLink", walletLinkSchema);
