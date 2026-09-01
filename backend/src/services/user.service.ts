import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { User } from "../models/user.model";
import { Profile } from "../models/profile.model";
import { TraderProfile } from "../models/trader.profile.model";
import { Transaction } from "../models/transaction.model";
import { Position } from "../models/position.model";
import { LoanApplication } from "../models/loan.model";
import { AppError } from "../utils/AppError";
import { uploadImage, uploadBuffer } from "./cloudinary.service";
import { UpdateProfileInput, KycSubmitInput } from "../utils/validators/user.validator";
import { generateAccessToken, generateRefreshToken } from "../utils/tokens";

// ─── Get My Full Profile ──────────────────────────────────────────────────────

export const getMyProfile = async (userId: string) => {
  const user = await User.findById(userId)
    .select("-password -refreshToken -emailVerificationToken -emailVerificationExpires -passwordResetToken -passwordResetExpires")
    .populate("profile")
    .lean();
  if (!user) throw new AppError("User not found", 404);
  return user;
};

// ─── Get My Dashboard Summary ─────────────────────────────────────────────────

export const getMyDashboard = async (userId: string) => {
  const [user, profile, activeInvestments, openPositions, activeLoans] = await Promise.all([
    User.findById(userId)
      .select("username email balance investedBalance pendingWithdrawal totalDeposited totalWithdrawn totalInvested totalEarnings bonus creditScore loanLimit kycStatus isVerified")
      .lean(),
    Profile.findOne({ user: userId }).lean(),
    Transaction.countDocuments({ user: userId, type: { $in: ["investment", "reinvestment"] }, status: "approved" }),
    Position.countDocuments({ user: userId, status: "open" }),
    LoanApplication.countDocuments({ user: userId, status: "active" }),
  ]);

  if (!user) throw new AppError("User not found", 404);

  return {
    ...user,
    bonus: user.bonus || 0,
    referralCode: (profile as any)?.referralCode || user.username,
    referredBy: (profile as any)?.referredBy || null,
    totalReferrals: (profile as any)?.totalReferrals || 0,
    activeInvestments,
    openPositions,
    activeLoans,
  };
};

// ─── Update Profile ───────────────────────────────────────────────────────────

export const updateMyProfile = async (userId: string, data: UpdateProfileInput) => {
  const { bio, country, timezone, phone, tradingExperience, preferredAssets } = data;

  const [user, profile] = await Promise.all([
    User.findById(userId),
    Profile.findOne({ user: userId }),
  ]);

  if (!user) throw new AppError("User not found", 404);
  if (!profile) throw new AppError("Profile not found", 404);

  if (phone) user.phone = phone;
  await user.save();

  if (bio !== undefined) profile.bio = bio;
  if (country !== undefined) profile.country = country;
  if (timezone !== undefined) profile.timezone = timezone;

  // trader-specific fields
  if (profile.type === "Trader") {
    const traderProfile = await TraderProfile.findOne({ user: userId });
    if (traderProfile) {
      if (tradingExperience) traderProfile.tradingExperience = tradingExperience;
      if (preferredAssets) traderProfile.preferredAssets = preferredAssets;
      await traderProfile.save();
    }
  }

  await profile.save();
  return profile;
};

// ─── Update Avatar ────────────────────────────────────────────────────────────

export const updateAvatar = async (userId: string, fileBuffer: Buffer) => {
  const profile = await Profile.findOne({ user: userId });
  if (!profile) throw new AppError("Profile not found", 404);

  const url = await uploadBuffer(fileBuffer, "avatars");
  profile.avatar = url;
  await profile.save();
  return { avatar: url };
};

export const uploadGeneralFile = async (fileBuffer: Buffer) => {
  const url = await uploadBuffer(fileBuffer, "kyc_documents");
  return url;
};

// ─── Change Password ──────────────────────────────────────────────────────────

export const changePassword = async (userId: string, currentPassword: string, newPassword: string) => {
  const user = await User.findById(userId).select("+password");
  if (!user) throw new AppError("User not found", 404);

  const match = await bcrypt.compare(currentPassword, user.password);
  if (!match) throw new AppError("Current password is incorrect", 400);

  user.password = await bcrypt.hash(newPassword, 12);
  user.passwordChangedAt = new Date();
  await user.save();
};

// ─── KYC Submit ───────────────────────────────────────────────────────────────

export const submitKyc = async (userId: string, data: KycSubmitInput) => {
  const user = await User.findById(userId);
  if (!user) throw new AppError("User not found", 404);
  if (user.kycStatus === "approved") throw new AppError("KYC already approved", 400);

  user.kycDocuments = data.documents;
  user.kycStatus = "pending";
  await user.save();
  return { kycStatus: user.kycStatus };
};

// ─── Executor: Get All Traders ────────────────────────────────────────────────

export const getAllTraders = async (page: number, limit: number, search?: string, kycStatus?: string) => {
  const filter: Record<string, unknown> = {};
  if (search) {
    filter.$or = [
      { username: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
    ];
  }
  if (kycStatus) {
    filter.kycStatus = kycStatus;
  }

  const userIds = await Profile.find({ type: "Trader" }).distinct("user");
  filter._id = { $in: userIds };

  const [users, total] = await Promise.all([
    User.find(filter)
      .select("-password -refreshToken -emailVerificationToken -emailVerificationExpires -passwordResetToken -passwordResetExpires -loginHistory")
      .populate({ path: "profile", select: "avatar bio country timezone tradingExperience preferredAssets referralCode totalReferrals activeInvestments" })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    User.countDocuments(filter),
  ]);

  return { users, total, page, pages: Math.ceil(total / limit) };
};

// ─── Executor: Get Single Trader Full Details ─────────────────────────────────

export const getTraderDetails = async (userId: string) => {
  const user = await User.findById(userId)
    .select("-password -refreshToken -emailVerificationToken -emailVerificationExpires -passwordResetToken -passwordResetExpires")
    .populate("profile")
    .lean();

  if (!user) throw new AppError("User not found", 404);

  const profile = await Profile.findOne({ user: userId }).lean();
  if (!profile || profile.type !== "Trader") throw new AppError("Trader not found", 404);

  const traderProfile = profile as any;

  // Find who referred this user
  let referredByDetails = null;
  if (traderProfile?.referredBy) {
    referredByDetails = await User.findOne({
      $or: [{ username: traderProfile.referredBy }, { referralCode: traderProfile.referredBy }],
    })
      .select("username email fullName createdAt isVerified")
      .populate({ path: "profile", select: "avatar" })
      .lean();
  }

  // Find all traders referred by this user
  const referredTraderProfiles = await TraderProfile.find({
    referredBy: { $in: [user.username, traderProfile.referralCode].filter(Boolean) },
  })
    .select("user")
    .lean();

  const referredUserIds = referredTraderProfiles.map((p) => p.user);
  const referrals = await User.find({ _id: { $in: referredUserIds } })
    .select("username email fullName createdAt isVerified totalDeposited balance bonus")
    .populate({ path: "profile", select: "avatar" })
    .sort({ createdAt: -1 })
    .lean();

  const [recentTransactions, openPositions, activeInvestments, activeLoans] = await Promise.all([
    Transaction.find({ user: userId }).sort({ createdAt: -1 }).limit(10).lean(),
    Position.find({ user: userId, status: "open" }).lean(),
    Transaction.find({ user: userId, type: { $in: ["investment", "reinvestment"] }, status: "approved" }).lean(),
    LoanApplication.find({ user: userId, status: "active" }).populate("offer", "title interestRate").lean(),
  ]);

  return {
    user,
    recentTransactions,
    openPositions,
    activeInvestments,
    activeLoans,
    referredByDetails,
    referrals,
    referralsCount: referrals.length,
  };
};

// ─── Executor: Update KYC Status ─────────────────────────────────────────────

export const updateKycStatus = async (userId: string, status: "approved" | "rejected") => {
  const user = await User.findById(userId);
  if (!user) throw new AppError("User not found", 404);
  user.kycStatus = status;
  await user.save();
  return { kycStatus: user.kycStatus };
};

// ─── Executor: Toggle User Active Status ─────────────────────────────────────

export const toggleUserActive = async (userId: string) => {
  const user = await User.findById(userId);
  if (!user) throw new AppError("User not found", 404);
  user.isActive = !user.isActive;
  await user.save();
  return { isActive: user.isActive };
};

// ─── Executor: Get Dashboard Stats ──────────────────────────────────────────

export const getExecutorDashboardStats = async () => {
  const [
    userStats,
    depositStats,
    withdrawalStats,
    investmentStats,
    pendingTxCount,
    kycStats,
  ] = await Promise.all([
    // User balance aggregates
    User.aggregate([
      {
        $group: {
          _id: null,
          totalBalance: { $sum: "$balance" },
          totalInvested: { $sum: "$investedBalance" },
          totalPendingWithdrawal: { $sum: "$pendingWithdrawal" },
          count: { $sum: 1 },
        },
      },
    ]),
    // Approved Deposits sum
    Transaction.aggregate([
      { $match: { type: "deposit", status: "approved" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
    // Approved Withdrawals sum
    Transaction.aggregate([
      { $match: { type: "withdrawal", status: "approved" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
    // Investment counts
    Transaction.aggregate([
      { $match: { type: { $in: ["investment", "reinvestment"] } } },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]),
    // Total pending transactions
    Transaction.countDocuments({ status: "pending" }),
    // Pending KYC count
    User.countDocuments({ kycStatus: "pending" }),
  ]);

  const u = userStats[0] || { totalBalance: 0, totalInvested: 0, totalPendingWithdrawal: 0, count: 0 };
  const d = depositStats[0]?.total || 0;
  const w = withdrawalStats[0]?.total || 0;

  const invStatsMap = Object.fromEntries(investmentStats.map((item) => [item._id, item.count]));

  return {
    totalClients: u.count,
    totalClientBalance: u.totalBalance,
    totalClientInvested: u.totalInvested,
    totalClientPendingWithdrawal: u.totalPendingWithdrawal,
    totalDepositsApproved: d,
    totalWithdrawalsApproved: w,
    activeInvestmentsCount: invStatsMap["approved"] || 0,
    pendingInvestmentsCount: invStatsMap["pending"] || 0,
    totalPendingTransactions: pendingTxCount,
    pendingKycCount: kycStats,
  };
};

// ─── Executor: Impersonate Trader Account ────────────────────────────────────

export const impersonateTrader = async (traderId: string, executorId: string, ip: string, userAgent: string) => {
  const [executor, trader] = await Promise.all([
    User.findById(executorId).populate("profile"),
    User.findById(traderId).populate("profile").select("+refreshToken"),
  ]);

  if (!executor) throw new AppError("Executor session not found", 401);
  const execProfile = executor.profile as any;
  if (!execProfile || execProfile.type !== "Executor") {
    throw new AppError("Unauthorized: Only Executors can impersonate traders", 403);
  }

  if (!trader) throw new AppError("Trader account not found", 404);
  const traderProfile = trader.profile as any;
  if (!traderProfile || traderProfile.type !== "Trader") {
    throw new AppError("Can only impersonate trader accounts", 400);
  }

  const accessToken = generateAccessToken(String(trader._id));
  const refreshToken = generateRefreshToken(String(trader._id));

  trader.refreshToken = await bcrypt.hash(refreshToken, 10);
  trader.lastLogin = new Date();
  trader.lastIp = ip;
  trader.loginHistory.push({ ip, userAgent: `[Admin Impersonation] ${userAgent}`, at: new Date() });
  if (trader.loginHistory.length > 20) trader.loginHistory = trader.loginHistory.slice(-20);
  await trader.save();

  return {
    accessToken,
    refreshToken,
    user: {
      id: String(trader._id),
      username: trader.username,
      email: trader.email,
      type: "Trader" as const,
    },
  };
};

// ─── Executor: Unverify Trader ───────────────────────────────────────────────

export const unverifyTrader = async (userId: string) => {
  const user = await User.findById(userId);
  if (!user) throw new AppError("Trader not found", 404);
  user.isVerified = false;
  user.kycStatus = "none";
  await user.save();
  return { isVerified: user.isVerified, kycStatus: user.kycStatus };
};

// ─── Executor: Balance Actions & Debits ──────────────────────────────────────

export type BalanceActionType =
  | "credit_balance"
  | "credit_profit"
  | "credit_bonus"
  | "clear_available_balance"
  | "clear_all_balances"
  | "debit";

export interface ManageBalanceInput {
  action: BalanceActionType;
  amount?: number;
  targetBalance?: "main" | "trading" | "profit" | "bonus";
  memo?: string;
}

export const manageTraderBalance = async (
  userId: string,
  executorId: string,
  data: ManageBalanceInput
) => {
  const user = await User.findById(userId);
  if (!user) throw new AppError("Trader not found", 404);

  const { action, amount = 0, targetBalance = "main", memo = "" } = data;
  const numAmount = Math.abs(Number(amount));
  const reference = `ADM-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

  let txType: "deposit" | "withdrawal" | "investment" | "reinvestment" | "loan_disbursement" | "loan_repayment" | "bonus" | "adjustment" | "admin_credit" | "admin_debit" = "adjustment";
  let txAmount: number = numAmount;
  let txDescription: string = memo || action;

  switch (action) {
    case "credit_balance": {
      if (isNaN(numAmount) || numAmount <= 0) {
        throw new AppError("Amount must be greater than 0", 400);
      }
      user.balance += numAmount;
      user.totalDeposited += numAmount;
      txType = "admin_credit";
      txDescription = memo || `Admin balance credit of $${numAmount.toLocaleString()}`;
      break;
    }
    case "credit_profit": {
      if (isNaN(numAmount) || numAmount <= 0) {
        throw new AppError("Amount must be greater than 0", 400);
      }
      user.totalEarnings += numAmount;
      txType = "bonus";
      txDescription = memo || `Admin profit credit of $${numAmount.toLocaleString()}`;
      break;
    }
    case "credit_bonus": {
      if (isNaN(numAmount) || numAmount <= 0) {
        throw new AppError("Amount must be greater than 0", 400);
      }
      user.bonus = (user.bonus || 0) + numAmount;
      txType = "bonus";
      txDescription = memo || `Admin bonus credit of $${numAmount.toLocaleString()}`;
      break;
    }
    case "clear_available_balance": {
      const cleared = user.balance;
      user.balance = 0;
      txType = "adjustment";
      txAmount = cleared;
      txDescription = memo || `Admin cleared available balance (was $${cleared.toLocaleString()})`;
      break;
    }
    case "clear_all_balances": {
      const prevSummary = `Balance: $${user.balance}, Trading: $${user.investedBalance}, Profit: $${user.totalEarnings}, Bonus: $${user.bonus || 0}`;
      user.balance = 0;
      user.investedBalance = 0;
      user.totalEarnings = 0;
      user.bonus = 0;
      txType = "adjustment";
      txAmount = 0;
      txDescription = memo || `Admin cleared all balances (${prevSummary})`;
      break;
    }
    case "debit": {
      if (isNaN(numAmount) || numAmount <= 0) {
        throw new AppError("Debit amount must be greater than 0", 400);
      }
      txType = "admin_debit";
      if (targetBalance === "main") {
        user.balance = Math.max(0, user.balance - numAmount);
        txDescription = memo || `Admin debited main balance by $${numAmount.toLocaleString()}`;
      } else if (targetBalance === "trading") {
        user.investedBalance = Math.max(0, user.investedBalance - numAmount);
        txDescription = memo || `Admin debited trading balance by $${numAmount.toLocaleString()}`;
      } else if (targetBalance === "profit") {
        user.totalEarnings = Math.max(0, user.totalEarnings - numAmount);
        txDescription = memo || `Admin debited profit balance by $${numAmount.toLocaleString()}`;
      } else if (targetBalance === "bonus") {
        user.bonus = Math.max(0, (user.bonus || 0) - numAmount);
        txDescription = memo || `Admin debited bonus balance by $${numAmount.toLocaleString()}`;
      } else {
        throw new AppError("Invalid target balance for debit", 400);
      }
      break;
    }
    default:
      throw new AppError("Invalid balance action", 400);
  }

  await user.save();

  // Create audit transaction record
  const transaction = await Transaction.create({
    user: user._id,
    type: txType,
    amount: txAmount,
    status: "approved",
    reference,
    meta: {
      action,
      targetBalance,
      memo: txDescription,
      performedBy: executorId,
      timestamp: new Date(),
    },
    reviewedBy: new mongoose.Types.ObjectId(executorId),
    reviewedAt: new Date(),
  });

  return {
    user: {
      id: String(user._id),
      username: user.username,
      balance: user.balance,
      investedBalance: user.investedBalance,
      totalEarnings: user.totalEarnings,
      bonus: user.bonus || 0,
      totalDeposited: user.totalDeposited,
      totalWithdrawn: user.totalWithdrawn,
    },
    transaction,
  };
};
