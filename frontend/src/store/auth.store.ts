import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  type: "Trader" | "Executor";
}

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  impersonatorAdmin: { user: AuthUser; accessToken: string } | null;
  setAuth: (user: AuthUser, accessToken: string) => void;
  setAccessToken: (token: string) => void;
  setImpersonation: (traderUser: AuthUser, traderAccessToken: string, adminUser: AuthUser, adminAccessToken: string) => void;
  stopImpersonation: () => { adminUser: AuthUser | null };
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      impersonatorAdmin: null,
      setAuth: (user, accessToken) => set({ user, accessToken, isAuthenticated: true }),
      setAccessToken: (accessToken) => set({ accessToken }),
      setImpersonation: (traderUser, traderAccessToken, adminUser, adminAccessToken) =>
        set({
          user: traderUser,
          accessToken: traderAccessToken,
          isAuthenticated: true,
          impersonatorAdmin: { user: adminUser, accessToken: adminAccessToken },
        }),
      stopImpersonation: () => {
        const state = get();
        if (state.impersonatorAdmin) {
          const { user: adminUser, accessToken: adminAccessToken } = state.impersonatorAdmin;
          set({
            user: adminUser,
            accessToken: adminAccessToken,
            isAuthenticated: true,
            impersonatorAdmin: null,
          });
          return { adminUser };
        }
        return { adminUser: null };
      },
      clearAuth: () => set({ user: null, accessToken: null, isAuthenticated: false, impersonatorAdmin: null }),
    }),
    {
      name: "auth",
      partialize: (s) => ({
        user: s.user,
        isAuthenticated: s.isAuthenticated,
        impersonatorAdmin: s.impersonatorAdmin,
      }),
    }
  )
);
