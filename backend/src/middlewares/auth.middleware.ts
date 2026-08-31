import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { Profile, ProfileType } from "../models/profile.model";
import { AppError } from "../utils/AppError";
import { asyncHandler } from "../utils/asyncHandler";

export interface AuthRequest extends Request {
  userId?: string;
  profileType?: ProfileType;
}

export const protect = asyncHandler(async (req: AuthRequest, _res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) throw new AppError("Access token missing", 401);

  let decoded: { userId: string };
  try {
    decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET as string) as { userId: string };
  } catch {
    throw new AppError("Invalid or expired access token", 401);
  }

  req.userId = decoded.userId;
  next();
});

export const authorize = (...types: ProfileType[]) =>
  asyncHandler(async (req: AuthRequest, _res: Response, next: NextFunction) => {
    if (!req.userId) throw new AppError("Not authenticated", 401);

    const profile = await Profile.findOne({ user: req.userId }).select("type").lean();
    if (!profile) throw new AppError("Profile not found", 403);

    if (!types.includes(profile.type as ProfileType)) {
      throw new AppError(`Access restricted to: ${types.join(", ")}`, 403);
    }

    req.profileType = profile.type as ProfileType;
    next();
  });
