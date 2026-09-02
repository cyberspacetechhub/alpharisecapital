import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { transactionApi } from "../../../api/transaction.api";
import { formatCurrency, formatDate } from "../../../utils";
import Pagination from "../../../components/common/Pagination";
import AssetLogo from "../../../components/common/AssetLogo";
import type { Transaction, ApiResponse } from "../../../types";

const TYPE_OPTS = ["", "deposit", "withdrawal", "investment", "reinvestment", "loan_disbursement", "loan_repayment", "bonus"];
const STATUS_OPTS = ["", "pending", "approved", "rejected", "completed", "matured"];

const typeLabel: Record<string, string> = {
  deposit: "Deposit",
  withdrawal: "Withdrawal",
  investment: "Investment",
  reinvestment: "Reinvestment",
  loan_disbursement: "Loan Disbursement",
  loan_repayment: "Loan Repayment",
  bonus: "Referral Bonus",
};

export default function TraderTransactionsPage() {
  const [type, setType] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Transaction | null>(null);
  const [viewMode, setViewMode] = useState<"auto" | "cards" | "table">("auto");

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-white">My Transactions</h1>
          <p className="text-xs text-slate-400 mt-0.5">Full audit ledger of your deposits, payouts, compounding investments, and credit disbursements.</p>
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-1 bg-[#121822] p-1 rounded-xl border border-white/10 text-xs w-fit">
          <button
            type="button"
            onClick={() => setViewMode("auto")}
            className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all cursor-pointer ${
              viewMode === "auto" ? "bg-white/10 text-white" : "text-slate-400 hover:text-white"
            }`}
          >
            Auto
          </button>
          <button
            type="button"
            onClick={() => setViewMode("cards")}
            className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all cursor-pointer ${
              viewMode === "cards" ? "bg-white/10 text-white" : "text-slate-400 hover:text-white"
            }`}
          >
            Cards
          </button>
          <button
            type="button"
            onClick={() => setViewMode("table")}
            className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all cursor-pointer ${
              viewMode === "table" ? "bg-white/10 text-white" : "text-slate-400 hover:text-white"
            }`}
          >
            Table
          </button>
        </div>
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

      {/* Transactions Container */}
      <div className="bg-[#121822] rounded-3xl border border-white/10 shadow-sm overflow-hidden text-white">
        {isLoading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-16 bg-white/5 animate-pulse rounded-2xl" />
            ))}
          </div>
        ) : txs.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-500">
            <p className="text-3xl mb-3">📋</p>
            <p className="font-bold text-white">No transactions found</p>
            <p className="text-slate-500 mt-1">Your ledger history will appear here.</p>
          </div>
        ) : (
          <div>
            {/* ── Responsive Card Feed (Visible in Cards mode OR on mobile in Auto mode) ── */}
            <div className={`p-4 sm:p-6 space-y-3 ${viewMode === "table" ? "hidden" : viewMode === "cards" ? "block" : "block md:hidden"}`}>
              {txs.map((tx) => {
                const isOutflow = tx.type === "withdrawal" || tx.type === "loan_repayment" || tx.type === "admin_debit";
                const isSuccess = tx.status === "approved" || tx.status === "completed";
                const isPending = tx.status === "pending";
                const methodName = tx.meta?.methodName || tx.planSnapshot?.name;

                return (
                  <button
                    key={tx._id}
                    onClick={() => setSelected(tx)}
                    className="w-full p-4 rounded-2xl bg-[#0e1520] border border-white/10 hover:border-white/20 transition-all text-left space-y-3 cursor-pointer group"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <AssetLogo
                          image={tx.meta?.methodImage}
                          name={methodName}
                          type={tx.type}
                          size="md"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-white text-xs group-hover:text-[#00e676] transition-colors">
                              {typeLabel[tx.type] ?? tx.type}
                            </span>
                            {methodName && (
                              <span className="text-[10px] text-slate-400 bg-white/5 px-2 py-0.5 rounded-full border border-white/5">
                                {methodName}
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-400 font-mono mt-0.5 truncate">{tx.reference}</p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className={`font-bold font-mono text-sm ${isOutflow ? "text-rose-400" : "text-[#00e676]"}`}>
                          {isOutflow ? "-" : "+"}{formatCurrency(tx.amount)}
                        </div>
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

                    <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-400">
                      <span className="text-[10px] font-mono text-slate-500">{formatDate(tx.createdAt)}</span>
                      <span className="text-[11px] text-[#00e676] font-bold">Inspect Details →</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* ── Table View (Visible in Table mode OR on md+ screens in Auto mode) ── */}
            <div className={`overflow-x-auto ${viewMode === "cards" ? "hidden" : viewMode === "table" ? "block" : "hidden md:block"}`}>
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-[#0e1520] text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-white/10">
                    <th className="px-6 py-3.5">Method / Asset</th>
                    <th className="px-6 py-3.5">Type</th>
                    <th className="px-6 py-3.5">Reference</th>
                    <th className="px-6 py-3.5 text-right">Amount</th>
                    <th className="px-6 py-3.5">Status</th>
                    <th className="px-6 py-3.5">Date</th>
                    <th className="px-6 py-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-slate-300">
                  {txs.map((tx) => {
                    const isOutflow = tx.type === "withdrawal" || tx.type === "loan_repayment" || tx.type === "admin_debit";
                    const isSuccess = tx.status === "approved" || tx.status === "completed";
                    const isPending = tx.status === "pending";
                    const methodName = tx.meta?.methodName || tx.planSnapshot?.name;

                    return (
                      <tr key={tx._id} className="hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <AssetLogo
                              image={tx.meta?.methodImage}
                              name={methodName}
                              type={tx.type}
                              size="sm"
                            />
                            <div>
                              <span className="font-bold text-white text-xs">{methodName || typeLabel[tx.type] || tx.type}</span>
                              {methodName && <div className="text-[10px] text-slate-500 font-mono">{typeLabel[tx.type] ?? tx.type}</div>}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-white/5 border border-white/10 text-slate-300">
                            {typeLabel[tx.type] ?? tx.type}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-mono text-xs text-slate-400 whitespace-nowrap">
                          {tx.reference}
                        </td>
                        <td className={`px-6 py-4 font-bold font-mono text-xs text-right whitespace-nowrap ${isOutflow ? "text-rose-400" : "text-[#00e676]"}`}>
                          {isOutflow ? "-" : "+"}{formatCurrency(tx.amount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            isSuccess
                              ? "bg-emerald-500/15 text-[#00e676] border border-emerald-500/30"
                              : isPending
                              ? "bg-amber-500/15 text-amber-300 border border-amber-500/30"
                              : "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                          }`}>
                            {isSuccess ? "Successful" : tx.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-400 whitespace-nowrap font-mono">
                          {formatDate(tx.createdAt)}
                        </td>
                        <td className="px-6 py-4 text-right whitespace-nowrap">
                          <button
                            onClick={() => setSelected(tx)}
                            className="text-[#00e676] hover:underline text-xs font-bold cursor-pointer"
                          >
                            Inspect
                          </button>
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
        <Pagination
          currentPage={page}
          totalPages={pages}
          totalItems={data?.total}
          pageSize={20}
          onPageChange={setPage}
        />
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
              {/* Method / Asset Header Card */}
              <div className="flex items-center gap-3.5 p-4 rounded-2xl bg-[#0e1520] border border-white/10">
                <AssetLogo
                  image={selected.meta?.methodImage}
                  name={selected.meta?.methodName || selected.planSnapshot?.name}
                  type={selected.type}
                  size="lg"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-bold text-white truncate">
                      {selected.meta?.methodName || selected.planSnapshot?.name || typeLabel[selected.type] || selected.type}
                    </h3>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase bg-white/5 border border-white/10 text-slate-300">
                      {typeLabel[selected.type] ?? selected.type}
                    </span>
                  </div>
                  <p className="text-[10px] font-mono text-slate-400 mt-0.5">{selected.reference}</p>
                </div>
              </div>

              {/* Status banner */}
              <div className={`flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-bold uppercase ${
                selected.status === "approved" || selected.status === "completed"
                  ? "bg-emerald-500/15 text-[#00e676] border border-emerald-500/30"
                  : selected.status === "pending"
                  ? "bg-amber-500/15 text-amber-300 border border-amber-500/30"
                  : "bg-rose-500/15 text-rose-400 border border-rose-500/30"
              }`}>
                <span>{selected.status === "approved" || selected.status === "completed" ? "Successful" : selected.status}</span>
                <span className="font-mono text-sm font-black">
                  {selected.type === "withdrawal" || selected.type === "loan_repayment" ? "-" : "+"}
                  {formatCurrency(selected.amount)}
                </span>
              </div>

              {/* Core details */}
              <div className="bg-[#0e1520] border border-white/10 rounded-2xl p-4 space-y-2.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Method / Gateway</span>
                  <div className="flex items-center gap-1.5 font-bold text-white">
                    <AssetLogo
                      image={selected.meta?.methodImage}
                      name={selected.meta?.methodName || selected.planSnapshot?.name}
                      type={selected.type}
                      size="sm"
                    />
                    <span>{selected.meta?.methodName ? String(selected.meta.methodName) : selected.planSnapshot?.name || typeLabel[selected.type] || selected.type}</span>
                  </div>
                </div>

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
                    <span className="font-mono font-bold text-white text-right max-w-[60%] truncate">{value}</span>
                  </div>
                ))}
              </div>

              {/* Proof / Receipt if present */}
              {selected.meta?.proofUrl && (
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Payment Receipt / Proof</p>
                  <a
                    href={String(selected.meta.proofUrl)}
                    target="_blank"
                    rel="noreferrer"
                    className="block rounded-2xl border border-white/10 overflow-hidden bg-[#0e1520] hover:border-[#00c076]/50 transition-colors p-2"
                  >
                    <img src={String(selected.meta.proofUrl)} alt="Payment Proof" className="max-h-48 w-full object-contain rounded-xl" />
                    <p className="text-[10px] text-center text-[#00e676] font-bold mt-1.5">View Full Image ↗</p>
                  </a>
                </div>
              )}

              {/* Plan snapshot */}
              {selected.planSnapshot && (
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Investment Contract</p>
                  <div className="bg-[#0e1520] border border-white/10 rounded-2xl p-4 space-y-2">
                    {[
                      ["Plan", selected.planSnapshot.name],
                      ["ROI", `${selected.planSnapshot.roiPercent}% Daily`],
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

              {/* Account Details if withdrawal */}
              {selected.meta?.accountDetails && Object.keys(selected.meta.accountDetails).length > 0 && (
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Destination Credentials</p>
                  <div className="bg-[#0e1520] border border-white/10 rounded-2xl p-4 space-y-2">
                    {Object.entries(selected.meta.accountDetails as Record<string, string>).map(([k, v]) => (
                      <div key={k} className="flex justify-between text-xs">
                        <span className="text-slate-400">{k}</span>
                        <span className="font-mono text-white text-right max-w-[60%] break-all font-bold">{v}</span>
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
