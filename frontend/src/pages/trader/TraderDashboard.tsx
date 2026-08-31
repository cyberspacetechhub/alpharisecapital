import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../hooks/useAuth";
import { userApi } from "../../api/user.api";
import { transactionApi } from "../../api/transaction.api";
import { investmentApi } from "../../api/investment.api";
import { formatCurrency, formatDate, getStatusColor } from "../../utils";
import type { DashboardSummary, Transaction, ApiResponse } from "../../types";

// ── small reusable pieces ────────────────────────────────────────────────────

const Skeleton = ({ className }: { className?: string }) => (
  <div className={`animate-pulse bg-gray-200 rounded-lg ${className}`} />
);

const StatCard = ({
  label,
  value,
  sub,
  loading,
}: {
  label: string;
  value: string;
  sub?: string;
  loading: boolean;
}) => (
  <div className="bg-white rounded-2xl border border-gray-100 p-4">
    <p className="text-xs text-gray-400 font-medium mb-1">{label}</p>
    {loading ? (
      <Skeleton className="h-6 w-28 mt-1" />
    ) : (
      <p className="text-lg font-bold text-[#1a3a2a]">{value}</p>
    )}
    {sub && !loading && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
  </div>
);

const ActionBtn = ({
  label,
  icon,
  onClick,
  variant = "default",
}: {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  variant?: "default" | "primary";
}) => (
  <button
    onClick={onClick}
    className={`flex-1 flex flex-col items-center gap-1.5 py-3 rounded-2xl text-xs font-semibold transition-colors ${
      variant === "primary"
        ? "bg-[#1a3a2a] text-white hover:bg-[#2d6a4f]"
        : "bg-white border border-gray-100 text-gray-700 hover:bg-gray-50"
    }`}
  >
    <span className={`w-8 h-8 rounded-xl flex items-center justify-center ${
      variant === "primary" ? "bg-white/15" : "bg-[#f0f7f4]"
    }`}>
      {icon}
    </span>
    {label}
  </button>
);

// ── market status ────────────────────────────────────────────────────────────

const useMarketOpen = () => {
  const now = new Date();
  const day = now.getUTCDay();
  const hour = now.getUTCHours();
  // forex market: Mon 00:00 – Fri 22:00 UTC (simplified)
  const isOpen = day >= 1 && day <= 5 && !(day === 5 && hour >= 22);
  return isOpen;
};

// ── main component ───────────────────────────────────────────────────────────

export default function TraderDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const marketOpen = useMarketOpen();

  const { data: dashData, isLoading: dashLoading } = useQuery<DashboardSummary>({
    queryKey: ["dashboard"],
    queryFn: () => userApi.getDashboard().then((r) => r.data.data),
  });

  const { data: txData, isLoading: txLoading } = useQuery<ApiResponse<Transaction[]>>({
    queryKey: ["my-transactions"],
    queryFn: () => transactionApi.getMyTransactions({ limit: 5 }).then((r) => r.data),
  });

  const { data: invData, isLoading: invLoading } = useQuery({
    queryKey: ["my-investments"],
    queryFn: () => investmentApi.getMyInvestments().then((r) => r.data.data),
  });

  const transactions: Transaction[] = txData?.data ?? [];
  const investments = (invData ?? []).filter((i: Transaction) => i.status === "approved").slice(0, 3);

  const balanceCards = [
    { label: "Available Balance", value: formatCurrency(dashData?.balance ?? 0) },
    { label: "Invested Balance", value: formatCurrency(dashData?.investedBalance ?? 0) },
    { label: "Total Earnings", value: formatCurrency(dashData?.totalEarnings ?? 0) },
    { label: "Pending Withdrawal", value: formatCurrency(dashData?.pendingWithdrawal ?? 0) },
    { label: "Total Deposited", value: formatCurrency(dashData?.totalDeposited ?? 0) },
    { label: "Total Withdrawn", value: formatCurrency(dashData?.totalWithdrawn ?? 0) },
  ];

  return (
    <div className="space-y-5 max-w-5xl mx-auto">

      {/* ── Welcome card ── */}
      <div className="relative overflow-hidden bg-[#1a3a2a] rounded-2xl p-5 lg:p-6 text-white keep-dark">
        {/* decorative circles */}
        <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-white/5" />
        <div className="absolute -bottom-10 -right-4 w-28 h-28 rounded-full bg-white/5" />

        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-white/60 text-sm mb-0.5">Welcome back,</p>
            <h2 className="text-2xl font-bold">{user?.username ?? dashData?.username ?? "Trader"}</h2>
            <p className="text-white/60 text-sm mt-1.5 max-w-sm leading-relaxed">
              Your portfolio is active. Monitor your investments, open trades, and manage your funds all in one place.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:items-end shrink-0">
            {/* Market status */}
            <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${
              marketOpen ? "bg-green-500/20 text-green-300" : "bg-red-500/20 text-red-300"
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${marketOpen ? "bg-green-400" : "bg-red-400"} animate-pulse`} />
              Market {marketOpen ? "Open" : "Closed"}
            </div>

            {/* Connect wallet */}
            <button
              onClick={() => navigate("/trader/wallet")}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors text-sm font-semibold"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
              Connect Wallet
            </button>
          </div>
        </div>
      </div>

      {/* ── Total balance + actions (mobile first, then full grid on lg) ── */}

      {/* Mobile: total balance card + actions stacked */}
      <div className="lg:hidden space-y-3">
        <div className="bg-[#2d6a4f] rounded-2xl p-5 text-white keep-dark">
          <p className="text-white/60 text-xs font-medium mb-1">Total Balance</p>
          {dashLoading
            ? <Skeleton className="h-8 w-36 bg-white/20" />
            : <p className="text-3xl font-bold">{formatCurrency(dashData?.balance ?? 0)}</p>
          }
          <p className="text-white/50 text-xs mt-1">Available for trading & withdrawal</p>
        </div>
        <div className="flex gap-3">
          <ActionBtn
            label="Deposit"
            variant="primary"
            onClick={() => navigate("/trader/deposit")}
            icon={<svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>}
          />
          <ActionBtn
            label="Withdraw"
            onClick={() => navigate("/trader/withdrawal")}
            icon={<svg className="w-4 h-4 text-[#1a3a2a]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" /></svg>}
          />
          <ActionBtn
            label="Invest"
            onClick={() => navigate("/trader/investments")}
            icon={<svg className="w-4 h-4 text-[#1a3a2a]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>}
          />
        </div>
      </div>

      {/* Desktop: balance grid */}
      <div className="hidden lg:grid grid-cols-1 gap-4">
        {/* Total balance prominent */}
        <div className="col-span-1 bg-[#2d6a4f] rounded-2xl p-5 text-white flex flex-col justify-between keep-dark">
          <p className="text-white/60 text-xs font-medium">Total Balance</p>
          {dashLoading
            ? <Skeleton className="h-8 w-36 bg-white/20 mt-2" />
            : <p className="text-3xl font-bold mt-2">{formatCurrency(dashData?.balance ?? 0)}</p>
          }
          <p className="text-white/50 text-xs mt-2">Available for trading & withdrawal</p>
        </div>

        {/* Action buttons */}
        <div className="col-span-2 flex gap-3 items-stretch">
          <ActionBtn
            label="Deposit"
            variant="primary"
            onClick={() => navigate("/trader/deposit")}
            icon={<svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>}
          />
          <ActionBtn
            label="Withdraw"
            onClick={() => navigate("/trader/withdrawal")}
            icon={<svg className="w-4 h-4 text-[#1a3a2a]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" /></svg>}
          />
          <ActionBtn
            label="Invest"
            onClick={() => navigate("/trader/investments")}
            icon={<svg className="w-4 h-4 text-[#1a3a2a]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>}
          />
        </div>
      </div>

      {/* ── Balance stats grid ── */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {balanceCards.map((c) => (
          <StatCard key={c.label} label={c.label} value={c.value} loading={dashLoading} />
        ))}
      </div>

      {/* ── Bottom row: transactions + active investments ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Latest transactions */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
            <h3 className="text-sm font-semibold text-gray-800">Latest Transactions</h3>
            <button
              onClick={() => navigate("/trader/deposit")}
              className="text-xs text-[#2d6a4f] font-semibold hover:underline"
            >
              View all
            </button>
          </div>

          {txLoading ? (
            <div className="p-5 space-y-3">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : transactions.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <p className="text-sm text-gray-400">No transactions yet</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-50">
              {transactions.map((tx) => (
                <li key={tx._id} className="flex items-center justify-between px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                      tx.type === "deposit" ? "bg-green-50" :
                      tx.type === "withdrawal" ? "bg-red-50" : "bg-blue-50"
                    }`}>
                      <svg className={`w-4 h-4 ${
                        tx.type === "deposit" ? "text-green-600" :
                        tx.type === "withdrawal" ? "text-red-500" : "text-blue-500"
                      }`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        {tx.type === "deposit"
                          ? <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                          : tx.type === "withdrawal"
                          ? <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
                          : <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        }
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-700 capitalize">{tx.type.replace("_", " ")}</p>
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

        {/* Active investments */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
            <h3 className="text-sm font-semibold text-gray-800">Active Investments</h3>
            <button
              onClick={() => navigate("/trader/investments")}
              className="text-xs text-[#2d6a4f] font-semibold hover:underline"
            >
              View all
            </button>
          </div>

          {invLoading ? (
            <div className="p-5 space-y-3">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : investments.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <p className="text-sm text-gray-400">No active investments</p>
              <button
                onClick={() => navigate("/trader/investments")}
                className="mt-3 text-xs text-[#2d6a4f] font-semibold hover:underline"
              >
                Start investing →
              </button>
            </div>
          ) : (
            <ul className="divide-y divide-gray-50">
              {investments.map((inv: Transaction) => (
                <li key={inv._id} className="px-5 py-3.5">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs font-semibold text-gray-700">
                      {inv.planSnapshot?.name ?? "Investment"}
                    </p>
                    <p className="text-xs font-bold text-[#2d6a4f]">{formatCurrency(inv.amount)}</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-400">
                      ROI: {inv.planSnapshot?.roiPercent ?? 0}% · {inv.planSnapshot?.durationDays ?? 0}d
                    </p>
                    {inv.expiresAt && (
                      <p className="text-xs text-gray-400">Matures {formatDate(inv.expiresAt)}</p>
                    )}
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
