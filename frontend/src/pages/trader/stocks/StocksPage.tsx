import { useState } from "react";

export default function StocksPage() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
      setEmail("");
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-12 px-4 flex flex-col items-center justify-center min-h-[70vh] text-center space-y-6 text-white">
      {/* Icon */}
      <div className="w-16 h-16 rounded-3xl bg-emerald-500/15 text-[#00e676] flex items-center justify-center text-3xl shadow-sm border border-emerald-500/30">
        📈
      </div>

      {/* Hero text */}
      <div className="space-y-2 max-w-xl">
        <span className="text-[10px] font-bold text-[#00e676] bg-emerald-500/15 border border-emerald-500/30 px-3 py-1 rounded-full uppercase tracking-wider">
          Coming Soon
        </span>
        <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight pt-2">
          Global Equities & Stocks Trading
        </h1>
        <p className="text-xs md:text-sm text-slate-400 leading-relaxed">
          Access US, European, and emerging equity markets directly from Alpha Rise Global. Trade shares in Apple, Tesla, Nvidia, and more with institutional liquidity routing.
        </p>
      </div>

      {/* Subscription/Waitlist Box */}
      <div className="bg-[#121822] border border-white/10 rounded-3xl p-6 md:p-8 max-w-md w-full shadow-xl space-y-4 text-white">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider">Get Early Access</h2>
        <p className="text-xs text-slate-400 leading-relaxed">
          Join our stocks trading waitlist and get notified as soon as beta allocations are opened.
        </p>

        {subscribed ? (
          <div className="p-4 bg-emerald-500/15 border border-emerald-500/30 text-xs text-[#00e676] font-bold rounded-2xl animate-fade-in flex items-center justify-center gap-2">
            <svg className="w-4 h-4 text-[#00e676] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
            Thank you! You have been added to the waitlist.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="flex-1 px-4 py-2.5 rounded-xl border border-white/10 bg-[#0e1520] text-white text-xs focus:outline-none focus:border-[#00c076]"
            />
            <button
              type="submit"
              className="px-5 py-2.5 bg-[#00c076] hover:bg-[#00e676] text-[#080c10] text-xs font-black rounded-xl shadow-md shadow-[#00c076]/20 transition-all whitespace-nowrap cursor-pointer"
            >
              Notify Me
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
