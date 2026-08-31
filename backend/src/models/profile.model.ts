import { Schema, model, Document, Types } from "mongoose";

export type ProfileType = "Executor" | "Trader";

export interface IProfile extends Document {
  user: Types.ObjectId;
  type: ProfileType;
  avatar?: string;
  bio?: string;
  country?: string;
  timezone?: string;
  createdAt: Date;
  updatedAt: Date;
}

const profileSchema = new Schema<IProfile>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    type: { type: String, required: true, enum: ["Executor", "Trader"] },
    avatar: { type: String },
    bio: { type: String },
    country: { type: String },
    timezone: { type: String },
  },
  {
    timestamps: true,
    discriminatorKey: "type",
  }
);

export const Profile = model<IProfile>("Profile", profileSchema);
