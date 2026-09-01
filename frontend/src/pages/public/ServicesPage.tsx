import { useNavigate } from "react-router-dom";

export default function ServicesPage() {
  const navigate = useNavigate();

  return (
    <div className="bg-[#0b0f14] text-slate-100 py-20 px-6 md:px-12">
      <div className="max-w-6xl mx-auto space-y-16">
        
        {/* Hero */}
        <div className="text-center space-y-4">
          <span className="text-xs font-extrabold text-[#00e676] bg-[#00c076]/15 border border-[#00c076]/30 px-4 py-1.5 rounded-full uppercase tracking-wider inline-block">
            Our Services
          </span>
          <h1 className="text-4xl md:text-6xl font-black text-white leading-tight">
            Financial & Yield Facilities
          </h1>
          <p className="text-base md:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
            We provide a diverse suite of automated solutions designed to facilitate asset growth, leverage trading, and daily compound yield.
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Card 1: Fixed-Yield Investments */}
          <div className="bg-[#121822] border border-white/10 rounded-[32px] p-8 space-y-6 shadow-lg hover:border-[#00c076]/40 hover:shadow-[0_10px_30px_rgba(0,192,118,0.1)] transition-all">
            <div className="w-14 h-14 rounded-2xl bg-[#00c076]/15 border border-[#00c076]/30 flex items-center justify-center text-[#00e676]">
              <svg className="w-8 h-8 text-[#00e676]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-extrabold text-white">Fixed-Yield Programs</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Allocate capital across structured tiers starting from $100. Earn automated daily ROI percentages (up to 7.5% depending on package choice) compounded directly into your account dashboard.
              </p>
            </div>
            <ul className="text-xs text-slate-400 space-y-1.5 border-t border-white/10 pt-4">
              <li>• Automated daily earnings ledger deposits</li>
              <li>• Flexible cycle periods (15 to 90 Days)</li>
              <li>• Option to reinvest initial balances on maturity</li>
            </ul>
          </div>

          {/* Card 2: Leveraged Margin Positions */}
          <div className="bg-[#121822] border border-white/10 rounded-[32px] p-8 space-y-6 shadow-lg hover:border-[#00c076]/40 hover:shadow-[0_10px_30px_rgba(0,192,118,0.1)] transition-all">
            <div className="w-14 h-14 rounded-2xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <svg className="w-8 h-8 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-extrabold text-white">Margin Trading Positions</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Compete in global foreign exchange, crypto, and precious metals markets. Open LONG or SHORT positions with up to 100x leverage and manage risk parameters using Stop Loss / Take Profit bounds.
              </p>
            </div>
            <ul className="text-xs text-slate-400 space-y-1.5 border-t border-white/10 pt-4">
              <li>• Real-time ticked pricing feeds</li>
              <li>• Leverage ranges from 5x to 100x</li>
              <li>• Double-check margin calls before open</li>
            </ul>
          </div>

          {/* Card 3: Dynamic Staking Pools */}
          <div className="bg-[#121822] border border-white/10 rounded-[32px] p-8 space-y-6 shadow-lg hover:border-[#00c076]/40 hover:shadow-[0_10px_30px_rgba(0,192,118,0.1)] transition-all">
            <div className="w-14 h-14 rounded-2xl bg-[#00c076]/15 border border-[#00c076]/30 flex items-center justify-center text-[#00e676]">
              <svg className="w-8 h-8 text-[#00e676]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-extrabold text-white">Staking & Yield Pools</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Access automated high-yield staking liquidity pools directly from the platform. Yield multipliers scale in accordance with user allocations and compounding terms.
              </p>
            </div>
            <ul className="text-xs text-slate-400 space-y-1.5 border-t border-white/10 pt-4">
              <li>• Automated compounding smart contracts</li>
              <li>• Transparent daily distribution ledgers</li>
              <li>• Instant withdrawable rewards with zero lock-ups</li>
            </ul>
          </div>

          {/* Card 4: Multi-Asset Custodian Wallet */}
          <div className="bg-[#121822] border border-white/10 rounded-[32px] p-8 space-y-6 shadow-lg hover:border-[#00c076]/40 hover:shadow-[0_10px_30px_rgba(0,192,118,0.1)] transition-all">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <svg className="w-8 h-8 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-extrabold text-white">Custodian Wallet Settlements</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Deposit and withdraw using various crypto networks. Check real-time ticking USD conversion rates for multi-sig vault holdings (BTC, ETH, SOL, BNB, XRP).
              </p>
            </div>
            <ul className="text-xs text-slate-400 space-y-1.5 border-t border-white/10 pt-4">
              <li>• Multi-sig cold storage custodians</li>
              <li>• Instant withdrawal routing settlements</li>
              <li>• Zero hidden processing rates</li>
            </ul>
          </div>
        </div>

        {/* CTA */}
        <div className="bg-[#121822] border border-white/10 text-white rounded-[40px] p-8 md:p-12 text-center space-y-6 relative overflow-hidden mt-12 shadow-2xl">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(0,192,118,0.15),transparent_50%)]" />
          <h3 className="text-2xl md:text-4xl font-black relative z-10 font-bold">Ready to Start Compounding?</h3>
          <p className="text-xs md:text-sm text-slate-400 max-w-lg mx-auto relative z-10 leading-relaxed">
            Create an account, submit your KYC validation papers, and allocate funding to the fixed yield plans.
          </p>
          <div className="relative z-10 pt-2">
            <button
              onClick={() => navigate("/register")}
              className="px-8 py-3.5 bg-[#00c076] hover:bg-[#00e676] text-[#080c10] text-xs font-black rounded-2xl transition-all shadow-lg shadow-[#00c076]/25"
            >
              Get Started Now
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
