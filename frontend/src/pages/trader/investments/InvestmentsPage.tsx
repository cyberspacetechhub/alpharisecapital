import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { investmentApi } from "../../../api/investment.api";
import { userApi } from "../../../api/user.api";
import { formatCurrency, formatDate } from "../../../utils";
import type { InvestmentPlan, Transaction, DashboardSummary } from "../../../types";

export default function TraderInvestmentsPage() {
  const qc = useQueryClient();
  const [selectedPlan, setSelectedPlan] = useState<InvestmentPlan | null>(null);
  const [investAmount, setInvestAmount] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [upgradeTx, setUpgradeTx] = useState<Transaction | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState("");

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
            <span className="text-slate-400 text-xs font-bold uppercase tracking-wider block">Wallet Balance</span>
            <span className="text-2xl lg:text-3xl font-black text-white font-mono block">
              {dashLoading ? "..." : formatCurrency(dashData?.balance ?? 0)}
            </span>
          </div>
          <div className="space-y-1 pt-4 md:pt-0 md:pl-6">
            <span className="text-slate-400 text-xs font-bold uppercase tracking-wider block">Invested Funds</span>
            <span className="text-2xl lg:text-3xl font-black text-[#00c076] font-mono block">
              {dashLoading ? "..." : formatCurrency(dashData?.investedBalance ?? 0)}
            </span>
          </div>
          <div className="space-y-1 pt-4 md:pt-0 md:pl-6">
            <span className="text-slate-400 text-xs font-bold uppercase tracking-wider block">Total Profit / Yield</span>
            <span className="text-2xl lg:text-3xl font-black text-[#00e676] font-mono block">
              {dashLoading ? "..." : formatCurrency(dashData?.totalEarnings ?? 0)}
            </span>
          </div>
        </div>
      </div>

      {/* Section 1: Active Investments & Duration Tracking */}
      <div>
        <h2 className="text-base font-bold text-white mb-3">Your Portfolios</h2>
        {loadingMyInvests ? (
          <div className="p-8 text-center text-slate-500 bg-[#121822] rounded-3xl border border-white/10">
            Loading your active portfolios...
          </div>
        ) : myInvestments.length === 0 ? (
          <div className="p-8 text-center text-slate-500 bg-[#121822] rounded-3xl border border-white/10">
            You do not have any active investments. Select a package below to start compounding yield.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {myInvestments.map((tx) => {
              const progress = getProgress(tx);
              const isMaturedOrCompleted = tx.status === "matured" || tx.status === "completed";
              const completedAt = tx.meta?.completedAt || tx.updatedAt;
              const timePassed = completedAt ? Date.now() - new Date(completedAt).getTime() : 0;
              const isEligibleForReinvest = isMaturedOrCompleted && timePassed <= 48 * 60 * 60 * 1000;
              const hoursLeft = Math.max(0, Math.ceil((48 * 60 * 60 * 1000 - timePassed) / (1000 * 60 * 60)));

              return (
                <div key={tx._id} className="bg-[#121822] border border-white/10 rounded-3xl p-5 shadow-sm space-y-4 hover:border-white/20 transition-colors text-white">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] text-slate-500 font-mono block uppercase">Reference: {tx.reference}</span>
                      <h3 className="font-bold text-white text-base mt-0.5">{tx.planSnapshot?.name} Contract</h3>
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

                  <div className="grid grid-cols-2 gap-3 text-xs bg-[#0e1520] p-3.5 rounded-2xl border border-white/10 font-mono">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-sans font-bold">Invested Principal</span>
                      <span className="font-bold text-white text-sm">{formatCurrency(tx.amount)}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-sans font-bold">Est. Maturity Yield</span>
                      <span className="font-bold text-[#00e676] text-sm">
                        {formatCurrency(tx.amount + (tx.amount * (tx.planSnapshot?.roiPercent ?? 0)) / 100)}
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
        )}
      </div>

      {/* Section 2: Investment Catalog (Available Plans) */}
      <div>
        <h2 className="text-base font-bold text-white mb-3">Investment Packages</h2>
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
            {activePlans.map((plan) => (
              <div key={plan._id} className="bg-[#121822] border border-white/10 rounded-3xl p-6 shadow-sm flex flex-col justify-between hover:border-[#00c076]/50 transition-all text-white">
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <h3 className="font-black text-base text-white">{plan.name}</h3>
                    <span className="bg-emerald-500/15 border border-emerald-500/30 text-[#00e676] px-2.5 py-1 rounded-full text-xs font-black uppercase tracking-wider">
                      +{plan.roiPercent}% ROI
                    </span>
                  </div>

                  <div className="space-y-2.5 bg-[#0e1520] p-4 rounded-2xl border border-white/10">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">Duration</span>
                      <span className="font-bold text-white">{plan.durationDays} Days</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">Min. Deposit</span>
                      <span className="font-mono font-bold text-white">{formatCurrency(plan.minAmount)}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">Max. Deposit</span>
                      <span className="font-mono font-bold text-white">{formatCurrency(plan.maxAmount)}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => { setSelectedPlan(plan); setErrorMsg(""); }}
                  className="w-full mt-6 bg-[#00c076] hover:bg-[#00e676] text-[#080c10] py-3 rounded-xl text-xs font-black shadow-md shadow-[#00c076]/20 transition-all cursor-pointer"
                >
                  Invest Now
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Invest Modal */}
      {selectedPlan && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#121822] border border-white/10 w-full max-w-md rounded-3xl p-6 shadow-2xl text-white">
            <h3 className="text-base font-bold text-white mb-1">Subscribe to {selectedPlan.name}</h3>
            <p className="text-xs text-slate-400 mb-4">
              Enter investment amount. Available balance: <strong className="text-[#00c076] font-mono">{formatCurrency(dashData?.balance ?? 0)}</strong>.
            </p>

            <form onSubmit={handleInvestSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Investment Amount ($)</label>
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
                    className="w-full bg-[#0e1520] border border-white/10 text-white rounded-xl pl-8 pr-4 py-2.5 text-xs focus:outline-none focus:border-[#00c076]"
                  />
                </div>
                <span className="text-[10px] text-slate-500 block mt-1 font-mono">
                  Limits: {formatCurrency(selectedPlan.minAmount)} – {formatCurrency(selectedPlan.maxAmount)}
                </span>
              </div>

              {errorMsg && (
                <div className="bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs p-3.5 rounded-2xl font-bold">
                  ✕ {errorMsg}
                </div>
              )}

              <div className="flex gap-3 justify-end pt-2">
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
                  className="px-5 py-2.5 text-xs font-black bg-[#00c076] hover:bg-[#00e676] text-[#080c10] rounded-xl shadow-md shadow-[#00c076]/20 disabled:opacity-50 cursor-pointer"
                >
                  {investMutation.isPending ? "Activating..." : "Activate Plan"}
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
                    ["ROI Percentage", `+${selectedTx.planSnapshot?.roiPercent}%`],
                    ["Contract Duration", `${selectedTx.planSnapshot?.durationDays} Days`],
                    ["Maturity Yield", formatCurrency(selectedTx.amount + (selectedTx.amount * (selectedTx.planSnapshot?.roiPercent ?? 0)) / 100)],
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
