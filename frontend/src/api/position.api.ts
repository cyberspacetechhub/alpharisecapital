import { api } from "./axios";

export const positionApi = {
  openPosition: (data: object) => api.post("/positions", data),
  closeMyPosition: (id: string) => api.patch(`/positions/${id}/close`),
  getMyPositions: (params?: object) => api.get("/positions/my", { params }),
  // executor
  getAllPositions: (params?: object) => api.get("/positions/all", { params }),
  forceClosePosition: (id: string, data: { exitPrice?: number; overridePnL?: number; remarks?: string }) =>
    api.patch(`/positions/${id}/force-close`, data),
};
