import { WithdrawalMethod } from "../models/withdrawalMethod.model";
import { AppError } from "../utils/AppError";
import { WithdrawalMethodInput } from "../utils/validators/plan.validator";

export const createWithdrawalMethod = async (data: WithdrawalMethodInput) => {
  const exists = await WithdrawalMethod.findOne({ name: data.name });
  if (exists) throw new AppError("A withdrawal method with this name already exists", 409);
  return WithdrawalMethod.create(data);
};

export const updateWithdrawalMethod = async (id: string, data: Partial<WithdrawalMethodInput>) => {
  const method = await WithdrawalMethod.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  if (!method) throw new AppError("Withdrawal method not found", 404);
  return method;
};

export const toggleWithdrawalMethod = async (id: string) => {
  const method = await WithdrawalMethod.findById(id);
  if (!method) throw new AppError("Withdrawal method not found", 404);
  method.isActive = !method.isActive;
  return method.save();
};

export const deleteWithdrawalMethod = async (id: string) => {
  const method = await WithdrawalMethod.findByIdAndDelete(id);
  if (!method) throw new AppError("Withdrawal method not found", 404);
};

export const getActiveWithdrawalMethods = async () => {
  return WithdrawalMethod.find({ isActive: true }).sort({ name: 1 });
};

export const getAllWithdrawalMethods = async () => {
  return WithdrawalMethod.find().sort({ createdAt: -1 });
};

export const getWithdrawalMethodById = async (id: string) => {
  const method = await WithdrawalMethod.findById(id);
  if (!method) throw new AppError("Withdrawal method not found", 404);
  return method;
};
