import { InvestmentPlan } from "../models/investmentPlan.model";
import { AppError } from "../utils/AppError";
import { InvestmentPlanInput } from "../utils/validators/plan.validator";

export const createInvestmentPlan = async (data: InvestmentPlanInput) => {
  const exists = await InvestmentPlan.findOne({ name: data.name });
  if (exists) throw new AppError("An investment plan with this name already exists", 409);
  if (data.minAmount >= data.maxAmount)
    throw new AppError("minAmount must be less than maxAmount", 400);
  return InvestmentPlan.create(data);
};

export const updateInvestmentPlan = async (id: string, data: Partial<InvestmentPlanInput>) => {
  if (data.minAmount && data.maxAmount && data.minAmount >= data.maxAmount)
    throw new AppError("minAmount must be less than maxAmount", 400);
  const plan = await InvestmentPlan.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  if (!plan) throw new AppError("Investment plan not found", 404);
  return plan;
};

export const toggleInvestmentPlan = async (id: string) => {
  const plan = await InvestmentPlan.findById(id);
  if (!plan) throw new AppError("Investment plan not found", 404);
  plan.isActive = !plan.isActive;
  return plan.save();
};

export const deleteInvestmentPlan = async (id: string) => {
  const plan = await InvestmentPlan.findByIdAndDelete(id);
  if (!plan) throw new AppError("Investment plan not found", 404);
};

export const getActivePlans = async () => {
  return InvestmentPlan.find({ isActive: true }).sort({ minAmount: 1 });
};

export const getAllPlans = async () => {
  return InvestmentPlan.find().sort({ minAmount: 1 });
};

export const getPlanById = async (id: string) => {
  const plan = await InvestmentPlan.findById(id);
  if (!plan) throw new AppError("Investment plan not found", 404);
  return plan;
};
