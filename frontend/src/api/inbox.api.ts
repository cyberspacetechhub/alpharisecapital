import { api } from "./axios";

export interface ResendEmail {
  id: string;
  from: string;
  to: string[];
  subject: string;
  html?: string;
  text?: string;
  created_at: string;
}

export interface SendEmailInput {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
}

export const inboxApi = {
  getEmails: () => api.get<{ success: boolean; data: ResendEmail[] }>("/inbox"),
  
  getEmail: (id: string) => api.get<{ success: boolean; data: ResendEmail }>(`/inbox/${id}`),
  
  deleteEmail: (id: string) => api.delete<{ success: boolean; message: string }>(`/inbox/${id}`),
  
  getSentEmails: () => api.get<{ success: boolean; data: ResendEmail[] }>("/inbox/sent/list"),
  
  getSentEmail: (id: string) => api.get<{ success: boolean; data: ResendEmail }>(`/inbox/sent/${id}`),
  
  sendEmail: (data: SendEmailInput) => api.post<{ success: boolean; data: any }>("/inbox/send", data),
};
