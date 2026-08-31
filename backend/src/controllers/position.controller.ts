import { Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { AuthRequest } from "../middlewares/auth.middleware";
import * as positionService from "../services/position.service";
import { Position } from "../models/position.model";
import { AppError } from "../utils/AppError";

export const openPosition = asyncHandler(async (req: AuthRequest, res: Response) => {
  // entryPrice should be fetched from ticker on the frontend or a separate ticker endpoint
  const position = await positionService.openPosition(req.userId!, req.body);
  res.status(201).json({ success: true, data: position });
});

export const closeMyPosition = asyncHandler(async (req: AuthRequest, res: Response) => {
  const position = await Position.findOne({ _id: req.params.id, user: req.userId, status: "open" });
  if (!position) throw new AppError("Open position not found", 404);
  const closed = await positionService.closePosition(req.params.id, "trader", position.currentPrice, req.userId);
  res.json({ success: true, data: closed });
});

export const closePositionAsExecutor = asyncHandler(async (req: AuthRequest, res: Response) => {
  const position = await Position.findOne({ _id: req.params.id, status: "open" });
  if (!position) throw new AppError("Open position not found", 404);
  const { exitPrice, overridePnL, remarks } = req.body;
  const closed = await positionService.closePosition(
    req.params.id,
    "executor",
    exitPrice ?? position.currentPrice,
    req.userId,
    overridePnL !== undefined && overridePnL !== null ? Number(overridePnL) : undefined,
    remarks
  );
  res.json({ success: true, data: closed });
});

export const getMyPositions = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { status } = req.query as { status?: string };
  const filter: Record<string, unknown> = { user: req.userId };
  if (status) filter.status = status;
  const data = await Position.find(filter).sort({ createdAt: -1 });
  res.json({ success: true, data });
});

export const getAllPositions = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { status, page = "1", limit = "20" } = req.query as Record<string, string>;
  const filter: Record<string, unknown> = {};
  if (status) filter.status = status;

  const [data, total] = await Promise.all([
    Position.find(filter)
      .populate("user", "username email")
      .sort({ createdAt: -1 })
      .skip((+page - 1) * +limit)
      .limit(+limit),
    Position.countDocuments(filter),
  ]);

  res.json({ success: true, data, total, page: +page, pages: Math.ceil(total / +limit) });
});
