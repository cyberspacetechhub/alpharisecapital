import mongoose from "mongoose";
import { User } from "../models/user.model";
import { Position, PositionClosedBy } from "../models/position.model";
import { AppError } from "../utils/AppError";
import { sendEmail } from "./email.service";
import { positionClosedEmail } from "../emails";

const DASHBOARD_URL = `${process.env.CLIENT_URL}/dashboard/positions`;

const calcUnrealizedPnL = (
  direction: "long" | "short",
  entryPrice: number,
  currentPrice: number,
  amount: number,
  leverage: number
): number => {
  const priceDiff = direction === "long" ? currentPrice - entryPrice : entryPrice - currentPrice;
  return parseFloat(((priceDiff / entryPrice) * amount * leverage).toFixed(4));
};

// ─── Open Position ────────────────────────────────────────────────────────────

export const openPosition = async (
  userId: string,
  data: {
    pair: string;
    direction: "long" | "short";
    amount: number;
    leverage: number;
    stopLoss?: number;
    takeProfit?: number;
    durationMinutes: number;
    entryPrice: number; // fetched from ticker before calling this
  }
) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const user = await User.findById(userId).session(session);
    if (!user) throw new AppError("User not found", 404);
    if (user.balance < data.amount) throw new AppError("Insufficient balance", 400);

    user.balance -= data.amount;
    await user.save({ session });

    const expiresAt = new Date(Date.now() + data.durationMinutes * 60 * 1000);

    const position = await Position.create(
      [
        {
          user: userId,
          pair: data.pair,
          direction: data.direction,
          entryPrice: data.entryPrice,
          currentPrice: data.entryPrice,
          amount: data.amount,
          leverage: data.leverage,
          stopLoss: data.stopLoss,
          takeProfit: data.takeProfit,
          unrealizedPnL: 0,
          status: "open",
          openedAt: new Date(),
          expiresAt,
        },
      ],
      { session }
    );

    await session.commitTransaction();
    return position[0];
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
};

// ─── Update Live Price (called by ticker job) ─────────────────────────────────

export const updatePositionPrice = async (positionId: string, currentPrice: number) => {
  const position = await Position.findOne({ _id: positionId, status: "open" });
  if (!position) return null;

  position.currentPrice = currentPrice;
  position.unrealizedPnL = calcUnrealizedPnL(
    position.direction,
    position.entryPrice,
    currentPrice,
    position.amount,
    position.leverage
  );

  // Auto-close on stop loss
  if (position.stopLoss) {
    const hit =
      position.direction === "long"
        ? currentPrice <= position.stopLoss
        : currentPrice >= position.stopLoss;
    if (hit) return closePosition(String(position._id), "system", currentPrice);
  }

  // Auto-close on take profit
  if (position.takeProfit) {
    const hit =
      position.direction === "long"
        ? currentPrice >= position.takeProfit
        : currentPrice <= position.takeProfit;
    if (hit) return closePosition(String(position._id), "system", currentPrice);
  }

  return position.save();
};

// ─── Close Position ───────────────────────────────────────────────────────────

export const closePosition = async (
  positionId: string,
  closedBy: PositionClosedBy,
  exitPrice: number,
  closedByUserId?: string,
  overridePnL?: number,
  remarks?: string
) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const position = await Position.findOne({ _id: positionId, status: "open" }).session(session);
    if (!position) throw new AppError("Open position not found", 404);

    const user = await User.findById(position.user).session(session);
    if (!user) throw new AppError("User not found", 404);

    let realizedPnL = calcUnrealizedPnL(
      position.direction,
      position.entryPrice,
      exitPrice,
      position.amount,
      position.leverage
    );

    if (overridePnL !== undefined && overridePnL !== null) {
      realizedPnL = overridePnL;
    }

    const totalReturn = position.amount + realizedPnL;

    user.balance += Math.max(0, totalReturn); // can't go below 0
    if (realizedPnL > 0) user.totalEarnings += realizedPnL;

    position.exitPrice = exitPrice;
    position.currentPrice = exitPrice;
    position.realizedPnL = realizedPnL;
    position.unrealizedPnL = 0;
    position.status = "closed";
    position.closedAt = new Date();
    position.closedBy = closedBy;
    if (closedByUserId) position.closedByUser = new mongoose.Types.ObjectId(closedByUserId);

    if (remarks) {
      if (!position.meta) position.meta = {};
      position.meta.remarks = remarks;
      position.markModified("meta");
    }

    await Promise.all([user.save({ session }), position.save({ session })]);
    await session.commitTransaction();

    await sendEmail(
      user.email,
      `Position Closed — ${position.pair}`,
      positionClosedEmail(
        user.username,
        position.pair,
        position.direction,
        `$${position.entryPrice}`,
        `$${exitPrice}`,
        `$${position.amount}`,
        `${realizedPnL >= 0 ? "+" : ""}$${realizedPnL.toFixed(2)}`,
        closedBy,
        DASHBOARD_URL
      )
    );

    return position;
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
};

// ─── Expire Positions (called by scheduler) ───────────────────────────────────

export const expireOpenPositions = async (currentPrices: Record<string, number>) => {
  const expired = await Position.find({
    status: "open",
    expiresAt: { $lte: new Date() },
  });

  for (const pos of expired) {
    const exitPrice = currentPrices[pos.pair] ?? pos.currentPrice;
    await closePosition(String(pos._id), "system", exitPrice);
  }
};
