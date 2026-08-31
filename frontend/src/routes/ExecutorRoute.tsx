import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export const ExecutorRoute = () => {
  const { isAuthenticated, isExecutor } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!isExecutor) return <Navigate to="/trader/dashboard" replace />;
  return <Outlet />;
};
