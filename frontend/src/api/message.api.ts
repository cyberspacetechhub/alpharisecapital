import { api } from "./axios";

export const messageApi = {
  getInbox: () => api.get("/messages"),
  getUnreadCount: () => api.get("/messages/unread-count"),
  markAllRead: () => api.patch("/messages/read-all"),
  markRead: (id: string) => api.patch(`/messages/${id}/read`),
  deleteMessage: (id: string) => api.delete(`/messages/${id}`),
  sendMessage: (data: object) => api.post("/messages/send", data),
};
