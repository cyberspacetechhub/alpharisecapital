import { api } from "./axios";

export const userApi = {
  getMe: () => api.get("/users/me"),
  getDashboard: () => api.get("/users/dashboard"),
  updateProfile: (data: object) => api.patch("/users/me", data),
  updateAvatar: (formData: FormData) =>
    api.patch("/users/me/avatar", formData, { headers: { "Content-Type": "multipart/form-data" } }),
  changePassword: (data: object) => api.patch("/users/me/password", data),
  submitKyc: (data: object) => api.post("/users/me/kyc", data),
  uploadFile: (formData: FormData) =>
    api.post("/users/me/upload", formData, { headers: { "Content-Type": "multipart/form-data" } }),
  // executor
  getAllTraders: (params?: object) => api.get("/users/traders", { params }),
  getTraderDetails: (id: string) => api.get(`/users/traders/${id}`),
  updateKycStatus: (id: string, status: string) => api.patch(`/users/traders/${id}/kyc`, { status }),
  unverifyTrader: (id: string) => api.patch(`/users/traders/${id}/unverify`),
  toggleUserActive: (id: string) => api.patch(`/users/traders/${id}/toggle`),
  getExecutorStats: () => api.get("/users/executor-stats"),
  impersonateTrader: (id: string) => api.post(`/users/traders/${id}/impersonate`),
  manageTraderBalance: (id: string, data: object) => api.post(`/users/traders/${id}/balance-action`, data),
};
