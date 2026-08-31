import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { transactionApi } from "../../../api/transaction.api";
import { formatCurrency, formatDate, getStatusColor } from "../../../utils";
import type { Transaction, User, ApiResponse } from "../../../types";

type TxWithUser = Omit<Transaction, "user"> & { user: User };

const TYPE_OPTS = ["", "deposit", "withdrawal", "investment", "loan_disbursement", "loan_repayment"];
const STATUS_OPTS = ["", "pending", "approved", "rejected", "completed"];

const typeLabel: Record<string, string> = {
  deposit: "Deposit",
  withdrawal: "Withdrawal",
  investment: "Investment",
  reinvestment: "Reinvestment",
  loan_disbursement: "Loan Out",
  loan_repayment: "Loan Repay",
};

export default function ExecutorTransactionsPage() {
  const qc = useQueryClient();
  const [type, setType] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<TxWithUser | null>(null);
  const [rejectModal, setRejectModal] = useState<{ tx: TxWithUser; kind: "deposit" | "withdrawal" } | null>(null);
  const [reason, setReason] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["exec-transactions", type, status, page],
    queryFn: () =>
      transactionApi
        .getAllTransactions({ type: type || undefined, status: status || undefined, page, limit: 20 })
        .then((r) => r.data as ApiResponse<TxWithUser[]> & { total: number; pages: number }),
  });

  const txs = data?.data ?? [];
  const pages = data?.pages ?? 1;

  const approveDeposit = useMutation({
    mutationFn: (id: string) => transactionApi.approveDeposit(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["exec-transactions"] }); setSelected(null); },
  });
  const rejectDeposit = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => transactionApi.rejectDeposit(id, reason),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["exec-transactions"] }); setRejectModal(null); setReason(""); setSelected(null); },
  });
  const approveWithdrawal = useMutation({
    mutationFn: (id: string) => transactionApi.approveWithdrawal(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["exec-transactions"] }); setSelected(null); },
  });
  const rejectWithdrawal = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => transactionApi.rejectWithdrawal(id, reason),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["exec-transactions"] }); setRejectModal(null); setReason(""); setSelected(null); },
  });

  const handleApprove = (tx: TxWithUser) => {
    if (tx.type === "deposit") approveDeposit.mutate(tx._id);
    else if (tx.type === "withdrawal") approveWithdrawal.mutate(tx._id);
  };

  const handleRejectSubmit = () => {
    if (!rejectModal || !reason.trim()) return;
    if (rejectModal.kind === "deposit") rejectDeposit.mutate({ id: rejectModal.tx._id, reason });
    else rejectWithdrawal.mutate({ id: rejectModal.tx._id, reason });
  };

  const isPending = (tx: TxWithUser) => tx.status === "pending" && (tx.type === "deposit" || tx.type === "withdrawal");

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-brand">Transactions</h1>
        <p className="text-sm text-gray-500 mt-1">Review and manage all platform transactions</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select
          value={type}
          onChange={(e) => { setType(e.target.value); setPage(1); }}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30"
        >
          {TYPE_OPTS.map((t) => (
            <option key={t} value={t}>{t ? typeLabel[t] ?? t : "All Types"}</option>
          ))}
        </select>
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30"
        >
          {STATUS_OPTS.map((s) => (
            <option key={s} value={s}>{s ? s.charAt(0).toUpperCase() + s.slice(1) : "All Statuses"}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {["Reference", "Trader", "Type", "Amount", "Status", "Date", ""].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading
                ? Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 7 }).map((_, j) => (
                        <td key={j} className="px-4 py-3"><div className="h-4 bg-gray-100 rounded animate-pulse w-24" /></td>
                      ))}
                    </tr>
                  ))
                : txs.length === 0
                ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-gray-400">No transactions found</td>
                  </tr>
                )
                : txs.map((tx) => (
                  <tr key={tx._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-gray-600">{tx.reference}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-800">{tx.user?.username ?? "—"}</div>
                      <div className="text-xs text-gray-400">{tx.user?.email ?? ""}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-brand-light text-brand">
                        {typeLabel[tx.type] ?? tx.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-gray-800">{formatCurrency(tx.amount)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(tx.status)}`}>
                        {tx.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{formatDate(tx.createdAt)}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setSelected(tx)}
                        className="text-brand hover:underline text-xs font-medium"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <span className="text-xs text-gray-500">Page {page} of {pages}</span>
            <div className="flex gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                className="px-3 py-1 text-xs border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50"
              >
                Prev
              </button>
              <button
                disabled={page === pages}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1 text-xs border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-lg font-bold text-brand">Transaction Details</h2>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
            </div>

            <div className="p-6 space-y-5">
              {/* Status banner */}
              <div className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium ${getStatusColor(selected.status)}`}>
                <span className="capitalize">{selected.status}</span>
                <span className="ml-auto font-mono text-xs">{selected.reference}</span>
              </div>

              {/* Trader info */}
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Trader</p>
                <div className="bg-gray-50 rounded-lg p-4 space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Username</span>
                    <span className="font-medium">{selected.user?.username ?? "—"}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Email</span>
                    <span className="font-medium">{selected.user?.email ?? "—"}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Balance</span>
                    <span className="font-medium">{selected.user?.balance != null ? formatCurrency(selected.user.balance) : "—"}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Total Deposited</span>
                    <span className="font-medium">{selected.user?.totalDeposited != null ? formatCurrency(selected.user.totalDeposited) : "—"}</span>
                  </div>
                </div>
              </div>

              {/* Transaction info */}
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Transaction</p>
                <div className="bg-gray-50 rounded-lg p-4 space-y-1">
                  {[
                    ["Type", typeLabel[selected.type] ?? selected.type],
                    ["Amount", formatCurrency(selected.amount)],
                    ["Date", formatDate(selected.createdAt)],
                    ...(selected.reviewedAt ? [["Reviewed At", formatDate(selected.reviewedAt)]] : []),
                    ...(selected.rejectionReason ? [["Rejection Reason", selected.rejectionReason]] : []),
                  ].map(([label, value]) => (
                    <div key={label} className="flex justify-between text-sm">
                      <span className="text-gray-500">{label}</span>
                      <span className="font-medium text-right max-w-[60%]">{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Meta (proof URL, method name, etc.) */}
              {selected.meta && Object.keys(selected.meta).length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Additional Info</p>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-1">
                    {Object.entries(selected.meta).map(([k, v]) => (
                      <div key={k} className="flex justify-between text-sm">
                        <span className="text-gray-500 capitalize">{k.replace(/([A-Z])/g, " $1")}</span>
                        <span className="font-medium text-right max-w-[60%] break-all">{String(v ?? "—")}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Plan snapshot */}
              {selected.planSnapshot && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Plan</p>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-1">
                    {[
                      ["Name", selected.planSnapshot.name],
                      ["ROI", `${selected.planSnapshot.roiPercent}%`],
                      ["Duration", `${selected.planSnapshot.durationDays} days`],
                    ].map(([label, value]) => (
                      <div key={label} className="flex justify-between text-sm">
                        <span className="text-gray-500">{label}</span>
                        <span className="font-medium">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              {isPending(selected) && (
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => handleApprove(selected)}
                    disabled={approveDeposit.isPending || approveWithdrawal.isPending}
                    className="flex-1 bg-brand text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-brand-accent transition-colors disabled:opacity-60"
                  >
                    {approveDeposit.isPending || approveWithdrawal.isPending ? "Approving…" : "Approve"}
                  </button>
                  <button
                    onClick={() => setRejectModal({ tx: selected, kind: selected.type as "deposit" | "withdrawal" })}
                    className="flex-1 border border-red-200 text-red-600 py-2.5 rounded-lg text-sm font-semibold hover:bg-red-50 transition-colors"
                  >
                    Reject
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectModal && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
            <h3 className="text-lg font-bold text-gray-800">Reject Transaction</h3>
            <p className="text-sm text-gray-500">
              Rejecting <span className="font-semibold">{rejectModal.tx.reference}</span> — {formatCurrency(rejectModal.tx.amount)}
            </p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Reason <span className="text-red-500">*</span></label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                placeholder="Provide a reason for rejection…"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-300 resize-none"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => { setRejectModal(null); setReason(""); }}
                className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-lg text-sm font-semibold hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectSubmit}
                disabled={!reason.trim() || rejectDeposit.isPending || rejectWithdrawal.isPending}
                className="flex-1 bg-red-600 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-red-700 disabled:opacity-60"
              >
                {rejectDeposit.isPending || rejectWithdrawal.isPending ? "Rejecting…" : "Confirm Reject"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
