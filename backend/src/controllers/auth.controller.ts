import { Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { AuthRequest } from "../middlewares/auth.middleware";
import * as authService from "../services/auth.service";
import { ProfileType } from "../models/profile.model";

const REFRESH_COOKIE = "refreshToken";
const cookieOpts = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: (process.env.NODE_ENV === "production" ? "none" : "lax") as "none" | "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

export const register = (type: ProfileType) =>
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const ip = req.ip ?? "unknown";
    const userAgent = req.headers["user-agent"] ?? "unknown";
    const { accessToken, refreshToken, user } = await authService.registerUser(req.body, type, ip, userAgent);
    res.cookie(REFRESH_COOKIE, refreshToken, cookieOpts);
    res.status(201).json({ success: true, accessToken, user });
  });

export const login = asyncHandler(async (req: AuthRequest, res: Response) => {
  const ip = req.ip ?? "unknown";
  const userAgent = req.headers["user-agent"] ?? "unknown";
  const { accessToken, refreshToken, user } = await authService.loginUser(req.body.identifier, req.body.password, ip, userAgent);
  res.cookie(REFRESH_COOKIE, refreshToken, cookieOpts);
  res.json({ success: true, accessToken, user });
});

export const refresh = asyncHandler(async (req: AuthRequest, res: Response) => {
  const token = req.cookies[REFRESH_COOKIE];
  if (!token) { res.status(401).json({ success: false, message: "No refresh token" }); return; }
  const { accessToken, refreshToken } = await authService.refreshAccessToken(token);
  res.cookie(REFRESH_COOKIE, refreshToken, cookieOpts);
  res.json({ success: true, accessToken });
});

export const logout = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (req.userId) await authService.logoutUser(req.userId);
  res.clearCookie(REFRESH_COOKIE, cookieOpts);
  res.json({ success: true, message: "Logged out" });
});

export const verifyEmail = asyncHandler(async (req: AuthRequest, res: Response) => {
  await authService.verifyEmail(req.query.token as string);
  res.json({ success: true, message: "Email verified" });
});

export const forgotPassword = asyncHandler(async (req: AuthRequest, res: Response) => {
  await authService.requestPasswordReset(req.body.email);
  res.json({ success: true, message: "If that email exists, a reset link has been sent" });
});

export const resetPassword = asyncHandler(async (req: AuthRequest, res: Response) => {
  await authService.resetPassword(req.query.token as string, req.body.newPassword);
  res.json({ success: true, message: "Password reset successful" });
});
