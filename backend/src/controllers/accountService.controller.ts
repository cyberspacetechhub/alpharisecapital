import { Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { AuthRequest } from "../middlewares/auth.middleware";
import * as accountService from "../services/accountService.service";
import { AppError } from "../utils/AppError";

// Trader: get my active services
export const getMyActiveServices = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = await accountService.getMyActiveServices(req.userId!);
  res.json({ success: true, data });
});

// Admin: create an account service for a client
export const createAccountService = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { userId, serviceType, title, message, requiresPayment, paymentAmount, targetPlanId } = req.body;

  if (!userId || !serviceType || !title || !message) {
    throw new AppError("userId, serviceType, title, and message are required", 400);
  }

  const data = await accountService.createAccountService(req.userId!, {
    userId,
    serviceType,
    title,
    message,
    requiresPayment,
    paymentAmount,
    targetPlanId,
  });

  res.status(201).json({ success: true, data });
});

// Admin: get all account services
export const getAllAccountServices = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = await accountService.getAllAccountServices(req.query as any);
  res.json({ success: true, ...data });
});

// Admin: get account services for a specific user
export const getUserAccountServices = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = await accountService.getUserAccountServices(req.params.userId);
  res.json({ success: true, data });
});

// Admin: get client active plan helper
export const getClientActivePlan = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = await accountService.getClientActivePlanDetails(req.params.userId);
  res.json({ success: true, data });
});

// Admin: mark service resolved
export const markServiceResolved = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = await accountService.markServiceResolved(req.params.id, req.userId!);
  res.json({ success: true, data });
});
