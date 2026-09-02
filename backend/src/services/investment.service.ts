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
  investmentFundsAvailableEmail,
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
      throw new AppError(`Amount must be between ${plan.minAmount} and ${plan.maxAmount}`, 400);
    if (user.balance < amount) throw new AppError("Insufficient balance", 400);

    // Deduct available balance to lock funds
    user.balance -= amount;
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
      `Your investment request of $${amount.toFixed(2)} into the ${plan.name} plan has been received and is pending activation.`,
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

// ─── Reinvest (only original invested amount, not earnings) ──────────────────

export const reinvest = async (userId: string, transactionId: string) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const original = await Transaction.findOne({
      _id: transactionId,
      user: userId,
      type: { $in: ["investment", "reinvestment"] },
      status: "matured",
    }).session(session);

    if (!original) throw new AppError("Matured investment transaction not found", 404);

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

    const reinvestAmount = original.amount; // only principal, not earnings
    const user = await User.findById(userId).session(session);
    if (!user) throw new AppError("User not found", 404);

    // Mark original matured transaction as reinvested to prevent double actions
    original.status = "reinvested";
    // Deduct original principal from invested balance so when new reinvestment is approved, it credits back
    user.investedBalance = Math.max(0, user.investedBalance - reinvestAmount);
    await Promise.all([original.save({ session }), user.save({ session })]);

    const earnings = (user.totalEarnings > 0)
      ? (original.amount * (original.planSnapshot?.roiPercent ?? 0)) / 100
      : 0;

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
          earningsAtReinvest: earnings,
          meta: {},
        },
      ],
      { session }
    );

    await session.commitTransaction();

    await sendSystemMessage(
      userId,
      "Reinvestment Submitted",
      `Your reinvestment of $${reinvestAmount.toFixed(2)} into the ${plan.name} plan has been initiated and is pending activation.`,
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

// ─── Mature Investment (called by scheduler or after last profit drop) ─────────

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
    const totalReturn = tx.amount + totalROI;

    // Credit any remaining undistributed ROI to user's earnings
    if (remainingROI > 0) {
      user.totalEarnings += remainingROI;
    }
    
    tx.status = "matured";
    
    if (!tx.meta) tx.meta = {};
    (tx.meta as Record<string, any>).completedAt = new Date();
    (tx.meta as Record<string, any>).payoutAmount = tx.amount; // Principal to return after 48h
    (tx.meta as Record<string, any>).payoutReleaseAt = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 hours payout release window
    tx.markModified("meta");

    await Promise.all([user.save({ session }), tx.save({ session })]);
    await session.commitTransaction();

    const clientUrl = process.env.CLIENT_URL || "https://alphariseglobal.com";

    // ── Email 1: Plan Expiry / Final Profit Notification ──
    await sendEmail(
      user.email,
      `Investment Cycle Completed — ${tx.planSnapshot?.name ?? "Plan"}`,
      investmentPlanExpiredEmail(
        user.username,
        tx.planSnapshot?.name ?? "Investment Plan",
        `$${tx.amount.toFixed(2)}`,
        `$${earnings.toFixed(2)}`,
        durationDays,
        `${clientUrl}/trader/investments`
      )
    ).catch((e) => console.error("[MatureJob] Plan expiry email failed:", e));

    // ── In-App System Notification ──
    await sendSystemMessage(
      user._id.toString(),
      `Investment Plan Expired — ${tx.planSnapshot?.name ?? "Plan"}`,
      `Your investment plan ${tx.planSnapshot?.name ?? "Plan"} ($${tx.amount.toFixed(2)}) has completed its full cycle and final daily ROI was processed. You can reinvest within 48 hours to continue compounding, or your principal will automatically return to your available balance after 48 hours for withdrawal.`,
      "Transaction",
      tx._id.toString()
    ).catch((e) => console.error("[MatureJob] In-app message failed:", e));

    return { tx, earnings, totalReturn };
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
};

// ─── Expire Uninvested (48hr — called by scheduler) ──────────────────────────

export const expireUninvestedFunds = async () => {
  const expired = await Transaction.find({
    type: "investment",
    status: "approved",
    "meta.pendingExpiry": { $lte: new Date() },
    expiresAt: { $gt: new Date() }, // not yet matured
  });

  for (const tx of expired) {
    const user = await User.findById(tx.user);
    if (!user) continue;
    user.investedBalance = Math.max(0, user.investedBalance - tx.amount);
    user.balance += tx.amount;
    user.totalInvested = Math.max(0, user.totalInvested - tx.amount);
    tx.status = "rejected";
    tx.meta = { ...tx.meta, expiredAt: new Date(), reason: "48hr uninvested expiry" };
    await Promise.all([user.save(), tx.save()]);
  }
};

// ─── Process Matured Payout (48hr Release to Main Balance) ────────────────────

export const processMaturedPayout = async (transactionId: string) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const tx = await Transaction.findOne({ _id: transactionId, status: "matured" }).session(session);
    if (!tx) {
      await session.abortTransaction();
      session.endSession();
      return;
    }

    const user = await User.findById(tx.user).session(session);
    if (!user) {
      await session.abortTransaction();
      session.endSession();
      return;
    }

    const payoutAmount = (tx.meta as Record<string, any>)?.payoutAmount || tx.amount;

    // After 48 hours without reinvestment, deduct from invested balance and return full principal to main balance
    user.investedBalance = Math.max(0, user.investedBalance - tx.amount);
    user.balance += payoutAmount;
    tx.status = "completed";
    
    if (!tx.meta) tx.meta = {};
    (tx.meta as Record<string, any>).paidOutAt = new Date();
    tx.markModified("meta");

    await Promise.all([user.save({ session }), tx.save({ session })]);
    await session.commitTransaction();

    const clientUrl = process.env.CLIENT_URL || "https://alphariseglobal.com";

    // ── Email 2: Principal Matured & Available for Withdrawal ──
    await sendEmail(
      user.email,
      "Investment Matured — Funds Available for Withdrawal",
      investmentFundsAvailableEmail(
        user.username,
        tx.planSnapshot?.name ?? "Investment Plan",
        `$${payoutAmount.toFixed(2)}`,
        `${clientUrl}/trader/withdrawal`
      )
    ).catch((e) => console.error("[PayoutJob] Funds available email failed:", e));

    // ── In-App System Notification ──
    await sendSystemMessage(
      user._id.toString(),
      `Investment Principal Released — ${tx.planSnapshot?.name ?? "Plan"}`,
      `Your investment in ${tx.planSnapshot?.name ?? "Plan"} has completed its 48-hour settlement window. Your principal capital of $${payoutAmount.toFixed(2)} is now credited to your available balance and ready for withdrawal.`,
      "Transaction",
      tx._id.toString()
    ).catch((e) => console.error("[PayoutJob] In-app message failed:", e));

    console.log(`[PayoutJob] Paid out matured investment ${tx._id} to user ${user.username}: $${payoutAmount}`);
  } catch (err) {
    await session.abortTransaction();
    console.error(`[PayoutJob] Error processing matured payout for ${transactionId}:`, err);
  } finally {
    session.endSession();
  }
};

// ─── Reconcile Matured Investments (Startup self-healing) ─────────────

export const reconcileMaturedInvestments = async () => {
  try {
    const activeMatured = await Transaction.find({
      type: { $in: ["investment", "reinvestment"] },
      status: "matured",
      "meta.payoutReleaseAt": { $gt: new Date() },
    });

    for (const tx of activeMatured) {
      const meta = tx.meta as Record<string, any>;
      if (!meta?.balanceRestoredToInvested) {
        const user = await User.findById(tx.user);
        if (user) {
          user.investedBalance += tx.amount;
          if (!tx.meta) tx.meta = {};
          (tx.meta as Record<string, any>).balanceRestoredToInvested = true;
          tx.markModified("meta");
          await Promise.all([user.save(), tx.save()]);
          console.log(`[Reconciliation] Restored $${tx.amount} to investedBalance for user ${user.username}`);
        }
      }
    }
  } catch (err) {
    console.error("[Reconciliation] Error reconciling matured investments:", err);
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
  status: "pending" | "approved" | "rejected" | "completed",
  reason?: string
) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const tx = await Transaction.findOne({
      _id: transactionId,
      type: { $in: ["investment", "reinvestment"] },
    }).session(session);

    if (!tx) throw new AppError("Investment transaction not found", 404);

    const user = await User.findById(tx.user).session(session);
    if (!user) throw new AppError("User not found", 404);

    const oldStatus = tx.status;
    if (oldStatus === status) {
      await session.abortTransaction();
      return tx;
    }

    if (status === "completed" && oldStatus === "approved") {
      // Maturation logic: principal + earnings (deducting already distributed daily profits)
      const roiPercent = tx.planSnapshot?.roiPercent ?? 0;
      const totalROI = (tx.amount * roiPercent) / 100;
      
      const meta = tx.meta as Record<string, any>;
      const distributedDailyROI = (meta?.profitLogs || [])
        .filter((l: any) => l.note?.startsWith("Daily yield distribution"))
        .reduce((sum: number, l: any) => sum + l.amount, 0);

      const remainingROI = Math.max(0, totalROI - distributedDailyROI);
      const totalReturn = tx.amount + remainingROI;

      user.investedBalance = Math.max(0, user.investedBalance - tx.amount);
      user.balance += totalReturn;
      user.totalEarnings += remainingROI;
      tx.status = "completed";
      
      if (!tx.meta) tx.meta = {};
      (tx.meta as Record<string, any>).completedAt = new Date();
      tx.markModified("meta");
    } else if (status === "rejected" && (oldStatus === "pending" || oldStatus === "approved")) {
      // Cancel logic: return principal to user
      user.investedBalance = Math.max(0, user.investedBalance - tx.amount);
      user.balance += tx.amount;
      tx.status = "rejected";
      if (reason) tx.rejectionReason = reason;
    } else if (status === "approved" && oldStatus === "pending") {
      tx.status = "approved";
      const durationDays = tx.planSnapshot?.durationDays ?? 30;
      tx.expiresAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);
    } else {
      tx.status = status;
    }

    await Promise.all([user.save({ session }), tx.save({ session })]);
    await session.commitTransaction();
    return tx;
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
};

// ─── Approve Investment (called by Executor) ──────────────────────────

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

    // Update balances
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
      // ── Reinvestment Confirmation Email ──
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

      // ── In-App System Notification ──
      await sendSystemMessage(
        user._id.toString(),
        "Reinvestment Activated ✓",
        `Your reinvestment of $${tx.amount.toFixed(2)} into ${tx.planSnapshot?.name ?? plan.name} is now active and compounding daily yield.`,
        "Transaction",
        tx._id.toString()
      ).catch((e) => console.error("System message failed:", e));
    } else {
      // ── Investment Activation Email ──
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

      // ── In-App System Notification ──
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

// ─── Reject Investment (called by Executor) ──────────────────────────

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

    // Refund principal to available balance
    user.balance += tx.amount;

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

// ─── Distribute Daily Profits (called by Cron Job) ───────────────────

export const distributeDailyProfits = async () => {
  const activeTxs = await Transaction.find({
    type: { $in: ["investment", "reinvestment"] },
    status: "approved",
  });

  const now = Date.now();

  for (const tx of activeTxs) {
    const session = await mongoose.startSession();
    session.startTransaction();
    let shouldMature = false;
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
      // Exact Daily Profit = amount * (dailyRoiPercent / 100)
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

      // If this was the last day of the cycle, schedule immediate maturation
      if (newDayIndex >= durationDays) {
        shouldMature = true;
      }
    } catch (err) {
      await session.abortTransaction();
      console.error(`[DailyProfitJob] Error processing transaction ${tx._id}:`, err);
    } finally {
      session.endSession();
    }

    // Trigger maturation outside the session to send plan expiry email
    if (shouldMature) {
      try {
        await matureInvestment(tx._id.toString());
      } catch (matErr) {
        console.error(`[DailyProfitJob] Error maturing transaction ${tx._id}:`, matErr);
      }
    }
  }
};
