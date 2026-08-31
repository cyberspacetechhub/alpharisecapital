import { api } from "./axios";

export interface WalletLinkInput {
  type: "crypto" | "bank";
  label: string;
  details: Record<string, string>;
  isPrimary?: boolean;
}

export interface WalletLink {
  _id: string;
  user: string;
  type: "crypto" | "bank";
  label: string;
  details: Record<string, string>;
  isPrimary: boolean;
  isVerified: boolean;
  verifiedBy?: string;
  verifiedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export const walletLinkApi = {
  getMyWallets: () => api.get<{ success: boolean; data: WalletLink[] }>("/wallet-links"),
  
  addWallet: (data: WalletLinkInput) => api.post<{ success: boolean; data: WalletLink }>("/wallet-links", data),
  
  setPrimary: (id: string) => api.patch<{ success: boolean; data: WalletLink }>(`/wallet-links/${id}/primary`),
  
  removeWallet: (id: string) => api.delete<{ success: boolean; message: string }>(`/wallet-links/${id}`),

  // Admin/Executor APIs
  getUserWallets: (userId: string) => api.get<{ success: boolean; data: WalletLink[] }>(`/wallet-links/user/${userId}`),
  
  verifyWallet: (id: string) => api.patch<{ success: boolean; data: WalletLink }>(`/wallet-links/${id}/verify`),

  getAllWallets: () => api.get<{ success: boolean; data: any[] }>("/wallet-links/all"),
};
