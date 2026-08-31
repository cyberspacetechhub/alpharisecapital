import mongoose from "mongoose";
import { InAppMessage } from "../models/inAppMessage.model";
import { User } from "../models/user.model";
import { AppError } from "../utils/AppError";
import { sendEmail } from "./email.service";
import { inAppMessageNotificationEmail } from "../emails";
import { SendMessageInput } from "../utils/validators/user.validator";

export const sendMessage = async (senderId: string, data: SendMessageInput) => {
  const recipient = await User.findById(data.recipientId).select("email username");
  if (!recipient) throw new AppError("Recipient not found", 404);

  const message = await InAppMessage.create({
    sender: new mongoose.Types.ObjectId(senderId),
    recipient: new mongoose.Types.ObjectId(data.recipientId),
    subject: data.subject,
    body: data.body,
    type: "direct",
    relatedModel: data.relatedModel,
    relatedId: data.relatedId ? new mongoose.Types.ObjectId(data.relatedId) : undefined,
  });

  // notify via email with a preview
  const preview = data.body.slice(0, 120);
  await sendEmail(
    recipient.email,
    `New message: ${data.subject}`,
    inAppMessageNotificationEmail(
      recipient.username,
      data.subject,
      preview,
      `${process.env.CLIENT_URL}/dashboard/messages`
    )
  );

  return message;
};

export const sendSystemMessage = async (recipientId: string, subject: string, body: string, relatedModel?: "Transaction" | "Loan" | "Position", relatedId?: string) => {
  return InAppMessage.create({
    recipient: new mongoose.Types.ObjectId(recipientId),
    subject,
    body,
    type: "system",
    relatedModel,
    relatedId: relatedId ? new mongoose.Types.ObjectId(relatedId) : undefined,
  });
};

export const getMyInbox = async (userId: string, page: number, limit: number) => {
  const filter = { recipient: new mongoose.Types.ObjectId(userId) };
  const [messages, total, unreadCount] = await Promise.all([
    InAppMessage.find(filter)
      .populate("sender", "username")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    InAppMessage.countDocuments(filter),
    InAppMessage.countDocuments({ ...filter, isRead: false }),
  ]);
  return { messages, total, unreadCount, page, pages: Math.ceil(total / limit) };
};

export const markAsRead = async (userId: string, messageId: string) => {
  const message = await InAppMessage.findOne({ _id: messageId, recipient: userId });
  if (!message) throw new AppError("Message not found", 404);
  if (!message.isRead) {
    message.isRead = true;
    message.readAt = new Date();
    await message.save();
  }
  return message;
};

export const markAllAsRead = async (userId: string) => {
  await InAppMessage.updateMany(
    { recipient: new mongoose.Types.ObjectId(userId), isRead: false },
    { isRead: true, readAt: new Date() }
  );
};

export const getUnreadCount = async (userId: string) => {
  return InAppMessage.countDocuments({ recipient: new mongoose.Types.ObjectId(userId), isRead: false });
};

export const deleteMessage = async (userId: string, messageId: string) => {
  const message = await InAppMessage.findOneAndDelete({ _id: messageId, recipient: userId });
  if (!message) throw new AppError("Message not found", 404);
};
