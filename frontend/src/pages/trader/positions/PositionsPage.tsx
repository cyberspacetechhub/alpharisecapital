import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { positionApi } from "../../../api/position.api";
import { userApi } from "../../../api/user.api";
import { formatCurrency, formatDate } from "../../../utils";
import type { Position as PositionType } from "../../../types";

const PAIRS = ["BTC/USDT", "ETH/USDT", "SOL/USDT", "BNB/USDT", "XRP/USDT"];
const DURATIONS = [
  { label: "5 Min", value: 5 },
  { label: "15 Min", value: 15 },
  { label: "1 Hour", value: 60 },
  { label: "4 Hours", value: 240 },
  { label: "24 Hours", value: 1440 },
];

export default function TraderPositionsPage() {
  const qc = useQueryClient();
  const [selectedPair, setSelectedPair] = useState("BTC/USDT");
  const [direction, setDirection] = useState<"long" | "short">("long");
  const [amount, setAmount] = useState("");
  const [leverage, setLeverage] = useState(5);
  const [stopLoss, setStopLoss] = useState("");
  const [takeProfit, setTakeProfit] = useState("");
  const [duration, setDuration] = useState(15);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Live Price ticks
  const [livePrices, setLivePrices] = useState<Record<string, number>>({
    "BTC/USDT": 78250.5,
    "ETH/USDT": 2230.25,
    "SOL/USDT": 140.4,
    "BNB/USDT": 560.8,
    "XRP/USDT": 1.90,
  });

  useEffect(() => {
    const fetchLivePrices = async () => {
      try {
        const res = await fetch("https://api.binance.com/api/v3/ticker/price");
        if (!res.ok) return;
        const data = await res.json();
        
        const priceMap: Record<string, number> = {};
        if (Array.isArray(data)) {
          data.forEach((item: any) => {
            priceMap[item.symbol] = parseFloat(item.price);
          });

          setLivePrices((prev) => {
            const next = { ...prev };
            Object.keys(next).forEach((pair) => {
              const binanceSymbol = pair.replace("/", "");
              if (priceMap[binanceSymbol]) {
                next[pair] = priceMap[binanceSymbol];
              }
            });
            return next;
          });
        }
      } catch (err) {
        console.error("Failed to query live crypto rates:", err);
      }
    };

    fetchLivePrices();
    const fetchInterval = setInterval(fetchLivePrices, 20000); // Poll rates every 20 seconds
    
    const tickInterval = setInterval(() => {
      setLivePrices((prev) => {
        const next = { ...prev };
        Object.keys(next).forEach((pair) => {
          const changePercent = (Math.random() - 0.5) * 0.0006;
          next[pair] = parseFloat((next[pair] * (1 + changePercent)).toFixed(4));
        });
        return next;
      });
    }, 3000);

    return () => {
      clearInterval(fetchInterval);
      clearInterval(tickInterval);
    };
  }, []);

  // Queries
  const { data: userData } = useQuery({
    queryKey: ["user-me"],
    queryFn: () => userApi.getMe().then((r) => r.data.data),
  });

  const { data: positionsData, isLoading: positionsLoading } = useQuery<PositionType[]>({
    queryKey: ["my-positions"],
    queryFn: () => positionApi.getMyPositions().then((r) => r.data.data),
  });

  const user = userData ?? { balance: 0 };
  const positions = positionsData ?? [];
  const openPositions = positions.filter((p) => p.status === "open");
  const closedPositions = positions.filter((p) => p.status !== "open");

  // Mutations
  const openMutation = useMutation({
    mutationFn: (payload: any) => positionApi.openPosition(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["user-me"] });
      qc.invalidateQueries({ queryKey: ["my-positions"] });
      setAmount("");
      setStopLoss("");
      setTakeProfit("");
      setSuccessMsg("Trading position opened successfully!");
      setTimeout(() => setSuccessMsg(""), 5000);
    },
    onError: (err: any) => {
      setErrorMsg(err?.response?.data?.message ?? "Failed to open position");
    },
  });

  const closeMutation = useMutation({
    mutationFn: (id: string) => positionApi.closeMyPosition(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["user-me"] });
      qc.invalidateQueries({ queryKey: ["my-positions"] });
    },
  });

  const handleOpenPosition = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    const tradeAmt = Number(amount);
    if (isNaN(tradeAmt) || tradeAmt <= 0) {
      setErrorMsg("Please enter a valid amount");
      return;
    }

    if (tradeAmt > user.balance) {
      setErrorMsg("Insufficient available balance");
      return;
    }

    const payload: any = {
      pair: selectedPair,
      direction,
      amount: tradeAmt,
      leverage,
      durationMinutes: duration,
      entryPrice: livePrices[selectedPair],
    };

    if (stopLoss) payload.stopLoss = Number(stopLoss);
    if (takeProfit) payload.takeProfit = Number(takeProfit);

    openMutation.mutate(payload);
  };

  // Live PnL calculation helper
  const getLivePnL = (pos: PositionType) => {
    const currentPrice = livePrices[pos.pair] ?? pos.currentPrice;
    const diff = pos.direction === "long" ? currentPrice - pos.entryPrice : pos.entryPrice - currentPrice;
    const pnl = (diff / pos.entryPrice) * pos.amount * pos.leverage;
    return pnl;
  };

  const getLivePnLPercent = (pos: PositionType) => {
    const currentPrice = livePrices[pos.pair] ?? pos.currentPrice;
    const diff = pos.direction === "long" ? currentPrice - pos.entryPrice : pos.entryPrice - currentPrice;
    return (diff / pos.entryPrice) * pos.leverage * 100;
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white">Margin & Leverage Trading</h1>
        <p className="text-xs text-slate-400 mt-0.5">Open institutional margin contracts with real-time crypto index settlement.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Form Panel */}
        <div className="bg-[#121822] rounded-3xl border border-white/10 p-6 shadow-sm h-fit text-white">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">New Position</h2>
            <span className="text-xs text-slate-400 font-mono">
              Balance: <strong className="text-[#00c076]">{formatCurrency(user.balance)}</strong>
            </span>
          </div>

          <form onSubmit={handleOpenPosition} className="space-y-4" noValidate>
            {/* Pairs */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Asset Pair</label>
              <div className="grid grid-cols-3 gap-1.5">
                {PAIRS.map((pair) => (
                  <button
                    key={pair}
                    type="button"
                    onClick={() => setSelectedPair(pair)}
                    className={`py-2 text-xs rounded-xl font-bold border transition-all cursor-pointer ${
                      selectedPair === pair
                        ? "bg-[#00c076] text-[#080c10] border-transparent shadow-sm"
                        : "bg-[#0e1520] border-white/10 text-slate-300 hover:bg-white/5"
                    }`}
                  >
                    <div>{pair.split("/")[0]}</div>
                    <div className="text-[9px] font-mono mt-0.5 opacity-80">
                      ${livePrices[pair]?.toLocaleString()}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Direction */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Order Type</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setDirection("long")}
                  className={`py-2.5 rounded-xl font-black text-xs transition-all border flex items-center justify-center gap-1.5 cursor-pointer ${
                    direction === "long"
                      ? "bg-emerald-500/20 text-[#00e676] border-emerald-500/40"
                      : "bg-[#0e1520] border-white/10 text-slate-400 hover:bg-white/5"
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00e676]" />
                  LONG (BUY)
                </button>
                <button
                  type="button"
                  onClick={() => setDirection("short")}
                  className={`py-2.5 rounded-xl font-black text-xs transition-all border flex items-center justify-center gap-1.5 cursor-pointer ${
                    direction === "short"
                      ? "bg-rose-500/20 text-rose-400 border-rose-500/40"
                      : "bg-[#0e1520] border-white/10 text-slate-400 hover:bg-white/5"
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                  SHORT (SELL)
                </button>
              </div>
            </div>

            {/* Amount & Leverage */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Margin ($)</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="e.g. 500"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-white/10 bg-[#0e1520] text-white text-xs focus:outline-none focus:border-[#00c076]"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Leverage</label>
                <select
                  value={leverage}
                  onChange={(e) => setLeverage(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-white/10 bg-[#0e1520] text-white text-xs focus:outline-none focus:border-[#00c076]"
                >
                  {[2, 5, 10, 20, 50, 100].map((lev) => (
                    <option key={lev} value={lev}>
                      {lev}x Leverage
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Durations */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Contract Expiry</label>
              <div className="grid grid-cols-5 gap-1">
                {DURATIONS.map((dur) => (
                  <button
                    key={dur.value}
                    type="button"
                    onClick={() => setDuration(dur.value)}
                    className={`py-1.5 rounded-xl text-[10px] font-bold transition-all border cursor-pointer ${
                      duration === dur.value
                        ? "bg-emerald-500/20 text-[#00e676] border-emerald-500/40"
                        : "bg-[#0e1520] border-white/10 text-slate-400 hover:bg-white/5"
                    }`}
                  >
                    {dur.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Stop Loss / Take Profit */}
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/10">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Stop Loss ($)</label>
                <input
                  type="number"
                  value={stopLoss}
                  onChange={(e) => setStopLoss(e.target.value)}
                  placeholder="Optional"
                  className="w-full px-3.5 py-2 rounded-xl border border-white/10 bg-[#0e1520] text-white text-xs focus:outline-none focus:border-[#00c076]"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Take Profit ($)</label>
                <input
                  type="number"
                  value={takeProfit}
                  onChange={(e) => setTakeProfit(e.target.value)}
                  placeholder="Optional"
                  className="w-full px-3.5 py-2 rounded-xl border border-white/10 bg-[#0e1520] text-white text-xs focus:outline-none focus:border-[#00c076]"
                />
              </div>
            </div>

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
              disabled={openMutation.isPending}
              className="w-full py-3.5 bg-[#00c076] hover:bg-[#00e676] text-[#080c10] text-xs font-black rounded-xl shadow-md shadow-[#00c076]/20 transition-all disabled:opacity-60 cursor-pointer flex items-center justify-center gap-1.5"
            >
              {openMutation.isPending && (
                <svg className="w-4 h-4 animate-spin text-[#080c10]" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={4} />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
              )}
              OPEN {direction.toUpperCase()} POSITION
            </button>
          </form>
        </div>

        {/* Right Active & History Panel */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active Positions */}
          <div className="bg-[#121822] rounded-3xl border border-white/10 overflow-hidden shadow-sm text-white">
            <div className="px-6 py-4 border-b border-white/10 bg-[#0e1520] flex items-center justify-between">
              <h2 className="text-xs font-bold text-white uppercase tracking-wider">Open Positions ({openPositions.length})</h2>
              <span className="text-[10px] text-slate-400 font-mono italic">Realtime rates polling</span>
            </div>

            {positionsLoading ? (
              <div className="p-6 space-y-2">
                <div className="h-10 bg-white/5 animate-pulse rounded-xl" />
                <div className="h-10 bg-white/5 animate-pulse rounded-xl" />
              </div>
            ) : openPositions.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-500">No open trading positions.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#0e1520] text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-white/10">
                      <th className="px-5 py-3.5">Asset</th>
                      <th className="px-5 py-3.5">Side</th>
                      <th className="px-5 py-3.5 text-right">Margin / Size</th>
                      <th className="px-5 py-3.5 text-right">Entry Price</th>
                      <th className="px-5 py-3.5 text-right">Mark Price</th>
                      <th className="px-5 py-3.5 text-right">Unrealized PnL</th>
                      <th className="px-5 py-3.5 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-slate-300 font-mono">
                    {openPositions.map((pos) => {
                      const pnl = getLivePnL(pos);
                      const pnlPct = getLivePnLPercent(pos);
                      const markPrice = livePrices[pos.pair] ?? pos.currentPrice;

                      return (
                        <tr key={pos._id} className="hover:bg-white/5 transition-colors">
                          <td className="px-5 py-4 whitespace-nowrap font-sans font-bold text-white">
                            {pos.pair}
                          </td>
                          <td className="px-5 py-4 whitespace-nowrap font-sans">
                            <span
                              className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase ${
                                pos.direction === "long"
                                  ? "bg-emerald-500/15 text-[#00e676] border border-emerald-500/30"
                                  : "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                              }`}
                            >
                              {pos.direction.toUpperCase()} {pos.leverage}x
                            </span>
                          </td>
                          <td className="px-5 py-4 text-right whitespace-nowrap font-mono">
                            <div className="font-bold text-white">{formatCurrency(pos.amount)}</div>
                            <div className="text-[10px] text-slate-500 font-mono">
                              Size: {formatCurrency(pos.amount * pos.leverage)}
                            </div>
                          </td>
                          <td className="px-5 py-4 text-right font-mono text-xs text-slate-400 whitespace-nowrap">
                            ${pos.entryPrice?.toLocaleString()}
                          </td>
                          <td className="px-5 py-4 text-right font-mono text-xs text-white font-bold whitespace-nowrap">
                            ${markPrice?.toLocaleString()}
                          </td>
                          <td className="px-5 py-4 text-right whitespace-nowrap">
                            <span className={`font-bold font-mono text-xs ${pnl >= 0 ? "text-[#00e676]" : "text-rose-400"}`}>
                              {pnl >= 0 ? "+" : ""}
                              {pnl.toFixed(2)} ({pnlPct.toFixed(2)}%)
                            </span>
                          </td>
                          <td className="px-5 py-4 text-center whitespace-nowrap font-sans">
                            <button
                              onClick={() => closeMutation.mutate(pos._id)}
                              disabled={closeMutation.isPending}
                              className="text-[10px] font-bold px-3 py-1.5 rounded-xl border border-rose-500/30 bg-rose-500/15 text-rose-400 hover:bg-rose-500/25 transition-colors disabled:opacity-60 cursor-pointer"
                            >
                              Close
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* History Positions */}
          <div className="bg-[#121822] rounded-3xl border border-white/10 overflow-hidden shadow-sm text-white">
            <div className="px-6 py-4 border-b border-white/10 bg-[#0e1520]">
              <h2 className="text-xs font-bold text-white uppercase tracking-wider">Closed Contracts History</h2>
            </div>

            {positionsLoading ? (
              <div className="p-6 space-y-2">
                <div className="h-10 bg-white/5 animate-pulse rounded-xl" />
              </div>
            ) : closedPositions.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-500">No trading history found.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#0e1520] text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-white/10">
                      <th className="px-5 py-3.5">Closed Date</th>
                      <th className="px-5 py-3.5">Asset</th>
                      <th className="px-5 py-3.5 text-right">Entry / Exit</th>
                      <th className="px-5 py-3.5 text-right">Realized PnL</th>
                      <th className="px-5 py-3.5">Closed By</th>
                      <th className="px-5 py-3.5">Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-slate-300 font-mono">
                    {closedPositions.map((pos) => {
                      const pnl = pos.realizedPnL ?? 0;
                      return (
                        <tr key={pos._id} className="hover:bg-white/5 transition-colors">
                          <td className="px-5 py-4 text-xs text-slate-400 whitespace-nowrap font-mono">
                            {formatDate(pos.closedAt ?? pos.updatedAt ?? pos.openedAt)}
                          </td>
                          <td className="px-5 py-4 whitespace-nowrap font-sans">
                            <span className="font-bold text-white block">{pos.pair}</span>
                            <span
                              className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${
                                pos.direction === "long" ? "bg-emerald-500/15 text-[#00e676] border border-emerald-500/30" : "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                              }`}
                            >
                              {pos.direction} {pos.leverage}x
                            </span>
                          </td>
                          <td className="px-5 py-4 text-right font-mono text-xs text-slate-400 whitespace-nowrap">
                            <div>En: ${pos.entryPrice?.toLocaleString()}</div>
                            <div>Ex: ${pos.exitPrice?.toLocaleString()}</div>
                          </td>
                          <td className="px-5 py-4 text-right whitespace-nowrap">
                            <span className={`font-bold font-mono text-xs ${pnl >= 0 ? "text-[#00e676]" : "text-rose-400"}`}>
                              {pnl >= 0 ? "+" : ""}
                              {pnl.toFixed(2)}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-xs text-slate-400 uppercase whitespace-nowrap font-sans font-bold">
                            {pos.closedBy || "system"}
                          </td>
                          <td className="px-5 py-4 text-xs text-slate-500 max-w-[120px] truncate italic font-sans">
                            {pos.meta?.remarks || "—"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
