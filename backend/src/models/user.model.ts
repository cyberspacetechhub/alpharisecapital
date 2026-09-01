import { Schema, model, Document, Types } from "mongoose";

export interface ILoginHistory {
  ip: string;
  userAgent: string;
  at: Date;
}

export interface IUser extends Document {
  username: string;
  fullName: string;
  email: string;
  password: string;
  phone?: string;
  refreshToken?: string;
  isVerified: boolean;
  isActive: boolean;
  kycStatus: "none" | "pending" | "approved" | "rejected";
  kycDocuments: string[];
  profile?: Types.ObjectId;
  balance: number;
  investedBalance: number;
  pendingWithdrawal: number;
  totalDeposited: number;
  totalWithdrawn: number;
  totalInvested: number;
  totalEarnings: number;
  bonus: number;
  creditScore: number;
  loanLimit: number;
  isCustomLoanLimit: boolean;
  lastLogin?: Date;
  lastIp?: string;
  loginHistory: ILoginHistory[];
  passwordChangedAt?: Date;
  emailVerificationToken?: string;
  emailVerificationExpires?: Date;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const loginHistorySchema = new Schema<ILoginHistory>(
  {
    ip: { type: String, required: true },
    userAgent: { type: String, required: true },
    at: { type: Date, default: Date.now },
  },
  { _id: false }
);

const userSchema = new Schema<IUser>(
  {
    username: { type: String, required: true, unique: true, trim: true },
    fullName: { type: String, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false },
    phone: { type: String },
    refreshToken: { type: String, select: false },
    isVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    kycStatus: { type: String, enum: ["none", "pending", "approved", "rejected"], default: "none" },
    kycDocuments: [{ type: String }],
    profile: { type: Schema.Types.ObjectId, ref: "Profile" },
    balance: { type: Number, default: 0 },
    investedBalance: { type: Number, default: 0 },
    pendingWithdrawal: { type: Number, default: 0 },
    totalDeposited: { type: Number, default: 0 },
    totalWithdrawn: { type: Number, default: 0 },
    totalInvested: { type: Number, default: 0 },
    totalEarnings: { type: Number, default: 0 },
    bonus: { type: Number, default: 0 },
    creditScore: { type: Number, default: 100 },
    loanLimit: { type: Number, default: 0 },
    isCustomLoanLimit: { type: Boolean, default: false },
    lastLogin: { type: Date },
    lastIp: { type: String },
    loginHistory: { type: [loginHistorySchema], default: [] },
    passwordChangedAt: { type: Date, select: false },
    emailVerificationToken: { type: String, select: false },
    emailVerificationExpires: { type: Date, select: false },
    passwordResetToken: { type: String, select: false },
    passwordResetExpires: { type: Date, select: false },
  },
  { timestamps: true }
);

export const User = model<IUser>("User", userSchema);
