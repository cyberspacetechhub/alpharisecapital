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
    <div className="max-w-4xl mx-auto py-12 px-4 flex flex-col items-center justify-center min-h-[70vh] text-center space-y-6">
      {/* Icon */}
      <div className="w-16 h-16 rounded-3xl bg-[#e6f4ea] text-[#2d6a4f] flex items-center justify-center text-3xl shadow-sm border border-[#c4e1ce] animate-bounce">
        📈
      </div>

      {/* Hero text */}
      <div className="space-y-2 max-w-xl">
        <span className="text-[10px] font-bold text-[#2d6a4f] bg-[#e6f4ea] border border-[#c4e1ce] px-3 py-1 rounded-full uppercase tracking-wider">
          Coming Soon
        </span>
        <h1 className="text-2xl md:text-3xl font-extrabold text-gray-800 tracking-tight pt-2">
          Global Stocks Trading
        </h1>
        <p className="text-xs md:text-sm text-gray-400 leading-relaxed">
          Access US, European, and emerging equity markets directly from Alpha Rise Global. Trade shares in Apple, Tesla, Nvidia, and more with 0% commission.
        </p>
      </div>

      {/* Subscription/Waitlist Box */}
      <div className="bg-white border border-gray-100 rounded-3xl p-6 md:p-8 max-w-md w-full shadow-sm space-y-4">
        <h2 className="text-sm font-semibold text-gray-800">Get early access</h2>
        <p className="text-xs text-gray-400 leading-relaxed">
          Join our stocks trading waitlist and get notified as soon as beta allocations are opened.
        </p>

        {subscribed ? (
          <div className="p-4 bg-green-50 border border-green-100 text-xs text-emerald-700 font-semibold rounded-2xl animate-fade-in flex items-center justify-center gap-2">
            <svg className="w-4 h-4 text-emerald-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
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
              className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#2d6a4f] focus:border-transparent"
            />
            <button
              type="submit"
              className="px-5 py-2.5 bg-[#1a3a2a] hover:bg-[#2d6a4f] text-white text-xs font-bold rounded-xl transition-colors whitespace-nowrap"
            >
              Notify Me
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
