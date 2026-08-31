import mongoose from "mongoose";
import { User } from "../models/user.model";
import { LoanOffer } from "../models/loan.model";
import { LoanApplication } from "../models/loan.model";
import { Transaction } from "../models/transaction.model";
import { SystemSetting } from "../models/systemSetting.model";
import { AppError } from "../utils/AppError";
import { generateReference } from "../utils/tokens";
import { sendEmail } from "./email.service";
import { loanApprovedEmail, loanRejectedEmail } from "../emails";

const DASHBOARD_URL = `${process.env.CLIENT_URL}/dashboard/loans`;

// ─── Executor: Create Loan Offer ─────────────────────────────────────────────

export const createLoanOffer = async (executorId: string, data: {
  title: string;
  description?: string;
  interestRate: number;
  interestType: "flat" | "compound";
  minAmount: number;
  maxAmount: number;
  durationDays: number;
}) => {
  return LoanOffer.create({ ...data, createdBy: executorId });
};

export const toggleLoanOffer = async (offerId: string) => {
  const offer = await LoanOffer.findById(offerId);
  if (!offer) throw new AppError("Loan offer not found", 404);
  offer.isActive = !offer.isActive;
  return offer.save();
};

// ─── Trader: Apply for Loan ───────────────────────────────────────────────────

export const applyForLoan = async (userId: string, offerId: string, requestedAmount: number) => {
  const [user, offer] = await Promise.all([
    User.findById(userId),
    LoanOffer.findById(offerId),
  ]);

  if (!user) throw new AppError("User not found", 404);
  if (!offer || !offer.isActive) throw new AppError("Loan offer not found or inactive", 404);
  if (requestedAmount < offer.minAmount || requestedAmount > offer.maxAmount)
    throw new AppError(`Amount must be between $${offer.minAmount} and $${offer.maxAmount}`, 400);
  if (requestedAmount > user.loanLimit)
    throw new AppError(`Amount exceeds your loan limit of $${user.loanLimit}`, 400);

  const hasActive = await LoanApplication.findOne({ user: userId, status: { $in: ["pending", "active"] } });
  if (hasActive) throw new AppError("You already have an active or pending loan", 400);

  const amountDue =
    offer.interestType === "flat"
      ? requestedAmount + (requestedAmount * offer.interestRate) / 100
      : requestedAmount * Math.pow(1 + offer.interestRate / 100, offer.durationDays / 30);

  return LoanApplication.create({
    user: userId,
    offer: offerId,
    requestedAmount,
    amountDue: parseFloat(amountDue.toFixed(2)),
    interestRate: offer.interestRate,
    interestType: offer.interestType,
    durationDays: offer.durationDays,
  });
};

// ─── Executor: Approve Loan ───────────────────────────────────────────────────

export const approveLoan = async (applicationId: string, executorId: string) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const application = await LoanApplication.findOne({
      _id: applicationId,
      status: "pending",
    }).session(session);
    if (!application) throw new AppError("Pending loan application not found", 404);

    const user = await User.findById(application.user).session(session);
    if (!user) throw new AppError("User not found", 404);

    const dueDate = new Date(Date.now() + application.durationDays * 24 * 60 * 60 * 1000);

    user.balance += application.requestedAmount;
    application.status = "active";
    application.approvedBy = new mongoose.Types.ObjectId(executorId);
    application.approvedAt = new Date();
    application.dueDate = dueDate;

    await Transaction.create(
      [
        {
          user: application.user,
          type: "loan_disbursement",
          amount: application.requestedAmount,
          status: "completed",
          reference: generateReference(),
          meta: { loanApplicationId: application._id },
        },
      ],
      { session }
    );

    await Promise.all([user.save({ session }), application.save({ session })]);
    await session.commitTransaction();

    await sendEmail(
      user.email,
      "Loan Approved",
      loanApprovedEmail(
        user.username,
        `$${application.requestedAmount}`,
        `$${application.amountDue}`,
        `${application.interestRate}%`,
        dueDate.toDateString(),
        DASHBOARD_URL
      )
    );

    return application;
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
};

// ─── Executor: Reject Loan ────────────────────────────────────────────────────

export const rejectLoan = async (applicationId: string, executorId: string, reason: string) => {
  const application = await LoanApplication.findOne({ _id: applicationId, status: "pending" });
  if (!application) throw new AppError("Pending loan application not found", 404);

  application.status = "rejected";
  application.approvedBy = new mongoose.Types.ObjectId(executorId);
  application.approvedAt = new Date();
  application.rejectionReason = reason;
  await application.save();

  const user = await User.findById(application.user);
  if (user) {
    await sendEmail(
      user.email,
      "Loan Rejected",
      loanRejectedEmail(user.username, `$${application.requestedAmount}`, reason, DASHBOARD_URL)
    );
  }

  return application;
};

// ─── Executor: Upgrade User Loan Limit & Credit Score ────────────────────────

export const upgradeUserLoanLimit = async (userId: string, loanLimit: number, creditScore?: number) => {
  const user = await User.findById(userId);
  if (!user) throw new AppError("User not found", 404);
  user.loanLimit = loanLimit;
  user.isCustomLoanLimit = true;
  if (creditScore !== undefined) user.creditScore = creditScore;
  return user.save();
};

export const getGeneralLoanLimit = async (): Promise<number> => {
  let settings = await SystemSetting.findOne();
  if (!settings) {
    settings = await SystemSetting.create({ generalLoanLimit: 0 });
  }
  return settings.generalLoanLimit;
};

export const updateGeneralLoanLimit = async (generalLoanLimit: number) => {
  let settings = await SystemSetting.findOne();
  if (!settings) {
    settings = await SystemSetting.create({ generalLoanLimit });
  } else {
    settings.generalLoanLimit = generalLoanLimit;
    await settings.save();
  }

  // Update all users who do not have a custom limit override
  await User.updateMany(
    { isCustomLoanLimit: false },
    { loanLimit: generalLoanLimit }
  );

  return settings;
};

// ─── Trader: Repay Loan ───────────────────────────────────────────────────────

export const repayLoan = async (userId: string, applicationId: string, amount: number) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const user = await User.findById(userId).session(session);
    const application = await LoanApplication.findOne({ _id: applicationId, user: userId, status: "active" }).session(session);

    if (!user) throw new AppError("User not found", 404);
    if (!application) throw new AppError("Active loan not found", 404);
    if (user.balance < amount) throw new AppError("Insufficient balance", 400);

    const remaining = application.amountDue - application.repaidAmount;
    const paying = Math.min(amount, remaining);

    user.balance -= paying;
    application.repaidAmount += paying;

    if (application.repaidAmount >= application.amountDue) {
      application.status = "repaid";
      // reward credit score on full repayment
      user.creditScore = Math.min(1000, user.creditScore + 10);
    }

    await Transaction.create(
      [
        {
          user: userId,
          type: "loan_repayment",
          amount: paying,
          status: "completed",
          reference: generateReference(),
          meta: { loanApplicationId: application._id },
        },
      ],
      { session }
    );

    await Promise.all([user.save({ session }), application.save({ session })]);
    await session.commitTransaction();
    return application;
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
};
