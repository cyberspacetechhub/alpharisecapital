import { Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { AuthRequest } from "../middlewares/auth.middleware";
import * as messageService from "../services/inAppMessage.service";

// ─── Trader / Self ────────────────────────────────────────────────────────────

export const getInbox = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { page = "1", limit = "20" } = req.query as Record<string, string>;
  const result = await messageService.getMyInbox(req.userId!, +page, +limit);
  res.json({ success: true, ...result });
});

export const markRead = asyncHandler(async (req: AuthRequest, res: Response) => {
  const message = await messageService.markAsRead(req.userId!, req.params.id);
  res.json({ success: true, data: message });
});

export const markAllRead = asyncHandler(async (req: AuthRequest, res: Response) => {
  await messageService.markAllAsRead(req.userId!);
  res.json({ success: true, message: "All messages marked as read" });
});

export const getUnreadCount = asyncHandler(async (req: AuthRequest, res: Response) => {
  const count = await messageService.getUnreadCount(req.userId!);
  res.json({ success: true, data: { unreadCount: count } });
});

export const deleteMessage = asyncHandler(async (req: AuthRequest, res: Response) => {
  await messageService.deleteMessage(req.userId!, req.params.id);
  res.json({ success: true, message: "Message deleted" });
});

// ─── Executor ─────────────────────────────────────────────────────────────────

export const sendMessage = asyncHandler(async (req: AuthRequest, res: Response) => {
  const message = await messageService.sendMessage(req.userId!, req.body);
  res.status(201).json({ success: true, data: message });
});
