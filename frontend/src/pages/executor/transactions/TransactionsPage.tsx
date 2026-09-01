import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { transactionApi } from "../../../api/transaction.api";
import { formatCurrency, formatDate } from "../../../utils";
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
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white">Transactions Management</h1>
        <p className="text-xs text-slate-400 mt-0.5">Review, approve, and audit platform deposits and withdrawals.</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select
          value={type}
          onChange={(e) => { setType(e.target.value); setPage(1); }}
          className="bg-[#0e1520] border border-white/10 text-white rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-[#00c076]"
        >
          {TYPE_OPTS.map((t) => (
            <option key={t} value={t}>{t ? typeLabel[t] ?? t : "All Transaction Types"}</option>
          ))}
        </select>
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="bg-[#0e1520] border border-white/10 text-white rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-[#00c076]"
        >
          {STATUS_OPTS.map((s) => (
            <option key={s} value={s}>{s ? s.charAt(0).toUpperCase() + s.slice(1) : "All Statuses"}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-[#121822] rounded-3xl border border-white/10 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead className="bg-[#0e1520] border-b border-white/10">
              <tr>
                {["Reference", "Trader", "Type", "Amount", "Status", "Date", "Action"].map((h) => (
                  <th key={h} className="px-5 py-3.5 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-300">
              {isLoading
                ? Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 7 }).map((_, j) => (
                        <td key={j} className="px-5 py-4"><div className="h-4 bg-white/5 rounded animate-pulse w-24" /></td>
                      ))}
                    </tr>
                  ))
                : txs.length === 0
                ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-16 text-center text-slate-500 text-xs">No transactions found</td>
                  </tr>
                )
                : txs.map((tx) => (
                  <tr key={tx._id} className="hover:bg-white/5 transition-colors">
                    <td className="px-5 py-4 font-mono text-xs text-slate-400">{tx.reference}</td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="font-bold text-white">{tx.user?.username ?? "—"}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{tx.user?.email ?? ""}</div>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-white/5 border border-white/10 text-slate-300">
                        {typeLabel[tx.type] ?? tx.type}
                      </span>
                    </td>
                    <td className="px-5 py-4 font-bold text-white font-mono whitespace-nowrap">{formatCurrency(tx.amount)}</td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        tx.status === "approved" || tx.status === "completed"
                          ? "bg-emerald-500/15 text-[#00e676] border border-emerald-500/30"
                          : tx.status === "pending"
                          ? "bg-amber-500/15 text-amber-300 border border-amber-500/30"
                          : "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                      }`}>
                        {tx.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-slate-400 text-xs font-mono whitespace-nowrap">{formatDate(tx.createdAt)}</td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <button
                        onClick={() => setSelected(tx)}
                        className="text-[#00e676] hover:underline text-xs font-bold cursor-pointer"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-white/10 text-xs">
            <span className="text-slate-400">Page {page} of {pages}</span>
            <div className="flex gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                className="px-3 py-1.5 border border-white/10 text-slate-300 rounded-xl disabled:opacity-40 hover:bg-white/5 cursor-pointer font-bold"
              >
                Prev
              </button>
              <button
                disabled={page === pages}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1.5 border border-white/10 text-slate-300 rounded-xl disabled:opacity-40 hover:bg-white/5 cursor-pointer font-bold"
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
          <div className="bg-[#121822] border border-white/10 rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto text-white">
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <h2 className="text-base font-bold text-white">Transaction Details</h2>
              <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-white cursor-pointer text-xl leading-none">&times;</button>
            </div>

            <div className="p-6 space-y-5">
              {/* Status banner */}
              <div className={`flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-bold ${
                selected.status === "approved" || selected.status === "completed"
                  ? "bg-emerald-500/15 text-[#00e676] border border-emerald-500/30"
                  : selected.status === "pending"
                  ? "bg-amber-500/15 text-amber-300 border border-amber-500/30"
                  : "bg-rose-500/15 text-rose-400 border border-rose-500/30"
              }`}>
                <span className="uppercase">{selected.status}</span>
                <span className="font-mono text-slate-400">{selected.reference}</span>
              </div>

              {/* Trader info */}
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Client Overview</p>
                <div className="bg-[#0e1520] border border-white/10 rounded-2xl p-4 space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Username</span>
                    <span className="font-bold text-white">{selected.user?.username ?? "—"}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Email</span>
                    <span className="font-mono text-slate-300">{selected.user?.email ?? "—"}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Available Balance</span>
                    <span className="font-bold text-[#00e676] font-mono">{selected.user?.balance != null ? formatCurrency(selected.user.balance) : "—"}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Total Deposited</span>
                    <span className="font-mono text-white">{selected.user?.totalDeposited != null ? formatCurrency(selected.user.totalDeposited) : "—"}</span>
                  </div>
                </div>
              </div>

              {/* Transaction info */}
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Transaction Details</p>
                <div className="bg-[#0e1520] border border-white/10 rounded-2xl p-4 space-y-2">
                  {[
                    ["Type", typeLabel[selected.type] ?? selected.type],
                    ["Amount", formatCurrency(selected.amount)],
                    ["Date", formatDate(selected.createdAt)],
                    ...(selected.reviewedAt ? [["Reviewed At", formatDate(selected.reviewedAt)]] : []),
                    ...(selected.rejectionReason ? [["Rejection Reason", selected.rejectionReason]] : []),
                  ].map(([label, value]) => (
                    <div key={label} className="flex justify-between text-xs">
                      <span className="text-slate-400">{label}</span>
                      <span className="font-bold text-white text-right max-w-[60%]">{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Meta (proof URL, method name, etc.) */}
              {selected.meta && Object.keys(selected.meta).length > 0 && (
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Method Payload</p>
                  <div className="bg-[#0e1520] border border-white/10 rounded-2xl p-4 space-y-2 font-mono text-xs">
                    {Object.entries(selected.meta).map(([k, v]) => (
                      <div key={k} className="flex justify-between text-xs">
                        <span className="text-slate-400 capitalize">{k.replace(/([A-Z])/g, " $1")}</span>
                        <span className="text-white font-bold text-right max-w-[60%] break-all">{String(v ?? "—")}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Plan snapshot */}
              {selected.planSnapshot && (
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Plan Details</p>
                  <div className="bg-[#0e1520] border border-white/10 rounded-2xl p-4 space-y-2">
                    {[
                      ["Name", selected.planSnapshot.name],
                      ["ROI", `${selected.planSnapshot.roiPercent}%`],
                      ["Duration", `${selected.planSnapshot.durationDays} days`],
                    ].map(([label, value]) => (
                      <div key={label} className="flex justify-between text-xs">
                        <span className="text-slate-400">{label}</span>
                        <span className="font-bold text-white">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              {isPending(selected) && (
                <div className="flex gap-3 pt-3 border-t border-white/10">
                  <button
                    onClick={() => handleApprove(selected)}
                    disabled={approveDeposit.isPending || approveWithdrawal.isPending}
                    className="flex-1 bg-[#00c076] hover:bg-[#00e676] text-[#080c10] py-3 rounded-xl text-xs font-black shadow-md shadow-[#00c076]/20 transition-all disabled:opacity-60 cursor-pointer"
                  >
                    {approveDeposit.isPending || approveWithdrawal.isPending ? "Approving…" : "Approve Transaction"}
                  </button>
                  <button
                    onClick={() => setRejectModal({ tx: selected, kind: selected.type as "deposit" | "withdrawal" })}
                    className="flex-1 bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 border border-rose-500/30 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    Reject Transaction
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-[#121822] border border-white/10 rounded-3xl shadow-2xl w-full max-w-md p-6 space-y-4 text-white">
            <h3 className="text-base font-bold text-white">Reject Transaction</h3>
            <p className="text-xs text-slate-400">
              Rejecting <span className="font-bold text-white font-mono">{rejectModal.tx.reference}</span> — {formatCurrency(rejectModal.tx.amount)}
            </p>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Reason for rejection <span className="text-rose-400">*</span></label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                placeholder="Provide a clear reason for rejection…"
                className="w-full border border-white/10 rounded-xl px-4 py-2.5 text-xs bg-[#0e1520] text-white focus:outline-none focus:border-[#00c076] resize-none"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => { setRejectModal(null); setReason(""); }}
                className="flex-1 border border-white/10 text-slate-400 py-2.5 rounded-xl text-xs font-bold hover:bg-white/5 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectSubmit}
                disabled={!reason.trim() || rejectDeposit.isPending || rejectWithdrawal.isPending}
                className="flex-1 bg-rose-500 text-white py-2.5 rounded-xl text-xs font-bold hover:bg-rose-600 disabled:opacity-60 transition-colors cursor-pointer"
              >
                {rejectDeposit.isPending || rejectWithdrawal.isPending ? "Rejecting…" : "Confirm Rejection"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
