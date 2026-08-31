import { DepositMethod } from "../models/depositMethod.model";
import { AppError } from "../utils/AppError";
import { DepositMethodInput } from "../utils/validators/plan.validator";

export const createDepositMethod = async (data: DepositMethodInput) => {
  const exists = await DepositMethod.findOne({ name: data.name });
  if (exists) throw new AppError("A deposit method with this name already exists", 409);
  return DepositMethod.create(data);
};

export const updateDepositMethod = async (id: string, data: Partial<DepositMethodInput>) => {
  const method = await DepositMethod.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  if (!method) throw new AppError("Deposit method not found", 404);
  return method;
};

export const toggleDepositMethod = async (id: string) => {
  const method = await DepositMethod.findById(id);
  if (!method) throw new AppError("Deposit method not found", 404);
  method.isActive = !method.isActive;
  return method.save();
};

export const deleteDepositMethod = async (id: string) => {
  const method = await DepositMethod.findByIdAndDelete(id);
  if (!method) throw new AppError("Deposit method not found", 404);
};

export const getActiveDepositMethods = async () => {
  return DepositMethod.find({ isActive: true }).sort({ name: 1 });
};

export const getAllDepositMethods = async () => {
  return DepositMethod.find().sort({ createdAt: -1 });
};

export const getDepositMethodById = async (id: string) => {
  const method = await DepositMethod.findById(id);
  if (!method) throw new AppError("Deposit method not found", 404);
  return method;
};
