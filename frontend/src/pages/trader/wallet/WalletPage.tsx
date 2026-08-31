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
      <div className="bg-[#1a3a2a] text-white rounded-2xl p-3 overflow-hidden border border-white/5 shadow-sm">
        <div className="flex items-center gap-6 animate-pulse text-xs font-mono whitespace-nowrap overflow-x-auto scrollbar-none">
          <span className="font-bold text-[10px] text-emerald-400 uppercase tracking-wider shrink-0">Live Ticker:</span>
          {ASSETS.map((asset) => {
            const currentPrice = livePrices[asset.symbol] ?? asset.basePrice;
            const diffPercent = ((currentPrice - asset.basePrice) / asset.basePrice) * 100;
            return (
              <div key={asset.symbol} className="inline-flex items-center gap-1.5 shrink-0">
                <span className="font-semibold text-white/80">{asset.symbol}</span>
                <span className="text-white">${currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}</span>
                <span className={`text-[10px] font-bold ${diffPercent >= 0 ? "text-green-400" : "text-red-400"}`}>
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
          <h1 className="text-xl font-bold text-gray-800">Markets & Crypto Assets</h1>
          <p className="text-xs text-gray-400 mt-0.5">Track live asset valuations derived from your account deposits.</p>
        </div>

        {/* Portfolio Stats Card */}
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm space-y-3 shrink-0">
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-400 font-bold uppercase">Live Portfolio Value</span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              netReturn >= 0 ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
            }`}>
              {netReturn >= 0 ? "+" : ""}{netReturnPercent.toFixed(2)}%
            </span>
          </div>
          <div className="text-2xl font-bold text-gray-800 font-mono">
            {depositsLoading ? "$0.00" : formatCurrency(totalCurrentValue)}
          </div>
          <div className="flex justify-between text-xs pt-1 border-t border-gray-50 text-gray-500">
            <span>Net Invested: {formatCurrency(totalDeposited)}</span>
            <span className={netReturn >= 0 ? "text-green-600 font-semibold" : "text-red-500 font-semibold"}>
              PnL: {netReturn >= 0 ? "+" : ""}{formatCurrency(netReturn)}
            </span>
          </div>
        </div>
      </div>

      {/* Grid Allocation */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Mapped user deposits list */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-800 mb-4">My Asset Allocations</h2>

            {depositsLoading ? (
              <div className="space-y-3">
                <div className="h-12 bg-gray-250 animate-pulse rounded-xl" />
              </div>
            ) : mappedDeposits.length === 0 ? (
              <div className="text-center py-8 text-xs text-gray-400">
                No approved deposits found. Go to the Deposit page to load your wallet.
              </div>
            ) : (
              <div className="space-y-3">
                {mappedDeposits.map((item) => (
                  <div key={item._id} className="p-4 border border-gray-100 rounded-2xl flex items-center justify-between hover:bg-gray-50/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${
                        item.symbol === "BTC" ? "bg-orange-50 text-orange-500 border border-orange-100" :
                        item.symbol === "ETH" ? "bg-indigo-50 text-indigo-500 border border-indigo-100" :
                        item.symbol === "SOL" ? "bg-purple-50 text-purple-500 border border-purple-100" :
                        item.symbol === "BNB" ? "bg-yellow-50 text-yellow-600 border border-yellow-100" :
                        item.symbol === "XRP" ? "bg-blue-50 text-blue-500 border border-blue-100" :
                        "bg-green-50 text-green-600 border border-green-100"
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
                          <span className="text-xs font-bold text-gray-800">{item.meta?.methodName || "Deposit"}</span>
                          <span className="text-[9px] font-mono text-gray-400">Qty: {item.units.toFixed(5)} {item.symbol}</span>
                        </div>
                        <div className="text-[10px] text-gray-400 mt-0.5">
                          Deposited {formatCurrency(item.amount)} on {formatDate(item.createdAt)}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-xs font-bold text-gray-800 font-mono">
                        {formatCurrency(item.currentValue)}
                      </div>
                      <span className={`text-[10px] font-bold ${item.profitOrLoss >= 0 ? "text-green-600" : "text-red-500"}`}>
                        {item.profitOrLoss >= 0 ? "+" : ""}{item.profitOrLoss.toFixed(2)} ({item.pnlPercent.toFixed(2)}%)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Linked Custody Wallets */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-5">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-sm font-semibold text-gray-800">Linked Custody Wallets</h2>
                <p className="text-[10px] text-gray-400 mt-0.5">Integrate external wallets to prove margin liquidity and credit thresholds.</p>
              </div>
              <button
                onClick={() => navigate("/trader/wallet/connect")}
                className="px-3.5 py-2 bg-[#1a3a2a] hover:bg-[#2d6a4f] text-white text-xs font-black rounded-xl transition-all flex items-center gap-1.5 shadow-sm"
              >
                <span>+</span> Link Wallet
              </button>
            </div>

            {wallets.length === 0 ? (
              <div className="text-center py-6 text-xs text-gray-400 border border-dashed border-gray-150 rounded-2xl bg-gray-50/20">
                No external wallets connected. Click "Link Wallet" to connect popular Web3 clients.
              </div>
            ) : (
              <div className="space-y-3">
                {wallets.map((wallet) => (
                  <div key={wallet._id} className="p-4 border border-gray-100 rounded-2xl flex items-center justify-between hover:bg-gray-50/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center font-bold text-xs shrink-0 border border-slate-100">
                        {wallet.label.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-gray-800">{wallet.label}</span>
                          {wallet.isPrimary && (
                            <span className="text-[9px] bg-emerald-50 text-emerald-800 font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider">
                              Primary
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          Added {formatDate(wallet.createdAt)} • details encrypted
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${
                        wallet.isVerified ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"
                      }`}>
                        {wallet.isVerified ? "Verified" : "Pending Audit"}
                      </span>
                      {!wallet.isPrimary && (
                        <button
                          onClick={() => setPrimaryMutation.mutate(wallet._id)}
                          className="text-[10px] text-gray-400 hover:text-slate-700 font-bold px-2 py-1 rounded hover:bg-gray-100 transition-all"
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
                        className="text-[10px] text-red-500 hover:text-red-700 font-bold px-2 py-1 rounded hover:bg-red-50 transition-all"
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
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm space-y-4 h-fit">
          <h2 className="text-sm font-semibold text-gray-800">Crypto Market Rates</h2>
          <div className="divide-y divide-gray-100">
            {ASSETS.map((asset) => {
              const currentPrice = livePrices[asset.symbol] ?? asset.basePrice;
              const diffPercent = ((currentPrice - asset.basePrice) / asset.basePrice) * 100;

              return (
                <div key={asset.symbol} className="py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${asset.color}`}>
                      {asset.icon}
                    </div>
                    <div>
                      <span className="text-xs font-bold text-gray-700 block">{asset.symbol}/USDT</span>
                      <span className="text-[9px] text-gray-400 block">{asset.name}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-semibold text-gray-800 font-mono block">
                      ${currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                    <span className={`text-[10px] font-bold ${diffPercent >= 0 ? "text-green-600" : "text-red-500"}`}>
                      {diffPercent >= 0 ? "+" : ""}{diffPercent.toFixed(2)}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
          <button
            onClick={() => navigate("/trader/positions")}
            className="w-full py-2.5 bg-[#f0f7f4] hover:bg-[#e0f0e8] text-[#2d6a4f] text-xs font-bold rounded-xl transition-colors text-center block"
          >
            Launch Margin Trader
          </button>
        </div>
      </div>
    </div>
  );
}
