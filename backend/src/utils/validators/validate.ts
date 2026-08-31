import { ZodSchema } from "zod";
import { Request, Response, NextFunction } from "express";
import { AppError } from "../AppError";

export const validate = (schema: ZodSchema) => (req: Request, _res: Response, next: NextFunction) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    const message = result.error.issues.map((e) => e.message).join(", ");
    return next(new AppError(message, 400));
  }
  req.body = result.data;
  next();
};
