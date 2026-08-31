import { Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { AuthRequest } from "../middlewares/auth.middleware";
import * as withdrawalMethodService from "../services/withdrawalMethod.service";

export const create = asyncHandler(async (req: AuthRequest, res: Response) => {
  const method = await withdrawalMethodService.createWithdrawalMethod(req.body);
  res.status(201).json({ success: true, data: method });
});

export const update = asyncHandler(async (req: AuthRequest, res: Response) => {
  const method = await withdrawalMethodService.updateWithdrawalMethod(req.params.id, req.body);
  res.json({ success: true, data: method });
});

export const toggle = asyncHandler(async (req: AuthRequest, res: Response) => {
  const method = await withdrawalMethodService.toggleWithdrawalMethod(req.params.id);
  res.json({ success: true, data: method });
});

export const remove = asyncHandler(async (req: AuthRequest, res: Response) => {
  await withdrawalMethodService.deleteWithdrawalMethod(req.params.id);
  res.json({ success: true, message: "Withdrawal method deleted" });
});

export const getActive = asyncHandler(async (_req: AuthRequest, res: Response) => {
  const methods = await withdrawalMethodService.getActiveWithdrawalMethods();
  res.json({ success: true, data: methods });
});

export const getAll = asyncHandler(async (_req: AuthRequest, res: Response) => {
  const methods = await withdrawalMethodService.getAllWithdrawalMethods();
  res.json({ success: true, data: methods });
});

export const getOne = asyncHandler(async (req: AuthRequest, res: Response) => {
  const method = await withdrawalMethodService.getWithdrawalMethodById(req.params.id);
  res.json({ success: true, data: method });
});
