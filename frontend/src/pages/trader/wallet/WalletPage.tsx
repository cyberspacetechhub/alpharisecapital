import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { walletLinkApi } from "../../../api/walletLink.api";
import { transactionApi } from "../../../api/transaction.api";
import { formatCurrency, formatDate } from "../../../utils";
import type { Transaction } from "../../../types";

const ASSETS = [
  { symbol: "BTC", name: "Bitcoin", basePrice: 78250.0, icon: "₿", color: "text-orange-500 bg-orange-50" },
  { symbol: "ETH", name: "Ethereum", basePrice: 2230.0, icon: "Ξ", color: "text-indigo-500 bg-indigo-50" },
  { symbol: "SOL", name: "Solana", basePrice: 140.0, icon: "◎", color: "text-purple-500 bg-purple-50" },
  { symbol: "BNB", name: "Binance Coin", basePrice: 560.0, icon: " BNB", color: "text-yellow-600 bg-yellow-50" },
  { symbol: "XRP", name: "Ripple", basePrice: 1.90, icon: "✕", color: "text-blue-500 bg-blue-50" },
];

export default function WalletPage() {
  const navigate = useNavigate();
  const [livePrices, setLivePrices] = useState<Record<string, number>>({
    BTC: 78250.0,
    ETH: 2230.0,
    SOL: 140.0,
    BNB: 560.0,
    XRP: 1.90,
  });

  // Prices scroll tick
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
            Object.keys(next).forEach((symbol) => {
              const binanceSymbol = `${symbol}USDT`;
              if (priceMap[binanceSymbol]) {
                next[symbol] = priceMap[binanceSymbol];
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
        Object.keys(next).forEach((symbol) => {
          const changePercent = (Math.random() - 0.5) * 0.0006;
          next[symbol] = parseFloat((next[symbol] * (1 + changePercent)).toFixed(4));
        });
        return next;
      });
    }, 3000);

    return () => {
      clearInterval(fetchInterval);
      clearInterval(tickInterval);
    };
  }, []);

  const queryClient = useQueryClient();

  // Query linked wallets
  const { data: walletsData } = useQuery({
    queryKey: ["my-wallet-links"],
    queryFn: () => walletLinkApi.getMyWallets().then((r) => r.data.data),
  });

  const wallets = walletsData ?? [];

  // Mutation to unlink/remove a wallet
  const removeWalletMutation = useMutation({
    mutationFn: walletLinkApi.removeWallet,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-wallet-links"] });
    },
  });

  // Mutation to set primary wallet
  const setPrimaryMutation = useMutation({
    mutationFn: walletLinkApi.setPrimary,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-wallet-links"] });
    },
  });

  // Query Trader Deposits
  const { data: depositsData, isLoading: depositsLoading } = useQuery({
    queryKey: ["my-markets-deposits"],
    queryFn: () =>
      transactionApi
        .getMyTransactions({ type: "deposit", status: "approved" })
        .then((r) => r.data.data),
  });

  const deposits: Transaction[] = depositsData ?? [];

  // Map user deposits to crypto assets
  const getMappedDeposits = () => {
    return deposits.map((d) => {
      const methodName = (d.meta?.methodName as string || "").toLowerCase();
      let matchedSymbol = "USDT"; // default stable
      let baselinePrice = 1.0;

      if (methodName.includes("btc") || methodName.includes("bitcoin")) {
        matchedSymbol = "BTC";
        baselinePrice = 95000.0; // historical entry reference
      } else if (methodName.includes("eth") || methodName.includes("ethereum")) {
        matchedSymbol = "ETH";
        baselinePrice = 3050.0;
      } else if (methodName.includes("sol") || methodName.includes("solana")) {
        matchedSymbol = "SOL";
        baselinePrice = 175.0;
      } else if (methodName.includes("bnb") || methodName.includes("binance")) {
        matchedSymbol = "BNB";
        baselinePrice = 610.0;
      } else if (methodName.includes("xrp") || methodName.includes("ripple")) {
        matchedSymbol = "XRP";
        baselinePrice = 2.2;
      }

      const units = matchedSymbol === "USDT" ? d.amount : d.amount / baselinePrice;
      const currentPrice = matchedSymbol === "USDT" ? 1.0 : livePrices[matchedSymbol] ?? baselinePrice;
      const currentValue = units * currentPrice;
      const profitOrLoss = currentValue - d.amount;
      const pnlPercent = (profitOrLoss / d.amount) * 100;

      return {
        ...d,
        symbol: matchedSymbol,
        units,
        currentValue,
        profitOrLoss,
        pnlPercent,
        currentPrice,
      };
    });
  };

  const mappedDeposits = getMappedDeposits();

  // Aggregate Portfolio Values
  const totalDeposited = deposits.reduce((sum, d) => sum + d.amount, 0);
  const totalCurrentValue = mappedDeposits.reduce((sum, d) => sum + d.currentValue, 0);
  const netReturn = totalCurrentValue - totalDeposited;
  const netReturnPercent = totalDeposited > 0 ? (netReturn / totalDeposited) * 100 : 0;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Ticker tape header */}
      <div className="bg-[#0e1520] text-white rounded-2xl p-3 overflow-hidden border border-white/10 shadow-sm">
        <div className="flex items-center gap-6 animate-pulse text-xs font-mono whitespace-nowrap overflow-x-auto scrollbar-none">
          <span className="font-bold text-[10px] text-[#00e676] uppercase tracking-wider shrink-0">Live Index:</span>
          {ASSETS.map((asset) => {
            const currentPrice = livePrices[asset.symbol] ?? asset.basePrice;
            const diffPercent = ((currentPrice - asset.basePrice) / asset.basePrice) * 100;
            return (
              <div key={asset.symbol} className="inline-flex items-center gap-1.5 shrink-0">
                <span className="font-bold text-slate-300">{asset.symbol}</span>
                <span className="text-white">${currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}</span>
                <span className={`text-[10px] font-bold ${diffPercent >= 0 ? "text-[#00e676]" : "text-rose-400"}`}>
                  {diffPercent >= 0 ? "▲" : "▼"}{Math.abs(diffPercent).toFixed(2)}%
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Header and Portfolio Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          <h1 className="text-xl font-bold text-white">Markets & Crypto Custody</h1>
          <p className="text-xs text-slate-400 mt-0.5">Track real-time asset valuations and connected Web3 liquidity sources.</p>
        </div>

        {/* Portfolio Stats Card */}
        <div className="bg-[#121822] border border-white/10 rounded-3xl p-5 shadow-sm space-y-3 shrink-0 text-white">
          <div className="flex justify-between items-center">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Live Portfolio Valuation</span>
            <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase ${
              netReturn >= 0 ? "bg-emerald-500/15 text-[#00e676] border border-emerald-500/30" : "bg-rose-500/15 text-rose-400 border border-rose-500/30"
            }`}>
              {netReturn >= 0 ? "+" : ""}{netReturnPercent.toFixed(2)}%
            </span>
          </div>
          <div className="text-2xl font-bold text-white font-mono">
            {depositsLoading ? "$0.00" : formatCurrency(totalCurrentValue)}
          </div>
          <div className="flex justify-between text-xs pt-2 border-t border-white/10 text-slate-400 font-mono">
            <span>Deposited: {formatCurrency(totalDeposited)}</span>
            <span className={netReturn >= 0 ? "text-[#00e676] font-bold" : "text-rose-400 font-bold"}>
              PnL: {netReturn >= 0 ? "+" : ""}{formatCurrency(netReturn)}
            </span>
          </div>
        </div>
      </div>

      {/* Grid Allocation */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Mapped user deposits list */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-[#121822] rounded-3xl border border-white/10 p-6 shadow-sm text-white">
            <h2 className="text-xs font-bold text-white uppercase tracking-wider mb-4">My Asset Allocations</h2>

            {depositsLoading ? (
              <div className="space-y-3">
                <div className="h-12 bg-white/5 animate-pulse rounded-xl" />
              </div>
            ) : mappedDeposits.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-500">
                No approved deposits found. Go to the Deposit page to load your account.
              </div>
            ) : (
              <div className="space-y-3">
                {mappedDeposits.map((item) => (
                  <div key={item._id} className="p-4 bg-[#0e1520] border border-white/10 rounded-2xl flex items-center justify-between hover:bg-white/5 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${
                        item.symbol === "BTC" ? "bg-amber-500/15 text-amber-400 border border-amber-500/30" :
                        item.symbol === "ETH" ? "bg-indigo-500/15 text-indigo-400 border border-indigo-500/30" :
                        item.symbol === "SOL" ? "bg-purple-500/15 text-purple-400 border border-purple-500/30" :
                        item.symbol === "BNB" ? "bg-yellow-500/15 text-yellow-300 border border-yellow-500/30" :
                        item.symbol === "XRP" ? "bg-blue-500/15 text-blue-400 border border-blue-500/30" :
                        "bg-emerald-500/15 text-[#00e676] border border-emerald-500/30"
                      }`}>
                        {item.symbol === "BTC" ? "₿" :
                         item.symbol === "ETH" ? "Ξ" :
                         item.symbol === "SOL" ? "◎" :
                         item.symbol === "BNB" ? "B" :
                         item.symbol === "XRP" ? "✕" :
                         "$"
                        }
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white">{item.meta?.methodName || "Deposit"}</span>
                          <span className="text-[9px] font-mono text-slate-400">Qty: {item.units.toFixed(5)} {item.symbol}</span>
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5 font-mono">
                          Deposited {formatCurrency(item.amount)} on {formatDate(item.createdAt)}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-xs font-bold text-white font-mono">
                        {formatCurrency(item.currentValue)}
                      </div>
                      <span className={`text-[10px] font-bold font-mono ${item.profitOrLoss >= 0 ? "text-[#00e676]" : "text-rose-400"}`}>
                        {item.profitOrLoss >= 0 ? "+" : ""}{item.profitOrLoss.toFixed(2)} ({item.pnlPercent.toFixed(2)}%)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Linked Custody Wallets */}
          <div className="bg-[#121822] rounded-3xl border border-white/10 p-6 shadow-sm space-y-5 text-white">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xs font-bold text-white uppercase tracking-wider">Linked Custody Wallets</h2>
                <p className="text-[10px] text-slate-400 mt-0.5">Integrate external wallets to prove margin liquidity and credit thresholds.</p>
              </div>
              <button
                onClick={() => navigate("/trader/wallet/connect")}
                className="px-4 py-2 bg-[#00c076] hover:bg-[#00e676] text-[#080c10] text-xs font-black rounded-xl transition-all flex items-center gap-1.5 shadow-md shadow-[#00c076]/20 cursor-pointer"
              >
                <span>+</span> Link Wallet
              </button>
            </div>

            {wallets.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-500 border border-dashed border-white/10 rounded-2xl bg-[#0e1520]">
                No external wallets connected. Click "Link Wallet" to connect Web3 custody clients.
              </div>
            ) : (
              <div className="space-y-3">
                {wallets.map((wallet) => (
                  <div key={wallet._id} className="p-4 bg-[#0e1520] border border-white/10 rounded-2xl flex items-center justify-between hover:bg-white/5 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center font-bold text-xs shrink-0 border border-white/10 text-white">
                        {wallet.label.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white">{wallet.label}</span>
                          {wallet.isPrimary && (
                            <span className="text-[9px] bg-emerald-500/15 text-[#00e676] border border-emerald-500/30 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                              Primary
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-500 block mt-0.5 font-mono">
                          Added {formatDate(wallet.createdAt)} • Encrypted Key
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase ${
                        wallet.isVerified ? "bg-emerald-500/15 text-[#00e676] border border-emerald-500/30" : "bg-amber-500/15 text-amber-300 border border-amber-500/30"
                      }`}>
                        {wallet.isVerified ? "Verified" : "Pending Audit"}
                      </span>
                      {!wallet.isPrimary && (
                        <button
                          onClick={() => setPrimaryMutation.mutate(wallet._id)}
                          className="text-[10px] text-slate-400 hover:text-white font-bold px-2 py-1 rounded hover:bg-white/5 transition-all cursor-pointer"
                          disabled={setPrimaryMutation.isPending}
                        >
                          Make Primary
                        </button>
                      )}
                      <button
                        onClick={() => {
                          if (confirm("Are you sure you want to unlink this wallet?")) {
                            removeWalletMutation.mutate(wallet._id);
                          }
                        }}
                        className="text-[10px] text-rose-400 hover:text-rose-300 font-bold px-2 py-1 rounded hover:bg-rose-500/15 transition-all cursor-pointer"
                        disabled={removeWalletMutation.isPending}
                      >
                        Unlink
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Asset Market Rates Table */}
        <div className="bg-[#121822] rounded-3xl border border-white/10 p-5 shadow-sm space-y-4 h-fit text-white">
          <h2 className="text-xs font-bold text-white uppercase tracking-wider">Crypto Market Rates</h2>
          <div className="divide-y divide-white/5 font-mono">
            {ASSETS.map((asset) => {
              const currentPrice = livePrices[asset.symbol] ?? asset.basePrice;
              const diffPercent = ((currentPrice - asset.basePrice) / asset.basePrice) * 100;

              return (
                <div key={asset.symbol} className="py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs bg-white/5 border border-white/10 text-white`}>
                      {asset.icon}
                    </div>
                    <div>
                      <span className="text-xs font-bold text-white block font-sans">{asset.symbol}/USDT</span>
                      <span className="text-[9px] text-slate-500 block font-sans">{asset.name}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-bold text-white font-mono block">
                      ${currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                    <span className={`text-[10px] font-bold ${diffPercent >= 0 ? "text-[#00e676]" : "text-rose-400"}`}>
                      {diffPercent >= 0 ? "+" : ""}{diffPercent.toFixed(2)}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
          <button
            onClick={() => navigate("/trader/positions")}
            className="w-full py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-[#00e676] text-xs font-bold rounded-xl transition-colors text-center block cursor-pointer"
          >
            Launch Margin Trader
          </button>
        </div>
      </div>
    </div>
  );
}
