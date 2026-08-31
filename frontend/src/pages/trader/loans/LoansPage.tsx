import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
}

interface LoanApplication {
  _id: string;
  offer: LoanOffer;
  requestedAmount: number;
  amountDue: number;
  repaidAmount: number;
  interestRate: number;
  interestType: "flat" | "compound";
  durationDays: number;
  status: "pending" | "active" | "repaid" | "rejected";
  dueDate?: string;
  createdAt: string;
  rejectionReason?: string;
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

export default function TraderLoansPage() {
  const qc = useQueryClient();
  const [selectedOffer, setSelectedOffer] = useState<LoanOffer | null>(null);
  const [applyAmount, setApplyAmount] = useState("");
  const [repayTarget, setRepayTarget] = useState<LoanApplication | null>(null);
  const [repayAmount, setRepayAmount] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [agreed, setAgreed] = useState(false);

  // Queries
  const { data: userData } = useQuery({
    queryKey: ["user-me"],
    queryFn: () => userApi.getMe().then((r) => r.data.data),
  });

  const { data: offers, isLoading: offersLoading } = useQuery<LoanOffer[]>({
    queryKey: ["loan-offers-active"],
    queryFn: () => loanApi.getActiveOffers().then((r) => r.data.data),
  });

  const { data: myLoans, isLoading: loansLoading } = useQuery<LoanApplication[]>({
    queryKey: ["my-loans"],
    queryFn: () => loanApi.getMyLoans().then((r) => r.data.data),
  });

  const user = userData ?? { balance: 0, loanLimit: 0, creditScore: 100 };
  const activeOffers = offers ?? [];
  const loansList = myLoans ?? [];

  // Mutations
  const applyMutation = useMutation({
    mutationFn: (payload: { offerId: string; requestedAmount: number }) =>
      loanApi.applyForLoan(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["user-me"] });
      qc.invalidateQueries({ queryKey: ["my-loans"] });
      setSelectedOffer(null);
      setApplyAmount("");
      setSuccessMsg("Loan application submitted successfully!");
      setTimeout(() => setSuccessMsg(""), 5000);
    },
    onError: (err: any) => {
      setErrorMsg(err?.response?.data?.message ?? "Failed to apply for loan");
    },
  });

  const repayMutation = useMutation({
    mutationFn: ({ id, amount }: { id: string; amount: number }) =>
      loanApi.repayLoan(id, amount),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["user-me"] });
      qc.invalidateQueries({ queryKey: ["my-loans"] });
      setRepayTarget(null);
      setRepayAmount("");
      setSuccessMsg("Repayment processed successfully!");
      setTimeout(() => setSuccessMsg(""), 5000);
    },
    onError: (err: any) => {
      setErrorMsg(err?.response?.data?.message ?? "Failed to process repayment");
    },
  });

  const handleApplySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!selectedOffer) return;

    const reqAmt = Number(applyAmount);
    if (isNaN(reqAmt) || reqAmt <= 0) {
      setErrorMsg("Please enter a valid amount");
      return;
    }

    if (reqAmt < selectedOffer.minAmount || reqAmt > selectedOffer.maxAmount) {
      setErrorMsg(
        `Requested amount must be between ${formatCurrency(
          selectedOffer.minAmount
        )} and ${formatCurrency(selectedOffer.maxAmount)}`
      );
      return;
    }

    if (reqAmt > user.loanLimit) {
      setErrorMsg(
        `Requested amount exceeds your current borrowing limit of ${formatCurrency(user.loanLimit)}`
      );
      return;
    }

    applyMutation.mutate({
      offerId: selectedOffer._id,
      requestedAmount: reqAmt,
    });
  };

  const handleRepaySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!repayTarget) return;

    const repAmt = Number(repayAmount);
    if (isNaN(repAmt) || repAmt <= 0) {
      setErrorMsg("Please enter a valid repayment amount");
      return;
    }

    const remaining = repayTarget.amountDue - repayTarget.repaidAmount;
    if (repAmt > remaining) {
      setErrorMsg(`Amount exceeds the remaining balance due of ${formatCurrency(remaining)}`);
      return;
    }

    if (repAmt > user.balance) {
      setErrorMsg("Insufficient available account balance");
      return;
    }

    repayMutation.mutate({
      id: repayTarget._id,
      amount: repAmt,
    });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Borrowing & Credit</h1>
          <p className="text-xs text-gray-400 mt-0.5">Apply for instant loans and manage repayments.</p>
        </div>

        {/* Credit score / Limit display */}
        <div className="flex gap-4">
          <div className="bg-white border border-gray-100 rounded-2xl px-5 py-3 shadow-sm flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
              <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            </div>
            <div>
              <span className="text-[10px] text-gray-400 block uppercase font-bold">Credit Score</span>
              <span className="text-sm font-bold text-gray-800">{user.creditScore}</span>
            </div>
          </div>

          <div className="bg-white border border-gray-100 rounded-2xl px-5 py-3 shadow-sm flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center">
              <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <span className="text-[10px] text-gray-400 block uppercase font-bold">Borrow Limit</span>
              <span className="text-sm font-bold text-[#2d6a4f]">{formatCurrency(user.loanLimit)}</span>
            </div>
          </div>
        </div>
      </div>

      {successMsg && (
        <div className="p-3 bg-green-50 border border-green-100 text-xs text-emerald-700 rounded-xl max-w-lg">
          {successMsg}
        </div>
      )}

      {/* Offers list */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-gray-700 uppercase">Available Loan Offers</h2>

        {offersLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-gray-200 animate-pulse rounded-2xl" />
            ))}
          </div>
        ) : activeOffers.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-6 text-center text-sm text-gray-400">
            No loan offers are currently active.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {activeOffers.map((o) => (
              <div key={o._id} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold text-gray-800">{o.title}</span>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full uppercase">
                      {o.interestRate}% {o.interestType}
                    </span>
                  </div>
                  {o.description && <p className="text-xs text-gray-400 line-clamp-2 mb-3">{o.description}</p>}
                  <div className="text-xs text-gray-500 space-y-1 bg-gray-50/50 p-2.5 rounded-xl border border-gray-100 mb-4">
                    <div className="flex justify-between">
                      <span>Term:</span>
                      <strong className="text-gray-700">{o.durationDays} Days</strong>
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
                  onClick={() => {
                    setSelectedOffer(o);
                    setApplyAmount("");
                    setAgreed(false);
                    setErrorMsg("");
                  }}
                  className="w-full py-2 bg-[#1a3a2a] hover:bg-[#2d6a4f] text-white text-xs font-semibold rounded-xl transition-colors"
                >
                  Apply Now
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Repayments / Applications history */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-gray-50">
          <h2 className="text-sm font-semibold text-gray-800">My Loan Applications</h2>
        </div>

        {loansLoading ? (
          <div className="p-6 space-y-2">
            {[1, 2].map((i) => (
              <div key={i} className="h-10 bg-gray-200 animate-pulse rounded-xl" />
            ))}
          </div>
        ) : loansList.length === 0 ? (
          <div className="p-12 text-center text-sm text-gray-400">No borrowing records found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-gray-50/50 text-[10px] font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-50">
                  <th className="px-6 py-3">Applied Date</th>
                  <th className="px-6 py-3">Offer Title</th>
                  <th className="px-6 py-3 text-right">Requested</th>
                  <th className="px-6 py-3 text-right">Total Due</th>
                  <th className="px-6 py-3 text-right">Repaid</th>
                  <th className="px-6 py-3">Due Date</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loansList.map((loan) => {
                  const remaining = loan.amountDue - loan.repaidAmount;
                  const isPending = loan.status === "pending";
                  const isActive = loan.status === "active";

                  return (
                    <tr key={loan._id} className="hover:bg-gray-50/40">
                      <td className="px-6 py-4 text-xs text-gray-500 whitespace-nowrap">
                        {formatDate(loan.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-semibold text-gray-800">{loan.offer?.title ?? "Loan Offer"}</span>
                        <div className="text-[9px] text-gray-400">
                          {loan.interestRate}% ({loan.interestType}) • {loan.durationDays} Days
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-gray-800 whitespace-nowrap">
                        {formatCurrency(loan.requestedAmount)}
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-gray-800 whitespace-nowrap">
                        {formatCurrency(loan.amountDue)}
                      </td>
                      <td className="px-6 py-4 text-right text-emerald-600 font-medium whitespace-nowrap">
                        {formatCurrency(loan.repaidAmount)}
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-500 whitespace-nowrap">
                        {loan.dueDate ? formatDate(loan.dueDate) : "—"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold uppercase ${
                            loan.status === "active"
                              ? "bg-green-50 text-green-700"
                              : loan.status === "pending"
                              ? "bg-yellow-50 text-yellow-700"
                              : loan.status === "repaid"
                              ? "bg-blue-50 text-blue-700"
                              : "bg-red-50 text-red-700"
                          }`}
                        >
                          {loan.status}
                        </span>
                        {loan.status === "rejected" && loan.rejectionReason && (
                          <div className="text-[9px] text-red-500 italic mt-0.5">
                            "{loan.rejectionReason}"
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center whitespace-nowrap">
                        {isActive && remaining > 0 ? (
                          <button
                            onClick={() => {
                              setRepayTarget(loan);
                              setRepayAmount("");
                              setErrorMsg("");
                            }}
                            className="text-xs px-3 py-1.5 rounded-lg font-bold bg-[#f0f7f4] text-[#2d6a4f] hover:bg-[#e0f0e8] transition-colors"
                          >
                            Repay
                          </button>
                        ) : isPending ? (
                          <span className="text-[10px] text-gray-400">Awaiting Approval</span>
                        ) : (
                          <span className="text-[10px] text-gray-400">—</span>
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

      {/* Apply Loan Modal */}
      {selectedOffer && (
        <Modal title="Apply for Loan" onClose={() => setSelectedOffer(null)}>
          <form onSubmit={handleApplySubmit} className="space-y-4" noValidate>
            <div>
              <span className="text-xs text-gray-400 block uppercase font-bold">Selected Offer</span>
              <strong className="text-sm text-gray-800 block">{selectedOffer.title}</strong>
              <span className="text-[10px] text-gray-500 block mt-0.5">
                Interest: {selectedOffer.interestRate}% ({selectedOffer.interestType}) • Term: {selectedOffer.durationDays} Days
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Requested Amount ($)</label>
              <input
                type="number"
                required
                value={applyAmount}
                onChange={(e) => setApplyAmount(e.target.value)}
                placeholder={`Min: $${selectedOffer.minAmount} - Max: $${selectedOffer.maxAmount}`}
                className={inputClass}
              />
              <p className="text-[10px] text-gray-400 mt-1">
                Your maximum borrow limit is <strong>{formatCurrency(user.loanLimit)}</strong>.
              </p>
            </div>

            {/* Terms and Conditions Box */}
            <div className="p-3.5 bg-gray-50 border border-gray-150 rounded-2xl space-y-2">
              <span className="text-[10px] font-bold text-gray-500 uppercase block">Terms & Credit Agreement</span>
              <div className="text-[10px] text-gray-450 max-h-20 overflow-y-auto leading-relaxed bg-white p-2.5 rounded-xl border border-gray-100">
                By applying for this credit facility, you agree to Alpha Rise Global's borrowing parameters.
                Repayment installments are due on or before the maturation date of {selectedOffer.durationDays} days.
                Outstanding balances will accrue standard late fees. You authorize the clearing house to restrict active trading or apply margin calls if default thresholds are reached.
              </div>
              <label className="flex items-start gap-2 text-[10px] font-semibold text-gray-600 cursor-pointer select-none mt-2">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="w-3.5 h-3.5 mt-0.5 accent-[#2d6a4f] shrink-0"
                />
                I agree to the Terms and Conditions of this Loan Agreement.
              </label>
            </div>

            {errorMsg && (
              <div className="p-3 bg-red-50 border border-red-100 text-xs text-red-600 rounded-xl">
                {errorMsg}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSelectedOffer(null)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={applyMutation.isPending || !agreed}
                className="flex-1 py-2.5 rounded-xl bg-[#1a3a2a] text-white text-xs font-semibold hover:bg-[#2d6a4f] transition-colors disabled:opacity-60 flex items-center justify-center gap-1.5"
              >
                {applyMutation.isPending && (
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                )}
                Submit Application
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Repay Loan Modal */}
      {repayTarget && (
        <Modal title="Repay Loan" onClose={() => setRepayTarget(null)}>
          <form onSubmit={handleRepaySubmit} className="space-y-4" noValidate>
            <div>
              <span className="text-xs text-gray-400 block uppercase font-bold">Active Loan</span>
              <strong className="text-sm text-gray-800 block">{repayTarget.offer?.title ?? "Loan"}</strong>
              <span className="text-[10px] text-gray-500 block mt-0.5">
                Total Due: <strong>{formatCurrency(repayTarget.amountDue)}</strong> • Repaid:{" "}
                <strong>{formatCurrency(repayTarget.repaidAmount)}</strong>
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Repayment Amount ($)</label>
              <input
                type="number"
                required
                value={repayAmount}
                onChange={(e) => setRepayAmount(e.target.value)}
                placeholder={`Remaining: $${(repayTarget.amountDue - repayTarget.repaidAmount).toFixed(2)}`}
                className={inputClass}
              />
              <p className="text-[10px] text-gray-400 mt-1">
                Your available account balance is <strong>{formatCurrency(user.balance)}</strong>.
              </p>
            </div>

            {errorMsg && (
              <div className="p-3 bg-red-50 border border-red-100 text-xs text-red-600 rounded-xl">
                {errorMsg}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setRepayTarget(null)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={repayMutation.isPending}
                className="flex-1 py-2.5 rounded-xl bg-[#2d6a4f] text-white text-xs font-semibold hover:bg-[#1a3a2a] transition-colors disabled:opacity-60 flex items-center justify-center gap-1.5"
              >
                {repayMutation.isPending && (
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                )}
                Submit Repayment
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
