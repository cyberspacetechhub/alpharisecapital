import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { userApi } from "../../../api/user.api";
import { withdrawalMethodApi } from "../../../api/methods.api";
import { transactionApi } from "../../../api/transaction.api";
import { formatCurrency, formatDate, getStatusColor } from "../../../utils";
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
        <h1 className="text-xl font-bold text-gray-800">Request Withdrawal</h1>
        <p className="text-xs text-gray-400 mt-0.5">Withdraw earnings and funds to your personal accounts.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: Form and Balances */}
        <div className="lg:col-span-2 space-y-6">
          {/* Balance Cards */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <span className="text-xs text-gray-400 font-semibold block uppercase">Available Balance</span>
              {userLoading ? (
                <div className="h-7 w-24 bg-gray-200 animate-pulse rounded-lg mt-1" />
              ) : (
                <span className="text-2xl font-bold text-gray-800 block mt-1">
                  {formatCurrency(user.balance)}
                </span>
              )}
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <span className="text-xs text-gray-400 font-semibold block uppercase">Pending Withdrawal</span>
              {userLoading ? (
                <div className="h-7 w-24 bg-gray-200 animate-pulse rounded-lg mt-1" />
              ) : (
                <span className="text-2xl font-bold text-amber-600 block mt-1">
                  {formatCurrency(user.pendingWithdrawal)}
                </span>
              )}
            </div>
          </div>

          {/* Form Card */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-800 mb-4">Request Form</h2>

            {methodsLoading ? (
              <div className="space-y-4">
                <div className="h-10 bg-gray-200 animate-pulse rounded-xl" />
                <div className="h-10 bg-gray-200 animate-pulse rounded-xl" />
              </div>
            ) : methods.length === 0 ? (
              <div className="text-center py-6 text-sm text-gray-400">
                No active withdrawal methods available. Please contact support.
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                {/* Method selector */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">
                    Select Payout Method
                  </label>
                  <select
                    value={selectedMethodId}
                    onChange={(e) => handleMethodChange(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#2d6a4f] focus:border-transparent"
                  >
                    <option value="">-- Select Payment Method --</option>
                    {methods.map((m) => (
                      <option key={m._id} value={m._id}>
                        {m.name} ({m.type.toUpperCase()})
                      </option>
                    ))}
                  </select>
                </div>

                {selectedMethod && (
                  <>
                    {/* Method details/guide */}
                    <div className="bg-[#f0f7f4] border border-green-100 rounded-2xl p-4 text-xs text-[#2d6a4f] space-y-2">
                      <div className="font-semibold text-emerald-800">Guidelines:</div>
                      {Object.entries(selectedMethod.details)
                        .filter(([_, v]) => v !== "")
                        .map(([k, v]) => (
                          <div key={k}>
                            <strong>{k}:</strong> <span className="font-mono">{v}</span>
                          </div>
                        ))}
                      <div className="mt-1 pt-1.5 border-t border-emerald-100/50">
                        Limits: <strong>{formatCurrency(selectedMethod.minAmount)}</strong> -{" "}
                        <strong>{formatCurrency(selectedMethod.maxAmount)}</strong>
                      </div>
                    </div>

                    {/* Amount */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">
                        Withdrawal Amount ($)
                      </label>
                      <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder={`Min: $${selectedMethod.minAmount}`}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#2d6a4f] focus:border-transparent"
                      />
                    </div>

                    {/* Dynamic Fields */}
                    <div className="space-y-4 pt-1.5 border-t border-gray-100">
                      <div className="text-xs font-semibold text-gray-700 uppercase">
                        Account Destination Details
                      </div>
                      {Object.entries(selectedMethod.details)
                        .filter(([_, v]) => v === "")
                        .map(([key]) => (
                          <div key={key}>
                            <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                              Your {key} <span className="text-red-400">*</span>
                            </label>
                            <input
                              type="text"
                              required
                              value={accountDetails[key] || ""}
                              onChange={(e) => handleInputChange(key, e.target.value)}
                              placeholder={`Enter ${key}`}
                              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#2d6a4f] focus:border-transparent"
                            />
                          </div>
                        ))}
                    </div>
                  </>
                )}

                {errorMsg && (
                  <div className="p-3 bg-red-50 border border-red-100 text-xs text-red-600 rounded-xl">
                    {errorMsg}
                  </div>
                )}

                {successMsg && (
                  <div className="p-3 bg-green-50 border border-green-100 text-xs text-emerald-700 rounded-xl">
                    {successMsg}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={withdrawMutation.isPending || !selectedMethodId}
                  className="w-full py-3 bg-[#1a3a2a] hover:bg-[#2d6a4f] text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {withdrawMutation.isPending && (
                    <svg className="w-4 h-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                  )}
                  {withdrawMutation.isPending ? "Processing..." : "Submit Withdrawal Request"}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Right Side: Instructions & Info */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-4 h-fit">
          <h3 className="text-sm font-semibold text-gray-800">Important Information</h3>
          <ul className="text-xs text-gray-500 space-y-3 list-disc pl-4 leading-relaxed">
            <li>
              Once submitted, the withdrawal amount is immediately debited from your available balance and marked as{" "}
              <strong className="text-amber-600 font-medium">Pending</strong>.
            </li>
            <li>
              All withdrawal requests undergo verification by our auditing team and are typically processed within{" "}
              <strong>24-48 business hours</strong>.
            </li>
            <li>
              Ensure your destination address or bank details match exactly. Alpha Rise Global is not liable for transactions sent
              to incorrect destination details supplied by the client.
            </li>
            <li>
              If your request is rejected, the full principal amount is immediately refunded back to your available balance.
            </li>
          </ul>
        </div>
      </div>

      {/* History Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-gray-50">
          <h2 className="text-sm font-semibold text-gray-800">Withdrawal History</h2>
        </div>

        {historyLoading ? (
          <div className="p-6 space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-10 bg-gray-200 animate-pulse rounded-xl" />
            ))}
          </div>
        ) : withdrawals.length === 0 ? (
          <div className="p-12 text-center text-sm text-gray-400">No withdrawal records found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-gray-50/50 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-50">
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3">Reference</th>
                  <th className="px-6 py-3">Method</th>
                  <th className="px-6 py-3">Details</th>
                  <th className="px-6 py-3 text-right">Amount</th>
                  <th className="px-6 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {withdrawals.map((tx: Transaction) => (
                  <tr key={tx._id} className="hover:bg-gray-50/40">
                    <td className="px-6 py-4 text-xs text-gray-500 whitespace-nowrap">
                      {formatDate(tx.createdAt)}
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-gray-600 whitespace-nowrap">
                      {tx.reference}
                    </td>
                    <td className="px-6 py-4 text-xs font-semibold text-gray-700 whitespace-nowrap">
                      {tx.meta?.methodName || "Withdrawal"}
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-500 max-w-[200px] truncate">
                      {tx.meta?.accountDetails
                        ? Object.entries(tx.meta.accountDetails)
                            .map(([k, v]) => `${k}: ${v}`)
                            .join(", ")
                        : "N/A"}
                    </td>
                    <td className="px-6 py-4 font-bold text-gray-800 text-right whitespace-nowrap">
                      {formatCurrency(tx.amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium uppercase w-fit ${getStatusColor(
                            tx.status
                          )}`}
                        >
                          {tx.status}
                        </span>
                        {tx.status === "rejected" && tx.rejectionReason && (
                          <span className="text-[10px] text-red-500 mt-1 italic max-w-[150px] truncate">
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
          <div className="flex justify-between items-center px-6 py-4 border-t border-gray-50 text-sm">
            <button
              disabled={historyPage === 1}
              onClick={() => setHistoryPage((p) => p - 1)}
              className="px-3 py-1 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:hover:bg-transparent"
            >
              Previous
            </button>
            <span className="text-xs text-gray-500">
              Page {historyPage} of {totalPages}
            </span>
            <button
              disabled={historyPage === totalPages}
              onClick={() => setHistoryPage((p) => p + 1)}
              className="px-3 py-1 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:hover:bg-transparent"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
