import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { transactionApi } from "../../../api/transaction.api";
import { formatCurrency, formatDate } from "../../../utils";
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
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white">My Transactions</h1>
        <p className="text-xs text-slate-400 mt-0.5">Full audit ledger of your deposits, payouts, compounding investments, and credit disbursements.</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select
          value={type}
          onChange={(e) => { setType(e.target.value); setPage(1); }}
          className="border border-white/10 bg-[#0e1520] text-white rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-[#00c076]"
        >
          {TYPE_OPTS.map((t) => (
            <option key={t} value={t} className="bg-[#0e1520]">{t ? typeLabel[t] ?? t : "All Transaction Types"}</option>
          ))}
        </select>
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="border border-white/10 bg-[#0e1520] text-white rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-[#00c076]"
        >
          {STATUS_OPTS.map((s) => (
            <option key={s} value={s} className="bg-[#0e1520]">{s ? s.charAt(0).toUpperCase() + s.slice(1) : "All Statuses"}</option>
          ))}
        </select>
      </div>

      {/* List */}
      <div className="bg-[#121822] rounded-3xl border border-white/10 shadow-sm overflow-hidden text-white">
        {isLoading ? (
          <div className="divide-y divide-white/5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-6 py-4">
                <div className="w-10 h-10 rounded-2xl bg-white/5 animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-white/5 rounded animate-pulse w-32" />
                  <div className="h-3 bg-white/5 rounded animate-pulse w-48" />
                </div>
                <div className="h-4 bg-white/5 rounded animate-pulse w-20" />
              </div>
            ))}
          </div>
        ) : txs.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-500">
            <p className="text-3xl mb-3">📋</p>
            <p className="font-bold text-white">No transactions found</p>
            <p className="text-slate-500 mt-1">Your ledger history will appear here.</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {txs.map((tx) => (
              <button
                key={tx._id}
                onClick={() => setSelected(tx)}
                className="w-full flex items-center gap-4 px-6 py-4 hover:bg-white/5 transition-colors text-left cursor-pointer"
              >
                {/* Icon */}
                <div className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-[#00e676] font-black text-base flex-shrink-0">
                  {typeIcon[tx.type] ?? "•"}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-xs">{typeLabel[tx.type] ?? tx.type}</span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      tx.status === "approved" || tx.status === "completed"
                        ? "bg-emerald-500/15 text-[#00e676] border border-emerald-500/30"
                        : tx.status === "pending"
                        ? "bg-amber-500/15 text-amber-300 border border-amber-500/30"
                        : "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                    }`}>
                      {tx.status}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5 font-mono truncate">{tx.reference}</div>
                </div>

                {/* Amount + date */}
                <div className="text-right flex-shrink-0">
                  <div className={`font-bold font-mono text-xs ${tx.type === "withdrawal" || tx.type === "loan_repayment" ? "text-rose-400" : "text-[#00e676]"}`}>
                    {tx.type === "withdrawal" || tx.type === "loan_repayment" ? "-" : "+"}{formatCurrency(tx.amount)}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5 font-mono">{formatDate(tx.createdAt)}</div>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pages > 1 && (
          <div className="flex items-center justify-between px-6 py-3.5 border-t border-white/10 bg-[#0e1520]">
            <span className="text-[10px] font-mono text-slate-400 uppercase">Page {page} of {pages}</span>
            <div className="flex gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                className="px-3 py-1 text-xs font-bold border border-white/10 rounded-xl text-slate-300 disabled:opacity-30 hover:bg-white/5 cursor-pointer"
              >
                Prev
              </button>
              <button
                disabled={page === pages}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1 text-xs font-bold border border-white/10 rounded-xl text-slate-300 disabled:opacity-30 hover:bg-white/5 cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#121822] border border-white/10 rounded-3xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto text-white">
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">Transaction Details</h2>
              <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-white text-xl leading-none cursor-pointer">&times;</button>
            </div>

            <div className="p-6 space-y-5">
              {/* Status banner */}
              <div className={`flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-bold uppercase ${
                selected.status === "approved" || selected.status === "completed"
                  ? "bg-emerald-500/15 text-[#00e676] border border-emerald-500/30"
                  : selected.status === "pending"
                  ? "bg-amber-500/15 text-amber-300 border border-amber-500/30"
                  : "bg-rose-500/15 text-rose-400 border border-rose-500/30"
              }`}>
                <span>{selected.status}</span>
                <span className="font-mono text-[10px] font-normal">{selected.reference}</span>
              </div>

              {/* Core details */}
              <div className="bg-[#0e1520] border border-white/10 rounded-2xl p-4 space-y-2.5">
                {[
                  ["Type", typeLabel[selected.type] ?? selected.type],
                  ["Amount", formatCurrency(selected.amount)],
                  ["Date", formatDate(selected.createdAt)],
                  ...(selected.expiresAt ? [["Expires", formatDate(selected.expiresAt)]] : []),
                  ...(selected.reviewedAt ? [["Reviewed", formatDate(selected.reviewedAt)]] : []),
                  ...(selected.rejectionReason ? [["Rejection Reason", selected.rejectionReason]] : []),
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between text-xs">
                    <span className="text-slate-400">{label}</span>
                    <span className="font-mono font-bold text-white text-right max-w-[60%]">{value}</span>
                  </div>
                ))}
              </div>

              {/* Plan snapshot */}
              {selected.planSnapshot && (
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Investment Contract</p>
                  <div className="bg-[#0e1520] border border-white/10 rounded-2xl p-4 space-y-2">
                    {[
                      ["Plan", selected.planSnapshot.name],
                      ["ROI", `${selected.planSnapshot.roiPercent}%`],
                      ["Duration", `${selected.planSnapshot.durationDays} days`],
                    ].map(([label, value]) => (
                      <div key={label} className="flex justify-between text-xs">
                        <span className="text-slate-400">{label}</span>
                        <span className="font-bold text-[#00e676]">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Meta */}
              {selected.meta && Object.keys(selected.meta).length > 0 && (
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Metadata</p>
                  <div className="bg-[#0e1520] border border-white/10 rounded-2xl p-4 space-y-2">
                    {Object.entries(selected.meta).map(([k, v]) => (
                      <div key={k} className="flex justify-between text-xs">
                        <span className="text-slate-400 capitalize">{k.replace(/([A-Z])/g, " $1")}</span>
                        <span className="font-mono text-white text-right max-w-[60%] break-all">{String(v ?? "—")}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={() => setSelected(null)}
                className="w-full border border-white/10 text-slate-300 py-3 rounded-xl text-xs font-bold hover:bg-white/5 transition-colors cursor-pointer"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
