import mongoose from "mongoose";
import { WalletLink } from "../models/walletLink.model";
import { AppError } from "../utils/AppError";
import { WalletLinkInput } from "../utils/validators/user.validator";

export const addWalletLink = async (userId: string, data: WalletLinkInput) => {
  // if setting as primary, unset all others first
  if (data.isPrimary) {
    await WalletLink.updateMany({ user: userId }, { isPrimary: false });
  }
  return WalletLink.create({ user: userId, ...data });
};

export const getMyWalletLinks = async (userId: string) => {
  return WalletLink.find({ user: userId }).sort({ isPrimary: -1, createdAt: -1 });
};

export const setPrimaryWallet = async (userId: string, walletId: string) => {
  const wallet = await WalletLink.findOne({ _id: walletId, user: userId });
  if (!wallet) throw new AppError("Wallet not found", 404);
  await WalletLink.updateMany({ user: userId }, { isPrimary: false });
  wallet.isPrimary = true;
  return wallet.save();
};

export const deleteWalletLink = async (userId: string, walletId: string) => {
  const wallet = await WalletLink.findOneAndDelete({ _id: walletId, user: userId });
  if (!wallet) throw new AppError("Wallet not found", 404);
};

// ─── Executor ─────────────────────────────────────────────────────────────────

export const verifyWalletLink = async (walletId: string, executorId: string) => {
  const wallet = await WalletLink.findById(walletId);
  if (!wallet) throw new AppError("Wallet not found", 404);
  wallet.isVerified = true;
  wallet.verifiedBy = new mongoose.Types.ObjectId(executorId);
  wallet.verifiedAt = new Date();
  return wallet.save();
};

export const getUserWalletLinks = async (userId: string) => {
  return WalletLink.find({ user: userId }).sort({ isPrimary: -1, createdAt: -1 });
};

export const getAllWalletLinks = async () => {
  return WalletLink.find().populate("user", "name email").sort({ createdAt: -1 });
};
