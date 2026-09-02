import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { transactionApi } from "../../../api/transaction.api";
import { formatCurrency, formatDate } from "../../../utils";
import Pagination from "../../../components/common/Pagination";
import AssetLogo from "../../../components/common/AssetLogo";
import type { Transaction, User, ApiResponse } from "../../../types";

type TxWithUser = Omit<Transaction, "user"> & { user: User };

const TYPE_OPTS = ["", "deposit", "withdrawal", "investment", "reinvestment", "loan_disbursement", "loan_repayment", "bonus"];
const STATUS_OPTS = ["", "pending", "approved", "rejected", "completed", "matured"];

const typeLabel: Record<string, string> = {
  deposit: "Deposit",
  withdrawal: "Withdrawal",
  investment: "Investment",
  reinvestment: "Reinvestment",
  loan_disbursement: "Loan Out",
  loan_repayment: "Loan Repay",
  bonus: "Referral Bonus",
};

export default function ExecutorTransactionsPage() {
  const qc = useQueryClient();
  const [type, setType] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<TxWithUser | null>(null);
  const [rejectModal, setRejectModal] = useState<{ tx: TxWithUser; kind: "deposit" | "withdrawal" } | null>(null);
  const [reason, setReason] = useState("");
  const [viewMode, setViewMode] = useState<"auto" | "table" | "cards">("auto");

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-white">Transactions Management</h1>
          <p className="text-xs text-slate-400 mt-0.5">Review, approve, and audit platform deposits and withdrawals.</p>
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

      {/* Transactions Container */}
      <div className="bg-[#121822] rounded-3xl border border-white/10 shadow-sm overflow-hidden text-white">
        {isLoading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-16 bg-white/5 animate-pulse rounded-2xl" />
            ))}
          </div>
        ) : txs.length === 0 ? (
          <div className="p-16 text-center text-slate-500 text-xs">
            <p className="text-3xl mb-3">📋</p>
            <p className="font-bold text-white">No transactions found</p>
            <p className="text-slate-500 mt-1">Transactions matching your criteria will show here.</p>
          </div>
        ) : (
          <div>
            {/* ── Responsive Card Feed (Visible in Cards mode OR on mobile in Auto mode) ── */}
            <div className={`p-4 sm:p-6 space-y-3 ${viewMode === "table" ? "hidden" : viewMode === "cards" ? "block" : "block md:hidden"}`}>
              {txs.map((tx) => {
                const isOutflow = tx.type === "withdrawal" || tx.type === "loan_repayment" || tx.type === "admin_debit";
                const isSuccess = tx.status === "approved" || tx.status === "completed";
                const isPendingTx = tx.status === "pending";
                const methodName = tx.meta?.methodName || tx.planSnapshot?.name;

                return (
                  <div
                    key={tx._id}
                    className="p-4 rounded-2xl bg-[#0e1520] border border-white/10 hover:border-white/20 transition-all space-y-3"
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
                            <span className="font-bold text-white text-xs">
                              {typeLabel[tx.type] ?? tx.type}
                            </span>
                            {methodName && (
                              <span className="text-[10px] text-slate-400 bg-white/5 px-2 py-0.5 rounded-full border border-white/5">
                                {methodName}
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-400 font-mono mt-0.5">{tx.reference}</p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className={`font-bold font-mono text-sm ${isOutflow ? "text-rose-400" : "text-[#00e676]"}`}>
                          {isOutflow ? "-" : "+"}{formatCurrency(tx.amount)}
                        </div>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase mt-0.5 ${
                          isSuccess
                            ? "bg-emerald-500/15 text-[#00e676] border border-emerald-500/30"
                            : isPendingTx
                            ? "bg-amber-500/15 text-amber-300 border border-amber-500/30"
                            : "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                        }`}>
                          {isSuccess ? "Successful" : tx.status}
                        </span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-white/5 flex items-center justify-between gap-2 text-[11px] text-slate-400">
                      <div className="truncate">
                        <span className="font-bold text-slate-300">{tx.user?.username ?? "—"}</span>
                        <span className="text-[10px] font-mono text-slate-500 ml-1.5">({tx.user?.email ?? ""})</span>
                      </div>
                      <span className="font-mono text-[10px] text-slate-500 shrink-0">{formatDate(tx.createdAt)}</span>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <button
                        onClick={() => setSelected(tx)}
                        className="text-xs font-bold text-[#00e676] hover:underline cursor-pointer"
                      >
                        Inspect Full Details →
                      </button>
                      {isPending(tx) && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleApprove(tx)}
                            className="px-2.5 py-1 bg-[#00c076] hover:bg-[#00e676] text-[#080c10] text-[11px] font-black rounded-lg transition-all cursor-pointer"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => setRejectModal({ tx, kind: tx.type as "deposit" | "withdrawal" })}
                            className="px-2.5 py-1 bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 border border-rose-500/30 text-[11px] font-bold rounded-lg transition-all cursor-pointer"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ── Table View (Visible in Table mode OR on md+ screens in Auto mode) ── */}
            <div className={`overflow-x-auto ${viewMode === "cards" ? "hidden" : viewMode === "table" ? "block" : "hidden md:block"}`}>
              <table className="w-full text-xs text-left border-collapse">
                <thead className="bg-[#0e1520] border-b border-white/10">
                  <tr>
                    {["Asset / Gateway", "Reference", "Trader", "Type", "Amount", "Status", "Date", "Action"].map((h) => (
                      <th key={h} className="px-5 py-3.5 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-slate-300">
                  {txs.map((tx) => {
                    const isOutflow = tx.type === "withdrawal" || tx.type === "loan_repayment" || tx.type === "admin_debit";
                    const isSuccess = tx.status === "approved" || tx.status === "completed";
                    const isPendingTx = tx.status === "pending";
                    const methodName = tx.meta?.methodName || tx.planSnapshot?.name;

                    return (
                      <tr key={tx._id} className="hover:bg-white/5 transition-colors">
                        <td className="px-5 py-4 whitespace-nowrap">
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
                        <td className="px-5 py-4 font-mono text-xs text-slate-400 whitespace-nowrap">{tx.reference}</td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <div className="font-bold text-white">{tx.user?.username ?? "—"}</div>
                          <div className="text-[10px] text-slate-500 font-mono">{tx.user?.email ?? ""}</div>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-white/5 border border-white/10 text-slate-300">
                            {typeLabel[tx.type] ?? tx.type}
                          </span>
                        </td>
                        <td className={`px-5 py-4 font-bold font-mono whitespace-nowrap ${isOutflow ? "text-rose-400" : "text-[#00e676]"}`}>
                          {isOutflow ? "-" : "+"}{formatCurrency(tx.amount)}
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            isSuccess
                              ? "bg-emerald-500/15 text-[#00e676] border border-emerald-500/30"
                              : isPendingTx
                              ? "bg-amber-500/15 text-amber-300 border border-amber-500/30"
                              : "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                          }`}>
                            {isSuccess ? "Successful" : tx.status}
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
          <div className="bg-[#121822] border border-white/10 rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto text-white">
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <div className="flex items-center gap-3">
                <AssetLogo
                  image={selected.meta?.methodImage}
                  name={selected.meta?.methodName || selected.planSnapshot?.name}
                  type={selected.type}
                  size="md"
                />
                <div>
                  <h2 className="text-sm font-bold text-white uppercase tracking-wider">Transaction Overview</h2>
                  <p className="text-[10px] text-slate-400 font-mono">{selected.reference}</p>
                </div>
              </div>
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
                <span className="uppercase">{selected.status === "approved" || selected.status === "completed" ? "Successful" : selected.status}</span>
                <span className="font-mono font-bold text-sm">
                  {selected.type === "withdrawal" || selected.type === "loan_repayment" ? "-" : "+"}
                  {formatCurrency(selected.amount)}
                </span>
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
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Transaction Parameters</p>
                <div className="bg-[#0e1520] border border-white/10 rounded-2xl p-4 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400">Gateway / Method</span>
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
                    ...(selected.reviewedAt ? [["Reviewed At", formatDate(selected.reviewedAt)]] : []),
                    ...(selected.rejectionReason ? [["Rejection Reason", selected.rejectionReason]] : []),
                  ].map(([label, value]) => (
                    <div key={label} className="flex justify-between text-xs">
                      <span className="text-slate-400">{label}</span>
                      <span className="font-bold text-white text-right max-w-[60%] truncate">{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment Proof / Receipt Box */}
              {(selected.meta?.proofUrl || (selected as any).proofUrl) && (
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
                    <span>Payment Proof Document</span>
                    <span className="text-[9px] font-bold text-[#00c076] bg-[#00c076]/15 border border-[#00c076]/30 px-2 py-0.5 rounded-full">
                      Attached
                    </span>
                  </p>
                  <div className="bg-[#0e1520] border border-white/10 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={String(selected.meta?.proofUrl || (selected as any).proofUrl)}
                        alt="Proof document"
                        className="w-16 h-16 rounded-xl object-cover border border-white/10 bg-black/40 shrink-0"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = "none";
                        }}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-white">Payment Receipt / Screenshot</p>
                        <p className="text-[10px] font-mono text-slate-400 break-all truncate">
                          {String(selected.meta?.proofUrl || (selected as any).proofUrl)}
                        </p>
                      </div>
                    </div>
                    <a
                      href={String(selected.meta?.proofUrl || (selected as any).proofUrl)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2 bg-[#00c076]/15 hover:bg-[#00c076]/25 border border-[#00c076]/30 text-[#00e676] text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all block text-center"
                    >
                      <svg className="w-3.5 h-3.5 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      Open Full Size Proof ↗
                    </a>
                  </div>
                </div>
              )}

              {/* Destination Details if withdrawal */}
              {selected.meta?.accountDetails && Object.keys(selected.meta.accountDetails).length > 0 && (
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Destination Credentials</p>
                  <div className="bg-[#0e1520] border border-white/10 rounded-2xl p-4 space-y-2 font-mono text-xs">
                    {Object.entries(selected.meta.accountDetails as Record<string, string>).map(([k, v]) => (
                      <div key={k} className="flex justify-between text-xs">
                        <span className="text-slate-400">{k}</span>
                        <span className="text-white font-bold text-right max-w-[60%] break-all">{v}</span>
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
