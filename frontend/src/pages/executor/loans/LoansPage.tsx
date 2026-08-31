import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { loanApi } from "../../../api/loan.api";
import { userApi } from "../../../api/user.api";
import { formatCurrency, formatDate } from "../../../utils";

interface LoanOffer {
  _id: string;
  title: string;
  description?: string;
  interestRate: number;
  interestType: "flat" | "compound";
  minAmount: number;
  maxAmount: number;
  durationDays: number;
  isActive: boolean;
}

interface LoanApplication {
  _id: string;
  user: {
    _id: string;
    username: string;
    email: string;
    loanLimit: number;
    creditScore: number;
  };
  offer: {
    title: string;
    interestRate: number;
  };
  requestedAmount: number;
  amountDue: number;
  repaidAmount: number;
  interestRate: number;
  interestType: "flat" | "compound";
  durationDays: number;
  status: "pending" | "active" | "repaid" | "rejected";
  createdAt: string;
}

interface OfferForm {
  title: string;
  description: string;
  interestRate: number;
  interestType: "flat" | "compound";
  minAmount: number;
  maxAmount: number;
  durationDays: number;
}

interface LimitForm {
  userId: string;
  loanLimit: number;
  creditScore: number;
}

const Modal = ({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
    <div className="absolute inset-0 bg-black/40" onClick={onClose} />
    <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto z-10">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div className="p-6">{children}</div>
    </div>
  </div>
);

const inputClass = "w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#2d6a4f] focus:border-transparent";

export default function ExecutorLoansPage() {
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<"offers" | "applications" | "limits">("offers");
  const [offerModal, setOfferModal] = useState(false);
  const [limitModal, setLimitModal] = useState<{ _id: string; username: string; loanLimit: number; creditScore: number } | null>(null);
  const [rejectTarget, setRejectTarget] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [generalLimitInput, setGeneralLimitInput] = useState("");
  const [serverError, setServerError] = useState("");

  // Queries
  const { data: offersData, isLoading: offersLoading } = useQuery<LoanOffer[]>({
    queryKey: ["executor-loan-offers"],
    queryFn: () => loanApi.getAllOffers().then((r) => r.data.data),
  });

  const { data: appsData, isLoading: appsLoading } = useQuery<LoanApplication[]>({
    queryKey: ["executor-loan-applications"],
    queryFn: () => loanApi.getAllApplications().then((r) => r.data.data),
  });

  const { data: tradersData, isLoading: tradersLoading } = useQuery({
    queryKey: ["executor-clients"],
    queryFn: () => userApi.getAllTraders().then((r) => r.data),
  });

  const { data: generalLimitData, isLoading: generalLimitLoading } = useQuery({
    queryKey: ["executor-general-loan-limit"],
    queryFn: () => loanApi.getGeneralLoanLimit().then((r) => r.data.data),
  });

  const offers = offersData ?? [];
  const applications = appsData ?? [];
  const traders = tradersData?.users ?? [];
  const generalLoanLimit = generalLimitData?.generalLoanLimit ?? 0;

  // Forms
  const { register: registerOffer, handleSubmit: handleOfferSubmit, reset: resetOffer, formState: { errors: offerErrors } } = useForm<OfferForm>({
    defaultValues: { title: "", description: "", interestRate: 5, interestType: "flat", minAmount: 100, maxAmount: 10000, durationDays: 30 },
  });

  const { register: registerLimit, handleSubmit: handleLimitSubmit, reset: resetLimit, formState: { errors: limitErrors } } = useForm<LimitForm>();

  // Mutations
  const createOfferMutation = useMutation({
    mutationFn: (data: OfferForm) => loanApi.createOffer(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["executor-loan-offers"] });
      setOfferModal(false);
      resetOffer();
    },
    onError: (err: any) => setServerError(err?.response?.data?.message ?? "Failed to create offer"),
  });

  const toggleOfferMutation = useMutation({
    mutationFn: (id: string) => loanApi.toggleOffer(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["executor-loan-offers"] }),
  });

  const approveLoanMutation = useMutation({
    mutationFn: (id: string) => loanApi.approveLoan(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["executor-loan-applications"] }),
  });

  const rejectLoanMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => loanApi.rejectLoan(id, reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["executor-loan-applications"] });
      setRejectTarget(null);
      setRejectReason("");
    },
  });

  const updateLimitMutation = useMutation({
    mutationFn: (data: LimitForm) => loanApi.upgradeUserLoanLimit(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["executor-clients"] });
      setLimitModal(null);
    },
    onError: (err: any) => setServerError(err?.response?.data?.message ?? "Failed to update limit"),
  });

  const updateGeneralLimitMutation = useMutation({
    mutationFn: (limit: number) => loanApi.updateGeneralLoanLimit({ generalLoanLimit: limit }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["executor-general-loan-limit"] });
      qc.invalidateQueries({ queryKey: ["executor-clients"] });
      setGeneralLimitInput("");
    },
  });

  // Action handlers
  const onOfferSubmit = (data: OfferForm) => {
    setServerError("");
    createOfferMutation.mutate(data);
  };

  const onLimitSubmit = (data: LimitForm) => {
    setServerError("");
    updateLimitMutation.mutate({
      userId: limitModal!._id,
      loanLimit: Number(data.loanLimit),
      creditScore: Number(data.creditScore),
    });
  };

  const handleOpenLimitModal = (u: any) => {
    setLimitModal(u);
    resetLimit({
      userId: u._id,
      loanLimit: u.loanLimit,
      creditScore: u.creditScore,
    });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-gray-800">Loans & Risk Management</h1>
          <p className="text-xs text-gray-400 mt-0.5">Control credit limits, approve trader loans, and manage terms.</p>
        </div>

        {/* Tab Selector */}
        <div className="flex bg-gray-100 rounded-xl p-1 shrink-0 border border-gray-200">
          {(["offers", "applications", "limits"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all uppercase ${
                activeTab === tab ? "bg-white text-gray-800 shadow-sm" : "text-gray-400 hover:text-gray-600"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Offers Tab */}
      {activeTab === "offers" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-700 uppercase">Registered Packages</h2>
            <button
              onClick={() => {
                setOfferModal(true);
                setServerError("");
              }}
              className="flex items-center gap-1.5 px-3 py-2 bg-[#1a3a2a] text-white text-xs font-semibold rounded-xl hover:bg-[#2d6a4f] transition-all"
            >
              Create Loan Offer
            </button>
          </div>

          {offersLoading ? (
            <div className="h-32 bg-gray-200 animate-pulse rounded-2xl" />
          ) : offers.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 py-16 text-center text-sm text-gray-400">
              No packages found. Create one above to get started.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {offers.map((o) => (
                <div key={o._id} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-bold text-gray-800">{o.title}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        o.isActive ? "bg-green-50 text-green-700 border border-green-150" : "bg-gray-100 text-gray-500"
                      }`}>
                        {o.isActive ? "Active" : "Disabled"}
                      </span>
                    </div>
                    {o.description && <p className="text-xs text-gray-400 mb-3">{o.description}</p>}
                    <div className="text-xs text-gray-500 space-y-1 bg-gray-50/50 p-2.5 rounded-xl border border-gray-100 mb-4">
                      <div className="flex justify-between">
                        <span>Term:</span>
                        <strong className="text-gray-700">{o.durationDays} Days</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Interest:</span>
                        <strong className="text-gray-700">
                          {o.interestRate}% ({o.interestType})
                        </strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Limits:</span>
                        <strong className="text-gray-700">
                          {formatCurrency(o.minAmount)} - {formatCurrency(o.maxAmount)}
                        </strong>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleOfferMutation.mutate(o._id)}
                    className={`w-full py-2 rounded-xl text-xs font-semibold border transition-all ${
                      o.isActive
                        ? "bg-gray-100 border-gray-250 text-gray-600 hover:bg-gray-200"
                        : "bg-green-50 border-green-150 text-green-700 hover:bg-green-100"
                    }`}
                  >
                    {o.isActive ? "Disable package" : "Enable package"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Applications Tab */}
      {activeTab === "applications" && (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-gray-50">
            <h2 className="text-sm font-semibold text-gray-800">Borrow Applications</h2>
          </div>

          {appsLoading ? (
            <div className="p-6 space-y-2">
              <div className="h-10 bg-gray-200 animate-pulse rounded-xl" />
            </div>
          ) : applications.length === 0 ? (
            <div className="p-12 text-center text-sm text-gray-400">No applications found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-gray-50/50 text-[10px] font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-50">
                    <th className="px-5 py-3">Applied</th>
                    <th className="px-5 py-3">Client</th>
                    <th className="px-5 py-3">Offer / Terms</th>
                    <th className="px-5 py-3 text-right">Requested</th>
                    <th className="px-5 py-3 text-right">Total Due</th>
                    <th className="px-5 py-3 text-right">Repaid</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {applications.map((app) => {
                    const u = app.user ?? {};
                    const isPending = app.status === "pending";

                    return (
                      <tr key={app._id} className="hover:bg-gray-50/40">
                        <td className="px-5 py-4 text-xs text-gray-500 whitespace-nowrap">
                          {formatDate(app.createdAt)}
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <div className="font-semibold text-gray-800">{u.username ?? "Unknown"}</div>
                          <div className="text-[10px] text-gray-400 font-mono">
                            Cred: {u.creditScore} • Limit: {formatCurrency(u.loanLimit ?? 0)}
                          </div>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <div className="font-medium text-gray-800">{app.offer?.title ?? "Loan"}</div>
                          <div className="text-[10px] text-gray-400">
                            {app.interestRate}% ({app.interestType}) • {app.durationDays} Days
                          </div>
                        </td>
                        <td className="px-5 py-4 text-right font-bold text-gray-800 whitespace-nowrap">
                          {formatCurrency(app.requestedAmount)}
                        </td>
                        <td className="px-5 py-4 text-right font-bold text-gray-800 whitespace-nowrap">
                          {formatCurrency(app.amountDue)}
                        </td>
                        <td className="px-5 py-4 text-right text-emerald-600 font-medium whitespace-nowrap">
                          {formatCurrency(app.repaidAmount)}
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase ${
                            app.status === "active"
                              ? "bg-green-50 text-green-700"
                              : app.status === "pending"
                              ? "bg-yellow-50 text-yellow-700"
                              : app.status === "repaid"
                              ? "bg-blue-50 text-blue-700"
                              : "bg-red-50 text-red-700"
                          }`}>
                            {app.status}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-center whitespace-nowrap">
                          {isPending ? (
                            <div className="flex justify-center gap-1.5">
                              <button
                                onClick={() => approveLoanMutation.mutate(app._id)}
                                className="text-xs px-2.5 py-1.5 bg-green-50 text-green-600 hover:bg-green-100 rounded-lg font-bold"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => {
                                  setRejectTarget(app._id);
                                  setRejectReason("");
                                }}
                                className="text-xs px-2.5 py-1.5 bg-red-50 text-red-500 hover:bg-red-100 rounded-lg font-bold"
                              >
                                Reject
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400">—</span>
                          )}
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

      {/* Limits & Settings Tab */}
      {activeTab === "limits" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* General Limits Form */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm space-y-4 h-fit">
            <h3 className="text-sm font-semibold text-gray-800 border-b border-gray-50 pb-2">Global Limit Settings</h3>

            <div className="bg-[#f0f7f4] border border-green-100 text-xs text-[#2d6a4f] p-3.5 rounded-2xl space-y-1">
              <div>Current Default Limit:</div>
              <strong className="text-sm font-mono block text-[#1a3a2a]">
                {generalLimitLoading ? "..." : formatCurrency(generalLoanLimit)}
              </strong>
              <div className="text-[10px] text-gray-400 pt-1 border-t border-emerald-100/50 mt-1.5">
                Note: Updating updates the limit of all clients who do not have custom settings.
              </div>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const amt = Number(generalLimitInput);
                if (!isNaN(amt) && amt >= 0) {
                  updateGeneralLimitMutation.mutate(amt);
                }
              }}
              className="space-y-3"
            >
              <div>
                <label className="block text-xs text-gray-500 font-semibold mb-1">Set General Loan Limit ($)</label>
                <input
                  type="number"
                  required
                  value={generalLimitInput}
                  onChange={(e) => setGeneralLimitInput(e.target.value)}
                  placeholder="e.g. 2000"
                  className={inputClass}
                />
              </div>

              <button
                type="submit"
                disabled={updateGeneralLimitMutation.isPending || !generalLimitInput}
                className="w-full py-2.5 bg-[#1a3a2a] hover:bg-[#2d6a4f] text-white text-xs font-semibold rounded-xl transition-all"
              >
                {updateGeneralLimitMutation.isPending ? "Updating..." : "Update Global Default"}
              </button>
            </form>
          </div>

          {/* User Limits Table */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-gray-50">
              <h3 className="text-sm font-semibold text-gray-800">Client Settings</h3>
            </div>

            {tradersLoading ? (
              <div className="p-6 space-y-2">
                <div className="h-10 bg-gray-200 animate-pulse rounded-xl" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="bg-gray-50/50 text-[10px] font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-50">
                      <th className="px-5 py-3">Client</th>
                      <th className="px-5 py-3 text-center">Credit Score</th>
                      <th className="px-5 py-3 text-right">Loan Limit</th>
                      <th className="px-5 py-3 text-center">Status</th>
                      <th className="px-5 py-3 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {traders.map((u: any) => (
                      <tr key={u._id} className="hover:bg-gray-50/40">
                        <td className="px-5 py-4 whitespace-nowrap">
                          <div className="font-semibold text-gray-800">{u.username}</div>
                          <div className="text-[10px] text-gray-400 font-mono">{u.email}</div>
                        </td>
                        <td className="px-5 py-4 text-center font-bold text-gray-700 whitespace-nowrap">
                          {u.creditScore ?? 100}
                        </td>
                        <td className="px-5 py-4 text-right font-bold text-[#2d6a4f] whitespace-nowrap">
                          {formatCurrency(u.loanLimit ?? 0)}
                        </td>
                        <td className="px-5 py-4 text-center whitespace-nowrap">
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                            u.isCustomLoanLimit ? "bg-orange-50 text-orange-600 border border-orange-100" : "bg-gray-50 text-gray-400"
                          }`}>
                            {u.isCustomLoanLimit ? "Custom" : "Default"}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-center whitespace-nowrap">
                          <button
                            onClick={() => handleOpenLimitModal(u)}
                            className="text-xs px-2.5 py-1 text-[#2d6a4f] font-semibold hover:underline"
                          >
                            Edit
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create Offer Modal */}
      {offerModal && (
        <Modal title="Create Loan Offer" onClose={() => setOfferModal(false)}>
          <form onSubmit={handleOfferSubmit(onOfferSubmit)} className="space-y-4" noValidate>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Package Title <span className="text-red-400">*</span></label>
              <input {...registerOffer("title", { required: "Title is required" })} placeholder="e.g. Bronze Business Credit" className={inputClass} />
              {offerErrors.title && <p className="text-xs text-red-500 mt-1">{offerErrors.title.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Description</label>
              <input {...registerOffer("description")} placeholder="Short summary" className={inputClass} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Interest Rate (%) <span className="text-red-400">*</span></label>
                <input type="number" step="0.01" {...registerOffer("interestRate", { required: true, min: 0.1 })} className={inputClass} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Interest Type <span className="text-red-400">*</span></label>
                <select {...registerOffer("interestType")} className={inputClass}>
                  <option value="flat">Flat Rate</option>
                  <option value="compound">Compound</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Min Amount ($) <span className="text-red-400">*</span></label>
                <input type="number" {...registerOffer("minAmount", { required: true, min: 1 })} className={inputClass} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Max Amount ($) <span className="text-red-400">*</span></label>
                <input type="number" {...registerOffer("maxAmount", { required: true, min: 1 })} className={inputClass} />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Duration (Days) <span className="text-red-400">*</span></label>
              <input type="number" {...registerOffer("durationDays", { required: true, min: 1 })} className={inputClass} />
            </div>

            {serverError && (
              <div className="p-3 bg-red-50 border border-red-100 text-xs text-red-600 rounded-xl">
                {serverError}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setOfferModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createOfferMutation.isPending}
                className="flex-1 py-2.5 rounded-xl bg-[#1a3a2a] text-white text-xs font-semibold hover:bg-[#2d6a4f] transition-colors disabled:opacity-60 flex items-center justify-center gap-1.5"
              >
                {createOfferMutation.isPending ? "Creating..." : "Create Offer"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Edit Limit Modal */}
      {limitModal && (
        <Modal title={`Edit limit: ${limitModal.username}`} onClose={() => setLimitModal(null)}>
          <form onSubmit={handleLimitSubmit(onLimitSubmit)} className="space-y-4" noValidate>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Credit Score <span className="text-red-400">*</span></label>
              <input
                type="number"
                {...registerLimit("creditScore", { required: "Credit score is required", min: 0, max: 1000 })}
                className={inputClass}
              />
              {limitErrors.creditScore && <p className="text-xs text-red-500 mt-1">{limitErrors.creditScore.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Custom Loan Limit ($) <span className="text-red-400">*</span></label>
              <input
                type="number"
                {...registerLimit("loanLimit", { required: "Limit is required", min: 0 })}
                className={inputClass}
              />
              {limitErrors.loanLimit && <p className="text-xs text-red-500 mt-1">{limitErrors.loanLimit.message}</p>}
            </div>

            {serverError && (
              <div className="p-3 bg-red-50 border border-red-100 text-xs text-red-600 rounded-xl">
                {serverError}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setLimitModal(null)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={updateLimitMutation.isPending}
                className="flex-1 py-2.5 rounded-xl bg-[#2d6a4f] text-white text-xs font-semibold hover:bg-[#1a3a2a] transition-colors disabled:opacity-60 flex items-center justify-center gap-1.5"
              >
                {updateLimitMutation.isPending ? "Saving..." : "Save limit settings"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Reject Modal */}
      {rejectTarget && (
        <Modal title="Reject Loan Application" onClose={() => setRejectTarget(null)}>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Reason for rejection</label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Brief reason for rejecting application"
                rows={3}
                className={inputClass}
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setRejectTarget(null)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => rejectLoanMutation.mutate({ id: rejectTarget, reason: rejectReason })}
                disabled={rejectLoanMutation.isPending || !rejectReason.trim()}
                className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-xs font-semibold hover:bg-red-600 transition-colors disabled:opacity-60"
              >
                Reject Application
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
