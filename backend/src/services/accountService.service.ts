import mongoose from "mongoose";
import { AccountService, AccountServiceType } from "../models/accountService.model";
import { User } from "../models/user.model";
import { Transaction } from "../models/transaction.model";
import { InvestmentPlan } from "../models/investmentPlan.model";
import { AppError } from "../utils/AppError";
import { sendSystemMessage } from "./inAppMessage.service";

// ─── Create Account Service ───────────────────────────────────────────────────

export interface ICreateAccountServicePayload {
  userId: string;
  serviceType: AccountServiceType;
  title: string;
  message: string;
  requiresPayment?: boolean;
  paymentAmount?: number;
  targetPlanId?: string;
  paymentAmountCustom?: number;
}

export const createAccountService = async (
  adminId: string,
  payload: ICreateAccountServicePayload
) => {
  const user = await User.findById(payload.userId);
  if (!user) throw new AppError("Client not found", 404);

  let currentPlanSnapshot: any = undefined;
  let targetPlanSnapshot: any = undefined;

  // If service is plan upgrade, auto-fetch client's active contract snapshot
  if (payload.serviceType === "upgrade_trading_plan") {
    const activeInvestment = await Transaction.findOne({
      user: payload.userId,
      type: { $in: ["investment", "reinvestment"] },
      status: "approved",
    }).sort({ createdAt: -1 });

    if (activeInvestment) {
      currentPlanSnapshot = {
        id: activeInvestment.planId,
        name: activeInvestment.planSnapshot?.name || "Active Plan",
        roiPercent: activeInvestment.planSnapshot?.roiPercent,
        durationDays: activeInvestment.planSnapshot?.durationDays,
        amount: activeInvestment.amount,
        minAmount: activeInvestment.planSnapshot?.minAmount,
      };
    }

    if (payload.targetPlanId) {
      const targetPlan = await InvestmentPlan.findById(payload.targetPlanId);
      if (targetPlan) {
        targetPlanSnapshot = {
          id: targetPlan._id,
          name: targetPlan.name,
          roiPercent: targetPlan.roiPercent,
          durationDays: targetPlan.durationDays,
          minAmount: targetPlan.minAmount,
        };
      }
    }
  }

  const service = await AccountService.create({
    user: payload.userId,
    serviceType: payload.serviceType,
    title: payload.title.trim(),
    message: payload.message.trim(),
    requiresPayment: !!payload.requiresPayment,
    paymentAmount: Number(payload.paymentAmount) || 0,
    currentPlan: currentPlanSnapshot,
    targetPlan: targetPlanSnapshot,
    status: "active",
    createdBy: new mongoose.Types.ObjectId(adminId),
  });

  // Send in-app system notification to user
  await sendSystemMessage(
    payload.userId,
    `Account Service Notice: ${payload.title}`,
    payload.message,
    "Transaction"
  ).catch((e) => console.error("System message failed:", e));

  return service;
};

// ─── Get Active Services For Current User ──────────────────────────────────────

export const getMyActiveServices = async (userId: string) => {
  return AccountService.find({
    user: userId,
    status: "active",
  }).sort({ createdAt: -1 });
};

// ─── Get All Account Services (Admin) ─────────────────────────────────────────

export const getAllAccountServices = async (
  query: { status?: string; serviceType?: string; page?: string; limit?: string }
) => {
  const { status, serviceType, page = "1", limit = "20" } = query;
  const filter: Record<string, any> = {};

  if (status) filter.status = status;
  if (serviceType) filter.serviceType = serviceType;

  const [data, total] = await Promise.all([
    AccountService.find(filter)
      .populate("user", "username email balance investedBalance")
      .populate("createdBy", "username email")
      .sort({ createdAt: -1 })
      .skip((+page - 1) * +limit)
      .limit(+limit),
    AccountService.countDocuments(filter),
  ]);

  return { data, total, page: +page, pages: Math.ceil(total / +limit) };
};

// ─── Get User Specific Services (Admin) ───────────────────────────────────────

export const getUserAccountServices = async (userId: string) => {
  return AccountService.find({ user: userId })
    .populate("createdBy", "username")
    .sort({ createdAt: -1 });
};

// ─── Get Client Active Plan Info (Helper for Admin Form) ─────────────────────

export const getClientActivePlanDetails = async (userId: string) => {
  const activeInvestment = await Transaction.findOne({
    user: userId,
    type: { $in: ["investment", "reinvestment"] },
    status: "approved",
  }).sort({ createdAt: -1 });

  return activeInvestment ? {
    transactionId: activeInvestment._id,
    planId: activeInvestment.planId,
    name: activeInvestment.planSnapshot?.name || "Active Plan",
    amount: activeInvestment.amount,
    roiPercent: activeInvestment.planSnapshot?.roiPercent,
    durationDays: activeInvestment.planSnapshot?.durationDays,
    minAmount: activeInvestment.planSnapshot?.minAmount,
    maxAmount: activeInvestment.planSnapshot?.maxAmount,
  } : null;
};

// ─── Mark Service Resolved ───────────────────────────────────────────────────

export const markServiceResolved = async (serviceId: string, adminId: string) => {
  const service = await AccountService.findById(serviceId);
  if (!service) throw new AppError("Account service not found", 404);

  service.status = "resolved";
  service.resolvedAt = new Date();
  await service.save();

  await sendSystemMessage(
    service.user.toString(),
    `Account Service Resolved: ${service.title}`,
    `Your account service request regarding "${service.title}" has been marked as resolved by administration.`,
    "Transaction"
  ).catch((e) => console.error("System message failed:", e));

  return service;
};

// ─── 24-Hour Cleanup Job For Resolved Services ────────────────────────────────

export const cleanupResolvedServices = async () => {
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const result = await AccountService.deleteMany({
    status: "resolved",
    resolvedAt: { $lte: cutoff },
  });

  if (result.deletedCount && result.deletedCount > 0) {
    console.log(`[AccountServiceCleanup] Deleted ${result.deletedCount} resolved service(s) older than 24 hours.`);
  }
};
