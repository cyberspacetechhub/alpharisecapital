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
    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
    <div className="relative bg-[#121822] border border-white/10 rounded-3xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto z-10 text-white">
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
        <h3 className="text-sm font-bold text-white">{title}</h3>
        <button onClick={onClose} className="text-slate-400 hover:text-white cursor-pointer text-xl leading-none">
          &times;
        </button>
      </div>
      <div className="p-6">{children}</div>
    </div>
  </div>
);

const inputClass = "w-full px-4 py-2.5 rounded-xl border border-white/10 bg-[#0e1520] text-white text-xs focus:outline-none focus:border-[#00c076]";

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
          <h1 className="text-xl font-bold text-white">Borrowing & Credit Facilities</h1>
          <p className="text-xs text-slate-400 mt-0.5">Apply for instant liquidity contracts and manage repayments.</p>
        </div>

        {/* Credit score / Limit display */}
        <div className="flex gap-4">
          <div className="bg-[#121822] border border-white/10 rounded-3xl px-5 py-3 shadow-sm flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-500/15 border border-blue-500/30 flex items-center justify-center">
              <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block uppercase font-bold">Credit Score</span>
              <span className="text-sm font-bold text-white font-mono">{user.creditScore}</span>
            </div>
          </div>

          <div className="bg-[#121822] border border-white/10 rounded-3xl px-5 py-3 shadow-sm flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
              <svg className="w-4 h-4 text-[#00e676]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block uppercase font-bold">Borrow Limit</span>
              <span className="text-sm font-bold text-[#00e676] font-mono">{formatCurrency(user.loanLimit)}</span>
            </div>
          </div>
        </div>
      </div>

      {successMsg && (
        <div className="p-3.5 bg-emerald-500/15 border border-emerald-500/30 text-xs font-bold text-[#00e676] rounded-2xl max-w-lg">
          ✓ {successMsg}
        </div>
      )}

      {/* Offers list */}
      <div className="space-y-3">
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Available Credit Packages</h2>

        {offersLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-white/5 animate-pulse rounded-3xl border border-white/5" />
            ))}
          </div>
        ) : activeOffers.length === 0 ? (
          <div className="bg-[#121822] rounded-3xl border border-white/10 p-6 text-center text-xs text-slate-500">
            No credit packages are currently active.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {activeOffers.map((o) => (
              <div key={o._id} className="bg-[#121822] rounded-3xl border border-white/10 p-5 shadow-sm flex flex-col justify-between text-white hover:border-white/20 transition-colors">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold text-white">{o.title}</span>
                    <span className="text-[10px] font-bold text-[#00e676] bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 rounded-full uppercase">
                      {o.interestRate}% {o.interestType}
                    </span>
                  </div>
                  {o.description && <p className="text-xs text-slate-400 line-clamp-2 mb-3">{o.description}</p>}
                  <div className="text-xs text-slate-400 space-y-1.5 bg-[#0e1520] p-3 rounded-2xl border border-white/10 mb-4 font-mono">
                    <div className="flex justify-between">
                      <span>Term:</span>
                      <strong className="text-white font-sans">{o.durationDays} Days</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Limits:</span>
                      <strong className="text-white">
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
                  className="w-full py-2.5 bg-[#00c076] hover:bg-[#00e676] text-[#080c10] text-xs font-black rounded-xl shadow-md shadow-[#00c076]/20 transition-all cursor-pointer"
                >
                  Apply Now
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Repayments / Applications history */}
      <div className="bg-[#121822] rounded-3xl border border-white/10 overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-white/10">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">My Loan Applications</h2>
        </div>

        {loansLoading ? (
          <div className="p-6 space-y-2">
            {[1, 2].map((i) => (
              <div key={i} className="h-10 bg-white/5 animate-pulse rounded-xl" />
            ))}
          </div>
        ) : loansList.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500">No borrowing records found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#0e1520] text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-white/10">
                  <th className="px-6 py-3.5">Applied Date</th>
                  <th className="px-6 py-3.5">Offer Title</th>
                  <th className="px-6 py-3.5 text-right">Requested</th>
                  <th className="px-6 py-3.5 text-right">Total Due</th>
                  <th className="px-6 py-3.5 text-right">Repaid</th>
                  <th className="px-6 py-3.5">Due Date</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-300 font-mono">
                {loansList.map((loan) => {
                  const remaining = loan.amountDue - loan.repaidAmount;
                  const isPending = loan.status === "pending";
                  const isActive = loan.status === "active";

                  return (
                    <tr key={loan._id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 text-xs text-slate-400 whitespace-nowrap">
                        {formatDate(loan.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-sans">
                        <span className="font-bold text-white">{loan.offer?.title ?? "Loan Offer"}</span>
                        <div className="text-[10px] text-slate-500 font-mono">
                          {loan.interestRate}% ({loan.interestType}) • {loan.durationDays} Days
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-white whitespace-nowrap">
                        {formatCurrency(loan.requestedAmount)}
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-white whitespace-nowrap">
                        {formatCurrency(loan.amountDue)}
                      </td>
                      <td className="px-6 py-4 text-right text-[#00e676] font-bold whitespace-nowrap">
                        {formatCurrency(loan.repaidAmount)}
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-400 whitespace-nowrap">
                        {loan.dueDate ? formatDate(loan.dueDate) : "—"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-sans">
                        <span
                          className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            loan.status === "active"
                              ? "bg-emerald-500/15 text-[#00e676] border border-emerald-500/30"
                              : loan.status === "pending"
                              ? "bg-amber-500/15 text-amber-300 border border-amber-500/30"
                              : loan.status === "repaid"
                              ? "bg-blue-500/15 text-blue-300 border border-blue-500/30"
                              : "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                          }`}
                        >
                          {loan.status}
                        </span>
                        {loan.status === "rejected" && loan.rejectionReason && (
                          <div className="text-[9px] text-rose-400 italic mt-0.5">
                            "{loan.rejectionReason}"
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center whitespace-nowrap font-sans">
                        {isActive && remaining > 0 ? (
                          <button
                            onClick={() => {
                              setRepayTarget(loan);
                              setRepayAmount("");
                              setErrorMsg("");
                            }}
                            className="text-xs px-3 py-1.5 rounded-xl font-bold bg-[#00c076] hover:bg-[#00e676] text-[#080c10] shadow-sm transition-all cursor-pointer"
                          >
                            Repay
                          </button>
                        ) : isPending ? (
                          <span className="text-[10px] text-slate-500">Awaiting Approval</span>
                        ) : (
                          <span className="text-[10px] text-slate-500">—</span>
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
        <Modal title="Apply for Credit Facility" onClose={() => setSelectedOffer(null)}>
          <form onSubmit={handleApplySubmit} className="space-y-4" noValidate>
            <div className="bg-[#0e1520] p-3.5 rounded-2xl border border-white/10">
              <span className="text-[10px] text-slate-400 block uppercase font-bold">Selected Package</span>
              <strong className="text-sm text-white block">{selectedOffer.title}</strong>
              <span className="text-[10px] text-[#00e676] font-mono block mt-0.5">
                Interest: {selectedOffer.interestRate}% ({selectedOffer.interestType}) • Term: {selectedOffer.durationDays} Days
              </span>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Requested Amount ($)</label>
              <input
                type="number"
                required
                value={applyAmount}
                onChange={(e) => setApplyAmount(e.target.value)}
                placeholder={`Min: $${selectedOffer.minAmount} - Max: $${selectedOffer.maxAmount}`}
                className={inputClass}
              />
              <p className="text-[10px] text-slate-500 mt-1 font-mono">
                Your maximum borrow limit is <strong className="text-[#00c076]">{formatCurrency(user.loanLimit)}</strong>.
              </p>
            </div>

            {/* Terms and Conditions Box */}
            <div className="p-3.5 bg-[#0e1520] border border-white/10 rounded-2xl space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Terms & Credit Agreement</span>
              <div className="text-[10px] text-slate-400 max-h-20 overflow-y-auto leading-relaxed bg-[#121822] p-2.5 rounded-xl border border-white/10">
                By applying for this credit facility, you agree to Alpha Rise Global's institutional borrowing parameters.
                Repayment installments are due on or before the maturation date of {selectedOffer.durationDays} days.
                Outstanding balances will accrue standard late fees. You authorize the clearing house to restrict active trading or apply margin calls if default thresholds are reached.
              </div>
              <label className="flex items-start gap-2 text-[10px] font-bold text-slate-300 cursor-pointer select-none mt-2">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="w-3.5 h-3.5 mt-0.5 accent-[#00c076] shrink-0"
                />
                I agree to the Terms and Conditions of this Loan Agreement.
              </label>
            </div>

            {errorMsg && (
              <div className="p-3.5 bg-rose-500/15 border border-rose-500/30 text-xs font-bold text-rose-400 rounded-2xl">
                ✕ {errorMsg}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSelectedOffer(null)}
                className="flex-1 py-2.5 rounded-xl border border-white/10 text-xs font-bold text-slate-400 hover:bg-white/5 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={applyMutation.isPending || !agreed}
                className="flex-1 py-2.5 rounded-xl bg-[#00c076] hover:bg-[#00e676] text-[#080c10] text-xs font-black shadow-md shadow-[#00c076]/20 transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {applyMutation.isPending && (
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={4} />
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
        <Modal title="Repay Credit Facility" onClose={() => setRepayTarget(null)}>
          <form onSubmit={handleRepaySubmit} className="space-y-4" noValidate>
            <div className="bg-[#0e1520] p-3.5 rounded-2xl border border-white/10">
              <span className="text-[10px] text-slate-400 block uppercase font-bold">Active Contract</span>
              <strong className="text-sm text-white block">{repayTarget.offer?.title ?? "Loan"}</strong>
              <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                Total Due: <strong className="text-white">{formatCurrency(repayTarget.amountDue)}</strong> • Repaid:{" "}
                <strong className="text-[#00c076]">{formatCurrency(repayTarget.repaidAmount)}</strong>
              </span>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Repayment Amount ($)</label>
              <input
                type="number"
                required
                value={repayAmount}
                onChange={(e) => setRepayAmount(e.target.value)}
                placeholder={`Remaining: $${(repayTarget.amountDue - repayTarget.repaidAmount).toFixed(2)}`}
                className={inputClass}
              />
              <p className="text-[10px] text-slate-500 mt-1 font-mono">
                Your available balance is <strong className="text-[#00c076]">{formatCurrency(user.balance)}</strong>.
              </p>
            </div>

            {errorMsg && (
              <div className="p-3.5 bg-rose-500/15 border border-rose-500/30 text-xs font-bold text-rose-400 rounded-2xl">
                ✕ {errorMsg}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setRepayTarget(null)}
                className="flex-1 py-2.5 rounded-xl border border-white/10 text-xs font-bold text-slate-400 hover:bg-white/5 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={repayMutation.isPending}
                className="flex-1 py-2.5 rounded-xl bg-[#00c076] hover:bg-[#00e676] text-[#080c10] text-xs font-black shadow-md shadow-[#00c076]/20 transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {repayMutation.isPending && (
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={4} />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                )}
                Confirm Repayment
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
