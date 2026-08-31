import { api } from "./axios";

export const transactionApi = {
  deposit: (data: object) => api.post("/transactions/deposit", data),
  withdraw: (data: object) => api.post("/transactions/withdraw", data),
  getMyTransactions: (params?: object) => api.get("/transactions/my", { params }),
  // executor
  getAllTransactions: (params?: object) => api.get("/transactions/all", { params }),
  approveDeposit: (id: string) => api.patch(`/transactions/deposit/${id}/approve`),
  rejectDeposit: (id: string, reason: string) => api.patch(`/transactions/deposit/${id}/reject`, { reason }),
  approveWithdrawal: (id: string) => api.patch(`/transactions/withdrawal/${id}/approve`),
  rejectWithdrawal: (id: string, reason: string) => api.patch(`/transactions/withdrawal/${id}/reject`, { reason }),
};
