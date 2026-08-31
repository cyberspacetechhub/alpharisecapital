import { Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { AuthRequest } from "../middlewares/auth.middleware";
import * as investService from "../services/investment.service";
import { Transaction } from "../models/transaction.model";
import { AppError } from "../utils/AppError";

export const invest = asyncHandler(async (req: AuthRequest, res: Response) => {
  const tx = await investService.invest(req.userId!, req.body.planId, req.body.amount);
  res.status(201).json({ success: true, data: tx });
});

export const reinvest = asyncHandler(async (req: AuthRequest, res: Response) => {
  const tx = await investService.reinvest(req.userId!, req.params.transactionId);
  res.status(201).json({ success: true, data: tx });
});

export const upgradePlan = asyncHandler(async (req: AuthRequest, res: Response) => {
  const tx = await investService.upgradePlan(req.userId!, req.params.transactionId, req.body.newPlanId);
  res.json({ success: true, data: tx });
});

export const getMyInvestments = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = await Transaction.find({
    user: req.userId,
    type: { $in: ["investment", "reinvestment"] },
  }).sort({ createdAt: -1 });
  res.json({ success: true, data });
});

export const getAllInvestments = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { status, page = "1", limit = "20" } = req.query as Record<string, string>;
  const filter: Record<string, unknown> = { type: { $in: ["investment", "reinvestment"] } };
  if (status) filter.status = status;

  const [data, total] = await Promise.all([
    Transaction.find(filter)
      .populate("user", "username email")
      .sort({ createdAt: -1 })
      .skip((+page - 1) * +limit)
      .limit(+limit),
    Transaction.countDocuments(filter),
  ]);

  res.json({ success: true, data, total, page: +page, pages: Math.ceil(total / +limit) });
});

export const logProfit = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { amount, note } = req.body;
  
  if (typeof amount !== "number" || amount <= 0) {
    throw new AppError("Profit amount must be a positive number", 400);
  }

  const tx = await investService.logProfit(id, amount, note);
  res.json({ success: true, data: tx });
});

export const updateInvestmentStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { status, reason } = req.body;

  const validStatuses = ["pending", "approved", "rejected", "completed"];
  if (!validStatuses.includes(status)) {
    throw new AppError("Invalid status", 400);
  }

  const tx = await investService.updateInvestmentStatus(id, status, reason);
  res.json({ success: true, data: tx });
});

export const upgradePlanExecutor = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { transactionId } = req.params;
  const { newPlanId } = req.body;

  const tx = await Transaction.findById(transactionId);
  if (!tx) throw new AppError("Investment not found", 404);

  const updatedTx = await investService.upgradePlan(String(tx.user), transactionId, newPlanId);
  res.json({ success: true, data: updatedTx });
});

export const approveInvestment = asyncHandler(async (req: AuthRequest, res: Response) => {
  const tx = await investService.approveInvestment(req.params.id, req.userId!);
  res.json({ success: true, data: tx });
});

export const rejectInvestment = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { reason } = req.body;
  const tx = await investService.rejectInvestment(req.params.id, req.userId!, reason);
  res.json({ success: true, data: tx });
});
