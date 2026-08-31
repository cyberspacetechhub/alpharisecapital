import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { investmentApi } from "../../../api/investment.api";
import { formatCurrency, formatDate, getStatusColor } from "../../../utils";
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
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Investment Portal</h1>
          <p className="text-sm text-gray-500 mt-1">Manage investment packages and track active user portfolios</p>
        </div>
        {activeTab === "plans" && (
          <button
            onClick={() => handleOpenPlanModal("create")}
            className="bg-[#2d6a4f] hover:bg-[#1b4332] text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors shadow-sm"
          >
            Create New Plan
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab("plans")}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-all ${
            activeTab === "plans"
              ? "border-[#2d6a4f] text-[#2d6a4f]"
              : "border-transparent text-gray-500 hover:text-gray-900"
          }`}
        >
          Investment Plans
        </button>
        <button
          onClick={() => setActiveTab("investments")}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-all ${
            activeTab === "investments"
              ? "border-[#2d6a4f] text-[#2d6a4f]"
              : "border-transparent text-gray-500 hover:text-gray-900"
          }`}
        >
          Client Investments
        </button>
      </div>

      {/* Tab: Plans */}
      {activeTab === "plans" && (
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
          {loadingPlans ? (
            <div className="p-12 text-center text-gray-500">Loading investment plans...</div>
          ) : !plansData || plansData.length === 0 ? (
            <div className="p-12 text-center text-gray-500">No investment plans configured. Create one to get started.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase border-b border-gray-100">
                    <th className="px-6 py-4">Plan Name</th>
                    <th className="px-6 py-4">Limits (Min / Max)</th>
                    <th className="px-6 py-4">ROI %</th>
                    <th className="px-6 py-4">Duration</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm text-gray-600">
                  {plansData.map((plan) => (
                    <tr key={plan._id} className="hover:bg-gray-50/50">
                      <td className="px-6 py-4 font-semibold text-gray-900">{plan.name}</td>
                      <td className="px-6 py-4">
                        {formatCurrency(plan.minAmount)} – {formatCurrency(plan.maxAmount)}
                      </td>
                      <td className="px-6 py-4 text-emerald-600 font-medium">+{plan.roiPercent}%</td>
                      <td className="px-6 py-4">{plan.durationDays} Days</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          plan.isActive ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-600"
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${plan.isActive ? "bg-green-500" : "bg-gray-400"}`} />
                          {plan.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <button
                          onClick={() => togglePlanMutation.mutate(plan._id)}
                          className={`text-xs font-semibold px-2.5 py-1 rounded-lg border transition-colors ${
                            plan.isActive
                              ? "border-gray-200 text-gray-500 hover:bg-gray-50"
                              : "border-green-200 text-[#2d6a4f] hover:bg-green-50"
                          }`}
                        >
                          {plan.isActive ? "Deactivate" : "Activate"}
                        </button>
                        <button
                          onClick={() => handleOpenPlanModal("edit", plan)}
                          className="text-xs font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 px-2.5 py-1 rounded-lg transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => {
                            if (confirm("Are you sure you want to delete this plan?")) {
                              deletePlanMutation.mutate(plan._id);
                            }
                          }}
                          className="text-xs font-semibold border border-red-100 text-red-600 hover:bg-red-50 px-2.5 py-1 rounded-lg transition-colors"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
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
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30"
            >
              <option value="">All Statuses</option>
              <option value="approved">Active</option>
              <option value="completed">Completed</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
            {loadingInvests ? (
              <div className="p-12 text-center text-gray-500">Loading portfolios...</div>
            ) : !investData || investData.data.length === 0 ? (
              <div className="p-12 text-center text-gray-500">No client investments found.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase border-b border-gray-100">
                      <th className="px-6 py-4">Client</th>
                      <th className="px-6 py-4">Package</th>
                      <th className="px-6 py-4">Amount</th>
                      <th className="px-6 py-4">Duration Tracking</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-sm text-gray-600">
                    {investData.data.map((tx) => {
                      const progress = getProgress(tx);
                      return (
                        <tr key={tx._id} className="hover:bg-gray-50/50">
                          <td className="px-6 py-4">
                            <div className="font-semibold text-gray-900">{tx.user?.username}</div>
                            <div className="text-xs text-gray-400">{tx.user?.email}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="font-medium text-gray-800">{tx.planSnapshot?.name}</div>
                            <div className="text-xs text-gray-500">ROI: +{tx.planSnapshot?.roiPercent}%</div>
                          </td>
                          <td className="px-6 py-4 font-semibold text-gray-900">
                            {formatCurrency(tx.amount)}
                          </td>
                          <td className="px-6 py-4 min-w-[180px]">
                            <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                              <span>{progress.daysElapsed} / {tx.planSnapshot?.durationDays} Days</span>
                              <span className="font-medium">{progress.percent}%</span>
                            </div>
                            <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                                style={{ width: `${progress.percent}%` }}
                              />
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium uppercase ${getStatusColor(tx.status)}`}>
                              {tx.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right space-x-2">
                            <button
                              onClick={() => setSelectedTx(tx)}
                              className="text-xs font-semibold text-[#2d6a4f] hover:text-[#1b4332]"
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
                                  className="text-xs font-semibold text-green-600 hover:text-green-800"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => setPendingRejectModal(tx)}
                                  className="text-xs font-semibold text-red-600 hover:text-red-800"
                                >
                                  Reject
                                </button>
                              </>
                            )}
                            {tx.status === "approved" && (
                              <>
                                <button
                                  onClick={() => setProfitModal(tx)}
                                  className="text-xs font-semibold text-blue-600 hover:text-blue-800"
                                >
                                  Log Profit
                                </button>
                                <button
                                  onClick={() => setUpgradeModal(tx)}
                                  className="text-xs font-semibold text-amber-600 hover:text-amber-800"
                                >
                                  Upgrade
                                </button>
                                <button
                                  onClick={() => setStatusModal({ tx, status: "completed" })}
                                  className="text-xs font-semibold text-green-600 hover:text-green-800"
                                >
                                  Mature
                                </button>
                                <button
                                  onClick={() => setStatusModal({ tx, status: "rejected" })}
                                  className="text-xs font-semibold text-red-600 hover:text-red-800"
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
            {investData && investData.pages > 1 && (
              <div className="flex justify-between items-center px-6 py-4 border-t border-gray-100 text-sm">
                <button
                  disabled={investPage === 1}
                  onClick={() => setInvestPage(p => p - 1)}
                  className="px-3 py-1.5 border border-gray-200 rounded-lg font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-40"
                >
                  Previous
                </button>
                <span className="text-gray-600">Page {investPage} of {investData.pages}</span>
                <button
                  disabled={investPage === investData.pages}
                  onClick={() => setInvestPage(p => p + 1)}
                  className="px-3 py-1.5 border border-gray-200 rounded-lg font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Plan Add/Edit Modal */}
      {planModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-xl animate-in fade-in zoom-in-95">
            <h3 className="text-lg font-bold text-gray-900 mb-4 capitalize">
              {planModal.mode} Investment Plan
            </h3>
            <form onSubmit={handlePlanSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Plan Name</label>
                <input
                  type="text"
                  required
                  value={planForm.name}
                  onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
                  placeholder="e.g. Bronze Package"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Min Amount ($)</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={planForm.minAmount || ""}
                    onChange={(e) => setPlanForm({ ...planForm, minAmount: parseFloat(e.target.value) })}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Max Amount ($)</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={planForm.maxAmount || ""}
                    onChange={(e) => setPlanForm({ ...planForm, maxAmount: parseFloat(e.target.value) })}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">ROI %</label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    min={0}
                    value={planForm.roiPercent || ""}
                    onChange={(e) => setPlanForm({ ...planForm, roiPercent: parseFloat(e.target.value) })}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Duration (Days)</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={planForm.durationDays || ""}
                    onChange={(e) => setPlanForm({ ...planForm, durationDays: parseInt(e.target.value) })}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2 py-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={planForm.isActive}
                  onChange={(e) => setPlanForm({ ...planForm, isActive: e.target.checked })}
                  className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                />
                <label htmlFor="isActive" className="text-sm font-medium text-gray-700">Make plan active immediately</label>
              </div>

              <div className="flex gap-3 justify-end pt-4">
                <button
                  type="button"
                  onClick={() => setPlanModal(null)}
                  className="px-4 py-2 text-sm font-semibold border border-gray-200 text-gray-500 rounded-xl hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createPlanMutation.isPending || updatePlanMutation.isPending}
                  className="px-4 py-2 text-sm font-semibold bg-[#2d6a4f] hover:bg-[#1b4332] text-white rounded-xl disabled:opacity-50"
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
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-xl animate-in fade-in zoom-in-95">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Log Daily/Manual Profit</h3>
            <p className="text-xs text-gray-500 mb-4">
              Distribute profit to <strong>{profitModal.user?.username}</strong> under package {profitModal.planSnapshot?.name}.
            </p>
            <form onSubmit={handleProfitSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Profit Amount ($)</label>
                <input
                  type="number"
                  required
                  step="0.01"
                  min="0.01"
                  value={profitAmount}
                  onChange={(e) => setProfitAmount(e.target.value)}
                  placeholder="e.g. 5.50"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Note / Reference</label>
                <input
                  type="text"
                  value={profitNote}
                  onChange={(e) => setProfitNote(e.target.value)}
                  placeholder="e.g. Daily trading yield distribution"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20"
                />
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setProfitModal(null)}
                  className="px-4 py-2 text-sm font-semibold border border-gray-200 text-gray-500 rounded-xl hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={logProfitMutation.isPending}
                  className="px-4 py-2 text-sm font-semibold bg-[#2d6a4f] hover:bg-[#1b4332] text-white rounded-xl disabled:opacity-50"
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
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-xl animate-in fade-in zoom-in-95">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Upgrade Investment Package</h3>
            <p className="text-xs text-gray-500 mb-4">
              Upgrade active portfolio for <strong>{upgradeModal.user?.username}</strong>. Currently on {upgradeModal.planSnapshot?.name}.
            </p>
            <form onSubmit={handleUpgradeSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Select New Plan</label>
                <select
                  required
                  value={selectedPlanId}
                  onChange={(e) => setSelectedPlanId(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20"
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
              <div className="bg-amber-50 rounded-xl p-3 border border-amber-100 text-xs text-amber-800 space-y-1">
                <span className="font-semibold block">Important Note:</span>
                <span>
                  Upgrading will top up the investment amount to match the new plan's minimum limit (if current investment is less). The difference will be automatically deducted from the user's available balance.
                </span>
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setUpgradeModal(null)}
                  className="px-4 py-2 text-sm font-semibold border border-gray-200 text-gray-500 rounded-xl hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={upgradePlanMutation.isPending}
                  className="px-4 py-2 text-sm font-semibold bg-[#2d6a4f] hover:bg-[#1b4332] text-white rounded-xl disabled:opacity-50"
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
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-xl animate-in fade-in zoom-in-95">
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              {statusModal.status === "completed" ? "Mature Investment" : "Cancel/Reject Investment"}
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Are you sure you want to change the status of this investment to <strong>{statusModal.status}</strong>?
            </p>

            {statusModal.status === "completed" && (
              <div className="bg-green-50 text-green-800 p-3 rounded-xl border border-green-100 text-xs mb-4">
                This will end the investment cycle, release the principal amount and finalize the calculated ROI earnings into the client's available balance.
              </div>
            )}

            {statusModal.status === "rejected" && (
              <div className="space-y-4 mb-4">
                <div className="bg-red-50 text-red-800 p-3 rounded-xl border border-red-100 text-xs">
                  This will cancel the active investment and return the principal amount invested back into the client's available balance.
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Reason for Rejection</label>
                  <input
                    type="text"
                    required
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="e.g. Account balance reconciliation"
                    className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20"
                  />
                </div>
              </div>
            )}

            <div className="flex gap-3 justify-end pt-2">
              <button
                type="button"
                onClick={() => setStatusModal(null)}
                className="px-4 py-2 text-sm font-semibold border border-gray-200 text-gray-500 rounded-xl hover:bg-gray-50"
              >
                Go Back
              </button>
              <button
                type="button"
                onClick={handleStatusSubmit}
                disabled={updateStatusMutation.isPending}
                className={`px-4 py-2 text-sm font-semibold text-white rounded-xl disabled:opacity-50 ${
                  statusModal.status === "completed"
                    ? "bg-[#2d6a4f] hover:bg-[#1b4332]"
                    : "bg-red-600 hover:bg-red-700"
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
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-xl animate-in fade-in zoom-in-95">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Reject Investment Request</h3>
            <p className="text-xs text-gray-500 mb-4">
              Specify the reason for rejecting the investment request from <strong>{pendingRejectModal.user?.username}</strong>.
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                rejectInvestmentMutation.mutate({ id: pendingRejectModal._id, reason: pendingRejectReason });
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Reason</label>
                <input
                  type="text"
                  required
                  value={pendingRejectReason}
                  onChange={(e) => setPendingRejectReason(e.target.value)}
                  placeholder="e.g. Incomplete verification or incorrect deposit reference"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                />
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => { setPendingRejectModal(null); setPendingRejectReason(""); }}
                  className="px-4 py-2 text-sm font-semibold border border-gray-200 text-gray-500 rounded-xl hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={rejectInvestmentMutation.isPending}
                  className="px-4 py-2 text-sm font-semibold bg-red-600 hover:bg-red-700 text-white rounded-xl disabled:opacity-50"
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
        <div className="fixed inset-0 bg-black/40 z-40 flex justify-end">
          <div className="fixed inset-0" onClick={() => setSelectedTx(null)} />
          <div className="relative w-full max-w-lg bg-white h-full shadow-2xl p-6 overflow-y-auto z-50 flex flex-col justify-between animate-in slide-in-from-right duration-300">
            <div className="space-y-6">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Investment Details</h2>
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

              {/* Client section */}
              <div className="border-t border-b border-gray-100 py-4">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Investor</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-50 text-[#2d6a4f] flex items-center justify-center text-sm font-bold uppercase shrink-0">
                    {selectedTx.user?.username?.charAt(0) ?? "U"}
                  </div>
                  <div>
                    <span className="font-semibold text-gray-900 block">{selectedTx.user?.username}</span>
                    <span className="text-xs text-gray-500">{selectedTx.user?.email}</span>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Overview</p>
                <div className="bg-gray-50 rounded-2xl p-4 space-y-2">
                  {[
                    ["Package Name", selectedTx.planSnapshot?.name],
                    ["Principal Invested", formatCurrency(selectedTx.amount)],
                    ["ROI Percentage", `+${selectedTx.planSnapshot?.roiPercent}%`],
                    ["Contract Duration", `${selectedTx.planSnapshot?.durationDays} Days`],
                    ["Maturity Yield", formatCurrency(selectedTx.amount + (selectedTx.amount * (selectedTx.planSnapshot?.roiPercent ?? 0)) / 100)],
                    ["Start Date", formatDate(selectedTx.createdAt)],
                    ["Maturity Date", selectedTx.expiresAt ? formatDate(selectedTx.expiresAt) : "N/A"],
                    ["Status", selectedTx.status.toUpperCase()],
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
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Profit Distributions</p>
                {selectedTx.meta?.profitLogs && selectedTx.meta.profitLogs.length > 0 ? (
                  <div className="space-y-2 max-h-[180px] overflow-y-auto border border-gray-100 rounded-xl p-3">
                    {(selectedTx.meta.profitLogs as any[]).map((log, index) => (
                      <div key={index} className="flex justify-between items-center text-xs border-b border-gray-50 pb-2 last:border-0 last:pb-0">
                        <div>
                          <div className="font-semibold text-gray-800">{log.note || "Yield Distribution"}</div>
                          <div className="text-gray-400">{formatDate(log.date)}</div>
                        </div>
                        <div className="font-bold text-emerald-600">+{formatCurrency(log.amount)}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-gray-500 bg-gray-50 p-4 rounded-xl text-center">
                    No manual profits distributed yet.
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
