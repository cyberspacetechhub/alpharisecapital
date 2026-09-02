import { Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { AuthRequest } from "../middlewares/auth.middleware";
import * as txService from "../services/transaction.service";
import { Transaction } from "../models/transaction.model";
import { AppError } from "../utils/AppError";

export const deposit = asyncHandler(async (req: AuthRequest, res: Response) => {
  const tx = await txService.requestDeposit(req.userId!, req.body.amount, req.body.methodId, req.body.proofUrl);
  res.status(201).json({ success: true, data: tx });
});

export const withdraw = asyncHandler(async (req: AuthRequest, res: Response) => {
  const tx = await txService.requestWithdrawal(req.userId!, req.body.amount, req.body.methodId, req.body.accountDetails);
  res.status(201).json({ success: true, data: tx });
});

export const approveDeposit = asyncHandler(async (req: AuthRequest, res: Response) => {
  const tx = await txService.approveDeposit(req.params.id, req.userId!);
  res.json({ success: true, data: tx });
});

export const rejectDeposit = asyncHandler(async (req: AuthRequest, res: Response) => {
  const tx = await txService.rejectDeposit(req.params.id, req.userId!, req.body.reason);
  res.json({ success: true, data: tx });
});

export const approveWithdrawal = asyncHandler(async (req: AuthRequest, res: Response) => {
  const tx = await txService.approveWithdrawal(req.params.id, req.userId!);
  res.json({ success: true, data: tx });
});

export const rejectWithdrawal = asyncHandler(async (req: AuthRequest, res: Response) => {
  const tx = await txService.rejectWithdrawal(req.params.id, req.userId!, req.body.reason);
  res.json({ success: true, data: tx });
});

import { DepositMethod } from "../models/depositMethod.model";
import { WithdrawalMethod } from "../models/withdrawalMethod.model";

const enrichTransactions = async (txs: any[]) => {
  if (!txs || !txs.length) return txs;

  const [depositMethods, withdrawalMethods] = await Promise.all([
    DepositMethod.find({}, "name image").lean(),
    WithdrawalMethod.find({}, "name image").lean(),
  ]);

  const methodMap = new Map<string, string>();
  const nameMap = new Map<string, string>();

  for (const m of depositMethods) {
    if (m.image) {
      methodMap.set(String(m._id), m.image);
      nameMap.set(m.name.toLowerCase().trim(), m.image);
    }
  }
  for (const m of withdrawalMethods) {
    if (m.image) {
      methodMap.set(String(m._id), m.image);
      nameMap.set(m.name.toLowerCase().trim(), m.image);
    }
  }

  return txs.map((txDoc) => {
    const tx = txDoc.toObject ? txDoc.toObject() : txDoc;
    const currentImg = tx.meta?.methodImage;
    if (!currentImg) {
      const fallbackImg =
        (tx.methodId && methodMap.get(String(tx.methodId))) ||
        (tx.meta?.methodName && nameMap.get(String(tx.meta.methodName).toLowerCase().trim()));
      if (fallbackImg) {
        tx.meta = { ...(tx.meta || {}), methodImage: fallbackImg };
      }
    }
    return tx;
  });
};

export const getMyTransactions = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { type, status, page = "1", limit = "20" } = req.query as Record<string, string>;
  const filter: Record<string, unknown> = { user: req.userId };
  if (type) filter.type = type;
  if (status) filter.status = status;

  const [rawDocs, total] = await Promise.all([
    Transaction.find(filter)
      .sort({ createdAt: -1 })
      .skip((+page - 1) * +limit)
      .limit(+limit),
    Transaction.countDocuments(filter),
  ]);

  const data = await enrichTransactions(rawDocs);

  res.json({ success: true, data, total, page: +page, pages: Math.ceil(total / +limit) });
});

export const getAllTransactions = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { type, status, page = "1", limit = "20" } = req.query as Record<string, string>;
  const filter: Record<string, unknown> = {};
  if (type) filter.type = type;
  if (status) filter.status = status;

  const [rawDocs, total] = await Promise.all([
    Transaction.find(filter)
      .populate("user", "username email")
      .sort({ createdAt: -1 })
      .skip((+page - 1) * +limit)
      .limit(+limit),
    Transaction.countDocuments(filter),
  ]);

  const data = await enrichTransactions(rawDocs);

  res.json({ success: true, data, total, page: +page, pages: Math.ceil(total / +limit) });
});
