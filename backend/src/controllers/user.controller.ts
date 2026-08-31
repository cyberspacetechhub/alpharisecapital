import { Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { AuthRequest } from "../middlewares/auth.middleware";
import * as userService from "../services/user.service";

// ─── Trader / Self ────────────────────────────────────────────────────────────

export const getMe = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = await userService.getMyProfile(req.userId!);
  res.json({ success: true, data: user });
});

export const getDashboard = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = await userService.getMyDashboard(req.userId!);
  res.json({ success: true, data });
});

export const updateProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
  const profile = await userService.updateMyProfile(req.userId!, req.body);
  res.json({ success: true, data: profile });
});

export const updateAvatar = asyncHandler(async (req: AuthRequest, res: Response) => {
  const buffer = req.file?.buffer;
  if (!buffer) { res.status(400).json({ success: false, message: "No file uploaded" }); return; }
  const result = await userService.updateAvatar(req.userId!, buffer);
  res.json({ success: true, data: result });
});

export const uploadFile = asyncHandler(async (req: AuthRequest, res: Response) => {
  const buffer = req.file?.buffer;
  if (!buffer) { res.status(400).json({ success: false, message: "No file uploaded" }); return; }
  const url = await userService.uploadGeneralFile(buffer);
  res.json({ success: true, url });
});

export const changePassword = asyncHandler(async (req: AuthRequest, res: Response) => {
  await userService.changePassword(req.userId!, req.body.currentPassword, req.body.newPassword);
  res.json({ success: true, message: "Password changed successfully" });
});

export const submitKyc = asyncHandler(async (req: AuthRequest, res: Response) => {
  const result = await userService.submitKyc(req.userId!, req.body);
  res.json({ success: true, data: result });
});

// ─── Executor: Trader Management ─────────────────────────────────────────────

export const getAllTraders = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { page = "1", limit = "20", search, kycStatus } = req.query as Record<string, string>;
  const result = await userService.getAllTraders(+page, +limit, search, kycStatus);
  res.json({ success: true, ...result });
});

export const getTraderDetails = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = await userService.getTraderDetails(req.params.id);
  res.json({ success: true, data });
});

export const updateKycStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
  const result = await userService.updateKycStatus(req.params.id, req.body.status);
  res.json({ success: true, data: result });
});

export const toggleUserActive = asyncHandler(async (req: AuthRequest, res: Response) => {
  const result = await userService.toggleUserActive(req.params.id);
  res.json({ success: true, data: result });
});

export const getExecutorStats = asyncHandler(async (req: AuthRequest, res: Response) => {
  const stats = await userService.getExecutorDashboardStats();
  res.json({ success: true, data: stats });
});
