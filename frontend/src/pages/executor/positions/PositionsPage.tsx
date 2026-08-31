import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { positionApi } from "../../../api/position.api";
import { formatCurrency, formatDate } from "../../../utils";
import type { Position as PositionType } from "../../../types";

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
    <div className="absolute inset-0 bg-black/40" onClick={onClose} />
    <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto z-10">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div className="p-6">{children}</div>
    </div>
  </div>
);

const inputClass = "w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#2d6a4f] focus:border-transparent";

export default function ExecutorPositionsPage() {
  const qc = useQueryClient();
  const [forceCloseTarget, setForceCloseTarget] = useState<PositionType | null>(null);
  const [exitPrice, setExitPrice] = useState("");
  const [overridePnL, setOverridePnL] = useState("");
  const [hasOverride, setHasOverride] = useState(false);
  const [remarks, setRemarks] = useState("");
  const [serverError, setServerError] = useState("");
  const [filterStatus, setFilterStatus] = useState<"open" | "closed" | "">("open");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["executor-positions", filterStatus, page],
    queryFn: () =>
      positionApi
        .getAllPositions({ status: filterStatus || undefined, page, limit: 12 })
        .then((r) => r.data),
  });

  const positions = data?.data ?? [];
  const totalPages = data?.pages ?? 1;

  const forceCloseMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) =>
      positionApi.forceClosePosition(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["executor-positions"] });
      setForceCloseTarget(null);
      setExitPrice("");
      setOverridePnL("");
      setHasOverride(false);
      setRemarks("");
    },
    onError: (err: any) => {
      setServerError(err?.response?.data?.message ?? "Failed to close position");
    },
  });

  const handleOpenModal = (pos: PositionType) => {
    setForceCloseTarget(pos);
    setExitPrice(String(pos.currentPrice));
    setOverridePnL("");
    setHasOverride(false);
    setRemarks("");
    setServerError("");
  };

  const handleSubmitForceClose = (e: React.FormEvent) => {
    e.preventDefault();
    setServerError("");

    if (!forceCloseTarget) return;

    const payload: any = {
      exitPrice: Number(exitPrice),
    };

    if (hasOverride) {
      const pnlVal = Number(overridePnL);
      if (isNaN(pnlVal)) {
        setServerError("Please enter a valid Profit/Loss number");
        return;
      }
      payload.overridePnL = pnlVal;
    }

    if (remarks.trim()) {
      payload.remarks = remarks.trim();
    }

    forceCloseMutation.mutate({
      id: forceCloseTarget._id,
      payload,
    });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-gray-800">Margin Positions Management</h1>
          <p className="text-xs text-gray-400 mt-0.5">Oversee and force-close client open margin contracts.</p>
        </div>

        {/* Filters */}
        <div className="flex gap-2">
          {["open", "closed", ""].map((status) => (
            <button
              key={status}
              onClick={() => {
                setFilterStatus(status as any);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                filterStatus === status
                  ? "bg-[#1a3a2a] text-white border-transparent"
                  : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              {status === "" ? "ALL CONTRACTS" : status.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-gray-200 animate-pulse rounded-2xl" />
          ))}
        </div>
      ) : positions.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 py-16 text-center">
          <p className="text-sm text-gray-400">No positions found for the selected filter.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-gray-50/50 text-[10px] font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-50">
                  <th className="px-5 py-3">Client</th>
                  <th className="px-5 py-3">Asset</th>
                  <th className="px-5 py-3">Leverage</th>
                  <th className="px-5 py-3 text-right">Margin / Size</th>
                  <th className="px-5 py-3 text-right">Entry / Current</th>
                  <th className="px-5 py-3 text-right">PnL</th>
                  <th className="px-5 py-3">Opened / Expires</th>
                  <th className="px-5 py-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {positions.map((pos: PositionType) => {
                  const user: any = pos.user ?? {};
                  const isClosed = pos.status !== "open";
                  const pnl = isClosed ? pos.realizedPnL ?? 0 : pos.unrealizedPnL;

                  return (
                    <tr key={pos._id} className="hover:bg-gray-50/40">
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="font-semibold text-gray-800">{user.username ?? "Unknown"}</div>
                        <div className="text-[10px] text-gray-400 font-mono">{user.email ?? "—"}</div>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap font-medium text-gray-800">
                        {pos.pair}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span
                          className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${
                            pos.direction === "long" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                          }`}
                        >
                          {pos.direction} {pos.leverage}x
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right whitespace-nowrap">
                        <div className="font-medium text-gray-800">{formatCurrency(pos.amount)}</div>
                        <div className="text-[9px] text-gray-400">
                          Size: {formatCurrency(pos.amount * pos.leverage)}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-right font-mono text-xs text-gray-600 whitespace-nowrap">
                        <div>En: ${pos.entryPrice?.toLocaleString()}</div>
                        <div>
                          {isClosed ? "Ex: " : "Cur: "}${pos.currentPrice?.toLocaleString()}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-right whitespace-nowrap">
                        <span className={`font-bold font-mono text-xs ${pnl >= 0 ? "text-green-600" : "text-red-500"}`}>
                          {pnl >= 0 ? "+" : ""}
                          {pnl.toFixed(2)}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-xs text-gray-500 whitespace-nowrap">
                        <div>Op: {formatDate(pos.openedAt)}</div>
                        <div className={isClosed ? "text-gray-400" : "text-amber-600 font-semibold"}>
                          {isClosed ? `Cl: ${formatDate(pos.closedAt ?? pos.updatedAt ?? pos.openedAt)}` : `Ex: ${formatDate(pos.expiresAt)}`}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-center whitespace-nowrap">
                        {isClosed ? (
                          <div className="flex flex-col items-center">
                            <span className="text-[10px] bg-gray-150 text-gray-600 px-2 py-0.5 rounded-full font-bold uppercase">
                              CLOSED
                            </span>
                            {pos.meta?.remarks && (
                              <span className="text-[9px] text-gray-400 mt-1 italic max-w-[100px] truncate">
                                "{pos.meta.remarks}"
                              </span>
                            )}
                          </div>
                        ) : (
                          <button
                            onClick={() => handleOpenModal(pos)}
                            className="text-xs px-3 py-1.5 rounded-lg font-bold bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
                          >
                            Force Close
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center px-6 py-4 border-t border-gray-50 text-sm">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                className="px-3 py-1 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:hover:bg-transparent"
              >
                Previous
              </button>
              <span className="text-xs text-gray-500">
                Page {page} of {totalPages}
              </span>
              <button
                disabled={page === totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:hover:bg-transparent"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}

      {/* Force Close Modal */}
      {forceCloseTarget && (
        <Modal title="Force Close Position" onClose={() => setForceCloseTarget(null)}>
          <form onSubmit={handleSubmitForceClose} className="space-y-4" noValidate>
            <div className="p-3 bg-red-50 border border-red-100 text-xs text-red-700 rounded-xl leading-relaxed">
              Force-closing will immediately mature this contract and credit the trader's balance based on the exit terms.
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Exit Price ($)</label>
              <input
                type="number"
                required
                value={exitPrice}
                onChange={(e) => setExitPrice(e.target.value)}
                className={inputClass}
              />
            </div>

            {/* Override PnL Toggle */}
            <div className="p-3.5 bg-gray-50 border border-gray-150 rounded-2xl space-y-3">
              <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={hasOverride}
                  onChange={(e) => setHasOverride(e.target.checked)}
                  className="w-4 h-4 accent-[#2d6a4f]"
                />
                Override Profit/Loss manually
              </label>

              {hasOverride && (
                <div>
                  <label className="block text-[10px] font-semibold text-gray-500 mb-1">
                    Manual PnL Value ($)
                  </label>
                  <input
                    type="number"
                    required
                    value={overridePnL}
                    onChange={(e) => setOverridePnL(e.target.value)}
                    placeholder="e.g. +350.00 (profit) or -120.00 (loss)"
                    className={inputClass}
                  />
                  <p className="text-[10px] text-gray-400 mt-1">
                    Positive numbers = Trader profit. Negative numbers = Trader loss.
                  </p>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Remarks / Remarks</label>
              <textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Internal audit note or reason for close"
                rows={2}
                className={`${inputClass} resize-none`}
              />
            </div>

            {serverError && (
              <div className="p-3 bg-red-50 border border-red-100 text-xs text-red-600 rounded-xl">
                {serverError}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setForceCloseTarget(null)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={forceCloseMutation.isPending}
                className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-xs font-semibold hover:bg-red-600 transition-colors disabled:opacity-60 flex items-center justify-center gap-1.5"
              >
                {forceCloseMutation.isPending && (
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                )}
                Confirm Force Close
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
