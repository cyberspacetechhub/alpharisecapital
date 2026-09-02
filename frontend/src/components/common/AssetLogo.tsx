import React, { useState } from "react";

interface AssetLogoProps {
  image?: string | null;
  name?: string | null;
  type?: string | null;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

export const AssetLogo: React.FC<AssetLogoProps> = ({
  image,
  name = "",
  type = "",
  size = "md",
  className = "",
}) => {
  const [imgError, setImgError] = useState(false);

  const sizeClasses = {
    sm: "w-7 h-7 text-xs rounded-xl",
    md: "w-10 h-10 text-sm rounded-2xl",
    lg: "w-12 h-12 text-base rounded-2xl",
    xl: "w-14 h-14 text-lg rounded-3xl",
  }[size];

  const imgSizeClasses = {
    sm: "w-7 h-7 rounded-xl",
    md: "w-10 h-10 rounded-2xl",
    lg: "w-12 h-12 rounded-2xl",
    xl: "w-14 h-14 rounded-3xl",
  }[size];

  // If valid image provided and hasn't failed to load, display the image
  if (image && !imgError) {
    return (
      <img
        src={image}
        alt={name || type || "Asset Logo"}
        onError={() => setImgError(true)}
        className={`${imgSizeClasses} object-cover border border-white/10 shrink-0 bg-[#0e1520] shadow-sm ${className}`}
      />
    );
  }

  const cleanName = (name || "").toLowerCase().trim();
  const cleanType = (type || "").toLowerCase().trim();

  // ── Bitcoin (BTC) ──
  if (cleanName.includes("btc") || cleanName.includes("bitcoin")) {
    return (
      <div
        className={`${sizeClasses} bg-[#F7931A]/15 text-[#F7931A] border border-[#F7931A]/30 flex items-center justify-center font-black shrink-0 shadow-sm ${className}`}
      >
        <svg className="w-5 h-5 fill-current" viewBox="0 0 32 32">
          <path d="M23.184 14.125c.348-2.327-1.425-3.578-3.85-4.412l.787-3.155-1.92-.479-.766 3.072c-.504-.126-1.023-.245-1.538-.362l.773-3.1-1.92-.48-.788 3.156c-.418-.096-.827-.189-1.226-.288l.002-.007-2.65-.662-.511 2.053s1.425.327 1.396.347c.778.194.919.709.896 1.117l-.898 3.599c.054.014.123.034.2.067-.065-.016-.135-.035-.205-.053l-1.258 5.044c-.095.236-.338.59-885.454.019.028-1.396-.348-1.396-.348l-.955 2.203 2.5.624c.465.117.92.238 1.368.354l-.797 3.2 1.92.479.787-3.154c.524.142 1.033.275 1.532.4l-.784 3.14 1.92.48.796-3.191c3.274.62 5.736.37 6.772-2.592.836-2.385-.041-3.761-1.767-4.66 1.256-.29 2.202-1.116 2.455-2.825zm-4.385 6.166c-.594 2.385-4.614 1.096-5.918.771l1.056-4.232c1.304.326 5.485.972 4.862 3.461zm.594-6.195c-.542 2.172-3.89 1.069-4.977.798l.958-3.84c1.087.271 4.582.778 4.019 3.042z" />
        </svg>
      </div>
    );
  }

  // ── Tether (USDT) ──
  if (cleanName.includes("usdt") || cleanName.includes("tether") || cleanName.includes("trc20") || cleanName.includes("erc20")) {
    return (
      <div
        className={`${sizeClasses} bg-[#26A17B]/15 text-[#26A17B] border border-[#26A17B]/30 flex items-center justify-center font-black shrink-0 shadow-sm ${className}`}
      >
        <svg className="w-5 h-5 fill-current" viewBox="0 0 32 32">
          <path d="M17.922 17.383v-.002c-.11.008-.677.042-1.942.042-1.01 0-1.721-.03-1.971-.042v.003c-3.888-.171-6.79-1.01-6.79-2.022 0-1.013 2.902-1.852 6.79-2.022v3.235c.254.018.98.056 2.001.056 1.229 0 1.797-.044 1.912-.056v-3.233c3.864.173 6.744 1.01 6.744 2.02 0 1.012-2.88 1.85-6.744 2.021m0-5.18v-3.41h6.666V4.77H7.392v4.023h6.56v3.41C8.75 12.435 4.5 13.885 4.5 15.603c0 1.714 4.25 3.164 9.452 3.398v8.204h3.97v-8.206c5.182-.236 9.412-1.686 9.412-3.396 0-1.718-4.23-3.168-9.412-3.396" />
        </svg>
      </div>
    );
  }

  // ── Ethereum (ETH) ──
  if (cleanName.includes("eth") || cleanName.includes("ethereum")) {
    return (
      <div
        className={`${sizeClasses} bg-[#627EEA]/15 text-[#627EEA] border border-[#627EEA]/30 flex items-center justify-center font-black shrink-0 shadow-sm ${className}`}
      >
        <svg className="w-5 h-5 fill-current" viewBox="0 0 32 32">
          <path d="M16 2.5l-.23.78v17.43l.23.23 8.08-4.78L16 2.5zm0 0L7.92 16.16l8.08 4.78V2.5zm0 19.86l-.13.16v6.94l.13.38 8.09-11.4-8.09 3.92zm0 7.48v-7.48l-8.08-3.92 8.08 11.4zm0-8.7l8.08-4.78-8.08-3.67v8.45zm-8.08-4.78l8.08 4.78v-8.45l-8.08 3.67z" />
        </svg>
      </div>
    );
  }

  // ── Binance Coin (BNB) ──
  if (cleanName.includes("bnb") || cleanName.includes("binance") || cleanName.includes("bep20")) {
    return (
      <div
        className={`${sizeClasses} bg-[#F3BA2F]/15 text-[#F3BA2F] border border-[#F3BA2F]/30 flex items-center justify-center font-black shrink-0 shadow-sm ${className}`}
      >
        <svg className="w-5 h-5 fill-current" viewBox="0 0 32 32">
          <path d="M16 3l4.5 4.5L16 12l-4.5-4.5L16 3zm-7 7l4.5 4.5L9 19l-4.5-4.5L9 10zm14 0l4.5 4.5L23 19l-4.5-4.5L23 10zM16 17l4.5 4.5L16 26l-4.5-4.5L16 17zm0-3.5L19.5 17 16 20.5 12.5 17 16 13.5zm7 3.5l4.5 4.5L23 26l-4.5-4.5L23 17zm-14 0l4.5 4.5L9 26l-4.5-4.5L9 17z" />
        </svg>
      </div>
    );
  }

  // ── Solana (SOL) ──
  if (cleanName.includes("sol") || cleanName.includes("solana")) {
    return (
      <div
        className={`${sizeClasses} bg-[#14F195]/15 text-[#14F195] border border-[#14F195]/30 flex items-center justify-center font-black shrink-0 shadow-sm ${className}`}
      >
        <svg className="w-5 h-5 fill-current" viewBox="0 0 32 32">
          <path d="M7 21.5l3.5-3.5h14.5l-3.5 3.5H7zm0-7.5l3.5-3.5h14.5l-3.5 3.5H7zm14.5-7.5l3.5 3.5H10.5L7 6.5h14.5z" />
        </svg>
      </div>
    );
  }

  // ── Tron (TRX) ──
  if (cleanName.includes("trx") || cleanName.includes("tron")) {
    return (
      <div
        className={`${sizeClasses} bg-[#EF0027]/15 text-[#EF0027] border border-[#EF0027]/30 flex items-center justify-center font-black shrink-0 shadow-sm ${className}`}
      >
        <svg className="w-5 h-5 fill-current" viewBox="0 0 32 32">
          <path d="M27.6 9.4L16.2 3.8 4.4 9.4v13.2l11.8 5.6 11.4-5.6V9.4zM16 6.1l8.7 4.2-4.8 2.2-9-4.2L16 6.1zm-9.3 5.4l7.8 3.6-7.8 3.5V11.5zm8.3 12.3l-7.3-3.5 7.3-3.3v6.8zm2 0v-6.8l7.3 3.3-7.3 3.5zm8.3-5.7l-7.8-3.5 7.8-3.6v7.1z" />
        </svg>
      </div>
    );
  }

  // ── Bank / Wire / Fiat Transfer ──
  if (
    cleanName.includes("bank") ||
    cleanName.includes("wire") ||
    cleanName.includes("transfer") ||
    cleanName.includes("fiat") ||
    cleanType === "bank"
  ) {
    return (
      <div
        className={`${sizeClasses} bg-blue-500/15 text-blue-400 border border-blue-500/30 flex items-center justify-center font-black shrink-0 shadow-sm ${className}`}
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      </div>
    );
  }

  // ── Generic Deposit ──
  if (cleanType === "deposit") {
    return (
      <div
        className={`${sizeClasses} bg-emerald-500/15 text-[#00e676] border border-emerald-500/30 flex items-center justify-center font-black shrink-0 shadow-sm ${className}`}
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      </div>
    );
  }

  // ── Generic Withdrawal ──
  if (cleanType === "withdrawal") {
    return (
      <div
        className={`${sizeClasses} bg-rose-500/15 text-rose-400 border border-rose-500/30 flex items-center justify-center font-black shrink-0 shadow-sm ${className}`}
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
        </svg>
      </div>
    );
  }

  // ── Investment / Reinvestment ──
  if (cleanType === "investment" || cleanType === "reinvestment") {
    return (
      <div
        className={`${sizeClasses} bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 flex items-center justify-center font-black shrink-0 shadow-sm ${className}`}
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      </div>
    );
  }

  // ── Referral Bonus ──
  if (cleanType === "bonus") {
    return (
      <div
        className={`${sizeClasses} bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center justify-center font-black shrink-0 shadow-sm ${className}`}
      >
        <span className="text-sm">🎁</span>
      </div>
    );
  }

  // ── Loan ──
  if (cleanType.includes("loan")) {
    return (
      <div
        className={`${sizeClasses} bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 flex items-center justify-center font-black shrink-0 shadow-sm ${className}`}
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
    );
  }

  // Fallback Crypto / Coin Icon
  return (
    <div
      className={`${sizeClasses} bg-[#00c076]/15 text-[#00e676] border border-[#00c076]/30 flex items-center justify-center font-black shrink-0 shadow-sm ${className}`}
    >
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    </div>
  );
};

export default AssetLogo;
