import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../hooks/useAuth";
import { userApi } from "../../api/user.api";
import { transactionApi } from "../../api/transaction.api";
import { formatCurrency, formatDate, getStatusColor } from "../../utils";
import type { Transaction, ApiResponse } from "../../types";

const Skeleton = ({ className }: { className?: string }) => (
  <div className={`animate-pulse bg-white/10 rounded-lg ${className}`} />
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
    className="bg-[#121822] rounded-3xl border border-white/10 p-5 text-left hover:border-white/20 transition-all w-full group cursor-pointer shadow-sm"
  >
    <div className="flex items-start justify-between mb-3">
      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${accent}`}>
        {icon}
      </div>
    </div>
    {loading ? (
      <Skeleton className="h-7 w-20 mb-1" />
    ) : (
      <p className="text-2xl font-black text-white">{value}</p>
    )}
    <p className="text-xs text-slate-400 font-bold mt-1 tracking-wide">{label}</p>
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
      accent: "bg-blue-500/15 border border-blue-500/30 text-blue-400",
      onClick: () => navigate("/executor/clients"),
      icon: (
        <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
    {
      label: "Pending Transactions",
      value: statsLoading ? "—" : statsData?.totalPendingTransactions ?? pendingCount,
      accent: "bg-amber-500/15 border border-amber-500/30 text-amber-400",
      onClick: () => navigate("/executor/transactions"),
      icon: (
        <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      label: "Active Investments",
      value: statsLoading ? "—" : statsData?.activeInvestmentsCount ?? 0,
      accent: "bg-emerald-500/15 border border-emerald-500/30 text-[#00e676]",
      onClick: () => navigate("/executor/investments"),
      icon: (
        <svg className="w-5 h-5 text-[#00e676]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      ),
    },
    {
      label: "Total Client Balance",
      value: statsLoading ? "—" : formatCurrency(statsData?.totalClientBalance ?? 0),
      accent: "bg-[#00c076]/15 border border-[#00c076]/30 text-[#00e676]",
      icon: (
        <svg className="w-5 h-5 text-[#00e676]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      label: "Total Client Invested",
      value: statsLoading ? "—" : formatCurrency(statsData?.totalClientInvested ?? 0),
      accent: "bg-purple-500/15 border border-purple-500/30 text-purple-400",
      icon: (
        <svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
    },
    {
      label: "Pending KYC Reviews",
      value: statsLoading ? "—" : statsData?.pendingKycCount ?? 0,
      accent: "bg-rose-500/15 border border-rose-500/30 text-rose-400",
      onClick: () => navigate("/executor/kyc"),
      icon: (
        <svg className="w-5 h-5 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">

      {/* Welcome banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#121822] via-[#0b2419] to-[#121822] border border-[#00c076]/30 rounded-3xl p-6 lg:p-7 text-white shadow-lg">
        <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-[#00c076]/10 blur-2xl" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-[#00c076]/20 text-[#00e676] border border-[#00c076]/40 uppercase">
              Administrator Portal
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black">Welcome, {user?.username ?? "Executor"}</h2>
          <p className="text-slate-300 text-xs sm:text-sm mt-1.5 max-w-xl leading-relaxed">
            Manage clients, inspect compliance, approve live ledger transactions, and adjust trading parameters in real time.
          </p>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
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
      <div className="bg-[#121822] rounded-3xl border border-white/10 p-6 shadow-sm">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Management Shortcuts</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            ["Deposit Methods", "/executor/deposit-methods", "bg-emerald-500/15 text-[#00e676] border border-emerald-500/30 hover:bg-emerald-500/25"],
            ["Withdrawal Methods", "/executor/withdrawal-methods", "bg-purple-500/15 text-purple-300 border border-purple-500/30 hover:bg-purple-500/25"],
            ["Investment Plans", "/executor/investments", "bg-blue-500/15 text-blue-300 border border-blue-500/30 hover:bg-blue-500/25"],
            ["Loan Offers", "/executor/loans", "bg-amber-500/15 text-amber-300 border border-amber-500/30 hover:bg-amber-500/25"],
          ].map(([label, path, colors]) => (
            <button
              key={label}
              onClick={() => navigate(path)}
              className={`py-3.5 px-4 rounded-2xl font-bold text-xs transition-all cursor-pointer text-center ${colors}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Pending transactions */}
        <div className="bg-[#121822] rounded-3xl border border-white/10 overflow-hidden shadow-sm">
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#0e1520]">
            <div className="flex items-center gap-2.5">
              <h3 className="text-sm font-bold text-white">Pending Transactions</h3>
              {pendingCount > 0 && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse">
                  {pendingCount}
                </span>
              )}
            </div>
            <button
              onClick={() => navigate("/executor/transactions")}
              className="text-xs text-[#00e676] font-bold hover:underline"
            >
              View all →
            </button>
          </div>

          {txLoading ? (
            <div className="p-5 space-y-3">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : pendingTx.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <p className="text-sm text-slate-500">No pending transactions</p>
            </div>
          ) : (
            <ul className="divide-y divide-white/5">
              {pendingTx.map((tx) => (
                <li
                  key={tx._id}
                  className="flex items-center justify-between px-6 py-4 hover:bg-white/5 cursor-pointer transition-colors"
                  onClick={() => navigate("/executor/transactions")}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 ${
                      tx.type === "deposit"
                        ? "bg-emerald-500/15 border border-emerald-500/30 text-[#00e676]"
                        : "bg-rose-500/15 border border-rose-500/30 text-rose-400"
                    }`}>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        {tx.type === "deposit"
                          ? <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                          : <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
                        }
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white capitalize">{tx.type}</p>
                      <p className="text-[10px] text-slate-400 font-mono">{formatDate(tx.createdAt)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-white font-mono">{formatCurrency(tx.amount)}</p>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${getStatusColor(tx.status)}`}>
                      {tx.status}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Recent clients */}
        <div className="bg-[#121822] rounded-3xl border border-white/10 overflow-hidden shadow-sm">
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#0e1520]">
            <h3 className="text-sm font-bold text-white">Recent Clients</h3>
            <button
              onClick={() => navigate("/executor/clients")}
              className="text-xs text-[#00e676] font-bold hover:underline"
            >
              View all →
            </button>
          </div>

          {tradersLoading ? (
            <div className="p-5 space-y-3">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : traders.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <p className="text-sm text-slate-500">No clients yet</p>
            </div>
          ) : (
            <ul className="divide-y divide-white/5">
              {traders.map((trader: any) => (
                <li
                  key={trader._id}
                  className="flex items-center justify-between px-6 py-4 hover:bg-white/5 cursor-pointer transition-colors"
                  onClick={() => navigate(`/executor/clients/${trader._id}`)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-2xl bg-[#00c076]/20 border border-[#00c076]/30 flex items-center justify-center text-[#00e676] text-xs font-black uppercase shrink-0">
                      {trader.username?.charAt(0) ?? "T"}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">{trader.username}</p>
                      <p className="text-[10px] text-slate-400 font-mono">{trader.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-white font-mono">{formatCurrency(trader.balance ?? 0)}</p>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                      trader.kycStatus === "approved"
                        ? "bg-emerald-500/15 text-[#00e676] border border-emerald-500/30"
                        : trader.kycStatus === "pending"
                        ? "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                        : "bg-white/5 text-slate-400 border border-white/10"
                    }`}>
                      KYC: {trader.kycStatus || "none"}
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
