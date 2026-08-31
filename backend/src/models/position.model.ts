import { Schema, model, Document, Types } from "mongoose";

export type PositionDirection = "long" | "short";
export type PositionStatus = "open" | "closed" | "liquidated";
export type PositionClosedBy = "trader" | "executor" | "system";

export interface IPosition extends Document {
  user: Types.ObjectId;
  pair: string;
  direction: PositionDirection;
  entryPrice: number;
  currentPrice: number;
  exitPrice?: number;
  amount: number;
  leverage: number;
  stopLoss?: number;
  takeProfit?: number;
  unrealizedPnL: number;
  realizedPnL?: number;
  status: PositionStatus;
  openedAt: Date;
  closedAt?: Date;
  closedBy?: PositionClosedBy;
  closedByUser?: Types.ObjectId;
  expiresAt: Date;
  meta: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const positionSchema = new Schema<IPosition>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    pair: { type: String, required: true },
    direction: { type: String, enum: ["long", "short"], required: true },
    entryPrice: { type: Number, required: true },
    currentPrice: { type: Number, required: true },
    exitPrice: { type: Number },
    amount: { type: Number, required: true },
    leverage: { type: Number, default: 1 },
    stopLoss: { type: Number },
    takeProfit: { type: Number },
    unrealizedPnL: { type: Number, default: 0 },
    realizedPnL: { type: Number },
    status: { type: String, enum: ["open", "closed", "liquidated"], default: "open" },
    openedAt: { type: Date, default: Date.now },
    closedAt: { type: Date },
    closedBy: { type: String, enum: ["trader", "executor", "system"] },
    closedByUser: { type: Schema.Types.ObjectId, ref: "User" },
    expiresAt: { type: Date, required: true },
    meta: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

positionSchema.index({ user: 1, status: 1 });
positionSchema.index({ status: 1, expiresAt: 1 });

export const Position = model<IPosition>("Position", positionSchema);
