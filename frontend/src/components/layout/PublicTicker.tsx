import { useState, useEffect } from "react";

const INITIAL_ASSETS = [
  // Crypto
  { symbol: "BTC", basePrice: 78250.0, isStock: false },
  { symbol: "ETH", basePrice: 2230.0, isStock: false },
  { symbol: "SOL", basePrice: 140.0, isStock: false },
  { symbol: "BNB", basePrice: 560.0, isStock: false },
  { symbol: "XRP", basePrice: 1.90, isStock: false },
  { symbol: "ADA", basePrice: 0.72, isStock: false },
  { symbol: "DOT", basePrice: 4.80, isStock: false },
  { symbol: "LINK", basePrice: 13.50, isStock: false },
  { symbol: "DOGE", basePrice: 0.22, isStock: false },
  { symbol: "SHIB", basePrice: 0.000015, isStock: false },
  // Stocks / Indices
  { symbol: "TSLA", basePrice: 260.4, isStock: true },
  { symbol: "NVDA", basePrice: 135.8, isStock: true },
  { symbol: "AAPL", basePrice: 228.3, isStock: true },
  { symbol: "AMZN", basePrice: 195.5, isStock: true },
  { symbol: "MSFT", basePrice: 418.2, isStock: true },
  { symbol: "SPY", basePrice: 585.6, isStock: true },
  { symbol: "QQQ", basePrice: 495.2, isStock: true },
  { symbol: "DIA", basePrice: 432.1, isStock: true },
];

export default function PublicTicker() {
  const [tickerPrices, setTickerPrices] = useState<Record<string, number>>({});

  // Initialize prices & fetch from Binance
  useEffect(() => {
    const init: Record<string, number> = {};
    INITIAL_ASSETS.forEach((a) => {
      init[a.symbol] = a.basePrice;
    });
    setTickerPrices(init);

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

          setTickerPrices((prev) => {
            const next = { ...prev };
            INITIAL_ASSETS.forEach((asset) => {
              if (!asset.isStock) {
                const binanceSymbol = `${asset.symbol}USDT`;
                if (priceMap[binanceSymbol]) {
                  next[asset.symbol] = priceMap[binanceSymbol];
                }
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
    const fetchInterval = setInterval(fetchLivePrices, 25000); // Fetch real rates every 25 seconds
    return () => clearInterval(fetchInterval);
  }, []);

  // Update prices periodically (minor cosmetic tick shifts)
  useEffect(() => {
    const interval = setInterval(() => {
      setTickerPrices((prev) => {
        const next = { ...prev };
        INITIAL_ASSETS.forEach((a) => {
          if (next[a.symbol]) {
            const changePercent = (Math.random() - 0.5) * 0.0006; // very small ticks
            next[a.symbol] = parseFloat((next[a.symbol] * (1 + changePercent)).toFixed(4));
          }
        });
        return next;
      });
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-[#0b1b14] text-white py-3 border-b border-white/5 overflow-hidden w-full relative">
      
      {/* Scroll Marquee Styles */}
      <style>{`
        @keyframes tickerMarquee {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
        .animate-ticker-marquee {
          display: flex;
          width: max-content;
          animation: tickerMarquee 40s linear infinite;
        }
        .animate-ticker-marquee:hover {
          animation-play-state: paused;
        }
      `}</style>

      <div className="animate-ticker-marquee flex gap-10 items-center">
        {/* Render twice for continuous loop */}
        {[...INITIAL_ASSETS, ...INITIAL_ASSETS].map((asset, idx) => {
          const currentPrice = tickerPrices[asset.symbol] ?? asset.basePrice;
          const diffPercent = ((currentPrice - asset.basePrice) / asset.basePrice) * 100;
          return (
            <div key={idx} className="inline-flex items-center gap-2.5 shrink-0 text-xs font-mono">
              <span className="font-extrabold text-white/50 text-[10px] uppercase tracking-wider">
                {asset.isStock ? "STK" : "CRYPTO"}
              </span>
              <span className="font-bold text-white">{asset.symbol}</span>
              <span className="text-white font-semibold">
                ${currentPrice.toLocaleString(undefined, {
                  minimumFractionDigits: asset.basePrice < 0.1 ? 6 : 2,
                  maximumFractionDigits: asset.basePrice < 0.1 ? 6 : 2,
                })}
              </span>
              <span className={`text-[10px] font-bold ${diffPercent >= 0 ? "text-green-400" : "text-red-400"}`}>
                {diffPercent >= 0 ? "▲" : "▼"}{Math.abs(diffPercent).toFixed(2)}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
