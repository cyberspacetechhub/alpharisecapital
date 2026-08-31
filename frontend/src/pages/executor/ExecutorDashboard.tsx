import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../hooks/useAuth";
import { userApi } from "../../api/user.api";
import { transactionApi } from "../../api/transaction.api";
import { formatCurrency, formatDate, getStatusColor } from "../../utils";
import type { Transaction, ApiResponse } from "../../types";

const Skeleton = ({ className }: { className?: string }) => (
  <div className={`animate-pulse bg-gray-200 rounded-lg ${className}`} />
);

const StatCard = ({
  label,
  value,
  icon,
  accent,
  loading,
  onClick,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  accent: string;
  loading: boolean;
  onClick?: () => void;
}) => (
  <button
    onClick={onClick}
    className="bg-white rounded-2xl border border-gray-100 p-5 text-left hover:shadow-sm transition-shadow w-full"
  >
    <div className="flex items-start justify-between mb-3">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${accent}`}>
        {icon}
      </div>
    </div>
    {loading ? (
      <Skeleton className="h-7 w-20 mb-1" />
    ) : (
      <p className="text-2xl font-bold text-gray-800">{value}</p>
    )}
    <p className="text-xs text-gray-400 font-medium mt-0.5">{label}</p>
  </button>
);

export default function ExecutorDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: tradersData, isLoading: tradersLoading } = useQuery({
    queryKey: ["all-traders"],
    queryFn: () => userApi.getAllTraders({ limit: 5 }).then((r) => r.data),
  });

  const { data: txData, isLoading: txLoading } = useQuery<ApiResponse<Transaction[]>>({
    queryKey: ["all-transactions"],
    queryFn: () => transactionApi.getAllTransactions({ limit: 8, status: "pending" }).then((r) => r.data),
  });

  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ["executor-dashboard-stats"],
    queryFn: () => userApi.getExecutorStats().then((r) => r.data.data),
  });

  const traders = tradersData?.users ?? [];
  const totalTraders = tradersData?.total ?? 0;
  const pendingTx: Transaction[] = txData?.data ?? [];
  const pendingCount = txData?.total ?? 0;

  const stats = [
    {
      label: "Total Clients",
      value: statsLoading ? "—" : statsData?.totalClients ?? totalTraders,
      accent: "bg-blue-50",
      onClick: () => navigate("/executor/clients"),
      icon: (
        <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
    {
      label: "Pending Transactions",
      value: statsLoading ? "—" : statsData?.totalPendingTransactions ?? pendingCount,
      accent: "bg-yellow-50",
      onClick: () => navigate("/executor/transactions"),
      icon: (
        <svg className="w-5 h-5 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      label: "Active Investments",
      value: statsLoading ? "—" : statsData?.activeInvestmentsCount ?? 0,
      accent: "bg-[#f0f7f4]",
      onClick: () => navigate("/executor/investments"),
      icon: (
        <svg className="w-5 h-5 text-[#2d6a4f]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      ),
    },
    {
      label: "Total Client Balance",
      value: statsLoading ? "—" : formatCurrency(statsData?.totalClientBalance ?? 0),
      accent: "bg-green-50",
      icon: (
        <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      label: "Total Client Invested",
      value: statsLoading ? "—" : formatCurrency(statsData?.totalClientInvested ?? 0),
      accent: "bg-purple-50",
      icon: (
        <svg className="w-5 h-5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
    },
    {
      label: "Pending KYC Applications",
      value: statsLoading ? "—" : statsData?.pendingKycCount ?? 0,
      accent: "bg-orange-50",
      onClick: () => navigate("/executor/clients"),
      icon: (
        <svg className="w-5 h-5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="space-y-5 max-w-6xl mx-auto">

      {/* Welcome banner */}
      <div className="relative overflow-hidden bg-[#1a3a2a] rounded-2xl p-5 lg:p-6 text-white">
        <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-white/5" />
        <div className="absolute -bottom-10 -right-4 w-28 h-28 rounded-full bg-white/5" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-white/10 text-white/70">
              Administrator
            </span>
          </div>
          <h2 className="text-2xl font-bold">Welcome, {user?.username ?? "Executor"}</h2>
          <p className="text-white/60 text-sm mt-1.5 max-w-lg leading-relaxed">
            Manage clients, approve transactions, oversee investments and loans from your admin panel.
          </p>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4">
        {stats.map((s) => (
          <StatCard
            key={s.label}
            label={s.label}
            value={s.value}
            icon={s.icon}
            accent={s.accent}
            loading={statsLoading}
            onClick={s.onClick}
          />
        ))}
      </div>

      {/* Management Shortcuts */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Management Shortcuts</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            ["Deposit Methods", "/executor/deposit-methods", "bg-green-50 text-green-700 hover:bg-green-100/70"],
            ["Withdrawal Methods", "/executor/withdrawal-methods", "bg-purple-50 text-purple-700 hover:bg-purple-100/70"],
            ["Investment Plans", "/executor/investments", "bg-[#f0f7f4] text-[#2d6a4f] hover:bg-[#e0f0e8]"],
            ["Loan Offers", "/executor/loans", "bg-orange-50 text-orange-700 hover:bg-orange-100/70"],
          ].map(([label, path, colors]) => (
            <button
              key={label}
              onClick={() => navigate(path)}
              className={`py-3 px-4 rounded-xl font-bold text-xs transition-colors ${colors}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Pending transactions */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-gray-800">Pending Transactions</h3>
              {pendingCount > 0 && (
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700">
                  {pendingCount}
                </span>
              )}
            </div>
            <button
              onClick={() => navigate("/executor/transactions")}
              className="text-xs text-[#2d6a4f] font-semibold hover:underline"
            >
              View all
            </button>
          </div>

          {txLoading ? (
            <div className="p-5 space-y-3">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : pendingTx.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <p className="text-sm text-gray-400">No pending transactions</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-50">
              {pendingTx.map((tx) => (
                <li
                  key={tx._id}
                  className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => navigate("/executor/transactions")}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                      tx.type === "deposit" ? "bg-green-50" : "bg-red-50"
                    }`}>
                      <svg className={`w-4 h-4 ${tx.type === "deposit" ? "text-green-600" : "text-red-500"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        {tx.type === "deposit"
                          ? <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                          : <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
                        }
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-700 capitalize">{tx.type}</p>
                      <p className="text-xs text-gray-400">{formatDate(tx.createdAt)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-gray-800">{formatCurrency(tx.amount)}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getStatusColor(tx.status)}`}>
                      {tx.status}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Recent clients */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
            <h3 className="text-sm font-semibold text-gray-800">Recent Clients</h3>
            <button
              onClick={() => navigate("/executor/clients")}
              className="text-xs text-[#2d6a4f] font-semibold hover:underline"
            >
              View all
            </button>
          </div>

          {tradersLoading ? (
            <div className="p-5 space-y-3">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : traders.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <p className="text-sm text-gray-400">No clients yet</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-50">
              {traders.map((trader: any) => (
                <li
                  key={trader._id}
                  className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => navigate(`/executor/clients/${trader._id}`)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#1a3a2a] flex items-center justify-center text-white text-xs font-bold uppercase shrink-0">
                      {trader.username?.charAt(0) ?? "T"}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-700">{trader.username}</p>
                      <p className="text-xs text-gray-400">{trader.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-gray-800">{formatCurrency(trader.balance ?? 0)}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      trader.kycStatus === "approved" ? "bg-green-100 text-green-700" :
                      trader.kycStatus === "pending" ? "bg-yellow-100 text-yellow-700" :
                      "bg-gray-100 text-gray-500"
                    }`}>
                      KYC: {trader.kycStatus}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

      </div>
    </div>
  );
}
