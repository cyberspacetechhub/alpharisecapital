import { useState, useEffect } from "react";

export const useTickerPrice = (pair: string, intervalMs = 10000) => {
  const [price, setPrice] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const binanceSymbol = pair.replace("/", ""); // e.g. "BTC/USDT" -> "BTCUSDT"
    if (!binanceSymbol) return;

    const fetchPrice = async () => {
      try {
        const res = await window.fetch(
          `https://api.binance.com/api/v3/ticker/price?symbol=${binanceSymbol}`
        );
        const data = await res.json();
        if (data && data.price) {
          setPrice(parseFloat(data.price));
        }
      } catch (err) {
        console.error(`Failed to fetch Binance price for ${pair}:`, err);
      } finally {
        setLoading(false);
      }
    };

    fetchPrice();
    const interval = setInterval(fetchPrice, intervalMs);
    return () => clearInterval(interval);
  }, [pair, intervalMs]);

  return { price, loading };
};
