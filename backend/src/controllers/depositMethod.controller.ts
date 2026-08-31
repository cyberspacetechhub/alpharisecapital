import { Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { AuthRequest } from "../middlewares/auth.middleware";
import * as depositMethodService from "../services/depositMethod.service";

export const create = asyncHandler(async (req: AuthRequest, res: Response) => {
  const method = await depositMethodService.createDepositMethod(req.body);
  res.status(201).json({ success: true, data: method });
});

export const update = asyncHandler(async (req: AuthRequest, res: Response) => {
  const method = await depositMethodService.updateDepositMethod(req.params.id, req.body);
  res.json({ success: true, data: method });
});

export const toggle = asyncHandler(async (req: AuthRequest, res: Response) => {
  const method = await depositMethodService.toggleDepositMethod(req.params.id);
  res.json({ success: true, data: method });
});

export const remove = asyncHandler(async (req: AuthRequest, res: Response) => {
  await depositMethodService.deleteDepositMethod(req.params.id);
  res.json({ success: true, message: "Deposit method deleted" });
});

export const getActive = asyncHandler(async (_req: AuthRequest, res: Response) => {
  const methods = await depositMethodService.getActiveDepositMethods();
  res.json({ success: true, data: methods });
});

export const getAll = asyncHandler(async (_req: AuthRequest, res: Response) => {
  const methods = await depositMethodService.getAllDepositMethods();
  res.json({ success: true, data: methods });
});

export const getOne = asyncHandler(async (req: AuthRequest, res: Response) => {
  const method = await depositMethodService.getDepositMethodById(req.params.id);
  res.json({ success: true, data: method });
});
