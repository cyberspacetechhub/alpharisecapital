import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { accountServiceApi } from "../../../api/accountService.api";
import { userApi } from "../../../api/user.api";
import { investmentApi } from "../../../api/investment.api";
import { formatCurrency, formatDate } from "../../../utils";
import Pagination from "../../../components/common/Pagination";
import type { AccountService, AccountServiceType } from "../../../types";

const SERVICE_TYPE_CONFIG: Record<
  AccountServiceType,
  {
    label: string;
    icon: string;
    badgeBg: string;
    defaultTitle: string;
    defaultMessage: string;
  }
> = {
  maintenance: {
    label: "Maintenance",
    icon: "🛠️",
    badgeBg: "bg-blue-500/15 text-blue-300 border-blue-500/30",
    defaultTitle: "System Maintenance & Account Synchronization",
    defaultMessage:
      "Your account is currently scheduled for essential portfolio synchronization. All trades and balances remain secure during this process.",
  },
  withdrawal_restriction: {
    label: "Withdrawal Restriction",
    icon: "🛡️",
    badgeBg: "bg-rose-500/15 text-rose-300 border-rose-500/30",
    defaultTitle: "Temporary Withdrawal Hold",
    defaultMessage:
      "Withdrawals are temporarily restricted on your account pending account compliance review or settlement. Please contact support or resolve required obligations.",
  },
  multiple_withdrawal: {
    label: "Multiple Withdrawal",
    icon: "⚠️",
    badgeBg: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    defaultTitle: "Multiple Withdrawal Processing Notice",
    defaultMessage:
      "Multiple concurrent withdrawal requests have been detected. Subsequent payouts require account verification or settlement clearance before queue dispatch.",
  },
  account_freeze: {
    label: "Account Freeze",
    icon: "🔒",
    badgeBg: "bg-rose-500/15 text-rose-300 border-rose-500/30",
    defaultTitle: "Account Security Freeze Notice",
    defaultMessage:
      "Your account has been temporarily frozen for security purposes. Trading operations and fund movements are paused until security clearance is confirmed.",
  },
  debit_freeze: {
    label: "Debit Freeze",
    icon: "💳",
    badgeBg: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    defaultTitle: "Debit & Transfer Freeze Notice",
    defaultMessage:
      "Debit transactions and transfer capabilities on your account are temporarily locked pending administrative review.",
  },
  security_update: {
    label: "Security Update",
    icon: "🔐",
    badgeBg: "bg-cyan-500/15 text-cyan-300 border-cyan-500/30",
    defaultTitle: "Security & Credentials Update Required",
    defaultMessage:
      "A mandatory security protocol update is required on your profile to ensure compliance with updated platform safety standards.",
  },
  upgrade_trading_plan: {
    label: "Upgrade Trading Plan",
    icon: "⚡",
    badgeBg: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    defaultTitle: "Trading Plan Upgrade Required",
    defaultMessage:
      "Your active trading portfolio has exceeded tier threshold limits. To continue executing automated trades and yield distributions, please upgrade to the next tier plan.",
  },
  kyc: {
    label: "KYC Verification",
    icon: "🪪",
    badgeBg: "bg-purple-500/15 text-purple-300 border-purple-500/30",
    defaultTitle: "Identity Verification (KYC) Required",
    defaultMessage:
      "Please complete your KYC identity verification to unlock full deposit, withdrawal, and active trading privileges on your account.",
  },
};

const inputClass =
  "w-full px-4 py-2.5 rounded-xl border border-white/10 bg-[#0e1520] text-white text-xs focus:outline-none focus:border-[#00c076]";

export default function AccountServicesPage() {
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "resolved">("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(15);

  // Create Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [serviceType, setServiceType] = useState<AccountServiceType>("maintenance");
  const [title, setTitle] = useState(SERVICE_TYPE_CONFIG.maintenance.defaultTitle);
  const [message, setMessage] = useState(SERVICE_TYPE_CONFIG.maintenance.defaultMessage);
  const [requiresPayment, setRequiresPayment] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [targetPlanId, setTargetPlanId] = useState("");
  const [formError, setFormError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Queries
  const { data: servicesData, isLoading: servicesLoading } = useQuery({
    queryKey: ["executor-account-services", statusFilter, typeFilter, page, pageSize],
    queryFn: () =>
      accountServiceApi
        .getAll({
          status: statusFilter !== "all" ? statusFilter : undefined,
          serviceType: typeFilter !== "all" ? typeFilter : undefined,
          page,
          limit: pageSize,
        })
        .then((r) => r.data),
  });

  const { data: clientsData } = useQuery({
    queryKey: ["executor-all-clients-list"],
    queryFn: () => userApi.getAllTraders().then((r) => r.data),
  });

  const { data: plansData } = useQuery({
    queryKey: ["investment-plans-list"],
    queryFn: () => investmentApi.getPlans().then((r) => r.data.data),
  });

  // Client's active contract query for upgrade plan
  const { data: clientActivePlanData, isFetching: activePlanLoading } = useQuery({
    queryKey: ["client-active-plan", selectedUserId],
    queryFn: () => accountServiceApi.getClientActivePlan(selectedUserId).then((r) => r.data.data),
    enabled: !!selectedUserId && serviceType === "upgrade_trading_plan",
  });

  const rawServices: AccountService[] = servicesData?.data ?? [];
  const pagination = servicesData?.pagination;
  const clients = clientsData?.users ?? [];
  const plans = plansData ?? [];

  // Filter client-side search by username, email or title
  const filteredServices = rawServices.filter((s) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    const username = typeof s.user === "object" ? s.user.username : "";
    const email = typeof s.user === "object" ? s.user.email : "";
    return (
      username.toLowerCase().includes(term) ||
      email.toLowerCase().includes(term) ||
      s.title.toLowerCase().includes(term)
    );
  });

  // Update default templates when serviceType changes
  const handleServiceTypeChange = (newType: AccountServiceType) => {
    setServiceType(newType);
    const config = SERVICE_TYPE_CONFIG[newType];
    if (config) {
      setTitle(config.defaultTitle);
      setMessage(config.defaultMessage);
    }
  };

  // Mutations
  const createMutation = useMutation({
    mutationFn: (payload: {
      userId: string;
      serviceType: string;
      title: string;
      message: string;
      requiresPayment?: boolean;
      paymentAmount?: number;
      targetPlanId?: string;
    }) => accountServiceApi.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["executor-account-services"] });
      setModalOpen(false);
      setSelectedUserId("");
      setPaymentAmount("");
      setTargetPlanId("");
      setRequiresPayment(false);
      setFormError("");
      setSuccessMsg("Account service successfully issued to client.");
      setTimeout(() => setSuccessMsg(""), 5000);
    },
    onError: (err: any) => {
      setFormError(err?.response?.data?.message ?? "Failed to create account service");
    },
  });

  const resolveMutation = useMutation({
    mutationFn: (id: string) => accountServiceApi.markResolved(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["executor-account-services"] });
      setSuccessMsg("Account service marked resolved. It will auto-delete in 24 hours.");
      setTimeout(() => setSuccessMsg(""), 5000);
    },
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    if (!selectedUserId) {
      setFormError("Please select a target client");
      return;
    }
    if (!title.trim()) {
      setFormError("Please enter a title");
      return;
    }
    if (!message.trim()) {
      setFormError("Please enter a message");
      return;
    }

    createMutation.mutate({
      userId: selectedUserId,
      serviceType,
      title: title.trim(),
      message: message.trim(),
      requiresPayment,
      paymentAmount: requiresPayment && paymentAmount ? Number(paymentAmount) : 0,
      targetPlanId: serviceType === "upgrade_trading_plan" ? targetPlanId || undefined : undefined,
    });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* ── Top Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">🛡️</span>
            <h1 className="text-2xl font-black text-white tracking-tight">Account Services & Notices</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Dispatch personalized notices, trading restrictions, plan upgrade requests, and fee settlements. Resolved
            notices are automatically purged from the database after 24 hours.
          </p>
        </div>

        <button
          onClick={() => {
            setModalOpen(true);
            setFormError("");
          }}
          className="px-4 py-2.5 rounded-xl bg-[#00c076] hover:bg-[#00e676] text-[#080c10] font-black text-xs uppercase tracking-wider transition-all shadow-md flex items-center gap-2 self-start md:self-auto cursor-pointer"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          <span>Issue Account Service</span>
        </button>
      </div>

      {/* Success Alert Banner */}
      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <span>✅</span>
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg("")} className="text-emerald-400 hover:text-white">
            ✕
          </button>
        </div>
      )}

      {/* ── Filter Bar ── */}
      <div className="bg-[#121822] border border-white/10 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="w-full md:w-80 relative">
          <svg
            className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search by client or notice title..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#0e1520] border border-white/10 text-white text-xs focus:outline-none focus:border-[#00c076]"
          />
        </div>

        {/* Status Tabs & Service Type filter */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Status Tabs */}
          <div className="flex items-center bg-[#0e1520] p-1 rounded-xl border border-white/10">
            {(["all", "active", "resolved"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  setStatusFilter(tab);
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${
                  statusFilter === tab
                    ? "bg-[#00c076] text-black shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 rounded-xl bg-[#0e1520] border border-white/10 text-white text-xs focus:outline-none focus:border-[#00c076]"
          >
            <option value="all">All Service Types</option>
            {Object.entries(SERVICE_TYPE_CONFIG).map(([typeKey, cfg]) => (
              <option key={typeKey} value={typeKey}>
                {cfg.icon} {cfg.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Table & List Display ── */}
      <div className="bg-[#121822] border border-white/10 rounded-2xl overflow-hidden shadow-xl">
        {servicesLoading ? (
          <div className="p-12 text-center text-slate-400 text-xs">Loading account services...</div>
        ) : filteredServices.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            No account services found matching the criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-[#0e1520] text-slate-400 uppercase tracking-wider font-bold border-b border-white/10 text-[10px]">
                <tr>
                  <th className="py-3.5 px-4">Client</th>
                  <th className="py-3.5 px-4">Service Type</th>
                  <th className="py-3.5 px-4">Notice Title & Message</th>
                  <th className="py-3.5 px-4">Plan / Settlement</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Date Issued</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-medium">
                {filteredServices.map((service) => {
                  const cfg = SERVICE_TYPE_CONFIG[service.serviceType] || SERVICE_TYPE_CONFIG.maintenance;
                  const clientObj = typeof service.user === "object" ? service.user : null;
                  const isResolved = service.status === "resolved";

                  return (
                    <tr key={service._id} className="hover:bg-white/[0.02] transition-colors">
                      {/* Client */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-[#00c076]/15 border border-[#00c076]/30 text-[#00e676] font-black flex items-center justify-center text-[10px]">
                            {clientObj?.username ? clientObj.username.charAt(0).toUpperCase() : "U"}
                          </div>
                          <div>
                            <div className="font-bold text-white text-xs">{clientObj?.username || "Unknown"}</div>
                            <div className="text-[10px] text-slate-400 font-mono">{clientObj?.email || "—"}</div>
                          </div>
                        </div>
                      </td>

                      {/* Service Type */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${cfg.badgeBg}`}
                        >
                          <span>{cfg.icon}</span>
                          <span>{cfg.label}</span>
                        </span>
                      </td>

                      {/* Title & Message */}
                      <td className="py-4 px-4 max-w-sm">
                        <div className="font-bold text-white text-xs">{service.title}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5 line-clamp-2 leading-relaxed">
                          {service.message}
                        </div>
                      </td>

                      {/* Plan / Settlement */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        {service.serviceType === "upgrade_trading_plan" && (service.currentPlan || service.targetPlan) ? (
                          <div className="space-y-1 text-[11px]">
                            <div className="text-slate-400">
                              Current: <span className="text-white font-bold">{service.currentPlan?.name || "Active"}</span>
                            </div>
                            <div className="text-emerald-400">
                              Target: <span className="text-emerald-300 font-bold">{service.targetPlan?.name || "Target"}</span>
                            </div>
                          </div>
                        ) : service.requiresPayment ? (
                          <div className="text-amber-300 font-bold font-mono text-xs">
                            {formatCurrency(service.paymentAmount ?? 0)}
                          </div>
                        ) : (
                          <span className="text-slate-500 text-[11px]">None Required</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        {isResolved ? (
                          <div>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-500/15 text-slate-300 border border-slate-500/30">
                              Resolved
                            </span>
                            {service.resolvedAt && (
                              <div className="text-[9px] text-slate-500 mt-0.5">
                                Purges: {new Date(new Date(service.resolvedAt).getTime() + 24 * 3600000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            Active Banner
                          </span>
                        )}
                      </td>

                      {/* Date */}
                      <td className="py-4 px-4 whitespace-nowrap text-[11px] text-slate-400">
                        {formatDate(service.createdAt)}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4 whitespace-nowrap text-right">
                        {!isResolved ? (
                          <button
                            onClick={() => resolveMutation.mutate(service._id)}
                            disabled={resolveMutation.isPending}
                            className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-emerald-400 border border-emerald-500/30 text-[11px] font-bold transition-all cursor-pointer"
                          >
                            Mark Resolved
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-500 italic">24h Auto-Purge</span>
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
        {pagination && pagination.totalPages > 1 && (
          <div className="p-4 border-t border-white/10">
            <Pagination
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
              onPageChange={(p) => setPage(p)}
            />
          </div>
        )}
      </div>

      {/* ── Create Modal ── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setModalOpen(false)} />
          <div className="relative bg-[#121822] border border-white/10 rounded-3xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto z-10 text-white animate-in fade-in zoom-in-95 duration-150">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <span className="text-xl">🛡️</span>
                <h3 className="text-base font-bold text-white">Issue Client Account Service</h3>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-bold">
                  {formError}
                </div>
              )}

              {/* Target Client */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Select Target Client <span className="text-rose-400">*</span>
                </label>
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className={inputClass}
                  required
                >
                  <option value="">-- Choose a Client / Trader --</option>
                  {clients.map((c: any) => (
                    <option key={c._id} value={c._id}>
                      {c.username} ({c.email}) - Bal: {formatCurrency(c.balance ?? 0)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Service Type */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Service Type <span className="text-rose-400">*</span>
                </label>
                <select
                  value={serviceType}
                  onChange={(e) => handleServiceTypeChange(e.target.value as AccountServiceType)}
                  className={inputClass}
                >
                  {Object.entries(SERVICE_TYPE_CONFIG).map(([typeKey, cfg]) => (
                    <option key={typeKey} value={typeKey}>
                      {cfg.icon} {cfg.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Upgrade Trading Plan Dynamic Info */}
              {serviceType === "upgrade_trading_plan" && (
                <div className="p-4 rounded-2xl bg-[#0e1520] border border-emerald-500/30 space-y-3">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                    <span>⚡</span>
                    <span>Trading Plan Upgrade Configuration</span>
                  </div>

                  {/* Client's Active Contract Details */}
                  {selectedUserId && (
                    <div className="p-3 rounded-xl bg-white/5 border border-white/5 text-xs space-y-1">
                      <div className="text-slate-400 font-bold uppercase text-[10px]">Client Active Contract</div>
                      {activePlanLoading ? (
                        <div className="text-slate-400 text-xs animate-pulse">Checking active contract...</div>
                      ) : clientActivePlanData?.activeContract ? (
                        <div className="text-white">
                          Plan: <span className="font-bold text-emerald-300">{clientActivePlanData.activeContract.planName}</span> |
                          Invested: <span className="font-mono font-bold">{formatCurrency(clientActivePlanData.activeContract.investedAmount)}</span>
                        </div>
                      ) : (
                        <div className="text-slate-400 italic">No active investment contract found for this client.</div>
                      )}
                    </div>
                  )}

                  {/* Target Plan Selector */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">Target Plan to Upgrade To</label>
                    <select
                      value={targetPlanId}
                      onChange={(e) => {
                        const pid = e.target.value;
                        setTargetPlanId(pid);
                        const selectedPlan = plans.find((p: any) => p._id === pid);
                        if (selectedPlan && selectedPlan.minAmount) {
                          setPaymentAmount(String(selectedPlan.minAmount));
                          setRequiresPayment(true);
                        }
                      }}
                      className={inputClass}
                    >
                      <option value="">-- Choose Recommended Plan --</option>
                      {plans.map((p: any) => (
                        <option key={p._id} value={p._id}>
                          {p.name} (Min: {formatCurrency(p.minAmount)} - Max: {formatCurrency(p.maxAmount)}) - {p.roiPercent}% ROI
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Title */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Notice Title <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className={inputClass}
                  required
                />
              </div>

              {/* Message */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Notice Message <span className="text-rose-400">*</span>
                </label>
                <textarea
                  rows={3}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className={inputClass}
                  required
                />
              </div>

              {/* Require Payment Toggle */}
              <div className="p-3.5 rounded-2xl bg-[#0e1520] border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-white">Require Payment / Settlement Deposit</div>
                    <div className="text-[10px] text-slate-400">
                      Displays required settlement amount badge and links directly to deposit on trader dashboard.
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={requiresPayment}
                      onChange={(e) => setRequiresPayment(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#00c076]" />
                  </label>
                </div>

                {requiresPayment && (
                  <div>
                    <label className="block text-[11px] font-bold text-amber-300 mb-1">
                      Settlement / Required Amount ($) <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      placeholder="e.g. 500.00"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      className={inputClass}
                      required={requiresPayment}
                    />
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="px-5 py-2.5 rounded-xl bg-[#00c076] hover:bg-[#00e676] text-[#080c10] font-black text-xs uppercase tracking-wider transition-all shadow-md flex items-center gap-2 cursor-pointer"
                >
                  {createMutation.isPending ? "Issuing..." : "Issue Notice"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
