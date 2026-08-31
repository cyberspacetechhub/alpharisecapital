import { api } from "./axios";

export const loanApi = {
  getActiveOffers: () => api.get("/loans/offers"),
  applyForLoan: (data: object) => api.post("/loans/apply", data),
  repayLoan: (id: string, amount: number) => api.post(`/loans/repay/${id}`, { amount }),
  getMyLoans: () => api.get("/loans/my"),
  // executor
  getAllOffers: () => api.get("/loans/offers/all"),
  createOffer: (data: object) => api.post("/loans/offers", data),
  toggleOffer: (id: string) => api.patch(`/loans/offers/${id}/toggle`),
  getAllApplications: () => api.get("/loans/applications"),
  approveLoan: (id: string) => api.patch(`/loans/applications/${id}/approve`),
  rejectLoan: (id: string, reason: string) => api.patch(`/loans/applications/${id}/reject`, { reason }),
  upgradeUserLoanLimit: (data: object) => api.patch("/loans/limit", data),
  getGeneralLoanLimit: () => api.get("/loans/general-limit"),
  updateGeneralLoanLimit: (data: { generalLoanLimit: number }) => api.patch("/loans/general-limit", data),
};
