import { api } from "./axios";

export const accountServiceApi = {
  getMyActiveServices: () => api.get("/account-services/my-active"),
  getAll: (params?: object) => api.get("/account-services/all", { params }),
  getUserServices: (userId: string) => api.get(`/account-services/user/${userId}`),
  getClientActivePlan: (userId: string) => api.get(`/account-services/client-active-plan/${userId}`),
  create: (data: {
    userId: string;
    serviceType: string;
    title: string;
    message: string;
    requiresPayment?: boolean;
    paymentAmount?: number;
    targetPlanId?: string;
  }) => api.post("/account-services/create", data),
  markResolved: (id: string) => api.patch(`/account-services/${id}/resolve`),
};
