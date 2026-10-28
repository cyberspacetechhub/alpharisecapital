import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

function extractSenderName(rawFrom?: string): string {
  if (process.env.EMAIL_FROM_NAME) return process.env.EMAIL_FROM_NAME.trim();
  if (!rawFrom) return "Alpha Rise Global";
  const match = rawFrom.match(/^([^<]+)</);
  return match ? match[1].trim() : rawFrom.trim();
}

export interface SendEmailOptions {
  text?: string;
  fromName?: string;
  replyTo?: string;
}

export const sendEmail = async (
  to: string | string[],
  subject: string,
  html: string,
  options?: SendEmailOptions
) => {
  const mailServiceUrl = (process.env.MAIL_SERVICE_URL || "http://localhost:3001").replace(
    /\/+$/,
    ""
  );
  const mailServiceApiKey = process.env.MAIL_SERVICE_API_KEY?.trim();

  // Primary: Send through the standalone Next.js Gmail/Nodemailer microservice
  if (mailServiceApiKey) {
    const response = await fetch(`${mailServiceUrl}/api/send-email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": mailServiceApiKey,
      },
      body: JSON.stringify({
        to,
        subject,
        html,
        ...(options?.text ? { text: options.text } : {}),
        fromName: options?.fromName || extractSenderName(process.env.EMAIL_FROM),
        ...(options?.replyTo || process.env.EMAIL_REPLY_TO
          ? { replyTo: options?.replyTo || process.env.EMAIL_REPLY_TO }
          : {}),
      }),
    });

    const result = (await response.json().catch(() => ({}))) as {
      success?: boolean;
      message?: string;
      data?: any;
    };

    if (!response.ok || !result.success) {
      throw new Error(
        result.message || `Mail service request failed with status ${response.status}`
      );
    }

    return result.data;
  }

  // Fallback to Resend if MAIL_SERVICE_API_KEY is not configured yet
  if (!resend) {
    throw new Error(
      "Neither MAIL_SERVICE_API_KEY nor RESEND_API_KEY is configured in environment variables."
    );
  }

  const { data, error } = await resend.emails.send({
    from: process.env.EMAIL_FROM as string,
    to: Array.isArray(to) ? to : [to],
    subject,
    html,
  });

  if (error) {
    throw new Error(error.message || "Failed to send email via Resend");
  }

  return data;
};

