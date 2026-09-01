import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../hooks/useAuth";
import { userApi } from "../../api/user.api";
import { transactionApi } from "../../api/transaction.api";
import { investmentApi } from "../../api/investment.api";
import { formatCurrency, formatDate, getStatusColor } from "../../utils";
import type { DashboardSummary, Transaction, ApiResponse } from "../../types";
import PublicTicker from "../../components/layout/PublicTicker";

// ── small reusable pieces ────────────────────────────────────────────────────

const Skeleton = ({ className }: { className?: string }) => (
  <div className={`animate-pulse bg-gray-200 dark:bg-white/10 rounded-lg ${className}`} />
);

interface StatCardProps {
  label: string;
  value: string;
  loading: boolean;
  icon: React.ReactNode;
  iconBg: string;
}

const StatCard = ({
  label,
  value,
  loading,
  icon,
  iconBg,
}: StatCardProps) => (
  <div className="bg-[#121418] border border-gray-800/80 dark:border-white/10 text-white rounded-2xl p-4 sm:p-5 shadow-md hover:border-gray-700 transition-all flex flex-col items-start gap-2.5">
    {/* 1. Icon */}
    <span className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}>
      {icon}
    </span>
    {/* 2. Label */}
    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{label}</p>
    {/* 3. Value */}
    {loading ? (
      <Skeleton className="h-7 w-24 bg-white/15" />
    ) : (
      <p className="text-lg sm:text-xl font-extrabold text-white tracking-tight">{value}</p>
    )}
  </div>
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

  // Calculations for Portfolio & Trends
  const portfolioValue = (dashData?.balance ?? 0) + (dashData?.investedBalance ?? 0);
  const totalEarnings = dashData?.totalEarnings ?? 0;
  const totalDeposited = dashData?.totalDeposited ?? 0;
  const profitPercentage = totalDeposited > 0 ? ((totalEarnings / totalDeposited) * 100).toFixed(1) : "0.0";
  const isProfitPositive = totalEarnings >= 0;

  // Exact 4 Stat Cards: Total Earnings, Total Withdrawal, Total Deposit, Total Bonus
  const balanceCards = [
    {
      label: "Total Earnings",
      value: formatCurrency(dashData?.totalEarnings ?? 0),
      iconBg: "bg-emerald-500/20 text-emerald-400",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      label: "Total Withdrawal",
      value: formatCurrency(dashData?.totalWithdrawn ?? 0),
      iconBg: "bg-rose-500/20 text-rose-400",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" />
        </svg>
      ),
    },
    {
      label: "Total Deposit",
      value: formatCurrency(dashData?.totalDeposited ?? 0),
      iconBg: "bg-teal-500/20 text-teal-400",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 4.5l-15 15m0 0h11.25m-11.25 0V8.25" />
        </svg>
      ),
    },
    {
      label: "Total Bonus",
      value: formatCurrency((dashData as any)?.bonus ?? (user as any)?.bonus ?? 0),
      iconBg: "bg-amber-500/20 text-amber-400",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="space-y-5 max-w-5xl mx-auto pb-10">

      {/* ── Coin Ticker ── */}
      <div className="rounded-2xl overflow-hidden shadow-sm border border-emerald-900/30">
        <PublicTicker />
      </div>

      {/* ── Unified Hero Card (Darker #121418 Background) ── */}
      <div className="bg-[#121418] border border-gray-800/80 dark:border-white/10 rounded-3xl p-5 sm:p-6 text-white shadow-lg space-y-6">

        {/* Top row: Welcome back / Username (Left) + Market Status / Connect Wallet (Right) */}
        <div className="flex items-start justify-between gap-4">
          {/* Left: Welcome back & Username */}
          <div>
            <p className="text-gray-400 text-xs sm:text-sm font-medium tracking-wide">Welcome back</p>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-0.5">
              {user?.username ?? dashData?.username ?? "Trader"}
            </h2>
          </div>

          {/* Right: [Heart Rhythm Icon] Market status on top, [Connect Wallet] with amber 600/20 & amber 500 text */}
          <div className="flex flex-col items-end gap-2 shrink-0">
            {/* [Heart Rhythm Icon] Market Status */}
            <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${
              marketOpen ? "bg-emerald-500/20 text-emerald-300 border border-emerald-400/30" : "bg-red-500/20 text-red-300 border border-red-400/30"
            }`}>
              {/* Heart Rhythm / ECG Waveform Icon */}
              <svg className={`w-4 h-4 ${marketOpen ? "text-emerald-400" : "text-red-400"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12h3.75l2.25-6 3.75 12 2.25-6H21.75" />
              </svg>
              <span>Market {marketOpen ? "Open" : "Closed"}</span>
            </div>

            {/* Connect Wallet: bg amber-600/20, text amber-500 */}
            <button
              onClick={() => navigate("/trader/wallet")}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/30 transition-all text-xs sm:text-sm font-semibold text-amber-500 shadow-sm"
            >
              {/* Pocket / Wallet icon */}
              <svg className="w-4 h-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3" />
              </svg>
              <span>Connect Wallet</span>
            </button>
          </div>
        </div>

        {/* Middle Section: [walleticon] Portfolio Value + Net Profit/Loss */}
        <div className="pt-2">
          {/* [walleticon] Portfolio Value with pulse */}
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6" />
              </svg>
            </div>
            <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">Portfolio Value</p>
            <span className="relative flex h-2 w-2 ml-1">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
            </span>
          </div>

          {/* Portfolio Value Main Number */}
          {dashLoading ? (
            <Skeleton className="h-10 w-44 bg-white/15 mt-2" />
          ) : (
            <p className="text-3xl sm:text-4xl font-black tracking-tight text-white mt-1">
              {formatCurrency(portfolioValue)}
            </p>
          )}

          {/* Profit / Loss label on top, value & % trend tracker below it */}
          <div className="mt-4 space-y-1.5">
            {/* [icon] Profit / Loss label */}
            <div className="flex items-center gap-1.5 text-gray-400 text-xs font-semibold">
              <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.281m5.94 2.28l-.001 6.364" />
              </svg>
              <span>Profit / Loss</span>
            </div>

            {/* Profit balance value & % trend tracker below it */}
            <div className="flex items-center gap-2.5">
              <p className="text-base sm:text-lg font-black text-white">
                {dashLoading ? "..." : `${isProfitPositive ? "+" : ""}${formatCurrency(totalEarnings)}`}
              </p>

              {/* % Trend Tracker Badge */}
              <div className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-bold border ${
                isProfitPositive 
                  ? "bg-emerald-500/20 text-emerald-300 border-emerald-400/30"
                  : "bg-red-500/20 text-red-300 border-red-400/30"
              }`}>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={isProfitPositive ? "M4.5 15.75l7.5-7.5 7.5 7.5" : "M19.5 8.25l-7.5 7.5-7.5-7.5"} />
                </svg>
                <span>{isProfitPositive ? `+${profitPercentage}%` : `${profitPercentage}%`}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section: Action Buttons (Deposit [Green], Withdraw, Invest Now) */}
        <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-3">
          {/* [icon] Deposit (Green Background) */}
          <button
            onClick={() => navigate("/trader/deposit")}
            className="flex-1 flex flex-col items-center justify-center gap-1.5 py-3 px-2 rounded-2xl bg-[#1e4835] hover:bg-[#164732] border border-[#1e4835] transition-all text-xs font-bold text-white shadow-md group"
          >
            <svg className="w-5 h-5 text-white transition-transform group-hover:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            <span>Deposit</span>
          </button>

          {/* [icon] Withdraw */}
          <button
            onClick={() => navigate("/trader/withdrawal")}
            className="flex-1 flex flex-col items-center justify-center gap-1.5 py-3 px-2 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/10 transition-all text-xs font-bold text-white shadow-sm group"
          >
            <svg className="w-5 h-5 text-white transition-transform group-hover:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" />
            </svg>
            <span>Withdraw</span>
          </button>

          {/* [icon] Invest Now */}
          <button
            onClick={() => navigate("/trader/investments")}
            className="flex-1 flex flex-col items-center justify-center gap-1.5 py-3 px-2 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/10 transition-all text-xs font-bold text-white shadow-sm group"
          >
            <svg className="w-5 h-5 text-white transition-transform group-hover:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
            </svg>
            <span>Invest Now</span>
          </button>
        </div>
      </div>

      {/* ── Balance stats 2-Column Grid (Exactly 4 Cards with #121418 background) ── */}
      <div className="grid grid-cols-2 gap-3.5 sm:gap-4">
        {balanceCards.map((c) => (
          <StatCard
            key={c.label}
            label={c.label}
            value={c.value}
            loading={dashLoading}
            icon={c.icon}
            iconBg={c.iconBg}
          />
        ))}
      </div>

      {/* ── Bottom row: Active Investments (FIRST) + Latest Transactions (SECOND) in #121418 ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* 1. Active investments (FIRST with #121418 background) */}
        <div className="bg-[#121418] border border-gray-800/80 dark:border-white/10 text-white rounded-2xl overflow-hidden shadow-md">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800/80 dark:border-white/5">
            <div className="flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.281m5.94 2.28l-.001 6.364" />
                </svg>
              </span>
              <h3 className="text-sm font-bold text-white">Active Investments</h3>
            </div>
            <button
              onClick={() => navigate("/trader/investments")}
              className="text-xs text-emerald-400 font-bold hover:underline"
            >
              View all
            </button>
          </div>

          {invLoading ? (
            <div className="p-5 space-y-3">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-10 w-full bg-white/10" />)}
            </div>
          ) : investments.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <p className="text-sm text-gray-400">No active investments</p>
              <button
                onClick={() => navigate("/trader/investments")}
                className="mt-3 text-xs text-emerald-400 font-bold hover:underline inline-block"
              >
                Start investing →
              </button>
            </div>
          ) : (
            <ul className="divide-y divide-gray-800/80 dark:divide-white/5">
              {investments.map((inv: Transaction) => (
                <li key={inv._id} className="px-5 py-3.5">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs font-bold text-gray-200">
                      {inv.planSnapshot?.name ?? "Investment"}
                    </p>
                    <p className="text-xs font-black text-emerald-400">{formatCurrency(inv.amount)}</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] text-gray-400">
                      ROI: {inv.planSnapshot?.roiPercent ?? 0}% · {inv.planSnapshot?.durationDays ?? 0}d
                    </p>
                    {inv.expiresAt && (
                      <p className="text-[11px] text-gray-400 font-medium">Matures {formatDate(inv.expiresAt)}</p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* 2. Latest transactions (SECOND with #121418 background) */}
        <div className="bg-[#121418] border border-gray-800/80 dark:border-white/10 text-white rounded-2xl overflow-hidden shadow-md">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800/80 dark:border-white/5">
            <div className="flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </span>
              <h3 className="text-sm font-bold text-white">Latest Transactions</h3>
            </div>
            <button
              onClick={() => navigate("/trader/transactions")}
              className="text-xs text-emerald-400 font-bold hover:underline"
            >
              View all
            </button>
          </div>

          {txLoading ? (
            <div className="p-5 space-y-3">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-10 w-full bg-white/10" />)}
            </div>
          ) : transactions.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <p className="text-sm text-gray-400">No transactions yet</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-800/80 dark:divide-white/5">
              {transactions.map((tx) => (
                <li key={tx._id} className="flex items-center justify-between px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                      tx.type === "deposit" ? "bg-emerald-500/20 text-emerald-400" :
                      tx.type === "withdrawal" ? "bg-rose-500/20 text-rose-400" : "bg-blue-500/20 text-blue-400"
                    }`}>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        {tx.type === "deposit"
                          ? <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                          : tx.type === "withdrawal"
                          ? <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
                          : <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        }
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-200 capitalize">{tx.type.replace("_", " ")}</p>
                      <p className="text-[11px] text-gray-400">{formatDate(tx.createdAt)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-black text-white">{formatCurrency(tx.amount)}</p>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${getStatusColor(tx.status)}`}>
                      {tx.status}
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
