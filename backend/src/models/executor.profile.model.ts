import { Schema, Document } from "mongoose";
import { Profile, IProfile } from "./profile.model";

export interface IExecutorProfile extends IProfile {
  department: string;
  permissions: string[];
  canApproveDeposits: boolean;
  canApproveWithdrawals: boolean;
  canManagePlans: boolean;
  canManageUsers: boolean;
}

const executorSchema = new Schema<IExecutorProfile>({
  department: { type: String, default: "Operations" },
  permissions: [{ type: String }],
  canApproveDeposits: { type: Boolean, default: false },
  canApproveWithdrawals: { type: Boolean, default: false },
  canManagePlans: { type: Boolean, default: false },
  canManageUsers: { type: Boolean, default: false },
});

export const ExecutorProfile = Profile.discriminator<IExecutorProfile>("Executor", executorSchema);
