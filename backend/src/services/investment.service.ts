import mongoose from "mongoose";
import { User } from "../models/user.model";
import { InvestmentPlan } from "../models/investmentPlan.model";
import { Transaction } from "../models/transaction.model";
import { AppError } from "../utils/AppError";
import { generateReference } from "../utils/tokens";
import { sendEmail } from "./email.service";
import { sendSystemMessage } from "./inAppMessage.service";
import {
  investmentStartedEmail,
  reinvestmentConfirmedEmail,
  investmentPlanExpiredEmail,
  investmentTopUpEmail,
  investmentCancelledEmail,
  investmentForfeitedEmail,
} from "../emails";

// ─── Invest ──────────────────────────────────────────────────────────────────

export const invest = async (userId: string, planId: string, amount: number) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const user = await User.findById(userId).session(session);
    const plan = await InvestmentPlan.findById(planId).session(session);

    if (!user) throw new AppError("User not found", 404);
    if (!plan || !plan.isActive) throw new AppError("Investment plan not found or inactive", 404);
    if (amount < plan.minAmount || amount > plan.maxAmount)
      throw new AppError(`Amount must be between $${plan.minAmount} and $${plan.maxAmount}`, 400);
    if (user.balance < amount) throw new AppError("Insufficient balance", 400);

    // Deduct available balance and hold in pending escrow
    user.balance -= amount;
    if (!user.escrow) {
      user.escrow = { pendingWithdrawal: 0, pendingDeposit: 0, pendingInvestment: 0, eligibleReinvestAmount: 0 };
    }
    user.escrow.pendingInvestment = (user.escrow.pendingInvestment || 0) + amount;
    await user.save({ session });

    const tx = await Transaction.create(
      [
        {
          user: userId,
          type: "investment",
          amount,
          status: "pending",
          reference: generateReference(),
          planId: plan._id,
          planSnapshot: {
            name: plan.name,
            roiPercent: plan.roiPercent,
            durationDays: plan.durationDays,
            minAmount: plan.minAmount,
            maxAmount: plan.maxAmount,
          },
          isReinvestment: false,
          meta: {},
        },
      ],
      { session }
    );

    await session.commitTransaction();

    await sendSystemMessage(
      userId,
      "Investment Requested",
      `Your investment request of $${amount.toFixed(2)} into ${plan.name} has been received and is pending activation.`,
      "Transaction",
      tx[0]._id.toString()
    ).catch((e) => console.error("System message failed:", e));

    return tx[0];
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
};

// ─── Reinvest (Strictly previous traded amount within 48 hours) ──────────────

export const reinvest = async (userId: string, transactionId: string) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const original = await Transaction.findOne({
      _id: transactionId,
      user: userId,
      type: { $in: ["investment", "reinvestment"] },
      status: { $in: ["completed", "matured"] },
    }).session(session);

    if (!original) throw new AppError("Completed investment transaction not found", 404);

    // Enforce 48-hour reinvestment limit from the completion time
    const completedAt = (original.meta as Record<string, any>)?.completedAt || original.updatedAt;
    if (completedAt) {
      const timePassed = Date.now() - new Date(completedAt as any).getTime();
      if (timePassed > 48 * 60 * 60 * 1000) {
        throw new AppError("Reinvestment period of 48 hours has expired for this investment", 400);
      }
    }

    const plan = await InvestmentPlan.findById(original.planId).session(session);
    if (!plan || !plan.isActive) throw new AppError("Original plan is no longer active", 400);

    const reinvestAmount = original.amount; // strictly previous traded principal
    const user = await User.findById(userId).session(session);
    if (!user) throw new AppError("User not found", 404);
    if (user.canReinvest === false) {
      throw new AppError("Reinvestment is disabled for your account. Please contact support.", 403);
    }

    if (user.balance < reinvestAmount) {
      throw new AppError(`Insufficient wallet balance to reinvest $${reinvestAmount}. Please deposit funds or adjust balance.`, 400);
    }

    // Deduct from balance to fund the new reinvestment
    user.balance -= reinvestAmount;
    if (!user.escrow) {
      user.escrow = { pendingWithdrawal: 0, pendingDeposit: 0, pendingInvestment: 0, eligibleReinvestAmount: 0 };
    }
    user.escrow.pendingInvestment = (user.escrow.pendingInvestment || 0) + reinvestAmount;
    user.escrow.eligibleReinvestAmount = Math.max(0, (user.escrow.eligibleReinvestAmount || 0) - reinvestAmount);

    // Mark original completed transaction as reinvested to prevent double actions
    original.status = "reinvested";
    await Promise.all([original.save({ session }), user.save({ session })]);

    const tx = await Transaction.create(
      [
        {
          user: userId,
          type: "reinvestment",
          amount: reinvestAmount,
          status: "pending",
          reference: generateReference(),
          planId: plan._id,
          planSnapshot: {
            name: plan.name,
            roiPercent: plan.roiPercent,
            durationDays: plan.durationDays,
            minAmount: plan.minAmount,
            maxAmount: plan.maxAmount,
          },
          isReinvestment: true,
          reinvestedAmount: reinvestAmount,
          meta: { originalTransactionId: original._id },
        },
      ],
      { session }
    );

    await session.commitTransaction();

    await sendSystemMessage(
      userId,
      "Reinvestment Submitted",
      `Your reinvestment of $${reinvestAmount.toFixed(2)} into ${plan.name} has been initiated and is pending activation.`,
      "Transaction",
      tx[0]._id.toString()
    ).catch((e) => console.error("System message failed:", e));

    return tx[0];
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
};

// ─── Top-Up on Active Investment (Trader or Admin) ───────────────────────────

export const topUpInvestment = async (
  userId: string,
  transactionId: string,
  topUpAmount: number,
  options?: { byAdmin?: boolean; adminId?: string; deductBalance?: boolean }
) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    if (isNaN(topUpAmount) || topUpAmount <= 0) {
      throw new AppError("Top-up amount must be a positive number", 400);
    }

    const tx = await Transaction.findOne({
      _id: transactionId,
      user: userId,
      type: { $in: ["investment", "reinvestment"] },
      status: "approved",
    }).session(session);

    if (!tx) throw new AppError("Active investment contract not found", 404);

    const user = await User.findById(userId).session(session);
    if (!user) throw new AppError("User not found", 404);

    const deductBalance = options?.deductBalance !== false;
    if (deductBalance && user.balance < topUpAmount) {
      throw new AppError(`Insufficient wallet balance for top-up of $${topUpAmount}`, 400);
    }

    if (deductBalance) {
      user.balance -= topUpAmount;
    }
    user.investedBalance += topUpAmount;
    user.totalInvested += topUpAmount;

    const previousAmount = tx.amount;
    const newAmount = previousAmount + topUpAmount;
    tx.amount = newAmount;

    if (!tx.meta) tx.meta = {};
    const meta = tx.meta as Record<string, any>;
    if (!meta.topUpLogs) meta.topUpLogs = [];

    const durationDays = tx.planSnapshot?.durationDays ?? 30;
    const daysProcessed = meta.daysProcessed || 0;
    const remainingDays = Math.max(1, durationDays - daysProcessed);

    meta.topUpLogs.push({
      amount: topUpAmount,
      date: new Date(),
      dayAtTopUp: daysProcessed,
      remainingDays,
      previousAmount,
      newTotalAmount: newAmount,
      by: options?.byAdmin ? `Admin (${options.adminId || "Admin"})` : "Trader",
    });

    tx.markModified("meta");

    await Promise.all([user.save({ session }), tx.save({ session })]);
    await session.commitTransaction();

    const clientUrl = process.env.CLIENT_URL || "https://alphariseglobal.com";
    const dailyRoi = tx.planSnapshot?.roiPercent ?? 0;
    const newDailyYield = (newAmount * (dailyRoi / 100)).toFixed(2);

    await sendEmail(
      user.email,
      `Investment Top-Up Processed — ${tx.planSnapshot?.name ?? "Plan"}`,
      investmentTopUpEmail(
        user.username,
        tx.planSnapshot?.name ?? "Investment Plan",
        `$${topUpAmount.toFixed(2)}`,
        `$${newAmount.toFixed(2)}`,
        remainingDays,
        `+$${newDailyYield}/day (${dailyRoi}% Daily)`,
        `${clientUrl}/trader/investments`
      )
    ).catch((e) => console.error("Top-up email failed:", e));

    await sendSystemMessage(
      userId,
      "Investment Top-Up Successful ✓",
      `A top-up of $${topUpAmount.toFixed(2)} has been added to your active ${tx.planSnapshot?.name ?? "investment"} contract. New active capital: $${newAmount.toFixed(2)}. Daily profit has been recalculated for the remaining ${remainingDays} days.`,
      "Transaction",
      tx._id.toString()
    ).catch((e) => console.error("Top-up system message failed:", e));

    return tx;
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
};

// ─── Admin Create Investment on Behalf of Client ─────────────────────────────

export const adminCreateInvestment = async (
  adminId: string,
  userId: string,
  planId: string,
  amount: number,
  options?: { fundSource?: "user_balance" | "direct_credit" }
) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    if (isNaN(amount) || amount <= 0) {
      throw new AppError("Investment amount must be a positive number", 400);
    }

    const user = await User.findById(userId).session(session);
    const plan = await InvestmentPlan.findById(planId).session(session);

    if (!user) throw new AppError("Client not found", 404);
    if (!plan || !plan.isActive) throw new AppError("Investment plan not found or inactive", 404);

    const fundSource = options?.fundSource || "user_balance";
    if (fundSource === "user_balance") {
      if (user.balance < amount) {
        throw new AppError(`Client balance of $${user.balance} is insufficient for $${amount} investment`, 400);
      }
      user.balance -= amount;
    } else {
      // Direct funding: increase total deposited to record client capitalization
      user.totalDeposited += amount;
    }

    user.investedBalance += amount;
    user.totalInvested += amount;

    const durationDays = plan.durationDays;
    const expiresAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);

    const tx = await Transaction.create(
      [
        {
          user: userId,
          type: "investment",
          amount,
          status: "approved",
          reference: generateReference(),
          planId: plan._id,
          planSnapshot: {
            name: plan.name,
            roiPercent: plan.roiPercent,
            durationDays: plan.durationDays,
            minAmount: plan.minAmount,
            maxAmount: plan.maxAmount,
          },
          isReinvestment: false,
          expiresAt,
          reviewedBy: new mongoose.Types.ObjectId(adminId),
          reviewedAt: new Date(),
          meta: {
            createdCreatedByAdmin: true,
            adminId,
            cycleStartAt: new Date(),
            profitLogs: [],
            daysProcessed: 0,
            lastProfitDropAt: null,
          },
        },
      ],
      { session }
    );

    await Promise.all([user.save({ session }), tx[0].save({ session })]);
    await session.commitTransaction();

    const clientUrl = process.env.CLIENT_URL || "https://alphariseglobal.com";
    const maturityDate = expiresAt.toDateString();
    const totalEarnings = ((amount * (plan.roiPercent / 100) * durationDays)).toFixed(2);

    await sendEmail(
      user.email,
      "Investment Activated",
      investmentStartedEmail(
        user.username,
        plan.name,
        `$${amount.toFixed(2)}`,
        `${plan.roiPercent}% Daily ($${totalEarnings} Total ROI)`,
        durationDays,
        maturityDate,
        `${clientUrl}/trader/investments`
      )
    ).catch((e) => console.error("Admin created investment activation email failed:", e));

    await sendSystemMessage(
      userId,
      "Investment Activated by Manager ✓",
      `A new investment of $${amount.toFixed(2)} into ${plan.name} has been activated for your account. Daily profits of ${plan.roiPercent}% will drop every 24 hours.`,
      "Transaction",
      tx[0]._id.toString()
    ).catch((e) => console.error("System message failed:", e));

    return tx[0];
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
};

// ─── Admin Cancel Ongoing Investment (Returns Balance) ───────────────────────

export const adminCancelInvestment = async (adminId: string, transactionId: string, reason?: string) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const tx = await Transaction.findOne({
      _id: transactionId,
      type: { $in: ["investment", "reinvestment"] },
      status: { $in: ["pending", "approved"] },
    }).session(session);

    if (!tx) throw new AppError("Active or pending investment not found", 404);

    const user = await User.findById(tx.user).session(session);
    if (!user) throw new AppError("Client not found", 404);

    if (tx.status === "approved") {
      user.investedBalance = Math.max(0, user.investedBalance - tx.amount);
    } else if (tx.status === "pending" && user.escrow?.pendingInvestment) {
      user.escrow.pendingInvestment = Math.max(0, user.escrow.pendingInvestment - tx.amount);
    }

    // Return principal directly to user available balance
    user.balance += tx.amount;
    tx.status = "cancelled";
    tx.reviewedBy = new mongoose.Types.ObjectId(adminId);
    tx.reviewedAt = new Date();
    tx.rejectionReason = reason || "Cancelled by administrator";

    if (!tx.meta) tx.meta = {};
    (tx.meta as Record<string, any>).cancelledAt = new Date();
    (tx.meta as Record<string, any>).cancelledBy = adminId;
    (tx.meta as Record<string, any>).cancellationReason = reason || "Cancelled by administrator";
    tx.markModified("meta");

    await Promise.all([user.save({ session }), tx.save({ session })]);
    await session.commitTransaction();

    const clientUrl = process.env.CLIENT_URL || "https://alphariseglobal.com";

    await sendEmail(
      user.email,
      "Investment Cancelled — Principal Refunded",
      investmentCancelledEmail(
        user.username,
        tx.planSnapshot?.name ?? "Investment Plan",
        `$${tx.amount.toFixed(2)}`,
        reason || "Cancelled by administrator",
        `${clientUrl}/trader/dashboard`
      )
    ).catch((e) => console.error("Cancellation email failed:", e));

    await sendSystemMessage(
      user._id.toString(),
      "Investment Cancelled — Balance Refunded",
      `Your investment in ${tx.planSnapshot?.name ?? "Plan"} ($${tx.amount.toFixed(2)}) was cancelled by administration. Your principal capital has been refunded to your wallet balance. Reason: ${reason || "Administrative review"}`,
      "Transaction",
      tx._id.toString()
    ).catch((e) => console.error("System message failed:", e));

    return tx;
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
};

// ─── Client Forfeit Ongoing Trade ───────────────────────────────────────────

export const clientForfeitInvestment = async (userId: string, transactionId: string, reason?: string) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const tx = await Transaction.findOne({
      _id: transactionId,
      user: userId,
      type: { $in: ["investment", "reinvestment"] },
      status: "approved",
    }).session(session);

    if (!tx) throw new AppError("Active ongoing investment not found", 404);

    const user = await User.findById(userId).session(session);
    if (!user) throw new AppError("User not found", 404);

    // Return principal back to balance
    user.investedBalance = Math.max(0, user.investedBalance - tx.amount);
    user.balance += tx.amount;

    tx.status = "forfeited";
    if (!tx.meta) tx.meta = {};
    (tx.meta as Record<string, any>).forfeitedAt = new Date();
    (tx.meta as Record<string, any>).forfeitReason = reason || "Voluntarily forfeited by client";
    tx.markModified("meta");

    await Promise.all([user.save({ session }), tx.save({ session })]);
    await session.commitTransaction();

    const clientUrl = process.env.CLIENT_URL || "https://alphariseglobal.com";

    await sendEmail(
      user.email,
      "Investment Forfeited — Principal Returned",
      investmentForfeitedEmail(
        user.username,
        tx.planSnapshot?.name ?? "Investment Plan",
        `$${tx.amount.toFixed(2)}`,
        `${clientUrl}/trader/investments`
      )
    ).catch((e) => console.error("Forfeit email failed:", e));

    await sendSystemMessage(
      userId,
      "Investment Trade Forfeited",
      `You have forfeited your active trade in ${tx.planSnapshot?.name ?? "Plan"}. Your principal of $${tx.amount.toFixed(2)} has been returned to your available balance.`,
      "Transaction",
      tx._id.toString()
    ).catch((e) => console.error("System message failed:", e));

    return tx;
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
};

// ─── Mature Investment (Immediate Balance Return + 48hr Reinvest Escrow) ────

export const matureInvestment = async (transactionId: string) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const tx = await Transaction.findOne({
      _id: transactionId,
      type: { $in: ["investment", "reinvestment"] },
      status: "approved",
    }).session(session);

    if (!tx) {
      await session.abortTransaction();
      session.endSession();
      return null;
    }

    const user = await User.findById(tx.user).session(session);
    if (!user) {
      await session.abortTransaction();
      session.endSession();
      return null;
    }

    const dailyRoiPercent = tx.planSnapshot?.roiPercent ?? 0;
    const durationDays = tx.planSnapshot?.durationDays ?? 30;
    const totalROI = Number((tx.amount * (dailyRoiPercent / 100) * durationDays).toFixed(2));

    const meta = (tx.meta || {}) as Record<string, any>;
    const distributedDailyROI = (meta?.profitLogs || [])
      .filter((l: any) => l.note?.startsWith("Daily yield distribution"))
      .reduce((sum: number, l: any) => sum + (Number(l.amount) || 0), 0);

    const remainingROI = Math.max(0, totalROI - distributedDailyROI);
    const earnings = totalROI;

    // Credit lifetime earnings
    if (remainingROI > 0) {
      user.totalEarnings += remainingROI;
    }

    // ── RETURN BOTH PRINCIPAL AND PROFIT DIRECTLY TO USER MAIN BALANCE ──
    user.investedBalance = Math.max(0, user.investedBalance - tx.amount);
    user.balance += (tx.amount + remainingROI);

    const reinvestExpiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);
    const allowReinvest = user.canReinvest !== false;

    // Set escrow reinvestment eligibility for 48 hours only if reinvestment is enabled
    if (!user.escrow) {
      user.escrow = { pendingWithdrawal: 0, pendingDeposit: 0, pendingInvestment: 0, eligibleReinvestAmount: 0 };
    }
    user.escrow.eligibleReinvestAmount = allowReinvest ? tx.amount : 0;
    user.escrow.reinvestExpiresAt = allowReinvest ? reinvestExpiresAt : undefined;

    tx.status = "completed";
    
    if (!tx.meta) tx.meta = {};
    (tx.meta as Record<string, any>).completedAt = new Date();
    (tx.meta as Record<string, any>).payoutAmount = tx.amount + totalROI;
    (tx.meta as Record<string, any>).principalReturned = tx.amount;
    (tx.meta as Record<string, any>).profitReturned = totalROI;
    (tx.meta as Record<string, any>).eligibleReinvestAmount = allowReinvest ? tx.amount : 0;
    (tx.meta as Record<string, any>).reinvestExpiresAt = allowReinvest ? reinvestExpiresAt : undefined;
    tx.markModified("meta");

    await Promise.all([user.save({ session }), tx.save({ session })]);
    await session.commitTransaction();

    const clientUrl = process.env.CLIENT_URL || "https://alphariseglobal.com";

    // ── Email: Trade Completed, Principal & Profits Returned ──
    await sendEmail(
      user.email,
      `Investment Completed & Credited — ${tx.planSnapshot?.name ?? "Plan"}`,
      investmentPlanExpiredEmail(
        user.username,
        tx.planSnapshot?.name ?? "Investment Plan",
        `$${tx.amount.toFixed(2)}`,
        `$${earnings.toFixed(2)}`,
        durationDays,
        `${clientUrl}/trader/investments`
      )
    ).catch((e) => console.error("[MatureJob] Completion email failed:", e));

    // ── In-App System Notification ──
    await sendSystemMessage(
      user._id.toString(),
      `Trade Completed — Funds Credited 🎉`,
      `Your investment in ${tx.planSnapshot?.name ?? "Plan"} has concluded! Your principal ($${tx.amount.toFixed(2)}) and total profit ($${earnings.toFixed(2)}) have been credited directly to your balance. You have 48 hours to reinvest your previous trading amount ($${tx.amount.toFixed(2)}) if desired.`,
      "Transaction",
      tx._id.toString()
    ).catch((e) => console.error("[MatureJob] In-app message failed:", e));

    return { tx, earnings, totalReturn: tx.amount + earnings };
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
};

// ─── Clean Expired Escrows (48hr Cleanup — called by scheduler) ──────────────

export const cleanExpiredEscrows = async () => {
  const now = new Date();

  // 1. Clear expired eligible reinvestment escrow on users past 48 hours
  const expiredUsers = await User.find({
    "escrow.reinvestExpiresAt": { $lte: now },
    "escrow.eligibleReinvestAmount": { $gt: 0 },
  });

  for (const u of expiredUsers) {
    u.escrow.eligibleReinvestAmount = 0;
    u.escrow.reinvestExpiresAt = undefined;
    await u.save();
    console.log(`[EscrowCleanup] Cleared expired reinvestment eligibility for user ${u.username}`);
  }

  // 2. Decline/cancel any pending reinvestments that sat past 48 hours without approval
  const stalePendingReinvestments = await Transaction.find({
    type: "reinvestment",
    status: "pending",
    createdAt: { $lte: new Date(Date.now() - 48 * 60 * 60 * 1000) },
  });

  for (const tx of stalePendingReinvestments) {
    const user = await User.findById(tx.user);
    if (user) {
      user.balance += tx.amount;
      if (user.escrow?.pendingInvestment) {
        user.escrow.pendingInvestment = Math.max(0, user.escrow.pendingInvestment - tx.amount);
      }
      tx.status = "rejected";
      tx.rejectionReason = "48-hour reinvestment approval window expired";
      if (!tx.meta) tx.meta = {};
      (tx.meta as Record<string, any>).expiredAt = new Date();
      tx.markModified("meta");
      await Promise.all([user.save(), tx.save()]);

      await sendSystemMessage(
        String(user._id),
        "Pending Reinvestment Expired",
        `Your pending reinvestment request of $${tx.amount.toFixed(2)} was cancelled due to expiration. The amount remains available in your balance.`,
        "Transaction",
        tx._id.toString()
      ).catch((e) => console.error("System message error:", e));
    }
  }
};

// ─── Distribute Daily Profits (called by Cron Job) ───────────────────────────

export const distributeDailyProfits = async () => {
  const activeTxs = await Transaction.find({
    type: { $in: ["investment", "reinvestment"] },
    status: "approved",
  });

  const now = Date.now();

  for (const tx of activeTxs) {
    const session = await mongoose.startSession();
    session.startTransaction();
    let shouldComplete = false;
    try {
      if (!tx.meta) tx.meta = {};
      const meta = tx.meta as Record<string, any>;
      const cycleStart = new Date(meta.cycleStartAt || tx.reviewedAt || tx.createdAt).getTime();
      const durationDays = tx.planSnapshot?.durationDays ?? 30;
      const currentDaysProcessed = meta.daysProcessed || 0;

      // Check if all cycle days have already completed
      if (currentDaysProcessed >= durationDays) {
        await session.abortTransaction();
        session.endSession();
        continue;
      }

      // Next profit drop target is strictly 24 hours after previous cycle step
      const nextDropTargetTime = cycleStart + (currentDaysProcessed + 1) * 24 * 60 * 60 * 1000;

      // Do not process unless full 24-hour cycle has elapsed
      if (now < nextDropTargetTime) {
        await session.abortTransaction();
        session.endSession();
        continue;
      }

      const user = await User.findById(tx.user).session(session);
      if (!user) {
        await session.abortTransaction();
        session.endSession();
        continue;
      }

      const dailyRoiPercent = tx.planSnapshot?.roiPercent ?? 0;
      // Exact Daily Profit based on current invested capital
      const dailyProfit = Number((tx.amount * (dailyRoiPercent / 100)).toFixed(2));

      // Credit daily profit into user's total earnings
      user.totalEarnings += dailyProfit;

      if (!meta.profitLogs) meta.profitLogs = [];
      const newDayIndex = currentDaysProcessed + 1;
      meta.profitLogs.push({
        day: newDayIndex,
        amount: dailyProfit,
        date: new Date(),
        note: `Daily yield distribution (Day ${newDayIndex}/${durationDays})`,
      });

      meta.daysProcessed = newDayIndex;
      meta.lastProfitDropAt = new Date();
      tx.markModified("meta");

      await Promise.all([user.save({ session }), tx.save({ session })]);
      await session.commitTransaction();

      console.log(`[DailyProfitJob] Disbursed Day ${newDayIndex}/${durationDays} profit $${dailyProfit} to ${user.username} for tx ${tx._id}`);

      // If this was the last day of the cycle, trigger trade completion
      if (newDayIndex >= durationDays) {
        shouldComplete = true;
      }
    } catch (err) {
      await session.abortTransaction();
      console.error(`[DailyProfitJob] Error processing transaction ${tx._id}:`, err);
    } finally {
      session.endSession();
    }

    // Trigger completion & instant principal + profit return
    if (shouldComplete) {
      try {
        await matureInvestment(tx._id.toString());
      } catch (matErr) {
        console.error(`[DailyProfitJob] Error completing transaction ${tx._id}:`, matErr);
      }
    }
  }
};

// ─── Approve Investment (called by Executor) ──────────────────────────────────

export const approveInvestment = async (transactionId: string, executorId: string) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const tx = await Transaction.findOne({
      _id: transactionId,
      type: { $in: ["investment", "reinvestment"] },
      status: "pending",
    }).session(session);

    if (!tx) throw new AppError("Pending investment transaction not found", 404);

    const user = await User.findById(tx.user).session(session);
    if (!user) throw new AppError("User not found", 404);

    const plan = await InvestmentPlan.findById(tx.planId).session(session);
    if (!plan) throw new AppError("Plan not found", 404);

    const durationDays = tx.planSnapshot?.durationDays ?? plan.durationDays;
    const expiresAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);

    // Update balances and release from pending escrow
    if (!user.escrow) {
      user.escrow = { pendingWithdrawal: 0, pendingDeposit: 0, pendingInvestment: 0, eligibleReinvestAmount: 0 };
    }
    user.escrow.pendingInvestment = Math.max(0, (user.escrow.pendingInvestment || 0) - tx.amount);
    user.investedBalance += tx.amount;
    user.totalInvested += tx.amount;

    tx.status = "approved";
    tx.expiresAt = expiresAt;
    tx.reviewedBy = new mongoose.Types.ObjectId(executorId);
    tx.reviewedAt = new Date();
    
    if (!tx.meta) tx.meta = {};
    const meta = tx.meta as Record<string, any>;
    meta.cycleStartAt = new Date();
    meta.profitLogs = [];
    meta.daysProcessed = 0;
    meta.lastProfitDropAt = null;
    tx.markModified("meta");

    await Promise.all([user.save({ session }), tx.save({ session })]);
    await session.commitTransaction();

    const clientUrl = process.env.CLIENT_URL || "https://alphariseglobal.com";
    const maturityDate = expiresAt.toDateString();
    const dailyRoi = tx.planSnapshot?.roiPercent ?? plan.roiPercent;
    const totalEarnings = ((tx.amount * (dailyRoi / 100) * durationDays)).toFixed(2);

    if (tx.type === "reinvestment") {
      await sendEmail(
        user.email,
        `Reinvestment Activated — ${tx.planSnapshot?.name ?? plan.name}`,
        reinvestmentConfirmedEmail(
          user.username,
          tx.planSnapshot?.name ?? plan.name,
          `$${tx.amount.toFixed(2)}`,
          `${dailyRoi}% Daily ($${totalEarnings} Total ROI)`,
          durationDays,
          maturityDate,
          `${clientUrl}/trader/investments`
        )
      ).catch((e) => console.error("Reinvestment confirmation email failed:", e));

      await sendSystemMessage(
        user._id.toString(),
        "Reinvestment Activated ✓",
        `Your reinvestment of $${tx.amount.toFixed(2)} into ${tx.planSnapshot?.name ?? plan.name} is now active and compounding daily yield.`,
        "Transaction",
        tx._id.toString()
      ).catch((e) => console.error("System message failed:", e));
    } else {
      await sendEmail(
        user.email,
        "Investment Activated",
        investmentStartedEmail(
          user.username,
          tx.planSnapshot?.name ?? plan.name,
          `$${tx.amount.toFixed(2)}`,
          `${dailyRoi}% Daily ($${totalEarnings} Total ROI)`,
          durationDays,
          maturityDate,
          `${clientUrl}/trader/investments`
        )
      ).catch((e) => console.error("Activation email failed to send", e));

      await sendSystemMessage(
        user._id.toString(),
        "Investment Activated ✓",
        `Your investment of $${tx.amount.toFixed(2)} into ${tx.planSnapshot?.name ?? plan.name} is now active and compounding daily yield.`,
        "Transaction",
        tx._id.toString()
      ).catch((e) => console.error("System message failed:", e));
    }

    return tx;
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
};

// ─── Reject Investment (called by Executor) ──────────────────────────────────

export const rejectInvestment = async (transactionId: string, executorId: string, reason?: string) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const tx = await Transaction.findOne({
      _id: transactionId,
      type: { $in: ["investment", "reinvestment"] },
      status: "pending",
    }).session(session);

    if (!tx) throw new AppError("Pending investment transaction not found", 404);

    const user = await User.findById(tx.user).session(session);
    if (!user) throw new AppError("User not found", 404);

    // Refund principal to available balance and clear from pending escrow
    user.balance += tx.amount;
    if (user.escrow?.pendingInvestment) {
      user.escrow.pendingInvestment = Math.max(0, user.escrow.pendingInvestment - tx.amount);
    }

    tx.status = "rejected";
    tx.reviewedBy = new mongoose.Types.ObjectId(executorId);
    tx.reviewedAt = new Date();
    if (reason) tx.rejectionReason = reason;

    await Promise.all([user.save({ session }), tx.save({ session })]);
    await session.commitTransaction();

    await sendSystemMessage(
      user._id.toString(),
      "Investment Request Declined",
      `Your investment request of $${tx.amount.toFixed(2)} was declined. Reason: ${reason || "Not specified"}. The principal has been refunded to your wallet balance.`,
      "Transaction",
      tx._id.toString()
    ).catch((e) => console.error("System message failed:", e));

    return tx;
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
};

// ─── Upgrade Plan ─────────────────────────────────────────────────────────────

export const upgradePlan = async (userId: string, activeTransactionId: string, newPlanId: string) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const user = await User.findById(userId).session(session);
    const activeTx = await Transaction.findOne({ _id: activeTransactionId, user: userId, type: "investment", status: "approved" }).session(session);
    const newPlan = await InvestmentPlan.findById(newPlanId).session(session);

    if (!user) throw new AppError("User not found", 404);
    if (!activeTx) throw new AppError("Active investment not found", 404);
    if (!newPlan || !newPlan.isActive) throw new AppError("New plan not found or inactive", 404);

    const currentAmount = activeTx.amount;
    if (newPlan.minAmount > currentAmount && user.balance < newPlan.minAmount - currentAmount)
      throw new AppError("Insufficient balance to upgrade to this plan", 400);

    const topUp = Math.max(0, newPlan.minAmount - currentAmount);
    if (topUp > 0) {
      if (user.balance < topUp) throw new AppError("Insufficient balance for plan upgrade top-up", 400);
      user.balance -= topUp;
      user.investedBalance += topUp;
      user.totalInvested += topUp;
    }

    const newExpiresAt = new Date(Date.now() + newPlan.durationDays * 24 * 60 * 60 * 1000);
    activeTx.planId = newPlan._id as mongoose.Types.ObjectId;
    activeTx.planSnapshot = {
      name: newPlan.name,
      roiPercent: newPlan.roiPercent,
      durationDays: newPlan.durationDays,
      minAmount: newPlan.minAmount,
      maxAmount: newPlan.maxAmount,
    };
    activeTx.amount = currentAmount + topUp;
    activeTx.expiresAt = newExpiresAt;
    activeTx.meta = { ...activeTx.meta, upgradedAt: new Date(), previousPlan: activeTx.planSnapshot };

    await Promise.all([user.save({ session }), activeTx.save({ session })]);
    await session.commitTransaction();

    await sendSystemMessage(
      userId,
      "Investment Plan Upgraded",
      `Your investment plan has been upgraded to ${newPlan.name} with updated daily yield of ${newPlan.roiPercent}%.`,
      "Transaction",
      activeTx._id.toString()
    ).catch((e) => console.error("System message failed:", e));

    return activeTx;
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
};

// ─── Log Manual Profit (called by Executor) ──────────────────────────

export const logProfit = async (transactionId: string, amount: number, note?: string) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const tx = await Transaction.findOne({
      _id: transactionId,
      type: { $in: ["investment", "reinvestment"] },
      status: "approved",
    }).session(session);

    if (!tx) throw new AppError("Active investment transaction not found", 404);

    const user = await User.findById(tx.user).session(session);
    if (!user) throw new AppError("User not found", 404);

    user.balance += amount;
    user.totalEarnings += amount;

    if (!tx.meta) tx.meta = {};
    const meta = tx.meta as Record<string, any>;
    if (!meta.profitLogs) meta.profitLogs = [];
    
    meta.profitLogs.push({
      amount,
      date: new Date(),
      note: note || "Manual profit distribution",
    });

    tx.markModified("meta");

    await Promise.all([user.save({ session }), tx.save({ session })]);
    await session.commitTransaction();

    await sendSystemMessage(
      user._id.toString(),
      "Profit Credit Received",
      `A profit credit of $${amount.toFixed(2)} has been added to your account for your investment in ${tx.planSnapshot?.name || "Plan"}.`,
      "Transaction",
      tx._id.toString()
    ).catch((e) => console.error("System message failed:", e));

    return tx;
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
};

// ─── Update Investment Status (called by Executor) ───────────────────

export const updateInvestmentStatus = async (
  transactionId: string,
  status: "pending" | "approved" | "rejected" | "completed" | "cancelled" | "forfeited",
  reason?: string
) => {
  if (status === "completed") {
    return matureInvestment(transactionId);
  } else if (status === "cancelled" || status === "rejected") {
    return adminCancelInvestment("Admin", transactionId, reason);
  }

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const tx = await Transaction.findOne({
      _id: transactionId,
      type: { $in: ["investment", "reinvestment"] },
    }).session(session);

    if (!tx) throw new AppError("Investment transaction not found", 404);

    tx.status = status as any;
    if (reason) tx.rejectionReason = reason;

    await tx.save({ session });
    await session.commitTransaction();
    return tx;
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
};
