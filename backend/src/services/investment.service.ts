import mongoose from "mongoose";
import { User } from "../models/user.model";
import { InvestmentPlan } from "../models/investmentPlan.model";
import { Transaction } from "../models/transaction.model";
import { AppError } from "../utils/AppError";
import { generateReference } from "../utils/tokens";
import { sendEmail } from "./email.service";
import { investmentStartedEmail, investmentCompletedEmail } from "../emails";

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
    await original.save({ session });

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
    return activeTx;
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
};

// ─── Mature Investment (called by scheduler) ──────────────────────────────────

export const matureInvestment = async (transactionId: string) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const tx = await Transaction.findOne({
      _id: transactionId,
      type: { $in: ["investment", "reinvestment"] },
      status: "approved",
    }).session(session);

    if (!tx) throw new AppError("Investment transaction not found", 404);

    const user = await User.findById(tx.user).session(session);
    if (!user) throw new AppError("User not found", 404);

    const roiPercent = tx.planSnapshot?.roiPercent ?? 0;
    const totalROI = (tx.amount * roiPercent) / 100;

    const meta = tx.meta as Record<string, any>;
    const distributedDailyROI = (meta?.profitLogs || [])
      .filter((l: any) => l.note === "Daily yield distribution")
      .reduce((sum: number, l: any) => sum + l.amount, 0);

    const remainingROI = Math.max(0, totalROI - distributedDailyROI);
    const earnings = remainingROI;
    const totalReturn = tx.amount + remainingROI;

    // Deduct from invested balance immediately on maturity, locking it inside matured status
    user.investedBalance = Math.max(0, user.investedBalance - tx.amount);
    // Add remaining profit to totalEarnings, but do NOT add total return to available balance yet.
    user.totalEarnings += remainingROI;
    
    tx.status = "matured";
    
    if (!tx.meta) tx.meta = {};
    meta.completedAt = new Date();
    meta.payoutAmount = tx.amount + totalROI;
    meta.payoutReleaseAt = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 hours payout release window
    tx.markModified("meta");

    await Promise.all([user.save({ session }), tx.save({ session })]);
    await session.commitTransaction();

    await sendEmail(
      user.email,
      "Investment Matured",
      investmentCompletedEmail(
        user.username,
        tx.planSnapshot?.name ?? "Plan",
        `$${tx.amount}`,
        `$${earnings.toFixed(2)}`,
        `$${totalReturn.toFixed(2)}`,
        `${process.env.CLIENT_URL}/dashboard/investments`
      )
    );

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

    // Finally credit available balance after 48 hours without reinvestment
    user.balance += payoutAmount;
    tx.status = "completed";
    
    if (!tx.meta) tx.meta = {};
    (tx.meta as Record<string, any>).paidOutAt = new Date();
    tx.markModified("meta");

    await Promise.all([user.save({ session }), tx.save({ session })]);
    await session.commitTransaction();

    console.log(`[PayoutJob] Paid out matured investment ${tx._id} to user ${user.username}: $${payoutAmount}`);
  } catch (err) {
    await session.abortTransaction();
    console.error(`[PayoutJob] Error processing matured payout for ${transactionId}:`, err);
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
        .filter((l: any) => l.note === "Daily yield distribution")
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
    meta.profitLogs = [];
    meta.daysProcessed = 0;
    meta.lastProcessedDate = null;
    tx.markModified("meta");

    await Promise.all([user.save({ session }), tx.save({ session })]);
    await session.commitTransaction();

    // Send email notification
    const maturityDate = expiresAt.toDateString();
    const earnings = ((tx.amount * (tx.planSnapshot?.roiPercent ?? plan.roiPercent)) / 100).toFixed(2);
    await sendEmail(
      user.email,
      "Investment Activated",
      investmentStartedEmail(
        user.username,
        tx.planSnapshot?.name ?? plan.name,
        `$${tx.amount}`,
        `${tx.planSnapshot?.roiPercent ?? plan.roiPercent}% ($${earnings})`,
        durationDays,
        maturityDate,
        `${process.env.CLIENT_URL}/dashboard/investments`
      )
    ).catch(e => console.error("Activation email failed to send", e));

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
    expiresAt: { $gt: new Date() },
  });

  const todayStr = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

  for (const tx of activeTxs) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const meta = tx.meta as Record<string, any>;
      if (meta?.lastProcessedDate === todayStr) {
        await session.abortTransaction();
        session.endSession();
        continue; // already processed today
      }

      const user = await User.findById(tx.user).session(session);
      if (!user) {
        await session.abortTransaction();
        session.endSession();
        continue;
      }

      const roiPercent = tx.planSnapshot?.roiPercent ?? 0;
      const durationDays = tx.planSnapshot?.durationDays ?? 30;
      
      // Calculate daily share: (amount * ROI) / durationDays
      const dailyProfit = (tx.amount * (roiPercent / 100)) / durationDays;

      // Accumulate only in total earnings, not available balance immediately
      user.totalEarnings += dailyProfit;

      if (!meta.profitLogs) meta.profitLogs = [];
      meta.profitLogs.push({
        amount: dailyProfit,
        date: new Date(),
        note: "Daily yield distribution",
      });

      meta.lastProcessedDate = todayStr;
      meta.daysProcessed = (meta.daysProcessed || 0) + 1;
      tx.markModified("meta");

      await Promise.all([user.save({ session }), tx.save({ session })]);
      await session.commitTransaction();
    } catch (err) {
      await session.abortTransaction();
      console.error(`[DailyProfitJob] Error processing transaction ${tx._id}:`, err);
    } finally {
      session.endSession();
    }
  }
};
