import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { investmentApi } from "../../../api/investment.api";
import { userApi } from "../../../api/user.api";
import { formatCurrency, formatDate, getStatusColor } from "../../../utils";
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
      <div className="bg-[#1a3a2a] text-white rounded-2xl p-6 relative overflow-hidden shadow-sm">
        <div className="absolute -top-10 -right-10 w-44 h-44 rounded-full bg-white/5" />
        <div className="absolute -bottom-10 -right-5 w-32 h-32 rounded-full bg-white/5" />
        
        <div className="relative grid grid-cols-1 md:grid-cols-3 gap-6 divide-y md:divide-y-0 md:divide-x divide-white/10">
          <div className="space-y-1">
            <span className="text-white/60 text-xs font-medium uppercase tracking-wider block">Wallet Balance</span>
            <span className="text-3xl font-extrabold block">
              {dashLoading ? "..." : formatCurrency(dashData?.balance ?? 0)}
            </span>
          </div>
          <div className="space-y-1 pt-4 md:pt-0 md:pl-6">
            <span className="text-white/60 text-xs font-medium uppercase tracking-wider block">Invested Funds</span>
            <span className="text-3xl font-extrabold text-emerald-400 block">
              {dashLoading ? "..." : formatCurrency(dashData?.investedBalance ?? 0)}
            </span>
          </div>
          <div className="space-y-1 pt-4 md:pt-0 md:pl-6">
            <span className="text-white/60 text-xs font-medium uppercase tracking-wider block">Total Earnings</span>
            <span className="text-3xl font-extrabold block">
              {dashLoading ? "..." : formatCurrency(dashData?.totalEarnings ?? 0)}
            </span>
          </div>
        </div>
      </div>

      {/* Section 1: Active Investments & Duration Tracking */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-3">Your Portfolios</h2>
        {loadingMyInvests ? (
          <div className="p-8 text-center text-gray-500 bg-white rounded-2xl border border-gray-100">
            Loading your active portfolios...
          </div>
        ) : myInvestments.length === 0 ? (
          <div className="p-8 text-center text-gray-500 bg-white rounded-2xl border border-gray-100">
            You do not have any active investments. Select a plan below to get started.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {myInvestments.map((tx) => {
              const progress = getProgress(tx);
              return (
                <div key={tx._id} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm space-y-4 hover:border-gray-200 transition-colors">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-xs text-gray-400 font-semibold block uppercase">Reference: {tx.reference}</span>
                      <h3 className="font-bold text-gray-900 mt-0.5">{tx.planSnapshot?.name} Plan</h3>
                    </div>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold uppercase ${getStatusColor(tx.status)}`}>
                      {tx.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-gray-400 block text-xs">Invested Principal</span>
                      <span className="font-bold text-gray-800">{formatCurrency(tx.amount)}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block text-xs">Est. Maturity Yield</span>
                      <span className="font-bold text-emerald-600">
                        {formatCurrency(tx.amount + (tx.amount * (tx.planSnapshot?.roiPercent ?? 0)) / 100)}
                      </span>
                    </div>
                  </div>

                  {/* Duration tracking */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Contract Progress</span>
                      {tx.status === "pending" ? (
                        <span className="font-semibold text-amber-500 animate-pulse">Awaiting Approval</span>
                      ) : (
                        <span>{progress.daysElapsed} / {tx.planSnapshot?.durationDays} Days ({progress.percent}%)</span>
                      )}
                    </div>
                    {tx.status !== "pending" && (
                      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                          style={{ width: `${progress.percent}%` }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex justify-between items-center pt-2 border-t border-gray-50">
                    <button
                      onClick={() => setSelectedTx(tx)}
                      className="text-xs font-bold text-[#1a3a2a] hover:text-[#2d6a4f] transition-colors"
                    >
                      View Details & Logs
                    </button>
                    <div className="space-x-2">
                      {tx.status === "approved" && (
                        <button
                          onClick={() => { setUpgradeTx(tx); setErrorMsg(""); }}
                          className="text-xs font-bold bg-amber-50 hover:bg-amber-100 text-amber-800 px-3 py-1.5 rounded-lg border border-amber-200 transition-colors"
                        >
                          Upgrade Plan
                        </button>
                      )}
                      {tx.status === "completed" && (() => {
                        const completedAt = tx.meta?.completedAt || tx.updatedAt;
                        const isEligible = completedAt && (Date.now() - new Date(completedAt).getTime() <= 48 * 60 * 60 * 1000);
                        if (isEligible) {
                          return (
                            <button
                              onClick={() => {
                                if (confirm("Are you sure you want to reinvest the principal amount into a new cycle?")) {
                                  reinvestMutation.mutate(tx._id);
                                }
                              }}
                              className="text-xs font-bold bg-emerald-50 hover:bg-emerald-100 text-[#1a3a2a] px-3 py-1.5 rounded-lg border border-emerald-200 transition-colors"
                            >
                              Reinvest Principal
                            </button>
                          );
                        } else {
                          return (
                            <span className="inline-block text-xs font-semibold text-gray-400 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-lg">
                              Can't Reinvest (Expired)
                            </span>
                          );
                        }
                      })()}
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
        <h2 className="text-lg font-bold text-gray-900 mb-3">Investment Packages</h2>
        {loadingPlans ? (
          <div className="p-8 text-center text-gray-500 bg-white rounded-2xl border border-gray-100">
            Loading packages...
          </div>
        ) : activePlans.length === 0 ? (
          <div className="p-8 text-center text-gray-500 bg-white rounded-2xl border border-gray-100">
            No investment plans are currently available.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {activePlans.map((plan) => (
              <div key={plan._id} className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm flex flex-col justify-between hover:border-emerald-500/30 transition-all hover:shadow-md">
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <h3 className="font-extrabold text-lg text-gray-900">{plan.name}</h3>
                    <span className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-xl text-xs font-extrabold uppercase">
                      +{plan.roiPercent}% ROI
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Duration</span>
                      <span className="font-semibold text-gray-800">{plan.durationDays} Days</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Min. Deposit</span>
                      <span className="font-semibold text-gray-800">{formatCurrency(plan.minAmount)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Max. Deposit</span>
                      <span className="font-semibold text-gray-800">{formatCurrency(plan.maxAmount)}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => { setSelectedPlan(plan); setErrorMsg(""); }}
                  className="w-full mt-6 bg-[#1a3a2a] hover:bg-[#2d6a4f] text-white py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-sm"
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
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-xl animate-in fade-in zoom-in-95">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Subscribe to {selectedPlan.name}</h3>
            <p className="text-xs text-gray-500 mb-4">
              Enter investment amount. Available balance: <strong>{formatCurrency(dashData?.balance ?? 0)}</strong>.
            </p>

            <form onSubmit={handleInvestSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Investment Amount ($)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-bold">$</span>
                  <input
                    type="number"
                    required
                    min={selectedPlan.minAmount}
                    max={selectedPlan.maxAmount}
                    value={investAmount}
                    onChange={(e) => { setInvestAmount(e.target.value); setErrorMsg(""); }}
                    placeholder={`${selectedPlan.minAmount} - ${selectedPlan.maxAmount}`}
                    className="w-full border border-gray-200 rounded-xl pl-8 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20"
                  />
                </div>
                <span className="text-[10px] text-gray-400 block mt-1">
                  Limits: {formatCurrency(selectedPlan.minAmount)} – {formatCurrency(selectedPlan.maxAmount)}
                </span>
              </div>

              {errorMsg && (
                <div className="bg-red-50 text-red-700 text-xs p-3 rounded-xl border border-red-100">
                  {errorMsg}
                </div>
              )}

              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedPlan(null)}
                  className="px-4 py-2 text-sm font-semibold border border-gray-200 text-gray-500 rounded-xl hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={investMutation.isPending}
                  className="px-4 py-2 text-sm font-semibold bg-[#1a3a2a] hover:bg-[#2d6a4f] text-white rounded-xl disabled:opacity-50"
                >
                  Activate Plan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Upgrade Plan Modal */}
      {upgradeTx && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-xl animate-in fade-in zoom-in-95">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Upgrade Investment Plan</h3>
            <p className="text-xs text-gray-500 mb-4">
              Select a higher tier package to upgrade your active reference <strong>{upgradeTx.reference}</strong>.
            </p>

            <form onSubmit={handleUpgradeSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Choose Target Package</label>
                <select
                  required
                  value={selectedPlanId}
                  onChange={(e) => { setSelectedPlanId(e.target.value); setErrorMsg(""); }}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20"
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
                <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Current Investment:</span>
                    <span className="font-semibold text-gray-700">{formatCurrency(upgradeTx.amount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">New Plan Min Requirement:</span>
                    <span className="font-semibold text-gray-700">
                      {formatCurrency(activePlans.find(p => p._id === selectedPlanId)?.minAmount ?? 0)}
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-gray-200 pt-1 mt-1 font-bold text-[#1a3a2a]">
                    <span>Top-up Required:</span>
                    <span>{formatCurrency(getUpgradeTopUp(upgradeTx, selectedPlanId))}</span>
                  </div>
                </div>
              )}

              {errorMsg && (
                <div className="bg-red-50 text-red-700 text-xs p-3 rounded-xl border border-red-100">
                  {errorMsg}
                </div>
              )}

              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setUpgradeTx(null)}
                  className="px-4 py-2 text-sm font-semibold border border-gray-200 text-gray-500 rounded-xl hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={upgradeMutation.isPending}
                  className="px-4 py-2 text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl disabled:opacity-50"
                >
                  Confirm & Upgrade
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Details Side Panel with Profit Logs */}
      {selectedTx && (
        <div className="fixed inset-0 bg-black/40 z-40 flex justify-end">
          <div className="fixed inset-0" onClick={() => setSelectedTx(null)} />
          <div className="relative w-full max-w-lg bg-white h-full shadow-2xl p-6 overflow-y-auto z-50 flex flex-col justify-between animate-in slide-in-from-right duration-300">
            <div className="space-y-6">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Investment Contract</h2>
                  <p className="text-xs text-gray-400 mt-0.5">Reference: {selectedTx.reference}</p>
                </div>
                <button
                  onClick={() => setSelectedTx(null)}
                  className="text-gray-400 hover:text-gray-900 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Statistics */}
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 font-mono">Overview</p>
                <div className="bg-gray-50 rounded-2xl p-4 space-y-2">
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
                    <div key={label} className="flex justify-between text-sm">
                      <span className="text-gray-500">{label}</span>
                      <span className="font-semibold text-gray-900 text-right">{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Profit Logs */}
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 font-mono">Profit Yield logs</p>
                {selectedTx.meta?.profitLogs && selectedTx.meta.profitLogs.length > 0 ? (
                  <div className="space-y-2 max-h-[220px] overflow-y-auto border border-gray-100 rounded-xl p-3 bg-gray-50/50">
                    {(selectedTx.meta.profitLogs as any[]).map((log, index) => (
                      <div key={index} className="flex justify-between items-center text-xs border-b border-gray-100/50 pb-2 last:border-0 last:pb-0">
                        <div>
                          <div className="font-semibold text-gray-800">{log.note || "Investment Yield"}</div>
                          <div className="text-[10px] text-gray-400">{formatDate(log.date)}</div>
                        </div>
                        <div className="font-bold text-emerald-600">+{formatCurrency(log.amount)}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-gray-500 bg-gray-50 p-4 rounded-xl text-center">
                    No yields logged on this investment cycle yet.
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={() => setSelectedTx(null)}
              className="w-full border border-gray-200 text-gray-600 py-3 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors mt-6"
            >
              Close Panel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
