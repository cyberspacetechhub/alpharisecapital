import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { transactionApi } from "../../../api/transaction.api";
import { formatCurrency, formatDate, getStatusColor } from "../../../utils";
import type { Transaction, ApiResponse } from "../../../types";

const TYPE_OPTS = ["", "deposit", "withdrawal", "investment", "reinvestment", "loan_disbursement", "loan_repayment"];
const STATUS_OPTS = ["", "pending", "approved", "rejected", "completed"];

const typeLabel: Record<string, string> = {
  deposit: "Deposit",
  withdrawal: "Withdrawal",
  investment: "Investment",
  reinvestment: "Reinvestment",
  loan_disbursement: "Loan Out",
  loan_repayment: "Loan Repay",
};

const typeIcon: Record<string, string> = {
  deposit: "↓",
  withdrawal: "↑",
  investment: "◈",
  reinvestment: "↻",
  loan_disbursement: "⊕",
  loan_repayment: "⊖",
};

export default function TraderTransactionsPage() {
  const [type, setType] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Transaction | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["my-transactions", type, status, page],
    queryFn: () =>
      transactionApi
        .getMyTransactions({ type: type || undefined, status: status || undefined, page, limit: 20 })
        .then((r) => r.data as ApiResponse<Transaction[]> & { total: number; pages: number }),
  });

  const txs = data?.data ?? [];
  const pages = data?.pages ?? 1;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-brand">My Transactions</h1>
        <p className="text-sm text-gray-500 mt-1">Full history of your deposits, withdrawals, and investments</p>
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

      {/* List */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="divide-y divide-gray-50">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-4">
                <div className="w-10 h-10 rounded-full bg-gray-100 animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-100 rounded animate-pulse w-32" />
                  <div className="h-3 bg-gray-100 rounded animate-pulse w-48" />
                </div>
                <div className="h-4 bg-gray-100 rounded animate-pulse w-20" />
              </div>
            ))}
          </div>
        ) : txs.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-4xl mb-3">📋</p>
            <p className="text-gray-500 font-medium">No transactions yet</p>
            <p className="text-sm text-gray-400 mt-1">Your transaction history will appear here</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {txs.map((tx) => (
              <button
                key={tx._id}
                onClick={() => setSelected(tx)}
                className="w-full flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors text-left"
              >
                {/* Icon */}
                <div className="w-10 h-10 rounded-full bg-brand-light flex items-center justify-center text-brand font-bold text-lg flex-shrink-0">
                  {typeIcon[tx.type] ?? "•"}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-800 text-sm">{typeLabel[tx.type] ?? tx.type}</span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(tx.status)}`}>
                      {tx.status}
                    </span>
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5 font-mono truncate">{tx.reference}</div>
                </div>

                {/* Amount + date */}
                <div className="text-right flex-shrink-0">
                  <div className={`font-bold text-sm ${tx.type === "withdrawal" || tx.type === "loan_repayment" ? "text-red-500" : "text-brand"}`}>
                    {tx.type === "withdrawal" || tx.type === "loan_repayment" ? "-" : "+"}{formatCurrency(tx.amount)}
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">{formatDate(tx.createdAt)}</div>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
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
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-lg font-bold text-brand">Transaction Details</h2>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
            </div>

            <div className="p-6 space-y-5">
              {/* Status banner */}
              <div className={`flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium ${getStatusColor(selected.status)}`}>
                <span className="capitalize">{selected.status}</span>
                <span className="font-mono text-xs">{selected.reference}</span>
              </div>

              {/* Core details */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                {[
                  ["Type", typeLabel[selected.type] ?? selected.type],
                  ["Amount", formatCurrency(selected.amount)],
                  ["Date", formatDate(selected.createdAt)],
                  ...(selected.expiresAt ? [["Expires", formatDate(selected.expiresAt)]] : []),
                  ...(selected.reviewedAt ? [["Reviewed", formatDate(selected.reviewedAt)]] : []),
                  ...(selected.rejectionReason ? [["Rejection Reason", selected.rejectionReason]] : []),
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between text-sm">
                    <span className="text-gray-500">{label}</span>
                    <span className="font-medium text-right max-w-[60%]">{value}</span>
                  </div>
                ))}
              </div>

              {/* Plan snapshot */}
              {selected.planSnapshot && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Investment Plan</p>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    {[
                      ["Plan", selected.planSnapshot.name],
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

              {/* Meta */}
              {selected.meta && Object.keys(selected.meta).length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Details</p>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    {Object.entries(selected.meta).map(([k, v]) => (
                      <div key={k} className="flex justify-between text-sm">
                        <span className="text-gray-500 capitalize">{k.replace(/([A-Z])/g, " $1")}</span>
                        <span className="font-medium text-right max-w-[60%] break-all">{String(v ?? "—")}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={() => setSelected(null)}
                className="w-full border border-gray-200 text-gray-600 py-2.5 rounded-lg text-sm font-semibold hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
