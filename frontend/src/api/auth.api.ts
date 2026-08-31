import { api } from "./axios";

export const authApi = {
  registerTrader: (data: object) => api.post("/auth/register/trader", data),
  registerExecutor: (data: object) => api.post("/auth/register/executor", data),
  login: (data: { identifier: string; password: string }) => api.post("/auth/login", data),
  logout: () => api.post("/auth/logout"),
  refresh: () => api.post("/auth/refresh"),
  verifyEmail: (token: string) => api.get(`/auth/verify-email?token=${token}`),
  forgotPassword: (email: string) => api.post("/auth/forgot-password", { email }),
  resetPassword: (token: string, newPassword: string) =>
    api.post(`/auth/reset-password?token=${token}`, { newPassword }),
};
