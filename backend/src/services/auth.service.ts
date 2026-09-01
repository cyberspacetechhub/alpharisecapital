import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model";
import { Profile } from "../models/profile.model";
import { TraderProfile } from "../models/trader.profile.model";
import { ExecutorProfile } from "../models/executor.profile.model";
import { SystemSetting } from "../models/systemSetting.model";
import { AppError } from "../utils/AppError";
import { generateAccessToken, generateRefreshToken, generateHexToken } from "../utils/tokens";
import { sendEmail } from "./email.service";
import { welcomeEmail, emailVerificationEmail, passwordResetEmail } from "../emails";
import { ProfileType } from "../models/profile.model";
import { RegisterInput } from "../utils/validators/auth.validator";

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: (process.env.NODE_ENV === "production" ? "none" : "lax") as "none" | "lax",
};

export const registerUser = async (data: RegisterInput, type: ProfileType, ip: string, userAgent: string) => {
  const existing = await User.findOne({ $or: [{ email: data.email }, { username: data.username }] });
  if (existing) throw new AppError("Email or username already in use", 409);

  const hashed = await bcrypt.hash(data.password, 12);
  const verificationToken = generateHexToken();
  const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

  const settings = await SystemSetting.findOne();
  const generalLoanLimit = settings ? settings.generalLoanLimit : 0;

  const user = await User.create({
    username: data.username,
    fullName: data.fullName,
    email: data.email,
    password: hashed,
    phone: data.phone,
    emailVerificationToken: verificationToken,
    emailVerificationExpires: verificationExpires,
    lastIp: ip,
    loginHistory: [{ ip, userAgent, at: new Date() }],
    loanLimit: generalLoanLimit,
    isCustomLoanLimit: false,
  });

  // create profile based on type
  let profile;
  if (type === "Trader") {
    profile = await TraderProfile.create({
      user: user._id,
      type: "Trader",
      referralCode: data.username,
      referredBy: data.referredBy,
    });

    if (data.referredBy) {
      const referrerUser = await User.findOne({
        $or: [{ username: data.referredBy }, { referralCode: data.referredBy }],
      });
      if (referrerUser) {
        await TraderProfile.findOneAndUpdate(
          { user: referrerUser._id },
          { $inc: { totalReferrals: 1 } }
        );
      }
    }
  } else {
    profile = await ExecutorProfile.create({ user: user._id, type: "Executor" });
  }

  // save profile ref back to user
  await User.findByIdAndUpdate(user._id, { profile: profile._id });

  const verifyUrl = `${process.env.CLIENT_URL}/verify-email?token=${verificationToken}`;
  await sendEmail(user.email, `Verify your email`, emailVerificationEmail(user.username, verifyUrl));
  await sendEmail(user.email, `Welcome to VerdexTrade`, welcomeEmail(user.username, `${process.env.CLIENT_URL}/dashboard`));

  const accessToken = generateAccessToken(String(user._id));
  const refreshToken = generateRefreshToken(String(user._id));
  await User.findByIdAndUpdate(user._id, { refreshToken: await bcrypt.hash(refreshToken, 10) });

  return { accessToken, refreshToken, user: { id: user._id, username: user.username, email: user.email, type } };
};

export const loginUser = async (identifier: string, password: string, ip: string, userAgent: string) => {
  const user = await User.findOne({
    $or: [{ email: identifier }, { phone: identifier }, { username: identifier }],
  }).select("+password +refreshToken");
  if (!user) throw new AppError("Invalid credentials", 401);
  if (!user.isActive) throw new AppError("Account is deactivated. Contact support.", 403);

  const match = await bcrypt.compare(password, user.password);
  if (!match) throw new AppError("Invalid credentials", 401);

  const profile = await Profile.findOne({ user: user._id }).select("type").lean();
  if (!profile) throw new AppError("Profile not found", 404);

  const accessToken = generateAccessToken(String(user._id));
  const refreshToken = generateRefreshToken(String(user._id));

  user.refreshToken = await bcrypt.hash(refreshToken, 10);
  user.lastLogin = new Date();
  user.lastIp = ip;
  user.loginHistory.push({ ip, userAgent, at: new Date() });
  if (user.loginHistory.length > 20) user.loginHistory = user.loginHistory.slice(-20);
  await user.save();

  return {
    accessToken,
    refreshToken,
    user: { id: user._id, username: user.username, email: user.email, type: profile.type },
  };
};

export const refreshAccessToken = async (token: string) => {
  let decoded: { userId: string };
  try {
    decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET as string) as { userId: string };
  } catch {
    throw new AppError("Invalid or expired refresh token", 401);
  }

  const user = await User.findById(decoded.userId).select("+refreshToken");
  if (!user || !user.refreshToken) throw new AppError("Session expired. Please login again.", 401);

  const valid = await bcrypt.compare(token, user.refreshToken);
  if (!valid) throw new AppError("Invalid refresh token", 401);

  const newAccessToken = generateAccessToken(String(user._id));
  const newRefreshToken = generateRefreshToken(String(user._id));
  user.refreshToken = await bcrypt.hash(newRefreshToken, 10);
  await user.save();

  return { accessToken: newAccessToken, refreshToken: newRefreshToken };
};

export const logoutUser = async (userId: string) => {
  await User.findByIdAndUpdate(userId, { refreshToken: null });
};

export const verifyEmail = async (token: string) => {
  const user = await User.findOne({
    emailVerificationToken: token,
    emailVerificationExpires: { $gt: new Date() },
  }).select("+emailVerificationToken +emailVerificationExpires");

  if (!user) throw new AppError("Invalid or expired verification token", 400);

  user.isVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationExpires = undefined;
  await user.save();
};

export const requestPasswordReset = async (email: string) => {
  const user = await User.findOne({ email });
  if (!user) return; // silent — don't reveal if email exists

  const token = generateHexToken();
  user.passwordResetToken = token;
  user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000);
  await user.save();

  const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${token}`;
  await sendEmail(user.email, "Reset your password", passwordResetEmail(user.username, resetUrl));
};

export const resetPassword = async (token: string, newPassword: string) => {
  const user = await User.findOne({
    passwordResetToken: token,
    passwordResetExpires: { $gt: new Date() },
  }).select("+passwordResetToken +passwordResetExpires");

  if (!user) throw new AppError("Invalid or expired reset token", 400);

  user.password = await bcrypt.hash(newPassword, 12);
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  user.passwordChangedAt = new Date();
  await user.save();
};
