import { api } from "./axios";

export const investmentApi = {
  getPlans: () => api.get("/investment-plans"),
  getPlanById: (id: string) => api.get(`/investment-plans/${id}`),
  invest: (data: object) => api.post("/investments/invest", data),
  reinvest: (transactionId: string) => api.post(`/investments/reinvest/${transactionId}`),
  upgradePlan: (transactionId: string, newPlanId: string) =>
    api.patch(`/investments/upgrade/${transactionId}`, { newPlanId }),
  getMyInvestments: () => api.get("/investments/my"),
  // executor
  getAllPlans: () => api.get("/investment-plans/all"),
  createPlan: (data: object) => api.post("/investment-plans", data),
  updatePlan: (id: string, data: object) => api.patch(`/investment-plans/${id}`, data),
  togglePlan: (id: string) => api.patch(`/investment-plans/${id}/toggle`),
  deletePlan: (id: string) => api.delete(`/investment-plans/${id}`),
  getAllInvestments: (params?: object) => api.get("/investments/all", { params }),
  logProfit: (id: string, amount: number, note?: string) => api.post(`/investments/${id}/profit`, { amount, note }),
  updateInvestmentStatus: (id: string, status: string, reason?: string) => api.patch(`/investments/${id}/status`, { status, reason }),
  upgradePlanExecutor: (id: string, newPlanId: string) => api.patch(`/investments/upgrade-executor/${id}`, { newPlanId }),
  approveInvestment: (id: string) => api.patch(`/investments/${id}/approve`),
  rejectInvestment: (id: string, reason?: string) => api.patch(`/investments/${id}/reject`, { reason }),
};
