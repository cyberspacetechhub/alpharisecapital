import jwt, { SignOptions } from "jsonwebtoken";
import crypto from "crypto";

export const generateAccessToken = (userId: string) =>
  jwt.sign({ userId }, process.env.ACCESS_TOKEN_SECRET as string, {
    expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN,
  } as SignOptions);

export const generateRefreshToken = (userId: string) =>
  jwt.sign({ userId }, process.env.REFRESH_TOKEN_SECRET as string, {
    expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN,
  } as SignOptions);

// Hex token for email verification and password reset (e.g. a3f9c1b2d4e6...)
export const generateHexToken = (bytes = 32): string => crypto.randomBytes(bytes).toString("hex");

// Transaction reference (e.g. TXN-a3f9c1b2)
export const generateReference = (): string => `TXN-${crypto.randomBytes(8).toString("hex").toUpperCase()}`;
