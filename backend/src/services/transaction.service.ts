import mongoose from "mongoose";
import { User } from "../models/user.model";
import { Transaction } from "../models/transaction.model";
import { DepositMethod } from "../models/depositMethod.model";
import { WithdrawalMethod } from "../models/withdrawalMethod.model";
import { TraderProfile } from "../models/trader.profile.model";
import { AppError } from "../utils/AppError";
import { generateReference } from "../utils/tokens";
import { sendEmail } from "./email.service";
import { sendSystemMessage } from "./inAppMessage.service";
import {
  depositReceivedEmail,
  depositApprovedEmail,
  depositRejectedEmail,
  withdrawalRequestedEmail,
  withdrawalApprovedEmail,
  withdrawalRejectedEmail,
} from "../emails";

const DASHBOARD_URL = `${process.env.CLIENT_URL}/dashboard/transactions`;

// ─── Deposit ─────────────────────────────────────────────────────────────────

export const requestDeposit = async (userId: string, amount: number, methodId: string, proofUrl?: string) => {
  const [user, method] = await Promise.all([
    User.findById(userId),
    DepositMethod.findById(methodId),
  ]);
  if (!user) throw new AppError("User not found", 404);
  if (!method || !method.isActive) throw new AppError("Deposit method not found or inactive", 404);

  const tx = await Transaction.create({
    user: userId,
    type: "deposit",
    amount,
    status: "pending",
    reference: generateReference(),
    methodId: method._id,
    meta: { proofUrl: proofUrl ?? null, methodName: method.name, methodImage: method.image || "" },
  });

  await sendEmail(
    user.email,
    "Deposit Request Received",
    depositReceivedEmail(user.username, `$${amount}`, method.name, tx.reference, DASHBOARD_URL)
  );

  await sendSystemMessage(
    userId,
    "Deposit Request Submitted",
    `Your deposit request of $${amount} via ${method.name} has been submitted and is pending review.`,
    "Transaction",
    String(tx._id)
  ).catch((e) => console.error("Deposit request system notification failed", e));

  return tx;
};

export const approveDeposit = async (txId: string, executorId: string) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const tx = await Transaction.findOne({ _id: txId, type: "deposit", status: "pending" }).session(session);
    if (!tx) throw new AppError("Pending deposit not found", 404);

    const user = await User.findById(tx.user).session(session);
    if (!user) throw new AppError("User not found", 404);

    const methodName: string =
      ((tx.meta as Record<string, any>)?.methodName as string) ||
      (tx.methodId ? (await DepositMethod.findById(tx.methodId).session(session))?.name : undefined) ||
      "Deposit Method";

    user.balance += tx.amount;
    user.totalDeposited += tx.amount;
    tx.status = "approved";
    tx.reviewedBy = new mongoose.Types.ObjectId(executorId);
    tx.reviewedAt = new Date();

    // Check for 5% referral bonus
    let referrerUserToNotify: { id: string; username: string; bonusAmount: number } | null = null;
    const traderProfile = await TraderProfile.findOne({ user: user._id }).session(session);
    if (traderProfile?.referredBy) {
      const referrerUser = await User.findOne({
        $or: [{ username: traderProfile.referredBy }, { referralCode: traderProfile.referredBy }],
      }).session(session);

      if (referrerUser && String(referrerUser._id) !== String(user._id)) {
        const bonusAmount = Number((tx.amount * 0.05).toFixed(2));
        if (bonusAmount > 0) {
          referrerUser.bonus = (referrerUser.bonus || 0) + bonusAmount;
          referrerUser.balance += bonusAmount;
          await referrerUser.save({ session });

          const bonusRef = `BON-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
          await Transaction.create(
            [
              {
                user: referrerUser._id,
                type: "bonus",
                amount: bonusAmount,
                status: "approved",
                reference: bonusRef,
                isReinvestment: false,
                meta: {
                  referredUser: user.username,
                  referredUserId: user._id,
                  depositAmount: tx.amount,
                  depositTxId: tx._id,
                  commissionRate: "5%",
                },
              },
            ],
            { session }
          );

          referrerUserToNotify = {
            id: String(referrerUser._id),
            username: referrerUser.username,
            bonusAmount,
          };
        }
      }
    }

    await Promise.all([user.save({ session }), tx.save({ session })]);
    await session.commitTransaction();

    await sendEmail(
      user.email,
      "Deposit Successful",
      depositApprovedEmail(user.username, `$${tx.amount}`, methodName, tx.reference, `$${user.balance}`, DASHBOARD_URL)
    );

    await sendSystemMessage(
      String(tx.user),
      "Deposit Successful",
      `Your deposit of $${tx.amount} via ${methodName} was successful and added to your available balance.`,
      "Transaction",
      String(tx._id)
    ).catch((e) => console.error("Deposit system notification failed", e));

    if (referrerUserToNotify) {
      sendSystemMessage(
        referrerUserToNotify.id,
        "Referral Commission Earned! 🎉",
        `You received a $${referrerUserToNotify.bonusAmount} referral bonus (5% commission) from ${user.username}'s deposit of $${tx.amount}!`,
        "Transaction"
      ).catch((e) => console.error("Referral bonus system notification failed", e));
    }

    return tx;
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
};

export const rejectDeposit = async (txId: string, executorId: string, reason: string) => {
  const tx = await Transaction.findOne({ _id: txId, type: "deposit", status: "pending" });
  if (!tx) throw new AppError("Pending deposit not found", 404);

  const methodName: string =
    ((tx.meta as Record<string, any>)?.methodName as string) ||
    (tx.methodId ? (await DepositMethod.findById(tx.methodId))?.name : undefined) ||
    "Deposit Method";

  tx.status = "rejected";
  tx.reviewedBy = new mongoose.Types.ObjectId(executorId);
  tx.reviewedAt = new Date();
  tx.rejectionReason = reason;
  await tx.save();

  const user = await User.findById(tx.user);
  if (user) {
    await sendEmail(
      user.email,
      "Deposit Rejected",
      depositRejectedEmail(user.username, `$${tx.amount}`, methodName, tx.reference, reason, DASHBOARD_URL)
    );

    await sendSystemMessage(
      String(tx.user),
      "Deposit Rejected",
      `Your deposit request of $${tx.amount} via ${methodName} has been rejected. Reason: ${reason}`,
      "Transaction",
      String(tx._id)
    ).catch((e) => console.error("Deposit rejection system notification failed", e));
  }

  return tx;
};

// ─── Withdrawal ───────────────────────────────────────────────────────────────

export const requestWithdrawal = async (
  userId: string,
  amount: number,
  methodId: string,
  accountDetails?: Record<string, string>
) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const user = await User.findById(userId).session(session);
    const method = await WithdrawalMethod.findById(methodId).session(session);

    if (!user) throw new AppError("User not found", 404);
    if (!method || !method.isActive) throw new AppError("Withdrawal method not found or inactive", 404);
    if (amount < method.minAmount || amount > method.maxAmount)
      throw new AppError(`Amount must be between $${method.minAmount} and $${method.maxAmount}`, 400);
    if (user.balance < amount) throw new AppError("Insufficient balance", 400);

    // Debit immediately, hold in pendingWithdrawal
    user.balance -= amount;
    user.pendingWithdrawal += amount;
    await user.save({ session });

    const tx = await Transaction.create(
      [
        {
          user: userId,
          type: "withdrawal",
          amount,
          status: "pending",
          reference: generateReference(),
          methodId: method._id,
          meta: { methodName: method.name, methodImage: method.image || "", accountDetails: accountDetails ?? {} },
        },
      ],
      { session }
    );

    await session.commitTransaction();

    await sendEmail(
      user.email,
      "Withdrawal Request Submitted",
      withdrawalRequestedEmail(user.username, `$${amount}`, method.name, tx[0].reference, DASHBOARD_URL)
    );

    await sendSystemMessage(
      userId,
      "Withdrawal Request Submitted",
      `Your withdrawal request of $${amount} via ${method.name} has been submitted and is pending review.`,
      "Transaction",
      String(tx[0]._id)
    ).catch((e) => console.error("Withdrawal request system notification failed", e));

    return tx[0];
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
};

export const approveWithdrawal = async (txId: string, executorId: string) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const tx = await Transaction.findOne({ _id: txId, type: "withdrawal", status: "pending" }).session(session);
    if (!tx) throw new AppError("Pending withdrawal not found", 404);

    const user = await User.findById(tx.user).session(session);
    if (!user) throw new AppError("User not found", 404);

    const methodName: string =
      ((tx.meta as Record<string, any>)?.methodName as string) ||
      (tx.methodId ? (await WithdrawalMethod.findById(tx.methodId).session(session))?.name : undefined) ||
      "Withdrawal Method";

    user.pendingWithdrawal = Math.max(0, user.pendingWithdrawal - tx.amount);
    user.totalWithdrawn += tx.amount;
    tx.status = "approved";
    tx.reviewedBy = new mongoose.Types.ObjectId(executorId);
    tx.reviewedAt = new Date();

    await Promise.all([user.save({ session }), tx.save({ session })]);
    await session.commitTransaction();

    await sendEmail(
      user.email,
      "Withdrawal Successful",
      withdrawalApprovedEmail(user.username, `$${tx.amount}`, methodName, tx.reference, DASHBOARD_URL)
    );

    await sendSystemMessage(
      String(tx.user),
      "Withdrawal Successful",
      `Your withdrawal request of $${tx.amount} via ${methodName} was successful.`,
      "Transaction",
      String(tx._id)
    ).catch((e) => console.error("Withdrawal approval system notification failed", e));

    return tx;
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
};

export const rejectWithdrawal = async (txId: string, executorId: string, reason: string) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const tx = await Transaction.findOne({ _id: txId, type: "withdrawal", status: "pending" }).session(session);
    if (!tx) throw new AppError("Pending withdrawal not found", 404);

    const user = await User.findById(tx.user).session(session);
    if (!user) throw new AppError("User not found", 404);

    const methodName: string =
      ((tx.meta as Record<string, any>)?.methodName as string) ||
      (tx.methodId ? (await WithdrawalMethod.findById(tx.methodId).session(session))?.name : undefined) ||
      "Withdrawal Method";

    // Return funds to balance
    user.pendingWithdrawal = Math.max(0, user.pendingWithdrawal - tx.amount);
    user.balance += tx.amount;
    tx.status = "rejected";
    tx.reviewedBy = new mongoose.Types.ObjectId(executorId);
    tx.reviewedAt = new Date();
    tx.rejectionReason = reason;

    await Promise.all([user.save({ session }), tx.save({ session })]);
    await session.commitTransaction();

    await sendEmail(
      user.email,
      "Withdrawal Rejected",
      withdrawalRejectedEmail(user.username, `$${tx.amount}`, methodName, tx.reference, reason, DASHBOARD_URL)
    );

    await sendSystemMessage(
      String(tx.user),
      "Withdrawal Rejected",
      `Your withdrawal request of $${tx.amount} via ${methodName} has been rejected. Reason: ${reason}`,
      "Transaction",
      String(tx._id)
    ).catch((e) => console.error("Withdrawal rejection system notification failed", e));

    return tx;
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
};
