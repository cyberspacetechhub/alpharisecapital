import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { withdrawalMethodApi } from "../../../api/methods.api";
import { transactionApi } from "../../../api/transaction.api";
import { userApi } from "../../../api/user.api";
import { formatCurrency, formatDate } from "../../../utils";
import AssetLogo from "../../../components/common/AssetLogo";
import type { WithdrawalMethod, Transaction, User } from "../../../types";

export default function WithdrawalPage() {
  const queryClient = useQueryClient();
  const [selectedMethodId, setSelectedMethodId] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [accountDetails, setAccountDetails] = useState<Record<string, string>>({});
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [successMsg, setSuccessMsg] = useState<string>("");
  const [historyPage, setHistoryPage] = useState(1);
  const [viewMode, setViewMode] = useState<"auto" | "table" | "cards">("auto");

  // Fetch active methods
  const { data: methods = [], isLoading: methodsLoading } = useQuery<WithdrawalMethod[]>({
    queryKey: ["withdrawal-methods-active"],
    queryFn: () => withdrawalMethodApi.getActive().then((res) => res.data.data),
  });

  // Fetch user profile for live balance
  const { data: userData, isLoading: userLoading } = useQuery({
    queryKey: ["user-profile"],
    queryFn: () => userApi.getMe().then((res) => res.data.data),
  });
  const user: User = userData || { balance: 0, pendingWithdrawal: 0 };

  // Fetch withdrawal history
  const { data: historyData, isLoading: historyLoading } = useQuery({
    queryKey: ["my-withdrawals", historyPage],
    queryFn: () =>
      transactionApi.getMyTransactions({ type: "withdrawal", page: historyPage, limit: 10 }).then((res) => res.data),
  });
  const withdrawals: Transaction[] = historyData?.data || [];
  const totalPages = historyData?.pages || 1;

  const selectedMethod = methods.find((m) => m._id === selectedMethodId);

  // Mutation
  const withdrawMutation = useMutation({
    mutationFn: (payload: { amount: number; methodId: string; accountDetails: Record<string, string> }) =>
      transactionApi.withdraw(payload),
    onSuccess: (res) => {
      setSuccessMsg(`Payout request submitted successfully! Ref: ${res.data.data.reference}`);
      setErrorMsg("");
      setAmount("");
      setAccountDetails({});
      setSelectedMethodId("");
      queryClient.invalidateQueries({ queryKey: ["user-profile"] });
      queryClient.invalidateQueries({ queryKey: ["my-withdrawals"] });
      queryClient.invalidateQueries({ queryKey: ["my-transactions"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (err: any) => {
      setErrorMsg(err.response?.data?.message || "Failed to submit withdrawal request");
      setSuccessMsg("");
    },
  });

  const handleMethodChange = (id: string) => {
    setSelectedMethodId(id);
    setAccountDetails({});
    setErrorMsg("");
    setSuccessMsg("");
  };

  const handleInputChange = (key: string, value: string) => {
    setAccountDetails((prev) => ({ ...prev, [key]: value }));
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
                <span className="text-2xl font-bold text-amber-400 font-mono block mt-1">
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
                {/* Gateway Selection Grid */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">
                    Select Payout Gateway
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {methods.map((m) => {
                      const isSelected = selectedMethodId === m._id;
                      return (
                        <button
                          key={m._id}
                          type="button"
                          onClick={() => handleMethodChange(m._id)}
                          className={`flex items-center gap-3 p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                            isSelected
                              ? "bg-[#00c076]/10 border-[#00c076] ring-1 ring-[#00c076]/30"
                              : "bg-[#0e1520] border-white/10 hover:border-white/20"
                          }`}
                        >
                          <AssetLogo image={m.image} name={m.name} type={m.type} size="md" />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <p className="text-xs font-bold text-white truncate">{m.name}</p>
                              <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase ${
                                m.type === "crypto" ? "bg-amber-500/20 text-amber-300" : "bg-blue-500/20 text-blue-300"
                              }`}>
                                {m.type}
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                              {formatCurrency(m.minAmount)} - {formatCurrency(m.maxAmount)}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {selectedMethod && (
                  <>
                    {/* Method details/guide */}
                    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 text-xs text-emerald-300 space-y-2">
                      <div className="flex items-center gap-2">
                        <AssetLogo image={selectedMethod.image} name={selectedMethod.name} type={selectedMethod.type} size="sm" />
                        <span className="font-bold text-[#00e676] uppercase text-[10px]">Gateway Guidelines & Limits</span>
                      </div>
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
                        placeholder={`Min: $${selectedMethod.minAmount} — Max: $${selectedMethod.maxAmount}`}
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

      {/* History Section (Responsive Card & Table Views) */}
      <div className="bg-[#121822] rounded-3xl border border-white/10 overflow-hidden shadow-sm text-white">
        <div className="px-6 py-4 border-b border-white/10 bg-[#0e1520] flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xs font-bold text-white uppercase tracking-wider">Payout History</h2>
            <p className="text-[11px] text-slate-400 mt-0.5">Real-time liquidation ledger and payout settlements</p>
          </div>
          
          {/* View Toggle */}
          <div className="flex items-center gap-1 bg-[#121822] p-1 rounded-xl border border-white/10 text-xs">
            <button
              type="button"
              onClick={() => setViewMode("auto")}
              className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                viewMode === "auto" ? "bg-white/10 text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              Auto
            </button>
            <button
              type="button"
              onClick={() => setViewMode("cards")}
              className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                viewMode === "cards" ? "bg-white/10 text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              Cards
            </button>
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                viewMode === "table" ? "bg-white/10 text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              Table
            </button>
          </div>
        </div>

        {historyLoading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-white/5 animate-pulse rounded-2xl" />
            ))}
          </div>
        ) : withdrawals.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500">No withdrawal records found.</div>
        ) : (
          <div>
            {/* ── Responsive Card Feed (Visible when viewMode === 'cards' OR on small screens under 'auto') ── */}
            <div className={`p-4 sm:p-6 space-y-3 ${viewMode === "table" ? "hidden" : viewMode === "cards" ? "block" : "block md:hidden"}`}>
              {withdrawals.map((tx: Transaction) => {
                const methodImg = tx.meta?.methodImage || methods.find((m) => m._id === tx.methodId || m.name === tx.meta?.methodName)?.image;
                const methodName = tx.meta?.methodName || "Withdrawal";
                const isSuccess = tx.status === "approved" || tx.status === "completed";
                const isPending = tx.status === "pending";

                return (
                  <div key={tx._id} className="p-4 rounded-2xl bg-[#0e1520] border border-white/10 space-y-3 hover:border-white/20 transition-all">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <AssetLogo
                          image={methodImg}
                          name={methodName}
                          type="withdrawal"
                          size="md"
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-white truncate">{methodName}</p>
                          <p className="text-[10px] text-slate-400 font-mono mt-0.5">{tx.reference}</p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold font-mono text-rose-400">-{formatCurrency(tx.amount)}</p>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase mt-0.5 ${
                          isSuccess
                            ? "bg-emerald-500/15 text-[#00e676] border border-emerald-500/30"
                            : isPending
                            ? "bg-amber-500/15 text-amber-300 border border-amber-500/30"
                            : "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                        }`}>
                          {isSuccess ? "Successful" : tx.status}
                        </span>
                      </div>
                    </div>

                    {/* Destination details and date */}
                    <div className="pt-2 border-t border-white/5 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
                      <div className="truncate max-w-[240px]">
                        {tx.meta?.accountDetails
                          ? Object.entries(tx.meta.accountDetails).map(([k, v]) => `${k}: ${v}`).join(" · ")
                          : "No custom destination recorded"}
                      </div>
                      <span className="font-mono text-[10px] text-slate-500 shrink-0">{formatDate(tx.createdAt)}</span>
                    </div>

                    {tx.status === "rejected" && tx.rejectionReason && (
                      <div className="px-3 py-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-[11px] text-rose-300">
                        <strong>Reason:</strong> {tx.rejectionReason}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* ── Table View (Visible when viewMode === 'table' OR on md+ screens under 'auto') ── */}
            <div className={`overflow-x-auto ${viewMode === "cards" ? "hidden" : viewMode === "table" ? "block" : "hidden md:block"}`}>
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#0e1520] text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-white/10">
                    <th className="px-6 py-3.5">Gateway</th>
                    <th className="px-6 py-3.5">Reference</th>
                    <th className="px-6 py-3.5">Destination Details</th>
                    <th className="px-6 py-3.5 text-right">Amount</th>
                    <th className="px-6 py-3.5">Status</th>
                    <th className="px-6 py-3.5">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-slate-300">
                  {withdrawals.map((tx: Transaction) => {
                    const methodImg = tx.meta?.methodImage || methods.find((m) => m._id === tx.methodId || m.name === tx.meta?.methodName)?.image;
                    const methodName = tx.meta?.methodName || "Withdrawal";
                    const isSuccess = tx.status === "approved" || tx.status === "completed";
                    const isPending = tx.status === "pending";

                    return (
                      <tr key={tx._id} className="hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <AssetLogo
                              image={methodImg}
                              name={methodName}
                              type="withdrawal"
                              size="sm"
                            />
                            <span className="font-bold text-white text-xs">{methodName}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-mono text-xs text-slate-400 whitespace-nowrap">
                          {tx.reference}
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-400 max-w-[200px] truncate">
                          {tx.meta?.accountDetails
                            ? Object.entries(tx.meta.accountDetails)
                                .map(([k, v]) => `${k}: ${v}`)
                                .join(", ")
                            : "N/A"}
                        </td>
                        <td className="px-6 py-4 font-bold text-rose-400 text-right whitespace-nowrap font-mono">
                          -{formatCurrency(tx.amount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase w-fit ${
                                isSuccess
                                  ? "bg-emerald-500/15 text-[#00e676] border border-emerald-500/30"
                                  : isPending
                                  ? "bg-amber-500/15 text-amber-300 border border-amber-500/30"
                                  : "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                              }`}
                            >
                              {isSuccess ? "Successful" : tx.status}
                            </span>
                            {tx.status === "rejected" && tx.rejectionReason && (
                              <span className="text-[10px] text-rose-400 mt-1 italic max-w-[150px] truncate">
                                Reason: {tx.rejectionReason}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-400 whitespace-nowrap font-mono">
                          {formatDate(tx.createdAt)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
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
