import { Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { AuthRequest } from "../middlewares/auth.middleware";
import * as walletService from "../services/walletLink.service";

// ─── Trader ───────────────────────────────────────────────────────────────────

export const addWallet = asyncHandler(async (req: AuthRequest, res: Response) => {
  const wallet = await walletService.addWalletLink(req.userId!, req.body);
  res.status(201).json({ success: true, data: wallet });
});

export const getMyWallets = asyncHandler(async (req: AuthRequest, res: Response) => {
  const wallets = await walletService.getMyWalletLinks(req.userId!);
  res.json({ success: true, data: wallets });
});

export const setPrimary = asyncHandler(async (req: AuthRequest, res: Response) => {
  const wallet = await walletService.setPrimaryWallet(req.userId!, req.params.id);
  res.json({ success: true, data: wallet });
});

export const removeWallet = asyncHandler(async (req: AuthRequest, res: Response) => {
  await walletService.deleteWalletLink(req.userId!, req.params.id);
  res.json({ success: true, message: "Wallet removed" });
});

// ─── Executor ─────────────────────────────────────────────────────────────────

export const verifyWallet = asyncHandler(async (req: AuthRequest, res: Response) => {
  const wallet = await walletService.verifyWalletLink(req.params.id, req.userId!);
  res.json({ success: true, data: wallet });
});

export const getUserWallets = asyncHandler(async (req: AuthRequest, res: Response) => {
  const wallets = await walletService.getUserWalletLinks(req.params.userId);
  res.json({ success: true, data: wallets });
});

export const getAllWallets = asyncHandler(async (req: AuthRequest, res: Response) => {
  const wallets = await walletService.getAllWalletLinks();
  res.json({ success: true, data: wallets });
});
