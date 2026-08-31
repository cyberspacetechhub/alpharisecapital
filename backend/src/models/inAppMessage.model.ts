import { Schema, model, Document, Types } from "mongoose";

export type MessageType = "system" | "direct";

export interface IInAppMessage extends Document {
  sender?: Types.ObjectId;
  recipient: Types.ObjectId;
  subject: string;
  body: string;
  type: MessageType;
  isRead: boolean;
  readAt?: Date;
  relatedModel?: "Transaction" | "Loan" | "Position";
  relatedId?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const inAppMessageSchema = new Schema<IInAppMessage>(
  {
    sender: { type: Schema.Types.ObjectId, ref: "User" },
    recipient: { type: Schema.Types.ObjectId, ref: "User", required: true },
    subject: { type: String, required: true },
    body: { type: String, required: true },
    type: { type: String, enum: ["system", "direct"], default: "system" },
    isRead: { type: Boolean, default: false },
    readAt: { type: Date },
    relatedModel: { type: String, enum: ["Transaction", "Loan", "Position"] },
    relatedId: { type: Schema.Types.ObjectId },
  },
  { timestamps: true }
);

inAppMessageSchema.index({ recipient: 1, isRead: 1 });

export const InAppMessage = model<IInAppMessage>("InAppMessage", inAppMessageSchema);
