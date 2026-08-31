import { api } from "./axios";

export const messageApi = {
  getInbox: (params?: object) => api.get("/messages", { params }),
  getUnreadCount: () => api.get("/messages/unread-count"),
  markRead: (id: string) => api.patch(`/messages/${id}/read`),
  markAllRead: () => api.patch("/messages/read-all"),
  deleteMessage: (id: string) => api.delete(`/messages/${id}`),
  // executor
  sendMessage: (data: object) => api.post("/messages/send", data),
};

export const walletApi = {
  getMyWallets: () => api.get("/wallet-links"),
  addWallet: (data: object) => api.post("/wallet-links", data),
  setPrimary: (id: string) => api.patch(`/wallet-links/${id}/primary`),
  removeWallet: (id: string) => api.delete(`/wallet-links/${id}`),
  // executor
  getUserWallets: (userId: string) => api.get(`/wallet-links/user/${userId}`),
  verifyWallet: (id: string) => api.patch(`/wallet-links/${id}/verify`),
};

export const depositMethodApi = {
  getActive: () => api.get("/deposit-methods"),
  getById: (id: string) => api.get(`/deposit-methods/${id}`),
  // executor
  getAll: () => api.get("/deposit-methods/all"),
  create: (data: object) => api.post("/deposit-methods", data),
  update: (id: string, data: object) => api.patch(`/deposit-methods/${id}`, data),
  toggle: (id: string) => api.patch(`/deposit-methods/${id}/toggle`),
  remove: (id: string) => api.delete(`/deposit-methods/${id}`),
};

export const withdrawalMethodApi = {
  getActive: () => api.get("/withdrawal-methods"),
  getById: (id: string) => api.get(`/withdrawal-methods/${id}`),
  // executor
  getAll: () => api.get("/withdrawal-methods/all"),
  create: (data: object) => api.post("/withdrawal-methods", data),
  update: (id: string, data: object) => api.patch(`/withdrawal-methods/${id}`, data),
  toggle: (id: string) => api.patch(`/withdrawal-methods/${id}/toggle`),
  remove: (id: string) => api.delete(`/withdrawal-methods/${id}`),
};
