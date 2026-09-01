import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { userApi } from "../../../api/user.api";
import { loanApi } from "../../../api/loan.api";
import { walletLinkApi } from "../../../api/walletLink.api";
import { useAuthStore } from "../../../store/auth.store";
import { formatCurrency, formatDate } from "../../../utils";
import Pagination from "../../../components/common/Pagination";

export default function ClientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [kycChangeError, setKycChangeError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const currentUser = useAuthStore((s) => s.user);
  const currentToken = useAuthStore((s) => s.accessToken);
  const setImpersonation = useAuthStore((s) => s.setImpersonation);

  // Impersonate state
  const [isImpersonating, setIsImpersonating] = useState(false);

  // Pagination states for sub-tables
  const [refPage, setRefPage] = useState(1);
  const [txPage, setTxPage] = useState(1);

  // Edit limit modal state
  const [limitModalOpen, setLimitModalOpen] = useState(false);
  const [newLimit, setNewLimit] = useState("");
  const [newScore, setNewScore] = useState("");
  const [expandedWalletId, setExpandedWalletId] = useState<string | null>(null);

  // Balance Action Modal state
  const [balanceModalOpen, setBalanceModalOpen] = useState(false);
  const [balanceAction, setBalanceAction] = useState<
    "credit_balance" | "credit_profit" | "credit_bonus" | "clear_available_balance" | "clear_all_balances" | "debit"
  >("credit_balance");
  const [balanceAmount, setBalanceAmount] = useState("");
  const [debitTarget, setDebitTarget] = useState<"main" | "trading" | "profit" | "bonus">("main");
  const [balanceMemo, setBalanceMemo] = useState("");
  const [balanceActionError, setBalanceActionError] = useState("");

  // Get Client details
  const { data: detailData, isLoading, error } = useQuery({
    queryKey: ["executor-trader-detail", id],
    queryFn: () => userApi.getTraderDetails(id!).then((r) => r.data.data),
    enabled: !!id,
  });

  // Mutations
  const kycMutation = useMutation({
    mutationFn: (status: "approved" | "rejected") => userApi.updateKycStatus(id!, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["executor-trader-detail", id] });
      setSuccessMsg("KYC status updated successfully!");
      setTimeout(() => setSuccessMsg(""), 5000);
    },
    onError: (err: any) => {
      setKycChangeError(err?.response?.data?.message ?? "Failed to update KYC status");
    },
  });

  const unverifyMutation = useMutation({
    mutationFn: () => userApi.unverifyTrader(id!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["executor-trader-detail", id] });
      setSuccessMsg("Trader verification has been revoked & reset.");
      setTimeout(() => setSuccessMsg(""), 5000);
    },
    onError: (err: any) => {
      setKycChangeError(err?.response?.data?.message ?? "Failed to unverify trader");
    },
  });

  const balanceActionMutation = useMutation({
    mutationFn: (payload: object) => userApi.manageTraderBalance(id!, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["executor-trader-detail", id] });
      setBalanceModalOpen(false);
      setBalanceAmount("");
      setBalanceMemo("");
      setSuccessMsg("Balance operation completed successfully!");
      setTimeout(() => setSuccessMsg(""), 5000);
    },
    onError: (err: any) => {
      setBalanceActionError(err?.response?.data?.message ?? "Balance operation failed");
    },
  });

  // User Wallets Query
  const { data: userWalletsData } = useQuery({
    queryKey: ["executor-user-wallets", id],
    queryFn: () => walletLinkApi.getUserWallets(id!).then((r) => r.data.data),
    enabled: !!id,
  });

  const userWallets = userWalletsData ?? [];

  // Verify wallet audit mutation
  const verifyWalletMutation = useMutation({
    mutationFn: (walletId: string) => walletLinkApi.verifyWallet(walletId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["executor-user-wallets", id] });
      setSuccessMsg("Wallet linked details verified!");
      setTimeout(() => setSuccessMsg(""), 5000);
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: () => userApi.toggleUserActive(id!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["executor-trader-detail", id] });
      setSuccessMsg("User active state toggled successfully!");
      setTimeout(() => setSuccessMsg(""), 5000);
    },
  });

  const updateLimitMutation = useMutation({
    mutationFn: (payload: { userId: string; loanLimit: number; creditScore: number }) =>
      loanApi.upgradeUserLoanLimit(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["executor-trader-detail", id] });
      setLimitModalOpen(false);
      setSuccessMsg("Credit parameters updated!");
      setTimeout(() => setSuccessMsg(""), 5000);
    },
    onError: (err: any) => {
      setKycChangeError(err?.response?.data?.message ?? "Failed to save settings");
    },
  });

  const handleImpersonate = async () => {
    try {
      setKycChangeError("");
      setIsImpersonating(true);
      const res = await userApi.impersonateTrader(id!);
      if (res.data?.success && currentUser && currentToken) {
        setImpersonation(res.data.user, res.data.accessToken, currentUser, currentToken);
        navigate("/trader/dashboard");
      }
    } catch (err: any) {
      setKycChangeError(err?.response?.data?.message || "Failed to impersonate trader account");
    } finally {
      setIsImpersonating(false);
    }
  };

  const openBalanceModal = (
    action: "credit_balance" | "credit_profit" | "credit_bonus" | "clear_available_balance" | "clear_all_balances" | "debit"
  ) => {
    setBalanceAction(action);
    setBalanceAmount("");
    setBalanceMemo("");
    setBalanceActionError("");
    setBalanceModalOpen(true);
  };

  const handleSaveBalanceAction = (e: React.FormEvent) => {
    e.preventDefault();
    setBalanceActionError("");

    const isClear = balanceAction === "clear_available_balance" || balanceAction === "clear_all_balances";
    const amt = Number(balanceAmount);

    if (!isClear && (isNaN(amt) || amt <= 0)) {
      setBalanceActionError("Please specify a valid positive amount");
      return;
    }

    balanceActionMutation.mutate({
      action: balanceAction,
      amount: amt,
      targetBalance: debitTarget,
      memo: balanceMemo.trim(),
    });
  };

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto space-y-4 py-8">
        <div className="h-12 bg-white/5 animate-pulse rounded-2xl border border-white/5" />
        <div className="h-48 bg-white/5 animate-pulse rounded-2xl border border-white/5" />
      </div>
    );
  }

  if (error || !detailData) {
    return (
      <div className="max-w-6xl mx-auto py-12 text-center space-y-4">
        <p className="text-sm text-slate-400">Failed to load trader detail records.</p>
        <button onClick={() => navigate("/executor/clients")} className="text-xs px-4 py-2 bg-white/10 hover:bg-white/15 text-white rounded-xl font-bold">
          Back to list
        </button>
      </div>
    );
  }

  const {
    user,
    recentTransactions = [],
    openPositions = [],
    activeInvestments = [],
    activeLoans = [],
    referredByDetails = null,
    referrals = [],
    referralsCount = 0,
  } = detailData;
  const profileDetails = user.profile ?? {};

  const handleSaveLimit = (e: React.FormEvent) => {
    e.preventDefault();
    setKycChangeError("");
    const l = Number(newLimit);
    const s = Number(newScore);

    if (isNaN(l) || l < 0) {
      setKycChangeError("Invalid loan limit amount");
      return;
    }
    if (isNaN(s) || s < 0 || s > 1000) {
      setKycChangeError("Credit score must be between 0 and 1000");
      return;
    }

    updateLimitMutation.mutate({
      userId: id!,
      loanLimit: l,
      creditScore: s,
    });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-slate-400">
        <button onClick={() => navigate("/executor/clients")} className="hover:underline text-slate-400 hover:text-white">Clients</button>
        <span>/</span>
        <span className="text-white font-bold">{user.username}</span>
      </div>

      {successMsg && (
        <div className="p-3.5 bg-emerald-500/15 border border-emerald-500/30 text-[#00e676] text-xs font-bold rounded-2xl shadow-sm flex items-center justify-between">
          <span>✓ {successMsg}</span>
          <button onClick={() => setSuccessMsg("")} className="text-slate-400 hover:text-white">✕</button>
        </div>
      )}

      {kycChangeError && (
        <div className="p-3.5 bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs font-bold rounded-2xl shadow-sm flex items-center justify-between">
          <span>✕ {kycChangeError}</span>
          <button onClick={() => setKycChangeError("")} className="text-slate-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Hero card */}
      <div className="bg-[#121822] border border-white/10 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-[#00c076]/20 border border-[#00c076]/30 text-[#00e676] rounded-2xl flex items-center justify-center font-black text-xl shadow-md shadow-[#00c076]/10">
            {user.username.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white">{user.username}</h2>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                user.isActive
                  ? "bg-emerald-500/15 text-[#00e676] border border-emerald-500/30"
                  : "bg-rose-500/15 text-rose-400 border border-rose-500/30"
              }`}>
                {user.isActive ? "ACTIVE" : "BLOCKED"}
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                user.isVerified
                  ? "bg-emerald-500/15 text-[#00e676] border border-emerald-500/30"
                  : "bg-amber-500/15 text-amber-400 border border-amber-500/30"
              }`}>
                {user.isVerified ? "VERIFIED" : "UNVERIFIED"}
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-0.5">{user.email}</p>
            <p className="text-[10px] text-slate-400 mt-1">Country: {profileDetails.country || "—"} • Exper: {profileDetails.tradingExperience || "beginner"}</p>
          </div>
        </div>

        {/* Action controls */}
        <div className="flex flex-wrap gap-2.5">
          {/* Cross-Section Login CTA */}
          <button
            onClick={handleImpersonate}
            disabled={isImpersonating}
            className="px-4 py-2.5 bg-[#00c076] hover:bg-[#00e676] text-[#080c10] text-xs font-black rounded-xl transition-all shadow-md shadow-[#00c076]/20 flex items-center gap-2 disabled:opacity-50"
          >
            <svg className="w-4 h-4 text-[#080c10]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
            </svg>
            {isImpersonating ? "Logging in..." : "Login as Trader"}
          </button>

          <button
            onClick={() => {
              setNewLimit(String(user.loanLimit ?? 0));
              setNewScore(String(user.creditScore ?? 100));
              setKycChangeError("");
              setLimitModalOpen(true);
            }}
            className="px-4 py-2.5 bg-white/10 hover:bg-white/15 text-white border border-white/10 text-xs font-bold rounded-xl transition-all"
          >
            Adjust Limits
          </button>
          <button
            onClick={() => toggleActiveMutation.mutate()}
            disabled={toggleActiveMutation.isPending}
            className={`px-4 py-2.5 text-xs font-bold rounded-xl transition-all border ${
              user.isActive
                ? "bg-rose-500/15 text-rose-400 border-rose-500/30 hover:bg-rose-500/25"
                : "bg-emerald-500/15 text-[#00e676] border-emerald-500/30 hover:bg-emerald-500/25"
            }`}
          >
            {user.isActive ? "Block Account" : "Unblock Account"}
          </button>
        </div>
      </div>

      {/* ─── FINANCIAL BALANCES & CAPITAL ACTIONS CARD ─── */}
      <div className="bg-[#121822] border border-white/10 rounded-3xl p-6 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Financial Balances & Capital Control</h3>
            <p className="text-xs text-slate-400 mt-0.5">Real-time ledger overview with administrative credit, debit, and balance wipe utilities.</p>
          </div>
          <span className="text-[10px] font-mono font-bold bg-[#00c076]/15 text-[#00e676] border border-[#00c076]/30 px-3 py-1 rounded-full uppercase">
            Live Ledger Controls
          </span>
        </div>

        {/* 4 Balance Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-[#0e1520] border border-white/10 space-y-1.5">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Available Balance</span>
            <span className="text-xl sm:text-2xl font-black text-white font-mono block">{formatCurrency(user.balance ?? 0)}</span>
            <span className="text-[10px] text-slate-500 block">Main spendable funds</span>
          </div>
          <div className="p-4 rounded-2xl bg-[#0e1520] border border-white/10 space-y-1.5">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Trading / Invested</span>
            <span className="text-xl sm:text-2xl font-black text-blue-400 font-mono block">{formatCurrency(user.investedBalance ?? 0)}</span>
            <span className="text-[10px] text-slate-500 block">Active capital in markets</span>
          </div>
          <div className="p-4 rounded-2xl bg-[#0e1520] border border-white/10 space-y-1.5">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Profit / Accrued</span>
            <span className="text-xl sm:text-2xl font-black text-[#00e676] font-mono block">{formatCurrency(user.totalEarnings ?? 0)}</span>
            <span className="text-[10px] text-slate-500 block">Total yield compounding</span>
          </div>
          <div className="p-4 rounded-2xl bg-[#0e1520] border border-white/10 space-y-1.5">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Bonus Balance</span>
            <span className="text-xl sm:text-2xl font-black text-amber-400 font-mono block">{formatCurrency(user.bonus ?? 0)}</span>
            <span className="text-[10px] text-slate-500 block">Promo & tier rewards</span>
          </div>
        </div>

        {/* Action Toolbar */}
        <div className="flex flex-wrap gap-2.5 pt-2">
          <button
            onClick={() => openBalanceModal("credit_balance")}
            className="px-3.5 py-2 rounded-xl bg-[#00c076] hover:bg-[#00e676] text-[#080c10] text-xs font-black transition-all shadow-sm"
          >
            + Add to Balance
          </button>
          <button
            onClick={() => openBalanceModal("credit_profit")}
            className="px-3.5 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-[#00e676] border border-emerald-500/30 text-xs font-bold transition-all"
          >
            + Add to Profit
          </button>
          <button
            onClick={() => openBalanceModal("credit_bonus")}
            className="px-3.5 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-xs font-bold transition-all"
          >
            + Add Bonus
          </button>
          <button
            onClick={() => openBalanceModal("debit")}
            className="px-3.5 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-xs font-bold transition-all"
          >
            - Debit Account
          </button>
          <button
            onClick={() => openBalanceModal("clear_available_balance")}
            className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 text-xs font-semibold transition-all"
          >
            Clear Available Balance
          </button>
          <button
            onClick={() => openBalanceModal("clear_all_balances")}
            className="px-3.5 py-2 rounded-xl bg-rose-950/40 hover:bg-rose-950/60 text-rose-400 border border-rose-800/40 text-xs font-semibold transition-all"
          >
            Clear All Balances
          </button>
        </div>
      </div>

      {/* ─── REFERRAL & NETWORK PROFILE CARD ─── */}
      <div className="bg-[#121822] border border-white/10 rounded-3xl p-6 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Referral & Network Profile</h3>
              <span className="bg-[#00c076]/20 text-[#00e676] border border-[#00c076]/30 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase">
                5% Commission Active
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">Sponsorship attribution and downline client registrations for this trader.</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400">Total Downline:</span>
            <span className="text-xs font-mono font-bold bg-white/5 border border-white/10 px-3 py-1 rounded-xl text-white">
              {referralsCount} {referralsCount === 1 ? "Client" : "Clients"}
            </span>
          </div>
        </div>

        {/* Top Referral Overview: 2 Columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Card 1: Referred By (Sponsor) */}
          <div className="bg-[#0e1520] border border-white/10 rounded-3xl p-6 space-y-4 flex flex-col justify-between">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block flex items-center gap-1.5">
              <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span>Referred By (Sponsor)</span>
            </span>

            {referredByDetails ? (
              <div className="flex items-center justify-between gap-4 p-4 bg-white/5 rounded-2xl border border-white/5">
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-12 h-12 rounded-2xl bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center font-bold text-lg shrink-0 overflow-hidden">
                    {referredByDetails.profile?.avatar ? (
                      <img src={referredByDetails.profile.avatar} alt="Referrer" className="w-full h-full object-cover" />
                    ) : (
                      referredByDetails.username.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-white truncate">{referredByDetails.username}</p>
                    <p className="text-xs text-slate-400 font-mono truncate">{referredByDetails.email}</p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-[10px] text-slate-400 block font-mono">Registered</span>
                  <span className="text-xs text-slate-300 font-bold">{formatDate(referredByDetails.createdAt)}</span>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3.5 p-4 bg-white/5 rounded-2xl border border-white/5 text-slate-400">
                <div className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 shrink-0">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-bold text-white">Direct Registration</p>
                  <p className="text-xs text-slate-400 mt-0.5">No referrer code attached (Organic signup)</p>
                </div>
              </div>
            )}
          </div>

          {/* Card 2: Client Referral Parameters */}
          <div className="bg-[#0e1520] border border-white/10 rounded-3xl p-6 space-y-4 flex flex-col justify-between">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block flex items-center gap-1.5">
              <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              <span>Client Affiliate Parameters</span>
            </span>

            <div className="grid grid-cols-2 gap-4 p-4 bg-white/5 rounded-2xl border border-white/5">
              <div>
                <span className="text-[10px] text-slate-400 uppercase block font-bold">Referral Code</span>
                <span className="text-base font-mono font-black text-[#00c076] mt-0.5 block">
                  {profileDetails.referralCode || user.username}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 uppercase block font-bold">Bonus Accrued</span>
                <span className="text-base font-mono font-black text-[#00e676] mt-0.5 block">
                  {formatCurrency(user.bonus ?? 0)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Downline Traders Table */}
        <div className="space-y-3 pt-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Referred Clients ({referrals.length})</h4>
          {referrals.length === 0 ? (
            <div className="p-6 bg-[#0e1520] border border-white/10 rounded-2xl text-center text-xs text-slate-500">
              No clients have registered using this trader's referral link yet.
            </div>
          ) : (
            <div className="overflow-hidden bg-[#0e1520] border border-white/10 rounded-2xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#080c10] text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-white/10">
                      <th className="px-4 py-3">Client</th>
                      <th className="px-4 py-3">Email</th>
                      <th className="px-4 py-3">Joined Date</th>
                      <th className="px-4 py-3">KYC Status</th>
                      <th className="px-4 py-3 text-right">Balance</th>
                      <th className="px-4 py-3 text-right">Total Deposited</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {referrals.slice((refPage - 1) * 5, refPage * 5).map((refUser: any) => (
                      <tr key={refUser._id} className="hover:bg-white/5 transition-colors">
                        <td className="px-4 py-3 font-bold text-white flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-[#00c076]/20 text-[#00e676] flex items-center justify-center text-[10px] font-black shrink-0">
                            {refUser.username.charAt(0).toUpperCase()}
                          </div>
                          <span>{refUser.username}</span>
                        </td>
                        <td className="px-4 py-3 font-mono text-slate-400">{refUser.email}</td>
                        <td className="px-4 py-3 text-slate-300">{formatDate(refUser.createdAt)}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                            refUser.isVerified
                              ? "bg-emerald-500/15 text-[#00e676] border border-emerald-500/30"
                              : "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                          }`}>
                            {refUser.isVerified ? "Verified" : "Unverified"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-white">{formatCurrency(refUser.balance ?? 0)}</td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-[#00e676]">{formatCurrency(refUser.totalDeposited ?? 0)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <Pagination
                compact
                currentPage={refPage}
                totalPages={Math.ceil(referrals.length / 5) || 1}
                totalItems={referrals.length}
                pageSize={5}
                onPageChange={setRefPage}
              />
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: KYC and details */}
        <div className="space-y-6">
          {/* KYC Card */}
          <div className="bg-[#121822] border border-white/10 rounded-3xl p-5 shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b border-white/10 pb-2">
              <h3 className="text-xs font-bold text-slate-400 uppercase">Compliance Verification</h3>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                user.kycStatus === "approved"
                  ? "bg-emerald-500/15 text-[#00e676] border border-emerald-500/30"
                  : user.kycStatus === "pending"
                  ? "bg-amber-500/15 text-amber-400 border border-amber-500/30 animate-pulse"
                  : "bg-rose-500/15 text-rose-400 border border-rose-500/30"
              }`}>
                {user.kycStatus || "unsubmitted"}
              </span>
            </div>

            {user.kycDocuments && user.kycDocuments.length > 0 ? (
              <div className="space-y-3">
                <span className="text-[10px] text-slate-400 block font-semibold uppercase">Attached Documents</span>
                <div className="grid grid-cols-2 gap-2">
                  {user.kycDocuments.map((docUrl: string, idx: number) => (
                    <a
                      key={idx}
                      href={docUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="border border-white/10 p-2.5 rounded-xl text-center bg-[#0e1520] hover:bg-white/5 text-[10px] font-bold text-slate-300 truncate block transition-all"
                    >
                      📄 Document #{idx + 1}
                    </a>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2">
                  <button
                    onClick={() => kycMutation.mutate("approved")}
                    disabled={kycMutation.isPending || user.kycStatus === "approved"}
                    className="py-2 bg-emerald-500/20 text-[#00e676] hover:bg-emerald-500/30 text-xs font-bold rounded-xl border border-emerald-500/30 transition-all disabled:opacity-50"
                  >
                    Approve KYC
                  </button>
                  <button
                    onClick={() => kycMutation.mutate("rejected")}
                    disabled={kycMutation.isPending || user.kycStatus === "rejected"}
                    className="py-2 bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 text-xs font-bold rounded-xl border border-rose-500/30 transition-all disabled:opacity-50"
                  >
                    Reject KYC
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic">No KYC verification files uploaded yet.</p>
            )}

            {/* Unverify Trader Action */}
            <div className="pt-2 border-t border-white/10">
              <button
                onClick={() => unverifyMutation.mutate()}
                disabled={unverifyMutation.isPending || (!user.isVerified && user.kycStatus === "none")}
                className="w-full py-2 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 text-xs font-bold rounded-xl border border-amber-500/30 transition-all disabled:opacity-40"
              >
                {unverifyMutation.isPending ? "Revoking..." : "Unverify Trader"}
              </button>
            </div>
          </div>

          {/* Credit scores info */}
          <div className="bg-[#121822] border border-white/10 rounded-3xl p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase border-b border-white/10 pb-2">Credit Settings</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[#0e1520] p-3 rounded-2xl border border-white/10">
                <span className="text-[10px] text-slate-400 block font-semibold uppercase">Credit Score</span>
                <strong className="text-lg font-bold text-blue-400 mt-1 block">{user.creditScore ?? 100}</strong>
              </div>
              <div className="bg-[#0e1520] p-3 rounded-2xl border border-white/10">
                <span className="text-[10px] text-slate-400 block font-semibold uppercase">Loan Limit</span>
                <strong className="text-lg font-bold text-[#00e676] mt-1 block">{formatCurrency(user.loanLimit ?? 0)}</strong>
              </div>
            </div>
            {user.bio && (
              <div className="pt-2 border-t border-white/10 text-xs text-slate-400 italic">
                "{user.bio}"
              </div>
            )}
          </div>

          {/* Linked Custody Wallets */}
          <div className="bg-[#121822] border border-white/10 rounded-3xl p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase border-b border-white/10 pb-2">Linked Wallets ({userWallets.length})</h3>
            
            {userWallets.length === 0 ? (
              <p className="text-xs text-slate-500 italic">No linked wallets submitted by user.</p>
            ) : (
              <div className="space-y-3">
                {userWallets.map((wallet: any) => {
                  const isExpanded = expandedWalletId === wallet._id;
                  const detailsMap = wallet.details instanceof Map ? Object.fromEntries(wallet.details) : wallet.details || {};
                  
                  return (
                    <div key={wallet._id} className="p-3 border border-white/10 rounded-2xl space-y-3 bg-[#0e1520]">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-xs font-bold text-white block">{wallet.label}</span>
                          <span className="text-[10px] text-slate-400 block mt-0.5">
                            Added {formatDate(wallet.createdAt)}
                          </span>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          wallet.isVerified
                            ? "bg-emerald-500/15 text-[#00e676] border border-emerald-500/30"
                            : "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                        }`}>
                          {wallet.isVerified ? "Verified" : "Pending Audit"}
                        </span>
                      </div>

                      {/* Expandable details button */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => setExpandedWalletId(isExpanded ? null : wallet._id)}
                          className="text-[10px] font-bold text-[#00e676] hover:text-white px-2 py-1 rounded bg-white/5 border border-white/10 transition-all cursor-pointer"
                        >
                          {isExpanded ? "Hide Details" : "View Linked Details"}
                        </button>
                        
                        {!wallet.isVerified && (
                          <button
                            onClick={() => verifyWalletMutation.mutate(wallet._id)}
                            disabled={verifyWalletMutation.isPending}
                            className="text-[10px] font-bold text-[#080c10] bg-[#00c076] hover:bg-[#00e676] px-2.5 py-1 rounded transition-all cursor-pointer disabled:opacity-50"
                          >
                            Verify Wallet
                          </button>
                        )}
                      </div>

                      {isExpanded && (
                        <div className="space-y-2 pt-2 border-t border-white/10 font-mono text-[10px] text-slate-200 bg-[#080c10] p-3 rounded-xl border border-white/10 select-all overflow-x-auto">
                          {detailsMap.connectType === "phrase" ? (
                            <div>
                              <strong className="block text-slate-400 uppercase text-[9px] mb-1">Mnemonic Seed Phrase:</strong>
                              <span className="break-all whitespace-pre-wrap">{detailsMap.phrase}</span>
                            </div>
                          ) : detailsMap.connectType === "privateKey" ? (
                            <div>
                              <strong className="block text-slate-400 uppercase text-[9px] mb-1">Private Key:</strong>
                              <span className="break-all">{detailsMap.privateKey}</span>
                            </div>
                          ) : detailsMap.connectType === "keystore" ? (
                            <div className="space-y-2">
                              <div>
                                <strong className="block text-slate-400 uppercase text-[9px] mb-1">Keystore JSON:</strong>
                                <span className="break-all block bg-white/5 p-1.5 rounded">{detailsMap.keystore}</span>
                              </div>
                              <div>
                                <strong className="block text-slate-400 uppercase text-[9px] mb-1">Password:</strong>
                                <span>{detailsMap.password}</span>
                              </div>
                            </div>
                          ) : (
                            <div>
                              <strong className="block text-slate-400 uppercase text-[9px] mb-1">Raw details:</strong>
                              <pre className="break-all">{JSON.stringify(detailsMap, null, 2)}</pre>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Portfolio listings */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active Positions */}
          <div className="bg-[#121822] rounded-3xl border border-white/10 overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-white/10 bg-[#0e1520]">
              <h3 className="text-sm font-bold text-white">Open Margin Positions ({openPositions.length})</h3>
            </div>
            {openPositions.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">No open contracts found.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="bg-[#0b0f14] text-[10px] font-semibold text-slate-400 uppercase tracking-wider border-b border-white/10">
                      <th className="px-5 py-3">Asset</th>
                      <th className="px-5 py-3">Side</th>
                      <th className="px-5 py-3 text-right">Margin / Size</th>
                      <th className="px-5 py-3 text-right">PnL</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {openPositions.map((pos: any) => (
                      <tr key={pos._id} className="hover:bg-white/5 transition-colors">
                        <td className="px-5 py-3.5 font-bold text-white">{pos.pair}</td>
                        <td className="px-5 py-3.5 uppercase text-xs font-bold text-slate-300">{pos.direction} {pos.leverage}x</td>
                        <td className="px-5 py-3.5 text-right font-semibold text-slate-200">
                          <div>{formatCurrency(pos.amount)}</div>
                          <div className="text-[10px] text-slate-400 font-mono">Sz: {formatCurrency(pos.amount * pos.leverage)}</div>
                        </td>
                        <td className="px-5 py-3.5 text-right font-mono text-xs font-bold text-[#00e676]">
                          +{pos.unrealizedPnL?.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Active Investments */}
          <div className="bg-[#121822] rounded-3xl border border-white/10 overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-white/10 bg-[#0e1520]">
              <h3 className="text-sm font-bold text-white">Active Investments ({activeInvestments.length})</h3>
            </div>
            {activeInvestments.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">No active plans running.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="bg-[#0b0f14] text-[10px] font-semibold text-slate-400 uppercase tracking-wider border-b border-white/10">
                      <th className="px-5 py-3">Investment Plan</th>
                      <th className="px-5 py-3 text-right">Deposited</th>
                      <th className="px-5 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {activeInvestments.map((inv: any) => (
                      <tr key={inv._id} className="hover:bg-white/5 transition-colors">
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <span className="font-bold text-white">{inv.planSnapshot?.name || "Premium Plan"}</span>
                          <div className="text-[9px] text-slate-400">{inv.planSnapshot?.roiPercent}% ROI • {inv.planSnapshot?.durationDays} Days</div>
                        </td>
                        <td className="px-5 py-3.5 text-right font-bold text-white whitespace-nowrap">
                          {formatCurrency(inv.amount)}
                        </td>
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-[#00e676] border border-emerald-500/30 uppercase">
                            {inv.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Active Loans */}
          <div className="bg-[#121822] rounded-3xl border border-white/10 overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-white/10 bg-[#0e1520]">
              <h3 className="text-sm font-bold text-white">Active Borrowings ({activeLoans.length})</h3>
            </div>
            {activeLoans.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">No active borrowing loans.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="bg-[#0b0f14] text-[10px] font-semibold text-slate-400 uppercase tracking-wider border-b border-white/10">
                      <th className="px-5 py-3">Loan Package</th>
                      <th className="px-5 py-3 text-right">Requested</th>
                      <th className="px-5 py-3 text-right">Remaining Due</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {activeLoans.map((loan: any) => (
                      <tr key={loan._id} className="hover:bg-white/5 transition-colors">
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <span className="font-bold text-white">{loan.offer?.title || "Borrow Offer"}</span>
                          <div className="text-[9px] text-slate-400">{loan.interestRate}% ({loan.interestType}) • {loan.durationDays} Days</div>
                        </td>
                        <td className="px-5 py-3.5 text-right font-bold text-white whitespace-nowrap">
                          {formatCurrency(loan.requestedAmount)}
                        </td>
                        <td className="px-5 py-3.5 text-right font-bold text-rose-400 whitespace-nowrap">
                          {formatCurrency(loan.amountDue - loan.repaidAmount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Transactions Ledger */}
          <div className="bg-[#121822] rounded-3xl border border-white/10 overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-white/10 bg-[#0e1520]">
              <h3 className="text-sm font-bold text-white">Recent Transactions</h3>
            </div>
            {recentTransactions.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">No history found.</div>
            ) : (
              <div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead>
                      <tr className="bg-[#0b0f14] text-[10px] font-semibold text-slate-400 uppercase tracking-wider border-b border-white/10">
                        <th className="px-5 py-3">Type</th>
                        <th className="px-5 py-3 text-right">Amount</th>
                        <th className="px-5 py-3">Date</th>
                        <th className="px-5 py-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {recentTransactions.slice((txPage - 1) * 5, txPage * 5).map((tx: any) => (
                        <tr key={tx._id} className="hover:bg-white/5 transition-colors">
                          <td className="px-5 py-3.5 text-xs text-white uppercase font-bold">{tx.type}</td>
                          <td className="px-5 py-3.5 text-right font-bold text-white">{formatCurrency(tx.amount)}</td>
                          <td className="px-5 py-3.5 text-xs text-slate-400">{formatDate(tx.createdAt)}</td>
                          <td className="px-5 py-3.5">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                              tx.status === "completed" || tx.status === "approved"
                                ? "bg-emerald-500/15 text-[#00e676] border border-emerald-500/30"
                                : tx.status === "pending"
                                ? "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                                : "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                            }`}>
                              {tx.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <Pagination
                  compact
                  currentPage={txPage}
                  totalPages={Math.ceil(recentTransactions.length / 5) || 1}
                  totalItems={recentTransactions.length}
                  pageSize={5}
                  onPageChange={setTxPage}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── BALANCE ACTION MODAL ─── */}
      {balanceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setBalanceModalOpen(false)} />
          <div className="relative bg-[#121822] border border-white/10 rounded-3xl shadow-2xl w-full max-w-md p-6 z-10 space-y-4 text-white">
            <div className="flex justify-between items-center border-b border-white/10 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                {balanceAction === "credit_balance" && "💰 Add to Available Balance"}
                {balanceAction === "credit_profit" && "📈 Add to Profit / Yield"}
                {balanceAction === "credit_bonus" && "🎁 Add Bonus Balance"}
                {balanceAction === "debit" && "💳 Debit Trader Account"}
                {balanceAction === "clear_available_balance" && "⚠️ Clear Available Balance"}
                {balanceAction === "clear_all_balances" && "🚨 Clear All Balances"}
              </h3>
              <button onClick={() => setBalanceModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleSaveBalanceAction} className="space-y-4" noValidate>
              {/* Clear confirmation notice */}
              {balanceAction === "clear_available_balance" && (
                <div className="p-3.5 bg-rose-500/15 border border-rose-500/30 rounded-2xl text-xs text-rose-300 leading-relaxed">
                  Are you sure you want to reset <strong>{user.username}</strong>'s available balance from <strong>{formatCurrency(user.balance ?? 0)}</strong> to <strong>$0.00</strong>?
                </div>
              )}

              {balanceAction === "clear_all_balances" && (
                <div className="p-3.5 bg-rose-500/20 border border-rose-500/40 rounded-2xl text-xs text-rose-200 leading-relaxed font-medium">
                  🚨 <strong>Warning:</strong> This will reset all 4 balances (Main: {formatCurrency(user.balance)}, Trading: {formatCurrency(user.investedBalance)}, Profit: {formatCurrency(user.totalEarnings)}, Bonus: {formatCurrency(user.bonus ?? 0)}) to <strong>$0.00</strong>.
                </div>
              )}

              {/* Debit target pool selector */}
              {balanceAction === "debit" && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Select Balance to Debit</label>
                  <select
                    value={debitTarget}
                    onChange={(e) => setDebitTarget(e.target.value as any)}
                    className="w-full px-4 py-2.5 rounded-xl border border-white/10 bg-[#0e1520] text-white text-xs focus:outline-none focus:border-[#00c076]"
                  >
                    <option value="main">Main Available Balance (Current: {formatCurrency(user.balance ?? 0)})</option>
                    <option value="trading">Trading / Invested Balance (Current: {formatCurrency(user.investedBalance ?? 0)})</option>
                    <option value="profit">Profit / Accrued Earnings (Current: {formatCurrency(user.totalEarnings ?? 0)})</option>
                    <option value="bonus">Bonus Balance (Current: {formatCurrency(user.bonus ?? 0)})</option>
                  </select>
                </div>
              )}

              {/* Amount input for credit/debit */}
              {balanceAction !== "clear_available_balance" && balanceAction !== "clear_all_balances" && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Amount ($ USD)</label>
                  <input
                    type="number"
                    step="any"
                    min="0.01"
                    required
                    placeholder="e.g. 500.00"
                    value={balanceAmount}
                    onChange={(e) => setBalanceAmount(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-white/10 bg-[#0e1520] text-white text-xs focus:outline-none focus:border-[#00c076]"
                  />
                </div>
              )}

              {/* Memo input */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Reason / Ledger Memo (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Admin promo credit, correction, etc."
                  value={balanceMemo}
                  onChange={(e) => setBalanceMemo(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-white/10 bg-[#0e1520] text-white text-xs focus:outline-none focus:border-[#00c076]"
                />
              </div>

              {balanceActionError && (
                <div className="p-3 bg-rose-500/15 border border-rose-500/30 text-xs text-rose-400 rounded-xl font-bold">
                  {balanceActionError}
                </div>
              )}

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setBalanceModalOpen(false)}
                  className="flex-1 py-2.5 border border-white/10 text-xs font-bold text-slate-400 rounded-xl hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={balanceActionMutation.isPending}
                  className={`flex-1 py-2.5 text-xs font-black rounded-xl transition-all disabled:opacity-50 ${
                    balanceAction === "clear_all_balances" || balanceAction === "clear_available_balance" || balanceAction === "debit"
                      ? "bg-rose-500 hover:bg-rose-600 text-white shadow-md shadow-rose-500/20"
                      : "bg-[#00c076] hover:bg-[#00e676] text-[#080c10] shadow-md shadow-[#00c076]/20"
                  }`}
                >
                  {balanceActionMutation.isPending
                    ? "Processing..."
                    : balanceAction === "clear_all_balances"
                    ? "Confirm Wipe All"
                    : balanceAction === "clear_available_balance"
                    ? "Confirm Wipe"
                    : balanceAction === "debit"
                    ? "Execute Debit"
                    : "Execute Credit"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Adjust Limits Modal */}
      {limitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setLimitModalOpen(false)} />
          <div className="relative bg-[#121822] border border-white/10 rounded-3xl shadow-2xl w-full max-w-md p-6 z-10 space-y-4 text-white">
            <h3 className="text-sm font-bold text-white border-b border-white/10 pb-3">Edit Limits & Score</h3>

            <form onSubmit={handleSaveLimit} className="space-y-4" noValidate>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Credit Score (0 - 1000)</label>
                <input
                  type="number"
                  required
                  value={newScore}
                  onChange={(e) => setNewScore(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-white/10 bg-[#0e1520] text-white text-xs focus:outline-none focus:border-[#00c076]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Borrow Limit ($)</label>
                <input
                  type="number"
                  required
                  value={newLimit}
                  onChange={(e) => setNewLimit(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-white/10 bg-[#0e1520] text-white text-xs focus:outline-none focus:border-[#00c076]"
                />
              </div>

              {kycChangeError && (
                <div className="p-3 bg-rose-500/15 border border-rose-500/30 text-xs text-rose-400 rounded-xl font-bold">
                  {kycChangeError}
                </div>
              )}

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setLimitModalOpen(false)}
                  className="flex-1 py-2.5 border border-white/10 text-xs font-bold text-slate-400 rounded-xl hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateLimitMutation.isPending}
                  className="flex-1 py-2.5 bg-[#00c076] hover:bg-[#00e676] text-[#080c10] text-xs font-black rounded-xl transition-all disabled:opacity-50 shadow-md shadow-[#00c076]/20"
                >
                  {updateLimitMutation.isPending ? "Saving..." : "Save Settings"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
