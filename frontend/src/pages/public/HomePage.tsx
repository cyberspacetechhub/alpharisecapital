import { useState } from "react";
import { useNavigate } from "react-router-dom";

const MARKETS = [
  {
    name: "Gold & Silvers",
    desc: "Gain exposure to physical precious metals indices. Safeguard your portfolio from inflation and currency debasement by allocating capital to institutional-grade bullion contracts with verified clearing house backing.",
    image: "https://images.unsplash.com/photo-1610375461246-83df859d849d?auto=format&fit=crop&w=600&q=80",
  },
  {
    name: "Stocks & Bonds",
    desc: "Trade blue-chip equities and sovereign bond yields. Compete in international stock index markets with up to 100x leverage and execute instant hedges on major tech conglomerates and sovereign treasuries.",
    image: "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&w=600&q=80",
  },
  {
    name: "Daily Investment",
    desc: "Access our fixed-rate daily liquidity pool agreements. Park cash inside structured short-term yield curves that compound daily profit rates directly into your withdrawable wallet balance.",
    image: "https://images.unsplash.com/photo-1621761191319-c6fb62004040?auto=format&fit=crop&w=600&q=80",
  },
  {
    name: "Job Offer",
    desc: "Collaborate as an institutional affiliate or regional partner. Earn monthly commissions, direct trading bonuses, and unlock career promotion opportunities by referring active capital to our platform.",
    image: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=600&q=80",
  },
  {
    name: "Loan Grants",
    desc: "Obtain capital matching grants based on your credit scores. Leverage your margin holdings to apply for low-interest liquidity loans to expand open trades or fund external payout operations.",
    image: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=600&q=80",
  },
  {
    name: "Real Estate",
    desc: "Acquire fractional shares in prime commercial real estate. Diversify your holdings through real-estate backed yield tokens that pay monthly distributions derived from physical lease agreements.",
    image: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=600&q=80",
  },
];

const HOW_IT_WORKS = [
  {
    title: "Create Account",
    desc: "Register details in minutes.",
    icon: (
      <svg className="w-6 h-6 text-[#2d6a4f]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
      </svg>
    ),
  },
  {
    title: "Choose a Plan",
    desc: "Select high-yield investment contracts.",
    icon: (
      <svg className="w-6 h-6 text-[#2d6a4f]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
  },
  {
    title: "Make Deposit",
    desc: "Instantly fund with crypto/cash.",
    icon: (
      <svg className="w-6 h-6 text-[#2d6a4f]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm-5-4a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0z" />
      </svg>
    ),
  },
  {
    title: "Get Confirmation",
    desc: "Approved by platform auditors.",
    icon: (
      <svg className="w-6 h-6 text-[#2d6a4f]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    title: "Earn Daily Profit",
    desc: "Payouts drop every cycle.",
    icon: (
      <svg className="w-6 h-6 text-[#2d6a4f]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
    ),
  },
  {
    title: "Withdraw Anytime",
    desc: "Instantly withdraw to wallet.",
    icon: (
      <svg className="w-6 h-6 text-[#2d6a4f]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
      </svg>
    ),
  },
];

const INVESTMENT_PLANS = [
  { name: "Bronze Plan", min: 100, max: 1999, roi: 2.5, duration: 15, label: "Starter tier" },
  { name: "Silver Plan", min: 2000, max: 9999, roi: 3.8, duration: 30, label: "Medium yield" },
  { name: "Gold Plan", min: 10000, max: 49999, roi: 5.2, duration: 60, label: "High earner" },
  { name: "Platinum Plan", min: 50000, max: 250000, roi: 7.5, duration: 90, label: "Ultra returns" },
];

const MOCK_DEPOSITS = [
  { user: "Alexander K.", amount: 15000, coin: "BTC", time: "2 mins ago" },
  { user: "Chen W.", amount: 840, coin: "USDT", time: "5 mins ago" },
  { user: "Sarah M.", amount: 4300, coin: "ETH", time: "12 mins ago" },
  { user: "David L.", amount: 25000, coin: "Bank Wire", time: "18 mins ago" },
];

const MOCK_WITHDRAWALS = [
  { user: "Marcus P.", amount: 3200, coin: "BTC", time: "1 min ago" },
  { user: "Emily S.", amount: 120, coin: "SOL", time: "4 mins ago" },
  { user: "Aiko N.", amount: 9500, coin: "ETH", time: "9 mins ago" },
  { user: "Carlos T.", amount: 1400, coin: "XRP", time: "15 mins ago" },
];

const FAQS = [
  {
    q: "How does Alpha Rise Global secure my capital?",
    a: "We utilize cold storage multi-signature custodian wallets for all digital deposits. Cash holdings are insured and held inside verified institutional clearing houses, keeping client portfolios isolated from operational balances.",
  },
  {
    q: "What is the borrowing protocol and loan limit?",
    a: "Every registered trader has an initial default borrowing limit which can be unlocked up to custom thresholds by making deposits and maintaining a high credit score. Loan applications require agreement to auto-debit clauses upon maturity.",
  },
  {
    q: "Can I manage positions manually?",
    a: "Yes. Traders have full access to our margin portal where you can open LONG/SHORT positions with up to 100x leverage, adjust Stop Loss / Take Profit prices, and trigger manual close options at any time.",
  },
  {
    q: "Are withdrawals subject to lock-up periods?",
    a: "No. You can request withdrawals at any time. Standard investment plans accrue daily and payouts clear into your available balance, which can be withdrawn without restriction using any of our registered payout methods.",
  },
];

const HERO_BARS = [45, 68, 52, 85, 60, 92, 75, 88, 64, 98, 78, 90, 72, 82, 60];

export default function HomePage() {
  const navigate = useNavigate();
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [hoveredBarIndex, setHoveredBarIndex] = useState<number | null>(null);

  return (
    <div className="bg-[#f5f8f5] font-sans text-gray-700 antialiased selection:bg-[#2d6a4f]/10 selection:text-[#1a3a2a]">
      
      {/* CSS-based smooth marquee animation */}
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee-loop {
          display: flex;
          width: max-content;
          animation: marquee 25s linear infinite;
        }
        .animate-marquee-loop:hover {
          animation-play-state: paused;
        }
      `}</style>

      {/* ─── HERO SECTION WITH INTERACTIVE HISTOGRAM GRAPH ─── */}
      <section className="py-20 md:py-32 px-6 md:px-12 max-w-7xl mx-auto w-full relative">
        {/* Soft Background glow bubble */}
        <div className="absolute top-1/4 right-10 w-[450px] h-[450px] rounded-full bg-emerald-100/30 blur-3xl -z-10 pointer-events-none" />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          
          {/* Left Text content */}
          <div className="space-y-8">
            <span className="text-xs font-extrabold text-[#2d6a4f] bg-[#e6f4ea] border border-[#c4e1ce] px-4 py-1.5 rounded-full uppercase tracking-wider inline-block">
              Institutional Asset Management
            </span>
            <h1 className="text-4xl md:text-6xl font-black text-slate-850 leading-tight">
              Invest with Confidence.<br />
              <span className="text-[#2d6a4f]">Borrow with Ease.</span>
            </h1>
            <p className="text-base md:text-lg text-slate-500 leading-relaxed max-w-xl">
              Unlock access to institutional liquidity pools, fixed-yield investment contracts, and margin trading limits. Alpha Rise Global is your gateway to diversified capital compounding.
            </p>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-4">
              <button
                onClick={() => navigate("/register")}
                className="px-8 py-4 rounded-2xl bg-[#1a3a2a] hover:bg-[#2d6a4f] text-sm font-black text-white text-center transition-all shadow-lg shadow-[#1a3a2a]/20 hover:scale-[1.01]"
              >
                Create Free Account
              </button>
              <button
                onClick={() => navigate("/login")}
                className="px-8 py-4 rounded-2xl border border-slate-200 hover:bg-slate-50 text-sm font-black text-slate-700 text-center transition-all hover:border-slate-350 hover:scale-[1.01]"
              >
                Access Portal
              </button>
            </div>
          </div>

          {/* Right Dashboard-relatable Portfolio Chart */}
          <div className="bg-white border border-slate-100/90 rounded-[40px] p-8 shadow-[0_30px_80px_rgba(15,23,42,0.08)] space-y-8 max-w-[460px] mx-auto w-full relative">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">
                  Total Balance
                </p>
                <h2 className="text-3xl font-black text-slate-900 mt-1">
                  $248,590.00
                </h2>
                <div className="flex items-center gap-1.5 mt-2 text-emerald-600 text-xs font-extrabold">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                  +12.4% this month
                </div>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-[#1a3a2a] flex items-center justify-center shadow-md shadow-[#1a3a2a]/10">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
            </div>

            {/* Interactive Histogram bar chart */}
            <div className="relative">
              {hoveredBarIndex !== null && (
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-[#0b1b14] text-white px-3 py-1.5 rounded-lg text-[10px] font-mono font-bold shadow-lg flex items-center gap-1.5 z-10 transition-all">
                  <span>Cycle Value:</span>
                  <span className="text-emerald-400">+${(HERO_BARS[hoveredBarIndex] * 125).toLocaleString()}</span>
                </div>
              )}

              <div className="bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 h-28 flex items-end gap-1.5">
                {HERO_BARS.map((height, i) => (
                  <div
                    key={i}
                    onMouseEnter={() => setHoveredBarIndex(i)}
                    onMouseLeave={() => setHoveredBarIndex(null)}
                    className={`flex-1 rounded-full cursor-pointer transition-all duration-300 ${
                      hoveredBarIndex === i
                        ? 'bg-emerald-600 scale-y-110 shadow-md shadow-emerald-500/20'
                        : i === 12
                        ? 'bg-[#1a3a2a]'
                        : 'bg-slate-200 hover:bg-slate-300'
                    }`}
                    style={{ height: `${height}%` }}
                  />
                ))}
              </div>
            </div>

            {/* Transactions items */}
            <div className="space-y-4">
              <p className="text-slate-400 text-xs uppercase tracking-wider font-extrabold">
                Recent Ledger Activities
              </p>
              <div className="space-y-3.5">
                {[
                  { name: "BTC Payout Approved", amt: "+$8,500.00", color: "text-emerald-600", bg: "bg-emerald-50 text-emerald-600" },
                  { name: "Standard Plan Maturity", amt: "+$12,400.00", color: "text-emerald-600", bg: "bg-emerald-50 text-emerald-600" },
                  { name: "Leveraged Long Sol", amt: "-$2,450.00", color: "text-red-500", bg: "bg-red-50 text-red-500" }
                ].map((tx, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold ${tx.bg}`}>
                        ⇄
                      </div>
                      <span className="text-xs font-bold text-slate-700">{tx.name}</span>
                    </div>
                    <span className={`text-xs font-extrabold ${tx.color}`}>{tx.amt}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── MARQUEE PAYMENT SYSTEMS ─── */}
      <section className="bg-white border-y border-gray-100 py-12 overflow-hidden w-full relative">
        <div className="animate-marquee-loop flex gap-12 items-center">
          
          {/* First loop iterations */}
          {[
            { name: "Bitcoin (BTC)", net: "Network: Bitcoin Core", icon: "🪙" },
            { name: "Ethereum (ETH)", net: "Network: ERC-20", icon: "Ξ" },
            { name: "Solana (SOL)", net: "Network: Solana Pay", icon: "◎" },
            { name: "Binance Coin", net: "Network: BEP-20", icon: "B" },
            { name: "Ripple (XRP)", net: "Network: RippleNet", icon: "✕" },
            { name: "Bank Transfer", net: "Network: Swift / Sepa", icon: "💳" },
          ].concat([
            { name: "Bitcoin (BTC)", net: "Network: Bitcoin Core", icon: "🪙" },
            { name: "Ethereum (ETH)", net: "Network: ERC-20", icon: "Ξ" },
            { name: "Solana (SOL)", net: "Network: Solana Pay", icon: "◎" },
            { name: "Binance Coin", net: "Network: BEP-20", icon: "B" },
            { name: "Ripple (XRP)", net: "Network: RippleNet", icon: "✕" },
            { name: "Bank Transfer", net: "Network: Swift / Sepa", icon: "💳" },
          ]).map((item, idx) => (
            <div key={idx} className="border border-slate-100 bg-slate-50/40 rounded-2xl px-8 py-5 shrink-0 flex items-center gap-4 min-w-[240px]">
              <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm text-sm font-extrabold text-[#2d6a4f] shrink-0 border border-slate-100">
                {item.icon}
              </div>
              <div className="text-left">
                <span className="text-xs font-bold text-slate-800 block leading-tight">{item.name}</span>
                <span className="text-[9px] font-mono text-slate-400 block mt-0.5">{item.net}</span>
              </div>
            </div>
          ))}

        </div>
      </section>

      {/* ─── HOW IT WORKS SECTION ─── */}
      <section id="about" className="py-20 md:py-32 px-6 md:px-12 max-w-7xl mx-auto w-full space-y-20">
        <div className="text-center space-y-3">
          <span className="text-xs font-extrabold text-[#2d6a4f] uppercase tracking-wider bg-green-50 px-4 py-1.5 rounded-full inline-block">
            Methodology
          </span>
          <h2 className="text-3xl md:text-5xl font-black text-slate-850">Clear Roadmap to Yield Accumulation</h2>
          <p className="text-sm md:text-base text-slate-500 max-w-lg mx-auto">Get started in minutes with our transparent six-step pipeline.</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 md:gap-6">
          {HOW_IT_WORKS.map((step, idx) => (
            <div key={idx} className="bg-white border border-slate-100 rounded-3xl p-6 shadow-[0_15px_40px_rgba(45,106,79,0.02)] space-y-6 relative flex flex-col justify-between hover:translate-y-[-4px] transition-transform min-h-[220px]">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50/80 border border-emerald-100/50 flex items-center justify-center shadow-sm shrink-0">
                {step.icon}
              </div>
              <span className="absolute top-4 right-4 text-3xl font-black opacity-30 text-green-900 font-mono">0{idx + 1}</span>
              <div className="space-y-2">
                <h3 className="text-sm font-bold text-slate-850 leading-tight">{step.title}</h3>
                <p className="text-xs text-slate-400 leading-normal">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── PROVEN SOLUTIONS (MARKETS) WITH BASE BACKGROUND IMAGE ─── */}
      <section id="markets" className="relative bg-slate-950 overflow-hidden py-28 md:py-40 px-6 md:px-12">
        {/* Background base image */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=1400&q=80"
            alt="Markets background"
            className="w-full h-full object-cover opacity-15"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950/80 via-slate-950/50 to-slate-950" />
        </div>

        <div className="max-w-7xl mx-auto space-y-20 relative z-10">
          <div className="text-center space-y-3">
            <span className="text-xs font-extrabold text-[#52b788] uppercase tracking-wider bg-white/10 border border-white/15 px-4 py-1.5 rounded-full shadow-sm">
              Global Asset Channels
            </span>
            <h2 className="text-3xl md:text-5xl font-black text-white">Alpha Rise Global Markets Portfolio</h2>
            <p className="text-sm md:text-base text-slate-400 max-w-lg mx-auto">Diverse high-yield products offering robust parameters for long-term equity growth.</p>
          </div>

          {/* 3 cards per row layout */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {MARKETS.map((market) => (
              <div key={market.name} className="bg-white/[0.03] border border-white/10 backdrop-blur-lg rounded-[32px] overflow-hidden flex flex-col hover:bg-white/[0.07] hover:border-white/20 transition-all duration-300 group hover:-translate-y-1">
                <div className="h-44 w-full overflow-hidden relative">
                  <img
                    src={market.image}
                    alt={market.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
                </div>
                <div className="p-6 space-y-3 flex-grow flex flex-col justify-between">
                  <div>
                    <h3 className="text-base font-extrabold text-white leading-tight group-hover:text-emerald-400 transition-colors mb-2">{market.name}</h3>
                    <p className="text-xs md:text-sm text-slate-350 leading-relaxed">{market.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── INVESTMENT PLANS ─── */}
      <section id="plans" className="py-24 md:py-36 px-6 md:px-12 max-w-7xl mx-auto w-full space-y-20">
        <div className="text-center space-y-3">
          <span className="text-xs font-extrabold text-[#2d6a4f] uppercase tracking-wider bg-green-50 px-4 py-1.5 rounded-full inline-block">
            Yield Rates
          </span>
          <h2 className="text-3xl md:text-5xl font-black text-slate-855">Fixed-ROI Program Plans</h2>
          <p className="text-sm md:text-base text-slate-550 max-w-md mx-auto">Choose an investment plan tailored to your liquidity preferences.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {INVESTMENT_PLANS.map((plan) => (
            <div key={plan.name} className="bg-white border border-slate-100 rounded-[32px] p-8 shadow-[0_15px_40px_rgba(45,106,79,0.02)] flex flex-col justify-between relative overflow-hidden min-h-[380px] hover:border-[#2d6a4f]/30 transition-all">
              <span className="absolute top-3 right-3 text-[10px] bg-emerald-50 text-emerald-800 font-extrabold px-3 py-1.5 rounded-full uppercase tracking-wider">
                {plan.label}
              </span>
              <div>
                <h3 className="text-base font-extrabold text-slate-855 mb-4">{plan.name}</h3>
                <div className="text-4xl font-black text-[#2d6a4f] font-mono mb-4">
                  {plan.roi}% <span className="text-xs text-gray-400 font-normal">Daily ROI</span>
                </div>
                <div className="text-xs text-slate-500 space-y-2.5 border-y border-slate-100 py-4 mb-6">
                  <div className="flex justify-between">
                    <span>Min Deposit:</span>
                    <strong className="text-slate-700">${plan.min.toLocaleString()}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Max Limit:</span>
                    <strong className="text-slate-700">${plan.max.toLocaleString()}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Term length:</span>
                    <strong className="text-slate-700">{plan.duration} Days</strong>
                  </div>
                </div>
              </div>
              <button
                onClick={() => navigate("/register")}
                className="w-full py-3.5 bg-[#1a3a2a] hover:bg-[#2d6a4f] text-xs font-black text-white rounded-xl transition-all text-center block shadow-md hover:shadow-lg shadow-[#1a3a2a]/10"
              >
                Invest Now
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* ─── RECENT DEPOSITS & WITHDRAWALS LEDGERS ─── */}
      <section className="bg-white border-y border-gray-100 py-24 md:py-36 px-6 md:px-12">
        <div className="max-w-7xl mx-auto space-y-20">
          <div className="text-center space-y-3">
            <span className="text-xs font-extrabold text-[#2d6a4f] uppercase tracking-wider bg-green-50 px-4 py-1.5 rounded-full inline-block">
              Ledger Logs
            </span>
            <h2 className="text-3xl md:text-5xl font-black text-slate-850">Platform Activity Feeds</h2>
            <p className="text-sm md:text-base text-slate-550 max-w-md mx-auto">Live updates of verified funding settlements and payouts clearing.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            
            {/* Deposits */}
            <div className="space-y-5">
              <h3 className="text-sm font-extrabold text-gray-750 uppercase tracking-wider flex items-center gap-2">
                <span className="w-2.5 h-2.5 bg-green-500 rounded-full animate-ping" />
                Recent Deposits
              </h3>
              <div className="border border-slate-100 rounded-[32px] overflow-hidden shadow-[0_15px_40px_rgba(15,23,42,0.01)] bg-white">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                      <th className="px-6 py-4">User</th>
                      <th className="px-6 py-4 text-right">Settled Amount</th>
                      <th className="px-6 py-4">Method</th>
                      <th className="px-6 py-4 text-right">Age</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-655">
                    {MOCK_DEPOSITS.map((d, i) => (
                      <tr key={i} className="hover:bg-slate-50/40">
                        <td className="px-6 py-4 text-slate-800 font-extrabold">{d.user}</td>
                        <td className="px-6 py-4 text-right font-mono font-bold text-slate-700">${d.amount.toLocaleString()}</td>
                        <td className="px-6 py-4 text-slate-550 font-black">{d.coin}</td>
                        <td className="px-6 py-4 text-right text-slate-450">{d.time}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Withdrawals */}
            <div className="space-y-5">
              <h3 className="text-sm font-extrabold text-gray-750 uppercase tracking-wider flex items-center gap-2">
                <span className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-ping" />
                Recent Payouts
              </h3>
              <div className="border border-slate-100 rounded-[32px] overflow-hidden shadow-[0_15px_40px_rgba(15,23,42,0.01)] bg-white">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                      <th className="px-6 py-4">User</th>
                      <th className="px-6 py-4 text-right">Cleared Payout</th>
                      <th className="px-6 py-4">Gateway</th>
                      <th className="px-6 py-4 text-right">Age</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-655">
                    {MOCK_WITHDRAWALS.map((w, i) => (
                      <tr key={i} className="hover:bg-slate-50/40">
                        <td className="px-6 py-4 text-slate-805 font-extrabold">{w.user}</td>
                        <td className="px-6 py-4 text-right font-mono font-bold text-[#2d6a4f]">${w.amount.toLocaleString()}</td>
                        <td className="px-6 py-4 text-slate-550 font-black">{w.coin}</td>
                        <td className="px-6 py-4 text-right text-slate-450">{w.time}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ─── FINANCIAL FREEDOM & STATS ─── */}
      <section className="py-24 md:py-36 px-6 md:px-12 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left Text Perks */}
          <div className="space-y-8">
            <span className="text-xs font-extrabold text-[#2d6a4f] uppercase tracking-wider bg-green-50 px-4 py-1.5 rounded-full inline-block">
              Platform Perks
            </span>
            <h2 className="text-3xl md:text-5xl font-extrabold text-slate-855">Your Path to Financial Autonomy</h2>
            <p className="text-sm md:text-base text-slate-500 leading-relaxed max-w-lg">
              Mitigate systemic risks with secure liquidity parameters. We provide key components facilitating client-controlled investment compounding.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
              <div className="p-6 border border-slate-100 rounded-3xl bg-white space-y-3 shadow-[0_15px_40px_rgba(15,23,42,0.01)] hover:-translate-y-0.5 transition-transform">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">Custodian Security</h4>
                <p className="text-xs text-slate-400">Secured with multi-sig encryption layers.</p>
              </div>
              <div className="p-6 border border-slate-100 rounded-3xl bg-white space-y-3 shadow-[0_15px_40px_rgba(15,23,42,0.01)] hover:-translate-y-0.5 transition-transform">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                  <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">Instant Loans</h4>
                <p className="text-xs text-slate-400">Immediate approval based on credit scores.</p>
              </div>
            </div>
          </div>

          {/* Right Stats Grid */}
          <div className="bg-white border border-slate-100 rounded-[36px] p-8 md:p-12 shadow-[0_20px_60px_rgba(15,23,42,0.03)] grid grid-cols-2 gap-8 text-center">
            <div className="space-y-2">
              <span className="text-4xl md:text-5xl font-black text-[#1a3a2a] block font-mono">24,000+</span>
              <span className="text-[10px] text-gray-450 font-extrabold uppercase tracking-widest block">Registered Accounts</span>
            </div>
            <div className="space-y-2">
              <span className="text-4xl md:text-5xl font-black text-[#1a3a2a] block font-mono">1.5M+</span>
              <span className="text-[10px] text-gray-450 font-extrabold uppercase tracking-widest block">Active Trades</span>
            </div>
            <div className="space-y-2">
              <span className="text-4xl md:text-5xl font-black text-[#2d6a4f] block font-mono">$450M+</span>
              <span className="text-[10px] text-gray-450 font-extrabold uppercase tracking-widest block">Total Deposits</span>
            </div>
            <div className="space-y-2">
              <span className="text-4xl md:text-5xl font-black text-[#2d6a4f] block font-mono">$380M+</span>
              <span className="text-[10px] text-gray-450 font-extrabold uppercase tracking-widest block">Total Payouts</span>
            </div>
          </div>
        </div>
      </section>

      {/* ─── COMPANY TIMELINE ─── */}
      <section className="bg-[#f0f4f1] border-y border-gray-100 py-24 md:py-36 px-6 md:px-12">
        <div className="max-w-4xl mx-auto space-y-16">
          <div className="text-center space-y-3">
            <span className="text-xs font-extrabold text-[#2d6a4f] uppercase tracking-wider bg-white px-4 py-1.5 rounded-full shadow-sm inline-block">
              Chronology
            </span>
            <h2 className="text-3xl font-black text-slate-850">Platform Timeline</h2>
            <p className="text-sm text-slate-550 max-w-sm mx-auto">Trace Alpha Rise Global's evolution from conceptualization to global operations.</p>
          </div>

          <div className="relative border-l-2 border-emerald-250 ml-4 space-y-12 pb-4">
            {/* Year 2023 */}
            <div className="relative pl-8">
              <span className="absolute left-[-7px] top-1.5 w-3.5 h-3.5 rounded-full bg-[#1a3a2a] border-2 border-white" />
              <div className="space-y-1.5">
                <span className="text-sm font-black text-[#2d6a4f] font-mono block">Q1 2023 — Setup & Foundation</span>
                <p className="text-xs text-gray-655 max-w-2xl leading-relaxed">Alpha Rise Global incorporated. Initiated structural planning and cold storage vault architectures.</p>
              </div>
            </div>

            {/* Year 2024 */}
            <div className="relative pl-8">
              <span className="absolute left-[-7px] top-1.5 w-3.5 h-3.5 rounded-full bg-[#2d6a4f] border-2 border-white" />
              <div className="space-y-1.5">
                <span className="text-sm font-black text-[#2d6a4f] font-mono block">Q3 2024 — Margin Trading Launch</span>
                <p className="text-xs text-gray-655 max-w-2xl leading-relaxed">Released our high-frequency leverage margin trading engine, allowing up to 100x custom contracts.</p>
              </div>
            </div>

            {/* Year 2025 */}
            <div className="relative pl-8">
              <span className="absolute left-[-7px] top-1.5 w-3.5 h-3.5 rounded-full bg-[#52b788] border-2 border-white" />
              <div className="space-y-1.5">
                <span className="text-sm font-black text-[#2d6a4f] font-mono block">Q2 2025 — Credit System Release</span>
                <p className="text-xs text-gray-655 max-w-2xl leading-relaxed">Deployed our Zod-driven credit audit services. Borrowing score triggers and limit modifications integrated.</p>
              </div>
            </div>

            {/* Year 2026 */}
            <div className="relative pl-8">
              <span className="absolute left-[-7px] top-1.5 w-3.5 h-3.5 rounded-full bg-emerald-300 animate-ping border-2 border-white" />
              <span className="absolute left-[-7px] top-1.5 w-3.5 h-3.5 rounded-full bg-[#74c69d] border-2 border-white" />
              <div className="space-y-1.5">
                <span className="text-sm font-black text-[#2d6a4f] font-mono block">2026 — Global Operations Expansion</span>
                <p className="text-xs text-gray-655 max-w-2xl leading-relaxed">Opening next-gen multi-asset support. Launching fractional real estate shares and stock listings.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FREQUENTLY ASKED QUESTIONS (FAQ) ─── */}
      <section id="faq" className="py-24 md:py-36 px-6 md:px-12 max-w-4xl mx-auto w-full space-y-16">
        <div className="text-center space-y-3">
          <span className="text-xs font-extrabold text-[#2d6a4f] uppercase tracking-wider bg-green-50 px-4 py-1.5 rounded-full inline-block">
            FAQ Desk
          </span>
          <h2 className="text-3xl font-black text-slate-850">Frequently Asked Questions</h2>
          <p className="text-sm text-slate-550">Clear information regarding deposits, security standards, and credit rates.</p>
        </div>

        <div className="space-y-4">
          {FAQS.map((faq, idx) => (
            <div key={idx} className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
              <button
                onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                className="w-full px-6 py-5 text-left flex items-center justify-between text-sm font-bold text-slate-700 hover:bg-gray-50 transition-colors"
              >
                <span>{faq.q}</span>
                <span className="text-sm text-slate-400 font-mono">{activeFaq === idx ? "−" : "+"}</span>
              </button>
              {activeFaq === idx && (
                <div className="px-6 pb-5 text-xs md:text-sm text-gray-500 leading-relaxed border-t border-slate-100 pt-4 bg-gray-50/10">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}
