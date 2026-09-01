import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { investmentApi } from "../../../api/investment.api";
import { formatCurrency, formatDate, getStatusColor } from "../../../utils";
import Pagination from "../../../components/common/Pagination";
import type { InvestmentPlan, Transaction, User, ApiResponse } from "../../../types";

type TxWithUser = Omit<Transaction, "user"> & { user: User };

export default function ExecutorInvestmentsPage() {
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<"plans" | "investments">("plans");

  // Plan states
  const [planModal, setPlanModal] = useState<{ mode: "create" | "edit"; plan?: InvestmentPlan } | null>(null);
  const [planForm, setPlanForm] = useState({
    name: "",
    minAmount: 0,
    maxAmount: 0,
    roiPercent: 0,
    durationDays: 30,
    isActive: true,
  });

  // Investment states
  const [statusFilter, setStatusFilter] = useState("");
  const [investPage, setInvestPage] = useState(1);
  const [selectedTx, setSelectedTx] = useState<TxWithUser | null>(null);
  const [profitModal, setProfitModal] = useState<TxWithUser | null>(null);
  const [profitAmount, setProfitAmount] = useState("");
  const [profitNote, setProfitNote] = useState("");
  
  const [statusModal, setStatusModal] = useState<{ tx: TxWithUser; status: string } | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const [upgradeModal, setUpgradeModal] = useState<TxWithUser | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState("");

  const [pendingRejectModal, setPendingRejectModal] = useState<TxWithUser | null>(null);
  const [pendingRejectReason, setPendingRejectReason] = useState("");

  // Queries
  const { data: plansData, isLoading: loadingPlans } = useQuery({
    queryKey: ["exec-plans"],
    queryFn: () => investmentApi.getAllPlans().then((r) => r.data.data as InvestmentPlan[]),
  });

  const { data: investData, isLoading: loadingInvests } = useQuery({
    queryKey: ["exec-investments", statusFilter, investPage],
    queryFn: () =>
      investmentApi
        .getAllInvestments({ status: statusFilter || undefined, page: investPage, limit: 15 })
        .then((r) => r.data as ApiResponse<TxWithUser[]> & { total: number; pages: number }),
  });

  const activePlans = plansData?.filter(p => p.isActive) ?? [];

  // Mutations
  const createPlanMutation = useMutation({
    mutationFn: (data: typeof planForm) => investmentApi.createPlan(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["exec-plans"] });
      setPlanModal(null);
    },
  });

  const updatePlanMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<typeof planForm> }) =>
      investmentApi.updatePlan(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["exec-plans"] });
      setPlanModal(null);
    },
  });

  const togglePlanMutation = useMutation({
    mutationFn: (id: string) => investmentApi.togglePlan(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["exec-plans"] });
    },
  });

  const deletePlanMutation = useMutation({
    mutationFn: (id: string) => investmentApi.deletePlan(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["exec-plans"] });
    },
  });

  const logProfitMutation = useMutation({
    mutationFn: ({ id, amount, note }: { id: string; amount: number; note?: string }) =>
      investmentApi.logProfit(id, amount, note),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["exec-investments"] });
      setProfitModal(null);
      setProfitAmount("");
      setProfitNote("");
      setSelectedTx(null);
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status, reason }: { id: string; status: string; reason?: string }) =>
      investmentApi.updateInvestmentStatus(id, status, reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["exec-investments"] });
      setStatusModal(null);
      setRejectReason("");
      setSelectedTx(null);
    },
  });

  const upgradePlanMutation = useMutation({
    mutationFn: ({ id, newPlanId }: { id: string; newPlanId: string }) =>
      investmentApi.upgradePlanExecutor(id, newPlanId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["exec-investments"] });
      setUpgradeModal(null);
      setSelectedPlanId("");
      setSelectedTx(null);
    },
  });

  const approveInvestmentMutation = useMutation({
    mutationFn: (id: string) => investmentApi.approveInvestment(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["exec-investments"] });
    },
  });

  const rejectInvestmentMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      investmentApi.rejectInvestment(id, reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["exec-investments"] });
      setPendingRejectModal(null);
      setPendingRejectReason("");
    },
  });

  // Handlers
  const handleOpenPlanModal = (mode: "create" | "edit", plan?: InvestmentPlan) => {
    if (mode === "edit" && plan) {
      setPlanForm({
        name: plan.name,
        minAmount: plan.minAmount,
        maxAmount: plan.maxAmount,
        roiPercent: plan.roiPercent,
        durationDays: plan.durationDays,
        isActive: plan.isActive,
      });
    } else {
      setPlanForm({
        name: "",
        minAmount: 0,
        maxAmount: 0,
        roiPercent: 0,
        durationDays: 30,
        isActive: true,
      });
    }
    setPlanModal({ mode, plan });
  };

  const handlePlanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (planModal?.mode === "create") {
      createPlanMutation.mutate(planForm);
    } else if (planModal?.mode === "edit" && planModal.plan) {
      updatePlanMutation.mutate({ id: planModal.plan._id, data: planForm });
    }
  };

  const handleProfitSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!profitModal || !profitAmount) return;
    logProfitMutation.mutate({
      id: profitModal._id,
      amount: parseFloat(profitAmount),
      note: profitNote,
    });
  };

  const handleStatusSubmit = () => {
    if (!statusModal) return;
    updateStatusMutation.mutate({
      id: statusModal.tx._id,
      status: statusModal.status,
      reason: statusModal.status === "rejected" ? rejectReason : undefined,
    });
  };

  const handleUpgradeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!upgradeModal || !selectedPlanId) return;
    upgradePlanMutation.mutate({
      id: upgradeModal._id,
      newPlanId: selectedPlanId,
    });
  };

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

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-white">Investment Portal</h1>
          <p className="text-xs text-slate-400 mt-1">Manage investment packages and track active user portfolios</p>
        </div>
        {activeTab === "plans" && (
          <button
            onClick={() => handleOpenPlanModal("create")}
            className="bg-[#00c076] hover:bg-[#00e676] text-[#080c10] px-4 py-2 rounded-2xl text-xs font-black transition-all shadow-md shadow-[#00c076]/20 cursor-pointer"
          >
            + Create New Plan
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/10">
        <button
          onClick={() => setActiveTab("plans")}
          className={`px-5 py-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === "plans"
              ? "border-[#00c076] text-[#00e676]"
              : "border-transparent text-slate-400 hover:text-white"
          }`}
        >
          Investment Plans
        </button>
        <button
          onClick={() => setActiveTab("investments")}
          className={`px-5 py-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === "investments"
              ? "border-[#00c076] text-[#00e676]"
              : "border-transparent text-slate-400 hover:text-white"
          }`}
        >
          Client Investments
        </button>
      </div>

      {/* Tab: Plans */}
      {activeTab === "plans" && (
        <div className="bg-[#121822] border border-white/10 rounded-3xl shadow-sm overflow-hidden">
          {loadingPlans ? (
            <div className="p-12 text-center text-slate-500 text-xs">Loading investment plans...</div>
          ) : !plansData || plansData.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-xs">No investment plans configured. Create one to get started.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#0e1520] text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-white/10">
                    <th className="px-6 py-4">Plan Name</th>
                    <th className="px-6 py-4">Limits (Min / Max)</th>
                    <th className="px-6 py-4">Daily ROI / Total ROI</th>
                    <th className="px-6 py-4">Duration & Frequency</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-xs text-slate-300">
                  {plansData.map((plan) => {
                    const totalRoi = plan.roiPercent * plan.durationDays;
                    return (
                      <tr key={plan._id} className="hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4 font-bold text-white">
                          <div>{plan.name}</div>
                          <span className="text-[10px] text-slate-400 font-normal">Fixed-Yield Compound</span>
                        </td>
                        <td className="px-6 py-4 font-mono">
                          {formatCurrency(plan.minAmount)} – {formatCurrency(plan.maxAmount)}
                        </td>
                        <td className="px-6 py-4 font-mono">
                          <span className="text-[#00e676] font-bold block">+{plan.roiPercent}% / Day</span>
                          <span className="text-[10px] text-slate-400">+{totalRoi}% Total</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-bold text-white block">{plan.durationDays} Days</span>
                          <span className="text-[10px] text-emerald-400 font-medium">Daily Drop (24h)</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            plan.isActive
                              ? "bg-emerald-500/15 text-[#00e676] border border-emerald-500/30"
                              : "bg-white/5 text-slate-400 border border-white/10"
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${plan.isActive ? "bg-[#00e676]" : "bg-slate-500"}`} />
                            {plan.isActive ? "Active" : "Inactive"}
                          </span>
                        </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <button
                          onClick={() => togglePlanMutation.mutate(plan._id)}
                          className={`text-xs font-bold px-2.5 py-1 rounded-xl border transition-all cursor-pointer ${
                            plan.isActive
                              ? "border-white/10 text-slate-400 hover:bg-white/5"
                              : "border-emerald-500/30 text-[#00e676] bg-emerald-500/15 hover:bg-emerald-500/25"
                          }`}
                        >
                          {plan.isActive ? "Deactivate" : "Activate"}
                        </button>
                        <button
                          onClick={() => handleOpenPlanModal("edit", plan)}
                          className="text-xs font-bold border border-white/10 text-slate-200 hover:bg-white/5 px-2.5 py-1 rounded-xl transition-all cursor-pointer"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => {
                            if (confirm("Are you sure you want to delete this plan?")) {
                              deletePlanMutation.mutate(plan._id);
                            }
                          }}
                          className="text-xs font-bold border border-rose-500/30 text-rose-400 hover:bg-rose-500/20 px-2.5 py-1 rounded-xl transition-all cursor-pointer"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab: Investments */}
      {activeTab === "investments" && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setInvestPage(1); }}
              className="bg-[#121822] border border-white/10 text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#00c076]"
            >
              <option value="">All Statuses</option>
              <option value="approved">Active</option>
              <option value="completed">Completed</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          <div className="bg-[#121822] border border-white/10 rounded-3xl shadow-sm overflow-hidden">
            {loadingInvests ? (
              <div className="p-12 text-center text-slate-500 text-xs">Loading portfolios...</div>
            ) : !investData || investData.data.length === 0 ? (
              <div className="p-12 text-center text-slate-500 text-xs">No client investments found.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#0e1520] text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-white/10">
                      <th className="px-6 py-4">Client</th>
                      <th className="px-6 py-4">Package</th>
                      <th className="px-6 py-4">Amount</th>
                      <th className="px-6 py-4">Duration Tracking</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-xs text-slate-300">
                    {investData.data.map((tx) => {
                      const progress = getProgress(tx);
                      return (
                        <tr key={tx._id} className="hover:bg-white/5 transition-colors">
                          <td className="px-6 py-4">
                            <div className="font-bold text-white">{tx.user?.username}</div>
                            <div className="text-[10px] text-slate-400 font-mono">{tx.user?.email}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="font-bold text-white">{tx.planSnapshot?.name}</div>
                            <div className="text-[10px] text-[#00e676] font-mono font-bold">
                              +{tx.planSnapshot?.roiPercent}% / Day (+{(tx.planSnapshot?.roiPercent ?? 0) * (tx.planSnapshot?.durationDays ?? 30)}% Total)
                            </div>
                          </td>
                          <td className="px-6 py-4 font-bold text-white font-mono">
                            {formatCurrency(tx.amount)}
                          </td>
                          <td className="px-6 py-4 min-w-[180px]">
                            <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                              <span>{progress.daysElapsed} / {tx.planSnapshot?.durationDays} Days</span>
                              <span className="font-bold text-white font-mono">{progress.percent}%</span>
                            </div>
                            <div className="w-full h-1.5 bg-[#0e1520] rounded-full overflow-hidden border border-white/5">
                              <div
                                className="h-full bg-[#00c076] rounded-full transition-all duration-500 shadow-sm shadow-[#00c076]/50"
                                style={{ width: `${progress.percent}%` }}
                              />
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${getStatusColor(tx.status)}`}>
                              {tx.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right space-x-2">
                            <button
                              onClick={() => setSelectedTx(tx)}
                              className="text-xs font-bold text-[#00e676] hover:underline"
                            >
                              Details
                            </button>
                            {tx.status === "pending" && (
                              <>
                                <button
                                  onClick={() => {
                                    if (confirm("Are you sure you want to approve this investment request? The daily yield cycles and maturity timer will begin immediately.")) {
                                      approveInvestmentMutation.mutate(tx._id);
                                    }
                                  }}
                                  className="text-xs font-bold text-[#00e676] hover:underline"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => setPendingRejectModal(tx)}
                                  className="text-xs font-bold text-rose-400 hover:underline"
                                >
                                  Reject
                                </button>
                              </>
                            )}
                            {tx.status === "approved" && (
                              <>
                                <button
                                  onClick={() => setProfitModal(tx)}
                                  className="text-xs font-bold text-blue-400 hover:underline"
                                >
                                  Log Profit
                                </button>
                                <button
                                  onClick={() => setUpgradeModal(tx)}
                                  className="text-xs font-bold text-amber-400 hover:underline"
                                >
                                  Upgrade
                                </button>
                                <button
                                  onClick={() => setStatusModal({ tx, status: "completed" })}
                                  className="text-xs font-bold text-[#00e676] hover:underline"
                                >
                                  Mature
                                </button>
                                <button
                                  onClick={() => setStatusModal({ tx, status: "rejected" })}
                                  className="text-xs font-bold text-rose-400 hover:underline"
                                >
                                  Cancel
                                </button>
                              </>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
            {/* Pagination */}
            <Pagination
              currentPage={investPage}
              totalPages={investData?.pages ?? 1}
              totalItems={investData?.total}
              pageSize={15}
              onPageChange={setInvestPage}
            />
          </div>
        </div>
      )}

      {/* Plan Add/Edit Modal */}
      {planModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#121822] border border-white/10 w-full max-w-md rounded-3xl p-6 shadow-2xl animate-in fade-in zoom-in-95">
            <h3 className="text-base font-bold text-white mb-4 capitalize">
              {planModal.mode} Investment Plan
            </h3>
            <form onSubmit={handlePlanSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Plan Name</label>
                <input
                  type="text"
                  required
                  value={planForm.name}
                  onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
                  placeholder="e.g. Institutional Yield"
                  className="w-full border border-white/10 bg-[#0e1520] rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#00c076]"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Min Amount ($)</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={planForm.minAmount || ""}
                    onChange={(e) => setPlanForm({ ...planForm, minAmount: parseFloat(e.target.value) })}
                    className="w-full border border-white/10 bg-[#0e1520] rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#00c076]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Max Amount ($)</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={planForm.maxAmount || ""}
                    onChange={(e) => setPlanForm({ ...planForm, maxAmount: parseFloat(e.target.value) })}
                    className="w-full border border-white/10 bg-[#0e1520] rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#00c076]"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Daily ROI % (Per 24h)</label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    min={0}
                    value={planForm.roiPercent || ""}
                    onChange={(e) => setPlanForm({ ...planForm, roiPercent: parseFloat(e.target.value) })}
                    placeholder="e.g. 20"
                    className="w-full border border-white/10 bg-[#0e1520] rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#00c076]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Duration (Days)</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={planForm.durationDays || ""}
                    onChange={(e) => setPlanForm({ ...planForm, durationDays: parseInt(e.target.value) })}
                    placeholder="e.g. 7"
                    className="w-full border border-white/10 bg-[#0e1520] rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#00c076]"
                  />
                </div>
              </div>
              {/* Daily ROI Calculation Preview */}
              {planForm.roiPercent > 0 && planForm.durationDays > 0 && (
                <div className="bg-[#0e1520] border border-white/10 rounded-2xl p-3.5 space-y-1.5 font-mono text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>Daily Profit Drop:</span>
                    <span className="text-[#00e676] font-bold">
                      +{planForm.roiPercent}% / Day (Every 24h)
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Total Compound Yield:</span>
                    <span className="text-white font-bold">
                      +{planForm.roiPercent * planForm.durationDays}% in {planForm.durationDays} Days
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 font-sans leading-relaxed pt-1 border-t border-white/5">
                    💡 <em>Active contracts under this plan will receive <strong>{planForm.roiPercent}%</strong> daily profit distribution every 24 hours for {planForm.durationDays} days (Total: <strong>{planForm.roiPercent * planForm.durationDays}%</strong>).</em>
                  </p>
                </div>
              )}

              <div className="flex items-center gap-2 py-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={planForm.isActive}
                  onChange={(e) => setPlanForm({ ...planForm, isActive: e.target.checked })}
                  className="rounded border-white/20 text-[#00c076] bg-[#0e1520] focus:ring-[#00c076]"
                />
                <label htmlFor="isActive" className="text-xs font-bold text-slate-300">Make plan active immediately</label>
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setPlanModal(null)}
                  className="px-4 py-2 text-xs font-bold border border-white/10 text-slate-400 rounded-xl hover:bg-white/5 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createPlanMutation.isPending || updatePlanMutation.isPending}
                  className="px-4 py-2 text-xs font-black bg-[#00c076] hover:bg-[#00e676] text-[#080c10] rounded-xl disabled:opacity-50 shadow-md shadow-[#00c076]/20 cursor-pointer"
                >
                  Save Plan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Log Profit Modal */}
      {profitModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#121822] border border-white/10 w-full max-w-md rounded-3xl p-6 shadow-2xl animate-in fade-in zoom-in-95">
            <h3 className="text-base font-bold text-white mb-1">Log Daily/Manual Profit</h3>
            <p className="text-xs text-slate-400 mb-4">
              Distribute profit to <strong className="text-white">{profitModal.user?.username}</strong> under package {profitModal.planSnapshot?.name}.
            </p>
            <form onSubmit={handleProfitSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Profit Amount ($)</label>
                <input
                  type="number"
                  required
                  step="0.01"
                  min="0.01"
                  value={profitAmount}
                  onChange={(e) => setProfitAmount(e.target.value)}
                  placeholder="e.g. 5.50"
                  className="w-full border border-white/10 bg-[#0e1520] rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#00c076]"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Note / Reference</label>
                <input
                  type="text"
                  value={profitNote}
                  onChange={(e) => setProfitNote(e.target.value)}
                  placeholder="e.g. Daily trading yield distribution"
                  className="w-full border border-white/10 bg-[#0e1520] rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#00c076]"
                />
              </div>
              <div className="flex gap-3 justify-end pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setProfitModal(null)}
                  className="px-4 py-2 text-xs font-bold border border-white/10 text-slate-400 rounded-xl hover:bg-white/5 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={logProfitMutation.isPending}
                  className="px-4 py-2 text-xs font-black bg-[#00c076] hover:bg-[#00e676] text-[#080c10] rounded-xl disabled:opacity-50 shadow-md shadow-[#00c076]/20 cursor-pointer"
                >
                  Disburse Profit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Upgrade Plan Modal */}
      {upgradeModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#121822] border border-white/10 w-full max-w-md rounded-3xl p-6 shadow-2xl animate-in fade-in zoom-in-95">
            <h3 className="text-base font-bold text-white mb-1">Upgrade Investment Package</h3>
            <p className="text-xs text-slate-400 mb-4">
              Upgrade active portfolio for <strong className="text-white">{upgradeModal.user?.username}</strong>. Currently on {upgradeModal.planSnapshot?.name}.
            </p>
            <form onSubmit={handleUpgradeSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Select New Plan</label>
                <select
                  required
                  value={selectedPlanId}
                  onChange={(e) => setSelectedPlanId(e.target.value)}
                  className="w-full border border-white/10 bg-[#0e1520] text-white rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-[#00c076]"
                >
                  <option value="">-- Choose Plan --</option>
                  {activePlans
                    .filter((p) => p._id !== upgradeModal.planId)
                    .map((p) => (
                      <option key={p._id} value={p._id}>
                        {p.name} (Min: {formatCurrency(p.minAmount)}, ROI: {p.roiPercent}%)
                      </option>
                    ))}
                </select>
              </div>
              <div className="bg-amber-500/15 rounded-2xl p-3.5 border border-amber-500/30 text-xs text-amber-300 space-y-1">
                <span className="font-bold block">Important Note:</span>
                <span className="text-[11px] leading-relaxed block">
                  Upgrading will top up the investment amount to match the new plan's minimum limit (if current investment is less). The difference will be automatically deducted from the user's available balance.
                </span>
              </div>
              <div className="flex gap-3 justify-end pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setUpgradeModal(null)}
                  className="px-4 py-2 text-xs font-bold border border-white/10 text-slate-400 rounded-xl hover:bg-white/5 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={upgradePlanMutation.isPending}
                  className="px-4 py-2 text-xs font-black bg-[#00c076] hover:bg-[#00e676] text-[#080c10] rounded-xl disabled:opacity-50 shadow-md shadow-[#00c076]/20 cursor-pointer"
                >
                  Confirm Upgrade
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Mature / Cancel Status Update Confirmation Modal */}
      {statusModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#121822] border border-white/10 w-full max-w-md rounded-3xl p-6 shadow-2xl animate-in fade-in zoom-in-95">
            <h3 className="text-base font-bold text-white mb-2">
              {statusModal.status === "completed" ? "Mature Investment" : "Cancel/Reject Investment"}
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Are you sure you want to change the status of this investment to <strong className="text-white uppercase">{statusModal.status}</strong>?
            </p>

            {statusModal.status === "completed" && (
              <div className="bg-emerald-500/15 text-[#00e676] p-3.5 rounded-2xl border border-emerald-500/30 text-xs mb-4">
                This will end the investment cycle, release the principal amount and finalize the calculated ROI earnings into the client's available balance.
              </div>
            )}

            {statusModal.status === "rejected" && (
              <div className="space-y-4 mb-4">
                <div className="bg-rose-500/15 text-rose-400 p-3.5 rounded-2xl border border-rose-500/30 text-xs">
                  This will cancel the active investment and return the principal amount invested back into the client's available balance.
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Reason for Rejection</label>
                  <input
                    type="text"
                    required
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="e.g. Account balance reconciliation"
                    className="w-full border border-white/10 bg-[#0e1520] text-white rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>
            )}

            <div className="flex gap-3 justify-end pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={() => setStatusModal(null)}
                className="px-4 py-2 text-xs font-bold border border-white/10 text-slate-400 rounded-xl hover:bg-white/5 cursor-pointer"
              >
                Go Back
              </button>
              <button
                type="button"
                onClick={handleStatusSubmit}
                disabled={updateStatusMutation.isPending}
                className={`px-4 py-2 text-xs font-black rounded-xl disabled:opacity-50 cursor-pointer ${
                  statusModal.status === "completed"
                    ? "bg-[#00c076] hover:bg-[#00e676] text-[#080c10] shadow-md shadow-[#00c076]/20"
                    : "bg-rose-500 hover:bg-rose-600 text-white"
                }`}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Pending Investment Modal */}
      {pendingRejectModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#121822] border border-white/10 w-full max-w-md rounded-3xl p-6 shadow-2xl animate-in fade-in zoom-in-95">
            <h3 className="text-base font-bold text-white mb-2">Reject Investment Request</h3>
            <p className="text-xs text-slate-400 mb-4">
              Specify the reason for rejecting the investment request from <strong className="text-white">{pendingRejectModal.user?.username}</strong>.
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                rejectInvestmentMutation.mutate({ id: pendingRejectModal._id, reason: pendingRejectReason });
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Reason</label>
                <input
                  type="text"
                  required
                  value={pendingRejectReason}
                  onChange={(e) => setPendingRejectReason(e.target.value)}
                  placeholder="e.g. Incomplete verification or incorrect deposit reference"
                  className="w-full border border-white/10 bg-[#0e1520] text-white rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-rose-500"
                />
              </div>
              <div className="flex gap-3 justify-end pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => { setPendingRejectModal(null); setPendingRejectReason(""); }}
                  className="px-4 py-2 text-xs font-bold border border-white/10 text-slate-400 rounded-xl hover:bg-white/5 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={rejectInvestmentMutation.isPending}
                  className="px-4 py-2 text-xs font-bold bg-rose-500 hover:bg-rose-600 text-white rounded-xl disabled:opacity-50 cursor-pointer"
                >
                  Reject Investment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Details Side Panel */}
      {selectedTx && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 flex justify-end">
          <div className="fixed inset-0" onClick={() => setSelectedTx(null)} />
          <div className="relative w-full max-w-lg bg-[#121822] border-l border-white/10 h-full shadow-2xl p-6 overflow-y-auto z-50 flex flex-col justify-between animate-in slide-in-from-right duration-300">
            <div className="space-y-6">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-lg font-bold text-white">Investment Details</h2>
                  <p className="text-xs text-slate-400 mt-0.5 font-mono">Ref: {selectedTx.reference}</p>
                </div>
                <button
                  onClick={() => setSelectedTx(null)}
                  className="text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Client section */}
              <div className="border-t border-b border-white/10 py-4">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Investor</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#00c076]/20 border border-[#00c076]/30 text-[#00e676] flex items-center justify-center text-sm font-black uppercase shrink-0">
                    {selectedTx.user?.username?.charAt(0) ?? "U"}
                  </div>
                  <div>
                    <span className="font-bold text-white block">{selectedTx.user?.username}</span>
                    <span className="text-xs text-slate-400 font-mono">{selectedTx.user?.email}</span>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Overview</p>
                <div className="bg-[#0e1520] border border-white/10 rounded-2xl p-4 space-y-2.5">
                  {[
                    ["Package Name", selectedTx.planSnapshot?.name],
                    ["Principal Invested", formatCurrency(selectedTx.amount)],
                    ["Daily ROI Rate", `+${selectedTx.planSnapshot?.roiPercent}% / Day`],
                    ["Total Contract Yield", `+${(selectedTx.planSnapshot?.roiPercent ?? 0) * (selectedTx.planSnapshot?.durationDays ?? 30)}% Total`],
                    ["Contract Duration", `${selectedTx.planSnapshot?.durationDays} Days`],
                    ["Est. Maturity Yield", formatCurrency(selectedTx.amount + (selectedTx.amount * (selectedTx.planSnapshot?.roiPercent ?? 0) * (selectedTx.planSnapshot?.durationDays ?? 30)) / 100)],
                    ["Start Date", formatDate(selectedTx.createdAt)],
                    ["Maturity Date", selectedTx.expiresAt ? formatDate(selectedTx.expiresAt) : "N/A"],
                    ["Status", selectedTx.status.toUpperCase()],
                  ].map(([label, value]) => (
                    <div key={label} className="flex justify-between text-xs">
                      <span className="text-slate-400">{label}</span>
                      <span className="font-bold text-white font-mono text-right">{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Profit Logs */}
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Profit Distributions</p>
                {selectedTx.meta?.profitLogs && selectedTx.meta.profitLogs.length > 0 ? (
                  <div className="space-y-2 max-h-[180px] overflow-y-auto border border-white/10 bg-[#0e1520] rounded-2xl p-3">
                    {(selectedTx.meta.profitLogs as any[]).map((log, index) => (
                      <div key={index} className="flex justify-between items-center text-xs border-b border-white/5 pb-2 last:border-0 last:pb-0">
                        <div>
                          <div className="font-bold text-white">{log.note || "Yield Distribution"}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{formatDate(log.date)}</div>
                        </div>
                        <div className="font-bold text-[#00e676] font-mono">+{formatCurrency(log.amount)}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-slate-500 bg-[#0e1520] border border-white/10 p-4 rounded-2xl text-center">
                    No manual profits distributed yet.
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={() => setSelectedTx(null)}
              className="w-full border border-white/10 text-slate-300 py-3 rounded-2xl text-xs font-bold hover:bg-white/5 transition-colors mt-6 cursor-pointer"
            >
              Close Panel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
