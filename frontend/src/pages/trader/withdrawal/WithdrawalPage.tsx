import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { userApi } from "../../../api/user.api";
import { withdrawalMethodApi } from "../../../api/methods.api";
import { transactionApi } from "../../../api/transaction.api";
import { formatCurrency, formatDate } from "../../../utils";
import type { WithdrawalMethod, Transaction } from "../../../types";

export default function WithdrawalPage() {
  const qc = useQueryClient();
  const [selectedMethodId, setSelectedMethodId] = useState("");
  const [amount, setAmount] = useState("");
  const [accountDetails, setAccountDetails] = useState<Record<string, string>>({});
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [historyPage, setHistoryPage] = useState(1);

  // Queries
  const { data: userData, isLoading: userLoading } = useQuery({
    queryKey: ["user-me"],
    queryFn: () => userApi.getMe().then((r) => r.data.data),
  });

  const { data: methodsData, isLoading: methodsLoading } = useQuery<WithdrawalMethod[]>({
    queryKey: ["withdrawal-methods-active"],
    queryFn: () => withdrawalMethodApi.getActive().then((r) => r.data.data),
  });

  const { data: historyData, isLoading: historyLoading } = useQuery({
    queryKey: ["my-withdrawals", historyPage],
    queryFn: () =>
      transactionApi
        .getMyTransactions({ type: "withdrawal", page: historyPage, limit: 10 })
        .then((r) => r.data),
  });

  const user = userData ?? { balance: 0, pendingWithdrawal: 0 };
  const methods = methodsData ?? [];
  const withdrawals = historyData?.data ?? [];
  const totalPages = historyData?.pages ?? 1;

  const selectedMethod = methods.find((m) => m._id === selectedMethodId);

  // Mutation
  const withdrawMutation = useMutation({
    mutationFn: (payload: { amount: number; methodId: string; accountDetails: Record<string, string> }) =>
      transactionApi.withdraw(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["user-me"] });
      qc.invalidateQueries({ queryKey: ["my-withdrawals"] });
      setAmount("");
      setAccountDetails({});
      setSelectedMethodId("");
      setSuccessMsg("Withdrawal request submitted successfully!");
      setTimeout(() => setSuccessMsg(""), 5000);
    },
    onError: (err: any) => {
      setErrorMsg(err?.response?.data?.message ?? "Failed to request withdrawal");
    },
  });

  const handleMethodChange = (id: string) => {
    setSelectedMethodId(id);
    setErrorMsg("");
    setSuccessMsg("");
    const method = methods.find((m) => m._id === id);
    if (method) {
      // Pre-fill keys with empty values for fields trader needs to fill
      const initialDetails: Record<string, string> = {};
      Object.entries(method.details).forEach(([key, val]) => {
        if (val === "") {
          initialDetails[key] = "";
        }
      });
      setAccountDetails(initialDetails);
    } else {
      setAccountDetails({});
    }
  };

  const handleInputChange = (key: string, value: string) => {
    setAccountDetails((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!selectedMethod) {
      setErrorMsg("Please select a withdrawal method");
      return;
    }

    const withdrawAmt = Number(amount);
    if (isNaN(withdrawAmt) || withdrawAmt <= 0) {
      setErrorMsg("Please enter a valid amount");
      return;
    }

    if (withdrawAmt < selectedMethod.minAmount || withdrawAmt > selectedMethod.maxAmount) {
      setErrorMsg(
        `Withdrawal limit for this method is between ${formatCurrency(
          selectedMethod.minAmount
        )} and ${formatCurrency(selectedMethod.maxAmount)}`
      );
      return;
    }

    if (withdrawAmt > user.balance) {
      setErrorMsg("Insufficient available balance for this withdrawal");
      return;
    }

    // Verify all trader required details are filled
    const requiredKeys = Object.entries(selectedMethod.details)
      .filter(([_, v]) => v === "")
      .map(([k]) => k);
    const missingFields = requiredKeys.filter((key) => !accountDetails[key]?.trim());
    if (missingFields.length > 0) {
      setErrorMsg(`Please fill in all account fields: ${missingFields.join(", ")}`);
      return;
    }

    withdrawMutation.mutate({
      amount: withdrawAmt,
      methodId: selectedMethod._id,
      accountDetails,
    });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white">Request Payout</h1>
        <p className="text-xs text-slate-400 mt-0.5">Withdraw compounded earnings and liquidity to your verified destination addresses.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: Form and Balances */}
        <div className="lg:col-span-2 space-y-6">
          {/* Balance Cards */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[#121822] rounded-3xl border border-white/10 p-5 shadow-sm text-white">
              <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Available Balance</span>
              {userLoading ? (
                <div className="h-7 w-24 bg-white/5 animate-pulse rounded-lg mt-1" />
              ) : (
                <span className="text-2xl font-bold text-[#00c076] font-mono block mt-1">
                  {formatCurrency(user.balance)}
                </span>
              )}
            </div>
            <div className="bg-[#121822] rounded-3xl border border-white/10 p-5 shadow-sm text-white">
              <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Pending Payout</span>
              {userLoading ? (
                <div className="h-7 w-24 bg-white/5 animate-pulse rounded-lg mt-1" />
              ) : (
                <span className="text-2xl font-bold text-amber-300 font-mono block mt-1">
                  {formatCurrency(user.pendingWithdrawal)}
                </span>
              )}
            </div>
          </div>

          {/* Form Card */}
          <div className="bg-[#121822] rounded-3xl border border-white/10 p-6 shadow-sm text-white">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Payout Request Form</h2>

            {methodsLoading ? (
              <div className="space-y-4">
                <div className="h-10 bg-white/5 animate-pulse rounded-xl" />
                <div className="h-10 bg-white/5 animate-pulse rounded-xl" />
              </div>
            ) : methods.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-500">
                No active payout gateways configured. Please contact support.
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                {/* Method selector */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">
                    Select Payout Gateway
                  </label>
                  <select
                    value={selectedMethodId}
                    onChange={(e) => handleMethodChange(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-white/10 bg-[#0e1520] text-white text-xs focus:outline-none focus:border-[#00c076]"
                  >
                    <option value="" className="bg-[#0e1520]">-- Select Gateway --</option>
                    {methods.map((m) => (
                      <option key={m._id} value={m._id} className="bg-[#0e1520]">
                        {m.name} ({m.type.toUpperCase()})
                      </option>
                    ))}
                  </select>
                </div>

                {selectedMethod && (
                  <>
                    {/* Method details/guide */}
                    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 text-xs text-emerald-300 space-y-2">
                      <div className="font-bold text-[#00e676] uppercase text-[10px]">Gateway Guidelines:</div>
                      {Object.entries(selectedMethod.details)
                        .filter(([_, v]) => v !== "")
                        .map(([k, v]) => (
                          <div key={k}>
                            <strong>{k}:</strong> <span className="font-mono text-white">{v}</span>
                          </div>
                        ))}
                      <div className="mt-1 pt-1.5 border-t border-emerald-500/20 font-mono">
                        Limits: <strong className="text-white">{formatCurrency(selectedMethod.minAmount)}</strong> -{" "}
                        <strong className="text-white">{formatCurrency(selectedMethod.maxAmount)}</strong>
                      </div>
                    </div>

                    {/* Amount */}
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">
                        Withdrawal Amount ($)
                      </label>
                      <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder={`Min: $${selectedMethod.minAmount}`}
                        className="w-full px-4 py-2.5 rounded-xl border border-white/10 bg-[#0e1520] text-white text-xs focus:outline-none focus:border-[#00c076]"
                      />
                    </div>

                    {/* Dynamic Fields */}
                    <div className="space-y-4 pt-2 border-t border-white/10">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Destination Credentials
                      </div>
                      {Object.entries(selectedMethod.details)
                        .filter(([_, v]) => v === "")
                        .map(([key]) => (
                          <div key={key}>
                            <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase">
                              Your {key} <span className="text-rose-400">*</span>
                            </label>
                            <input
                              type="text"
                              required
                              value={accountDetails[key] || ""}
                              onChange={(e) => handleInputChange(key, e.target.value)}
                              placeholder={`Enter your ${key}`}
                              className="w-full px-4 py-2.5 rounded-xl border border-white/10 bg-[#0e1520] text-white text-xs focus:outline-none focus:border-[#00c076]"
                            />
                          </div>
                        ))}
                    </div>
                  </>
                )}

                {errorMsg && (
                  <div className="p-3.5 bg-rose-500/15 border border-rose-500/30 text-xs font-bold text-rose-400 rounded-2xl">
                    ✕ {errorMsg}
                  </div>
                )}

                {successMsg && (
                  <div className="p-3.5 bg-emerald-500/15 border border-emerald-500/30 text-xs font-bold text-[#00e676] rounded-2xl">
                    ✓ {successMsg}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={withdrawMutation.isPending || !selectedMethodId}
                  className="w-full py-3.5 bg-[#00c076] hover:bg-[#00e676] text-[#080c10] text-xs font-black rounded-xl shadow-md shadow-[#00c076]/20 transition-all disabled:opacity-60 cursor-pointer flex items-center justify-center gap-2"
                >
                  {withdrawMutation.isPending && (
                    <svg className="w-4 h-4 animate-spin text-[#080c10]" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={4} />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                  )}
                  {withdrawMutation.isPending ? "Submitting Payout..." : "Confirm & Request Withdrawal"}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Right Side: Instructions & Info */}
        <div className="bg-[#121822] rounded-3xl border border-white/10 p-6 shadow-sm space-y-4 h-fit text-white">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">Settlement Protocol</h3>
          <ul className="text-xs text-slate-400 space-y-3 list-disc pl-4 leading-relaxed">
            <li>
              Once submitted, the withdrawal amount is immediately segregated from your available compounding balance and marked as{" "}
              <strong className="text-amber-300 font-bold">Pending</strong>.
            </li>
            <li>
              All payout requests are audited and processed on-chain or via wire clearance within{" "}
              <strong className="text-white">24-48 business hours</strong>.
            </li>
            <li>
              Ensure destination addresses match exactly. Blockchain transactions are irreversible once broadcast by our liquidity nodes.
            </li>
            <li>
              If a payout is rejected due to inaccurate credentials, the entire principal is refunded immediately back to your trading balance.
            </li>
          </ul>
        </div>
      </div>

      {/* History Table */}
      <div className="bg-[#121822] rounded-3xl border border-white/10 overflow-hidden shadow-sm text-white">
        <div className="px-6 py-4 border-b border-white/10 bg-[#0e1520]">
          <h2 className="text-xs font-bold text-white uppercase tracking-wider">Payout History</h2>
        </div>

        {historyLoading ? (
          <div className="p-6 space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-10 bg-white/5 animate-pulse rounded-xl" />
            ))}
          </div>
        ) : withdrawals.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500">No withdrawal records found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#0e1520] text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-white/10">
                  <th className="px-6 py-3.5">Date</th>
                  <th className="px-6 py-3.5">Reference</th>
                  <th className="px-6 py-3.5">Gateway</th>
                  <th className="px-6 py-3.5">Destination Details</th>
                  <th className="px-6 py-3.5 text-right">Amount</th>
                  <th className="px-6 py-3.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-300 font-mono">
                {withdrawals.map((tx: Transaction) => (
                  <tr key={tx._id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 text-xs text-slate-400 whitespace-nowrap">
                      {formatDate(tx.createdAt)}
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-400 whitespace-nowrap">
                      {tx.reference}
                    </td>
                    <td className="px-6 py-4 text-xs font-bold text-white whitespace-nowrap font-sans">
                      {tx.meta?.methodName || "Withdrawal"}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-400 max-w-[200px] truncate">
                      {tx.meta?.accountDetails
                        ? Object.entries(tx.meta.accountDetails)
                            .map(([k, v]) => `${k}: ${v}`)
                            .join(", ")
                        : "N/A"}
                    </td>
                    <td className="px-6 py-4 font-bold text-white text-right whitespace-nowrap">
                      {formatCurrency(tx.amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-sans">
                      <div className="flex flex-col">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase w-fit ${
                            tx.status === "approved" || tx.status === "completed"
                              ? "bg-emerald-500/15 text-[#00e676] border border-emerald-500/30"
                              : tx.status === "pending"
                              ? "bg-amber-500/15 text-amber-300 border border-amber-500/30"
                              : "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                          }`}
                        >
                          {tx.status}
                        </span>
                        {tx.status === "rejected" && tx.rejectionReason && (
                          <span className="text-[10px] text-rose-400 mt-1 italic max-w-[150px] truncate">
                            Reason: {tx.rejectionReason}
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-between items-center px-6 py-4 border-t border-white/10 bg-[#0e1520] text-xs">
            <button
              disabled={historyPage === 1}
              onClick={() => setHistoryPage((p) => p - 1)}
              className="px-3 py-1.5 border border-white/10 rounded-xl text-slate-300 hover:bg-white/5 disabled:opacity-30 cursor-pointer font-bold"
            >
              Previous
            </button>
            <span className="text-[10px] font-mono text-slate-400 uppercase">
              Page {historyPage} of {totalPages}
            </span>
            <button
              disabled={historyPage === totalPages}
              onClick={() => setHistoryPage((p) => p + 1)}
              className="px-3 py-1.5 border border-white/10 rounded-xl text-slate-300 hover:bg-white/5 disabled:opacity-30 cursor-pointer font-bold"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
