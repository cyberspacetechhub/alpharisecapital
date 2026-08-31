import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/AppError";

export const errorHandler = (err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ success: false, message: err.message });
  }

  // Mongoose duplicate key
  if (typeof err === "object" && err !== null && (err as { code?: number }).code === 11000) {
    const field = Object.keys((err as { keyValue?: object }).keyValue ?? {})[0];
    return res.status(409).json({ success: false, message: `${field} already exists` });
  }

  // Mongoose cast error
  if (typeof err === "object" && err !== null && (err as { name?: string }).name === "CastError") {
    return res.status(400).json({ success: false, message: "Invalid ID format" });
  }

  console.error(err);
  res.status(500).json({ success: false, message: "Internal server error" });
};
