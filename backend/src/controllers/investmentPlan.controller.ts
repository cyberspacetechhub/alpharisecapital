import { Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { AuthRequest } from "../middlewares/auth.middleware";
import * as planService from "../services/investmentPlan.service";

export const create = asyncHandler(async (req: AuthRequest, res: Response) => {
  const plan = await planService.createInvestmentPlan(req.body);
  res.status(201).json({ success: true, data: plan });
});

export const update = asyncHandler(async (req: AuthRequest, res: Response) => {
  const plan = await planService.updateInvestmentPlan(req.params.id, req.body);
  res.json({ success: true, data: plan });
});

export const toggle = asyncHandler(async (req: AuthRequest, res: Response) => {
  const plan = await planService.toggleInvestmentPlan(req.params.id);
  res.json({ success: true, data: plan });
});

export const remove = asyncHandler(async (req: AuthRequest, res: Response) => {
  await planService.deleteInvestmentPlan(req.params.id);
  res.json({ success: true, message: "Investment plan deleted" });
});

export const getActive = asyncHandler(async (_req: AuthRequest, res: Response) => {
  const plans = await planService.getActivePlans();
  res.json({ success: true, data: plans });
});

export const getAll = asyncHandler(async (_req: AuthRequest, res: Response) => {
  const plans = await planService.getAllPlans();
  res.json({ success: true, data: plans });
});

export const getOne = asyncHandler(async (req: AuthRequest, res: Response) => {
  const plan = await planService.getPlanById(req.params.id);
  res.json({ success: true, data: plan });
});
