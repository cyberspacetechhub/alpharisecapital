import { Request, Response } from "express";
import { Resend } from "resend";
import { asyncHandler } from "../utils/asyncHandler";
import { AppError } from "../utils/AppError";

const resend = new Resend(process.env.RESEND_API_KEY) as any;
const emailFrom = process.env.EMAIL_FROM || "onboarding@resend.dev";

// ── Received emails ───────────────────────────────────────────────────────────

export const listEmails = asyncHandler(async (req: Request, res: Response) => {
  const { data, error } = await resend.emails.receiving.list();
  if (error) throw new AppError(error.message || "Failed to fetch inbox", 502);
  res.json({ success: true, data: data?.data || [] });
});

export const getEmail = asyncHandler(async (req: Request, res: Response) => {
  const { data, error } = await resend.emails.receiving.get(req.params.id);
  if (error) throw new AppError(error.message || "Email not found", 404);
  res.json({ success: true, data });
});

export const deleteEmail = asyncHandler(async (req: Request, res: Response) => {
  const apiRes = await fetch(`https://api.resend.com/emails/receiving/${req.params.id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}` },
  });
  if (!apiRes.ok) {
    const body = await apiRes.json().catch(() => ({}));
    throw new AppError(body?.message || "Failed to delete email", apiRes.status);
  }
  res.json({ success: true, message: "Email deleted." });
});

// ── Received email attachments ────────────────────────────────────────────────

export const listReceivedAttachments = asyncHandler(async (req: Request, res: Response) => {
  const { data, error } = await resend.attachments.receiving.list({ emailId: req.params.emailId });
  if (error) throw new AppError(error.message || "Failed to fetch attachments", 502);
  res.json({ success: true, data: data?.data || [] });
});

export const getReceivedAttachment = asyncHandler(async (req: Request, res: Response) => {
  const { data, error } = await resend.attachments.receiving.get({
    id: req.params.id,
    emailId: req.params.emailId,
  });
  if (error) throw new AppError(error.message || "Attachment not found", 404);
  res.json({ success: true, data });
});

// ── Sent emails ───────────────────────────────────────────────────────────────

export const listSentEmails = asyncHandler(async (req: Request, res: Response) => {
  const { data, error } = await resend.emails.list();
  if (error) throw new AppError(error.message || "Failed to fetch sent emails", 502);
  res.json({ success: true, data: data?.data || [] });
});

export const getSentEmail = asyncHandler(async (req: Request, res: Response) => {
  const { data, error } = await resend.emails.get(req.params.id);
  if (error) throw new AppError(error.message || "Sent email not found", 404);
  res.json({ success: true, data });
});

// ── Sent email attachments ────────────────────────────────────────────────────

export const listSentAttachments = asyncHandler(async (req: Request, res: Response) => {
  const { data, error } = await resend.emails.attachments.list({ emailId: req.params.emailId });
  if (error) throw new AppError(error.message || "Failed to fetch attachments", 502);
  res.json({ success: true, data: data?.data || [] });
});

export const getSentAttachment = asyncHandler(async (req: Request, res: Response) => {
  const { data, error } = await resend.emails.attachments.get({
    id: req.params.id,
    emailId: req.params.emailId,
  });
  if (error) throw new AppError(error.message || "Attachment not found", 404);
  res.json({ success: true, data });
});

// ── Compose / send ────────────────────────────────────────────────────────────

export const sendEmail = asyncHandler(async (req: Request, res: Response) => {
  const { to, subject, html, text } = req.body;
  if (!to || !subject) throw new AppError("to and subject are required", 400);
  if (!html && !text) throw new AppError("html or text body is required", 400);

  const { data, error } = await resend.emails.send({
    from: emailFrom,
    to: Array.isArray(to) ? to : [to],
    subject,
    ...(html ? { html } : { text }),
  });

  if (error) throw new AppError(error.message || "Failed to send email", 502);
  res.json({ success: true, data });
});
