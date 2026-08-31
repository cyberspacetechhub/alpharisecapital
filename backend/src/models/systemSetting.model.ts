import { Schema, model, Document } from "mongoose";

export interface ISystemSetting extends Document {
  generalLoanLimit: number;
  createdAt: Date;
  updatedAt: Date;
}

const systemSettingSchema = new Schema<ISystemSetting>(
  {
    generalLoanLimit: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const SystemSetting = model<ISystemSetting>("SystemSetting", systemSettingSchema);
