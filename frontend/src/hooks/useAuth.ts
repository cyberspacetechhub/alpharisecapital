import { useAuthStore } from "../store/auth.store";

export const useAuth = () => {
  const { user, accessToken, isAuthenticated, setAuth, clearAuth } = useAuthStore();
  const isExecutor = user?.type === "Executor";
  const isTrader = user?.type === "Trader";
  return { user, accessToken, isAuthenticated, isExecutor, isTrader, setAuth, clearAuth };
};
