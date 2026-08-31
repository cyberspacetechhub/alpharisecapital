import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { User } from "../models/user.model";
import { Profile } from "../models/profile.model";
import { TraderProfile } from "../models/trader.profile.model";
import { Transaction } from "../models/transaction.model";
import { Position } from "../models/position.model";
import { LoanApplication } from "../models/loan.model";
import { AppError } from "../utils/AppError";
import { uploadImage } from "./cloudinary.service";
import { UpdateProfileInput, KycSubmitInput } from "../utils/validators/user.validator";

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
  const [user, activeInvestments, openPositions, activeLoans] = await Promise.all([
    User.findById(userId)
      .select("username email balance investedBalance pendingWithdrawal totalDeposited totalWithdrawn totalInvested totalEarnings creditScore loanLimit kycStatus isVerified")
      .lean(),
    Transaction.countDocuments({ user: userId, type: { $in: ["investment", "reinvestment"] }, status: "approved" }),
    Position.countDocuments({ user: userId, status: "open" }),
    LoanApplication.countDocuments({ user: userId, status: "active" }),
  ]);

  if (!user) throw new AppError("User not found", 404);

  return {
    ...user,
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

export const updateAvatar = async (userId: string, filePath: string) => {
  const profile = await Profile.findOne({ user: userId });
  if (!profile) throw new AppError("Profile not found", 404);

  const url = await uploadImage(filePath, "avatars");
  profile.avatar = url;
  await profile.save();
  return { avatar: url };
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

export const getAllTraders = async (page: number, limit: number, search?: string) => {
  const filter: Record<string, unknown> = {};
  if (search) {
    filter.$or = [
      { username: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
    ];
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

  const [recentTransactions, openPositions, activeInvestments, activeLoans] = await Promise.all([
    Transaction.find({ user: userId }).sort({ createdAt: -1 }).limit(10).lean(),
    Position.find({ user: userId, status: "open" }).lean(),
    Transaction.find({ user: userId, type: { $in: ["investment", "reinvestment"] }, status: "approved" }).lean(),
    LoanApplication.find({ user: userId, status: "active" }).populate("offer", "title interestRate").lean(),
  ]);

  return { user, recentTransactions, openPositions, activeInvestments, activeLoans };
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
