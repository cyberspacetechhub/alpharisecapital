import { Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { AuthRequest } from "../middlewares/auth.middleware";
import * as loanService from "../services/loan.service";
import { LoanOffer, LoanApplication } from "../models/loan.model";
import { AppError } from "../utils/AppError";

export const createOffer = asyncHandler(async (req: AuthRequest, res: Response) => {
  const offer = await loanService.createLoanOffer(req.userId!, req.body);
  res.status(201).json({ success: true, data: offer });
});

export const toggleOffer = asyncHandler(async (req: AuthRequest, res: Response) => {
  const offer = await loanService.toggleLoanOffer(req.params.id);
  res.json({ success: true, data: offer });
});

export const getActiveOffers = asyncHandler(async (_req: AuthRequest, res: Response) => {
  const offers = await LoanOffer.find({ isActive: true }).sort({ createdAt: -1 });
  res.json({ success: true, data: offers });
});

export const getAllOffers = asyncHandler(async (_req: AuthRequest, res: Response) => {
  const offers = await LoanOffer.find().sort({ createdAt: -1 });
  res.json({ success: true, data: offers });
});

export const applyForLoan = asyncHandler(async (req: AuthRequest, res: Response) => {
  const application = await loanService.applyForLoan(req.userId!, req.body.offerId, req.body.requestedAmount);
  res.status(201).json({ success: true, data: application });
});

export const approveLoan = asyncHandler(async (req: AuthRequest, res: Response) => {
  const application = await loanService.approveLoan(req.params.id, req.userId!);
  res.json({ success: true, data: application });
});

export const rejectLoan = asyncHandler(async (req: AuthRequest, res: Response) => {
  const application = await loanService.rejectLoan(req.params.id, req.userId!, req.body.reason);
  res.json({ success: true, data: application });
});

export const upgradeUserLoanLimit = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = await loanService.upgradeUserLoanLimit(req.body.userId, req.body.loanLimit, req.body.creditScore);
  res.json({ success: true, data: { loanLimit: user.loanLimit, creditScore: user.creditScore } });
});

export const repayLoan = asyncHandler(async (req: AuthRequest, res: Response) => {
  const application = await loanService.repayLoan(req.userId!, req.params.id, req.body.amount);
  res.json({ success: true, data: application });
});

export const getMyLoans = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = await LoanApplication.find({ user: req.userId })
    .populate("offer", "title interestRate interestType durationDays")
    .sort({ createdAt: -1 });
  res.json({ success: true, data });
});

export const getAllApplications = asyncHandler(async (_req: AuthRequest, res: Response) => {
  const data = await LoanApplication.find()
    .populate("user", "username email creditScore loanLimit")
    .populate("offer", "title interestRate")
    .sort({ createdAt: -1 });
  res.json({ success: true, data });
});

export const getGeneralLimit = asyncHandler(async (_req: AuthRequest, res: Response) => {
  const generalLoanLimit = await loanService.getGeneralLoanLimit();
  res.json({ success: true, data: { generalLoanLimit } });
});

export const updateGeneralLimit = asyncHandler(async (req: AuthRequest, res: Response) => {
  const settings = await loanService.updateGeneralLoanLimit(Number(req.body.generalLoanLimit));
  res.json({ success: true, data: settings });
});
