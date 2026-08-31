import { Schema, Document } from "mongoose";
import { Profile, IProfile } from "./profile.model";

export type TradingExperience = "beginner" | "intermediate" | "expert";

export interface ITraderProfile extends IProfile {
  tradingExperience: TradingExperience;
  preferredAssets: string[];
  activeInvestments: number;
  referralCode?: string;
  referredBy?: string;
  totalReferrals: number;
}

const traderSchema = new Schema<ITraderProfile>({
  tradingExperience: {
    type: String,
    enum: ["beginner", "intermediate", "expert"],
    default: "beginner",
  },
  preferredAssets: [{ type: String }],
  activeInvestments: { type: Number, default: 0 },
  referralCode: { type: String, unique: true, sparse: true },
  referredBy: { type: String },
  totalReferrals: { type: Number, default: 0 },
});

export const TraderProfile = Profile.discriminator<ITraderProfile>("Trader", traderSchema);
