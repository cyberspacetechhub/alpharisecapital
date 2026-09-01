import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { investmentApi } from "../../../api/investment.api";
import { userApi } from "../../../api/user.api";
import { formatCurrency, formatDate } from "../../../utils";
import Pagination from "../../../components/common/Pagination";
import type { InvestmentPlan, Transaction, DashboardSummary } from "../../../types";

export default function TraderInvestmentsPage() {
  const qc = useQueryClient();
  const [selectedPlan, setSelectedPlan] = useState<InvestmentPlan | null>(null);
  const [investAmount, setInvestAmount] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [upgradeTx, setUpgradeTx] = useState<Transaction | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [portfolioPage, setPortfolioPage] = useState(1);

  // Queries
  const { data: dashData, isLoading: dashLoading } = useQuery<DashboardSummary>({
    queryKey: ["dashboard"],
    queryFn: () => userApi.getDashboard().then((r) => r.data.data),
  });

  const { data: plansData, isLoading: loadingPlans } = useQuery({
    queryKey: ["plans"],
    queryFn: () => investmentApi.getPlans().then((r) => r.data.data as InvestmentPlan[]),
  });

  const { data: myInvestData, isLoading: loadingMyInvests } = useQuery({
    queryKey: ["my-investments"],
    queryFn: () => investmentApi.getMyInvestments().then((r) => r.data.data as Transaction[]),
  });

  const myInvestments = myInvestData ?? [];
  const activePlans = plansData ?? [];

  // Mutations
  const investMutation = useMutation({
    mutationFn: (data: { planId: string; amount: number }) => investmentApi.invest(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      qc.invalidateQueries({ queryKey: ["my-investments"] });
      setSelectedPlan(null);
      setInvestAmount("");
      setErrorMsg("");
    },
    onError: (err: any) => {
      setErrorMsg(err.response?.data?.message || "Failed to initiate investment");
    },
  });

  const upgradeMutation = useMutation({
    mutationFn: ({ txId, newPlanId }: { txId: string; newPlanId: string }) =>
      investmentApi.upgradePlan(txId, newPlanId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      qc.invalidateQueries({ queryKey: ["my-investments"] });
      setUpgradeTx(null);
      setSelectedPlanId("");
      setSelectedTx(null);
      setErrorMsg("");
    },
    onError: (err: any) => {
      setErrorMsg(err.response?.data?.message || "Failed to upgrade investment plan");
    },
  });

  const reinvestMutation = useMutation({
    mutationFn: (txId: string) => investmentApi.reinvest(txId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      qc.invalidateQueries({ queryKey: ["my-investments"] });
      setSelectedTx(null);
    },
  });

  // Helper: calculate days elapsed and progress
  const getProgress = (tx: Transaction) => {
    if (tx.status === "completed") return { percent: 100, daysElapsed: tx.planSnapshot?.durationDays ?? 0 };
    if (tx.status === "rejected") return { percent: 0, daysElapsed: 0 };
    const start = new Date(tx.createdAt).getTime();
    const duration = (tx.planSnapshot?.durationDays ?? 30) * 24 * 60 * 60 * 1000;
    const now = Date.now();
    const elapsed = Math.max(0, now - start);
    const percent = Math.min(100, Math.round((elapsed / duration) * 100));
    const daysElapsed = Math.min(tx.planSnapshot?.durationDays ?? 30, Math.round(elapsed / (24 * 60 * 60 * 1000)));
    return { percent, daysElapsed };
  };

  const handleInvestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlan) return;
    const amount = parseFloat(investAmount);
    if (isNaN(amount) || amount <= 0) {
      setErrorMsg("Please enter a valid investment amount");
      return;
    }
    if (amount < selectedPlan.minAmount || amount > selectedPlan.maxAmount) {
      setErrorMsg(`Amount must be between ${formatCurrency(selectedPlan.minAmount)} and ${formatCurrency(selectedPlan.maxAmount)}`);
      return;
    }
    if ((dashData?.balance ?? 0) < amount) {
      setErrorMsg("Insufficient balance in your wallet. Please deposit funds first.");
      return;
    }
    investMutation.mutate({ planId: selectedPlan._id, amount });
  };

  const handleUpgradeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!upgradeTx || !selectedPlanId) return;

    const currentAmount = upgradeTx.amount;
    const newPlan = activePlans.find((p) => p._id === selectedPlanId);
    if (!newPlan) return;

    const topUp = Math.max(0, newPlan.minAmount - currentAmount);
    if (topUp > 0 && (dashData?.balance ?? 0) < topUp) {
      setErrorMsg(`Insufficient balance. Upgrading to this plan requires a top-up of ${formatCurrency(topUp)}.`);
      return;
    }

    upgradeMutation.mutate({ txId: upgradeTx._id, newPlanId: selectedPlanId });
  };

  const getUpgradeTopUp = (tx: Transaction, planId: string) => {
    const targetPlan = activePlans.find((p) => p._id === planId);
    if (!targetPlan) return 0;
    return Math.max(0, targetPlan.minAmount - tx.amount);
  };


  return (
    <div className="space-y-6 max-w-5xl mx-auto p-4 md:p-6">
      {/* Header Summary Banner */}
      <div className="bg-[#121822] text-white rounded-3xl border border-white/10 p-6 relative overflow-hidden shadow-sm">
        <div className="absolute -top-10 -right-10 w-44 h-44 rounded-full bg-emerald-500/5 blur-xl" />
        <div className="absolute -bottom-10 -right-5 w-32 h-32 rounded-full bg-emerald-500/5 blur-xl" />
        
        <div className="relative grid grid-cols-1 md:grid-cols-3 gap-6 divide-y md:divide-y-0 md:divide-x divide-white/10">
          <div className="space-y-1">
            <span className="text-slate-400 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
              <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
              Wallet Balance
            </span>
            <span className="text-2xl lg:text-3xl font-black text-white font-mono block">
              {dashLoading ? "..." : formatCurrency(dashData?.balance ?? 0)}
            </span>
          </div>
          <div className="space-y-1 pt-4 md:pt-0 md:pl-6">
            <span className="text-slate-400 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
              <svg className="w-4 h-4 text-[#00c076]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Invested Funds
            </span>
            <span className="text-2xl lg:text-3xl font-black text-[#00c076] font-mono block">
              {dashLoading ? "..." : formatCurrency(dashData?.investedBalance ?? 0)}
            </span>
          </div>
          <div className="space-y-1 pt-4 md:pt-0 md:pl-6">
            <span className="text-slate-400 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
              <svg className="w-4 h-4 text-[#00e676]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              Total Profit / Yield
            </span>
            <span className="text-2xl lg:text-3xl font-black text-[#00e676] font-mono block">
              {dashLoading ? "..." : formatCurrency(dashData?.totalEarnings ?? 0)}
            </span>
          </div>
        </div>
      </div>

      {/* Section 1: Active Investments & Duration Tracking */}
      <div>
        <h2 className="text-base font-bold text-white mb-3 flex items-center gap-2">
          <svg className="w-5 h-5 text-[#00c076]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <span>Your Portfolios</span>
        </h2>
        {loadingMyInvests ? (
          <div className="p-8 text-center text-slate-500 bg-[#121822] rounded-3xl border border-white/10">
            Loading your active portfolios...
          </div>
        ) : myInvestments.length === 0 ? (
          <div className="p-8 text-center text-slate-500 bg-[#121822] rounded-3xl border border-white/10">
            You do not have any active investments. Select a package below to start compounding yield.
          </div>
        ) : (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {myInvestments.slice((portfolioPage - 1) * 4, portfolioPage * 4).map((tx) => {
                const progress = getProgress(tx);
                const isMaturedOrCompleted = tx.status === "matured" || tx.status === "completed";
                const completedAt = tx.meta?.completedAt || tx.updatedAt;
                const timePassed = completedAt ? Date.now() - new Date(completedAt).getTime() : 0;
                const isEligibleForReinvest = isMaturedOrCompleted && timePassed <= 48 * 60 * 60 * 1000;
                const hoursLeft = Math.max(0, Math.ceil((48 * 60 * 60 * 1000 - timePassed) / (1000 * 60 * 60)));
                const duration = tx.planSnapshot?.durationDays ?? 30;
                const dailyRoi = tx.planSnapshot?.roiPercent ?? 0;
                const totalProfit = (tx.amount * (dailyRoi / 100)) * duration;
                const maturityTotal = tx.amount + totalProfit;

                return (
                  <div key={tx._id} className="bg-[#121822] border border-white/10 rounded-3xl p-5 shadow-sm space-y-4 hover:border-white/20 transition-colors text-white">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] text-slate-500 font-mono block uppercase">Reference: {tx.reference}</span>
                        <h3 className="font-bold text-white text-base mt-0.5">{tx.planSnapshot?.name} Contract</h3>
                        <span className="text-[11px] text-[#00e676] font-mono font-bold">
                          +{dailyRoi}% Daily • {duration} Days Duration
                        </span>
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        tx.status === "approved" || tx.status === "completed"
                          ? "bg-emerald-500/15 text-[#00e676] border border-emerald-500/30"
                          : tx.status === "matured"
                          ? "bg-emerald-500/20 text-[#00c076] border border-[#00c076] animate-pulse"
                          : tx.status === "pending"
                          ? "bg-amber-500/15 text-amber-300 border border-amber-500/30"
                          : "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                      }`}>
                        {tx.status === "matured" ? "Matured (48h Window)" : tx.status}
                      </span>
                    </div>

                    {isEligibleForReinvest && (
                      <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-between text-xs">
                        <span className="text-slate-300 font-medium">48h Reinvestment Window:</span>
                        <span className="text-[#00e676] font-bold font-mono">{hoursLeft}h remaining</span>
                      </div>
                    )}

                    <div className="grid grid-cols-3 gap-2.5 text-xs bg-[#0e1520] p-3.5 rounded-2xl border border-white/10 font-mono">
                      <div>
                        <span className="text-slate-400 block text-[9px] uppercase font-sans font-bold">Principal</span>
                        <span className="font-bold text-white text-xs">{formatCurrency(tx.amount)}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[9px] uppercase font-sans font-bold">Daily Drop</span>
                        <span className="font-bold text-[#00e676] text-xs">
                          +{formatCurrency((tx.amount * (dailyRoi / 100)))}/d
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[9px] uppercase font-sans font-bold">Maturity Total</span>
                        <span className="font-bold text-[#00c076] text-xs">
                          {formatCurrency(maturityTotal)}
                        </span>
                      </div>
                    </div>

                    {/* Duration tracking */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs text-slate-400">
                        <span>Contract Progress</span>
                        {tx.status === "pending" ? (
                          <span className="font-bold text-amber-300 animate-pulse">Awaiting Approval</span>
                        ) : isMaturedOrCompleted ? (
                          <span className="font-bold text-[#00e676]">Matured 100%</span>
                        ) : (
                          <span className="font-mono">{progress.daysElapsed} / {tx.planSnapshot?.durationDays} Days ({progress.percent}%)</span>
                        )}
                      </div>
                      {tx.status !== "pending" && (
                        <div className="w-full h-2 bg-[#0e1520] rounded-full overflow-hidden border border-white/10">
                          <div
                            className="h-full bg-[#00c076] rounded-full transition-all duration-500"
                            style={{ width: `${progress.percent}%` }}
                          />
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex justify-between items-center pt-2 border-t border-white/10">
                      <button
                        onClick={() => setSelectedTx(tx)}
                        className="text-xs font-bold text-slate-400 hover:text-white transition-colors cursor-pointer"
                      >
                        View Details & Logs
                      </button>
                      <div className="space-x-2">
                        {tx.status === "approved" && (
                          <button
                            onClick={() => { setUpgradeTx(tx); setErrorMsg(""); }}
                            className="text-xs font-bold bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 px-3 py-1.5 rounded-xl border border-amber-500/30 transition-colors cursor-pointer"
                          >
                            Upgrade Plan
                          </button>
                        )}
                        {isMaturedOrCompleted && (
                          isEligibleForReinvest ? (
                            <button
                              onClick={() => {
                                if (confirm("Are you sure you want to reinvest the principal amount into a new cycle?")) {
                                  reinvestMutation.mutate(tx._id);
                                }
                              }}
                              className="text-xs font-black bg-[#00c076] hover:bg-[#00e676] text-[#080c10] px-3.5 py-1.5 rounded-xl shadow-md shadow-[#00c076]/20 transition-all cursor-pointer"
                            >
                              Reinvest Principal
                            </button>
                          ) : (
                            <span className="inline-block text-[10px] font-bold text-slate-400 bg-white/5 border border-white/10 px-3 py-1 rounded-xl">
                              Payout Released
                            </span>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            <div className="mt-4 bg-[#121822] rounded-2xl border border-white/10 overflow-hidden">
              <Pagination
                compact
                currentPage={portfolioPage}
                totalPages={Math.ceil(myInvestments.length / 4) || 1}
                totalItems={myInvestments.length}
                pageSize={4}
                onPageChange={setPortfolioPage}
              />
            </div>
          </div>
        )}
      </div>

      {/* Section 2: Investment Catalog (Available Plans) */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <svg className="w-5 h-5 text-[#00c076]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span>Investment Packages</span>
            </h2>
            <p className="text-xs text-slate-400">Fixed-yield compounding contracts with daily automated profit drops.</p>
          </div>
          <span className="bg-[#00c076]/15 border border-[#00c076]/30 text-[#00e676] text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider self-start sm:self-auto flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00e676] animate-pulse" />
            24h Daily Profit Cycles
          </span>
        </div>

        {loadingPlans ? (
          <div className="p-8 text-center text-slate-500 bg-[#121822] rounded-3xl border border-white/10">
            Loading packages...
          </div>
        ) : activePlans.length === 0 ? (
          <div className="p-8 text-center text-slate-500 bg-[#121822] rounded-3xl border border-white/10">
            No investment plans are currently available.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {activePlans.map((plan) => {
              const totalRoi = plan.roiPercent * plan.durationDays;
              return (
                <div key={plan._id} className="bg-[#121822] border border-white/10 rounded-3xl p-6 shadow-sm flex flex-col justify-between hover:border-[#00c076]/50 transition-all text-white group">
                  <div className="space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-black text-base text-white group-hover:text-[#00c076] transition-colors">{plan.name}</h3>
                        <span className="text-xs text-[#00e676] font-bold font-mono">
                          +{plan.roiPercent}% Daily ROI
                        </span>
                      </div>
                      <span className="bg-emerald-500/15 border border-emerald-500/30 text-[#00e676] px-2.5 py-1 rounded-full text-xs font-black uppercase tracking-wider font-mono">
                        +{totalRoi}% Total
                      </span>
                    </div>

                    <div className="space-y-2.5 bg-[#0e1520] p-4 rounded-2xl border border-white/10">
                      <div className="flex justify-between text-xs items-center">
                        <span className="text-slate-400 flex items-center gap-1.5">
                          <svg className="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Contract Duration
                        </span>
                        <span className="font-bold text-white">{plan.durationDays} Days</span>
                      </div>
                      <div className="flex justify-between text-xs items-center">
                        <span className="text-slate-400 flex items-center gap-1.5">
                          <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                          Payout Frequency
                        </span>
                        <span className="font-bold text-[#00e676]">Daily Drop (Every 24h)</span>
                      </div>
                      <div className="flex justify-between text-xs items-center">
                        <span className="text-slate-400 flex items-center gap-1.5">
                          <svg className="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Min. Deposit
                        </span>
                        <span className="font-mono font-bold text-white">{formatCurrency(plan.minAmount)}</span>
                      </div>
                      <div className="flex justify-between text-xs items-center">
                        <span className="text-slate-400 flex items-center gap-1.5">
                          <svg className="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Max. Deposit
                        </span>
                        <span className="font-mono font-bold text-white">{formatCurrency(plan.maxAmount)}</span>
                      </div>
                    </div>

                    {/* Descriptive bullet points */}
                    <div className="space-y-2 text-[11px] text-slate-300 bg-white/5 p-3.5 rounded-2xl border border-white/5 leading-relaxed">
                      <div className="flex items-start gap-2">
                        <span className="text-[#00e676] font-black shrink-0 mt-0.5">⚡</span>
                        <span>Earns <strong>{plan.roiPercent}% daily profit</strong> every 24 hours ({totalRoi}% over {plan.durationDays} days)</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-[#00e676] font-black shrink-0 mt-0.5">🛡️</span>
                        <span>Principal safely locked in compounding during the {plan.durationDays}-day cycle</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-[#00e676] font-black shrink-0 mt-0.5">🔄</span>
                        <span>48-hour reinvestment grace window on maturity with auto-settlement</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedPlan(plan);
                      setInvestAmount(String(plan.minAmount));
                      setErrorMsg("");
                    }}
                    className="w-full mt-6 bg-[#00c076] hover:bg-[#00e676] text-[#080c10] py-3.5 rounded-xl text-xs font-black shadow-md shadow-[#00c076]/20 transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <span>Invest Now</span>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Invest Modal */}
      {selectedPlan && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#121822] border border-white/10 w-full max-w-lg rounded-3xl p-6 shadow-2xl text-white space-y-4">
            <div>
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <span>Subscribe to {selectedPlan.name}</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5 font-mono">
                    {selectedPlan.durationDays} Days Duration • {selectedPlan.roiPercent}% Daily ROI
                  </p>
                </div>
                <span className="bg-[#00c076]/20 border border-[#00c076]/40 text-[#00e676] px-2.5 py-1 rounded-full text-xs font-black uppercase font-mono">
                  +{selectedPlan.roiPercent}% / Day
                </span>
              </div>
            </div>

            <form onSubmit={handleInvestSubmit} className="space-y-4">
              {/* Number Input & Balance Header */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Investment Amount</label>
                  <span className="text-slate-400">
                    Wallet Balance: <strong className="text-[#00c076] font-mono">{formatCurrency(dashData?.balance ?? 0)}</strong>
                  </span>
                </div>

                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-bold">$</span>
                  <input
                    type="number"
                    required
                    min={selectedPlan.minAmount}
                    max={selectedPlan.maxAmount}
                    value={investAmount}
                    onChange={(e) => { setInvestAmount(e.target.value); setErrorMsg(""); }}
                    placeholder={`${selectedPlan.minAmount} - ${selectedPlan.maxAmount}`}
                    className="w-full bg-[#0e1520] border border-white/10 text-white rounded-xl pl-8 pr-4 py-2.5 text-sm font-mono font-bold focus:outline-none focus:border-[#00c076]"
                  />
                </div>

                {/* ─── ADJUSTABLE DRAGGER / SLIDER ─── */}
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono font-bold">
                    <span>Min: {formatCurrency(selectedPlan.minAmount)}</span>
                    <span className="text-[#00c076]">Selected: {formatCurrency(Number(investAmount) || selectedPlan.minAmount)}</span>
                    <span>Max: {formatCurrency(selectedPlan.maxAmount)}</span>
                  </div>
                  
                  <input
                    type="range"
                    min={selectedPlan.minAmount}
                    max={selectedPlan.maxAmount}
                    step={Math.max(1, Math.round((selectedPlan.maxAmount - selectedPlan.minAmount) / 100))}
                    value={Number(investAmount) || selectedPlan.minAmount}
                    onChange={(e) => {
                      setInvestAmount(e.target.value);
                      setErrorMsg("");
                    }}
                    className="w-full accent-[#00c076] bg-[#0e1520] h-2 rounded-lg cursor-pointer transition-all"
                  />

                  {/* Preset Percent Quick Buttons */}
                  <div className="grid grid-cols-5 gap-1.5 pt-1">
                    {[
                      { label: "Min", val: selectedPlan.minAmount },
                      { label: "25%", val: Math.round(selectedPlan.minAmount + (selectedPlan.maxAmount - selectedPlan.minAmount) * 0.25) },
                      { label: "50%", val: Math.round(selectedPlan.minAmount + (selectedPlan.maxAmount - selectedPlan.minAmount) * 0.5) },
                      { label: "75%", val: Math.round(selectedPlan.minAmount + (selectedPlan.maxAmount - selectedPlan.minAmount) * 0.75) },
                      { label: "Max", val: selectedPlan.maxAmount },
                    ].map((preset) => (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => {
                          const targetAmount = Math.min(preset.val, selectedPlan.maxAmount);
                          setInvestAmount(String(targetAmount));
                          setErrorMsg("");
                        }}
                        className="py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] font-mono font-bold text-slate-300 hover:text-white transition-all cursor-pointer"
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Live 24h Yield Breakdown Calculator */}
              {Number(investAmount) > 0 && (
                <div className="bg-[#0e1520] border border-white/10 rounded-2xl p-4 space-y-2.5 font-mono text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span className="flex items-center gap-1.5 font-sans font-medium text-slate-300">
                      ⚡ Daily Profit Drop (Every 24h):
                    </span>
                    <span className="text-[#00e676] font-bold text-sm">
                      +{formatCurrency(Number(investAmount) * (selectedPlan.roiPercent / 100))} / day
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span className="flex items-center gap-1.5 font-sans font-medium text-slate-300">
                      📈 Total Profit ({selectedPlan.durationDays} Days):
                    </span>
                    <span className="text-[#00e676] font-bold">
                      +{formatCurrency(Number(investAmount) * (selectedPlan.roiPercent / 100) * selectedPlan.durationDays)} (+{selectedPlan.roiPercent * selectedPlan.durationDays}%)
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-white/10 pt-2 text-white font-bold text-sm">
                    <span className="font-sans">💰 Total Maturity Payout:</span>
                    <span className="text-white font-bold">
                      {formatCurrency(Number(investAmount) + Number(investAmount) * (selectedPlan.roiPercent / 100) * selectedPlan.durationDays)}
                    </span>
                  </div>
                </div>
              )}

              {/* Descriptive 24h Cycle Notice */}
              <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-[11px] text-slate-300 leading-relaxed space-y-1">
                <p className="flex items-center gap-1.5 font-bold text-white">
                  <svg className="w-4 h-4 text-[#00c076] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  24-Hour Cycle Schedule:
                </p>
                <p className="text-slate-300 pl-5">
                  Your first profit drop of <strong className="text-[#00e676] font-mono">+{formatCurrency((Number(investAmount) || selectedPlan.minAmount) * (selectedPlan.roiPercent / 100))}</strong> will credit in exactly 24 hours, continuing daily for <strong className="text-white">{selectedPlan.durationDays} consecutive cycles</strong>.
                </p>
                <p className="text-slate-400 pl-5">
                  Your initial capital of <strong className="text-white font-mono">{formatCurrency(Number(investAmount) || selectedPlan.minAmount)}</strong> remains secured and returns upon maturity with 48-hour reinvestment eligibility.
                </p>
              </div>

              {errorMsg && (
                <div className="bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs p-3.5 rounded-2xl font-bold">
                  ✕ {errorMsg}
                </div>
              )}

              <div className="flex gap-3 justify-end pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setSelectedPlan(null)}
                  className="px-4 py-2.5 text-xs font-bold border border-white/10 text-slate-400 rounded-xl hover:bg-white/5 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={investMutation.isPending}
                  className="px-6 py-2.5 text-xs font-black bg-[#00c076] hover:bg-[#00e676] text-[#080c10] rounded-xl shadow-md shadow-[#00c076]/20 disabled:opacity-50 cursor-pointer flex items-center gap-2"
                >
                  {investMutation.isPending && (
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={4} />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                  )}
                  {investMutation.isPending ? "Activating Contract…" : "Confirm & Activate Plan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Upgrade Plan Modal */}
      {upgradeTx && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#121822] border border-white/10 w-full max-w-md rounded-3xl p-6 shadow-2xl text-white">
            <h3 className="text-base font-bold text-white mb-1">Upgrade Investment Plan</h3>
            <p className="text-xs text-slate-400 mb-4">
              Select a higher tier package to upgrade your active reference <strong className="font-mono text-white">{upgradeTx.reference}</strong>.
            </p>

            <form onSubmit={handleUpgradeSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Choose Target Package</label>
                <select
                  required
                  value={selectedPlanId}
                  onChange={(e) => { setSelectedPlanId(e.target.value); setErrorMsg(""); }}
                  className="w-full bg-[#0e1520] border border-white/10 text-white rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-[#00c076]"
                >
                  <option value="">-- Choose Plan --</option>
                  {activePlans
                    .filter((p) => p._id !== upgradeTx.planId)
                    .map((p) => (
                      <option key={p._id} value={p._id}>
                        {p.name} (Min: {formatCurrency(p.minAmount)}, ROI: {p.roiPercent}%)
                      </option>
                    ))}
                </select>
              </div>

              {selectedPlanId && (
                <div className="bg-[#0e1520] rounded-2xl p-4 border border-white/10 text-xs space-y-1.5 font-mono">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Current Investment:</span>
                    <span className="font-bold text-white">{formatCurrency(upgradeTx.amount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">New Plan Requirement:</span>
                    <span className="font-bold text-white">
                      {formatCurrency(activePlans.find(p => p._id === selectedPlanId)?.minAmount ?? 0)}
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-white/10 pt-2 mt-2 font-bold text-[#00e676]">
                    <span>Top-up Required:</span>
                    <span>{formatCurrency(getUpgradeTopUp(upgradeTx, selectedPlanId))}</span>
                  </div>
                </div>
              )}

              {errorMsg && (
                <div className="bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs p-3.5 rounded-2xl font-bold">
                  ✕ {errorMsg}
                </div>
              )}

              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setUpgradeTx(null)}
                  className="px-4 py-2.5 text-xs font-bold border border-white/10 text-slate-400 rounded-xl hover:bg-white/5 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={upgradeMutation.isPending}
                  className="px-5 py-2.5 text-xs font-black bg-[#00c076] hover:bg-[#00e676] text-[#080c10] rounded-xl shadow-md shadow-[#00c076]/20 disabled:opacity-50 cursor-pointer"
                >
                  {upgradeMutation.isPending ? "Upgrading..." : "Confirm Upgrade"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Details Side Panel with Profit Logs */}
      {selectedTx && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 flex justify-end">
          <div className="fixed inset-0" onClick={() => setSelectedTx(null)} />
          <div className="relative w-full max-w-lg bg-[#121822] border-l border-white/10 h-full shadow-2xl p-6 overflow-y-auto z-50 flex flex-col justify-between text-white">
            <div className="space-y-6">
              <div className="flex justify-between items-start border-b border-white/10 pb-4">
                <div>
                  <h2 className="text-base font-bold text-white">Investment Contract</h2>
                  <p className="text-xs text-slate-400 mt-0.5 font-mono">Reference: {selectedTx.reference}</p>
                </div>
                <button
                  onClick={() => setSelectedTx(null)}
                  className="text-slate-400 hover:text-white transition-colors cursor-pointer text-xl"
                >
                  &times;
                </button>
              </div>

              {/* Statistics */}
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 font-mono">Contract Breakdown</p>
                <div className="bg-[#0e1520] border border-white/10 rounded-2xl p-4 space-y-2">
                  {[
                    ["Selected Package", selectedTx.planSnapshot?.name],
                    ["Principal Invested", formatCurrency(selectedTx.amount)],
                    ["Daily ROI Rate", `+${selectedTx.planSnapshot?.roiPercent}% / Day`],
                    ["Total Contract Yield", `+${(selectedTx.planSnapshot?.roiPercent ?? 0) * (selectedTx.planSnapshot?.durationDays ?? 30)}% Total`],
                    ["Contract Duration", `${selectedTx.planSnapshot?.durationDays} Days`],
                    ["Est. Maturity Yield", formatCurrency(selectedTx.amount + (selectedTx.amount * (selectedTx.planSnapshot?.roiPercent ?? 0) * (selectedTx.planSnapshot?.durationDays ?? 30)) / 100)],
                    ["Start Date", formatDate(selectedTx.createdAt)],
                    ["Maturity Date", selectedTx.expiresAt ? formatDate(selectedTx.expiresAt) : "N/A"],
                    ["Contract Status", selectedTx.status.toUpperCase()],
                  ].map(([label, value]) => (
                    <div key={label} className="flex justify-between text-xs">
                      <span className="text-slate-400">{label}</span>
                      <span className="font-bold text-white text-right">{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Profit Logs */}
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 font-mono">Profit Yield Logs</p>
                {selectedTx.meta?.profitLogs && selectedTx.meta.profitLogs.length > 0 ? (
                  <div className="space-y-2 max-h-[220px] overflow-y-auto border border-white/10 rounded-2xl p-3 bg-[#0e1520]">
                    {(selectedTx.meta.profitLogs as any[]).map((log, index) => (
                      <div key={index} className="flex justify-between items-center text-xs border-b border-white/5 pb-2 last:border-0 last:pb-0">
                        <div>
                          <div className="font-bold text-white">{log.note || "Daily Yield"}</div>
                          <div className="text-[10px] text-slate-500 font-mono">{formatDate(log.date)}</div>
                        </div>
                        <div className="font-bold text-[#00e676] font-mono">+{formatCurrency(log.amount)}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-slate-500 bg-[#0e1520] border border-white/10 p-4 rounded-2xl text-center">
                    No yields logged on this investment cycle yet.
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={() => setSelectedTx(null)}
              className="w-full border border-white/10 text-slate-400 py-3 rounded-2xl text-xs font-bold hover:bg-white/5 transition-colors mt-6 cursor-pointer"
            >
              Close Panel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
