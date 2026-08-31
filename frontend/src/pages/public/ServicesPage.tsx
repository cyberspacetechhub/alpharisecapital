import { useNavigate } from "react-router-dom";

export default function ServicesPage() {
  const navigate = useNavigate();

  return (
    <div className="bg-[#f5f8f5] py-20 px-6 md:px-12">
      <div className="max-w-6xl mx-auto space-y-16">
        
        {/* Hero */}
        <div className="text-center space-y-4">
          <span className="text-xs font-extrabold text-[#2d6a4f] bg-[#e6f4ea] border border-[#c4e1ce] px-4 py-1.5 rounded-full uppercase tracking-wider inline-block">
            Our Services
          </span>
          <h1 className="text-4xl md:text-6xl font-black text-slate-850 leading-tight">
            Financial & Yield Facilities
          </h1>
          <p className="text-base md:text-lg text-slate-500 max-w-2xl mx-auto leading-relaxed">
            We provide a diverse suite of automated solutions designed to facilitate credit allocations, leverage, and daily yield.
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Card 1: Fixed-Yield Investments */}
          <div className="bg-white border border-slate-100 rounded-[32px] p-8 space-y-6 shadow-sm hover:border-[#2d6a4f]/25 transition-all">
            <div className="w-14 h-14 rounded-2xl bg-[#e6f4ea] flex items-center justify-center">
              <svg className="w-8 h-8 text-[#2d6a4f]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-extrabold text-slate-850">Fixed-Yield Programs</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                Allocate capital across structured tiers starting from $100. Earn automated daily ROI percentages (up to 7.5% depending on package choice) compounded directly into your account dashboard.
              </p>
            </div>
            <ul className="text-xs text-slate-450 space-y-1.5 border-t border-slate-100 pt-4">
              <li>• Automated daily earnings ledger deposits</li>
              <li>• Flexible cycle periods (15 to 90 Days)</li>
              <li>• Option to reinvest initial balances on maturity</li>
            </ul>
          </div>

          {/* Card 2: Leveraged Margin Positions */}
          <div className="bg-white border border-slate-100 rounded-[32px] p-8 space-y-6 shadow-sm hover:border-[#2d6a4f]/25 transition-all">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center">
              <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-extrabold text-slate-850">Margin Trading Positions</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                Compete in global foreign exchange, crypto, and precious metals markets. Open LONG or SHORT positions with up to 100x leverage and manage risk parameters using Stop Loss / Take Profit bounds.
              </p>
            </div>
            <ul className="text-xs text-slate-450 space-y-1.5 border-t border-slate-100 pt-4">
              <li>• Real-time ticked pricing feeds</li>
              <li>• Leverage ranges from 5x to 100x</li>
              <li>• Double-check margin calls before open</li>
            </ul>
          </div>

          {/* Card 3: Dynamic Borrowing Grants */}
          <div className="bg-white border border-slate-100 rounded-[32px] p-8 space-y-6 shadow-sm hover:border-[#2d6a4f]/25 transition-all">
            <div className="w-14 h-14 rounded-2xl bg-purple-50 flex items-center justify-center">
              <svg className="w-8 h-8 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-extrabold text-slate-850">Liquidity Loan Grants</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                Access low-interest collateral credit matches directly from the platform. Borrowing limits dynamically scale in accordance with user deposits and credit rating score factors.
              </p>
            </div>
            <ul className="text-xs text-slate-450 space-y-1.5 border-t border-slate-100 pt-4">
              <li>• Dynamic limit matching curves</li>
              <li>• Flat low rate repayment terms</li>
              <li>• Structured auto-debit recovery tools</li>
            </ul>
          </div>

          {/* Card 4: Multi-Asset Custodian Wallet */}
          <div className="bg-white border border-slate-100 rounded-[32px] p-8 space-y-6 shadow-sm hover:border-[#2d6a4f]/25 transition-all">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 flex items-center justify-center">
              <svg className="w-8 h-8 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-extrabold text-slate-850">Custodian Wallet Settlements</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                Deposit and withdraw using various crypto networks. Check real-time ticking USD conversion rates for multi-sig vault holdings (BTC, ETH, SOL, BNB, XRP).
              </p>
            </div>
            <ul className="text-xs text-slate-450 space-y-1.5 border-t border-slate-100 pt-4">
              <li>• Multi-sig cold storage custodians</li>
              <li>• Instant withdrawal routing settlements</li>
              <li>• Zero hidden processing rates</li>
            </ul>
          </div>
        </div>

        {/* CTA */}
        <div className="bg-slate-900 text-white rounded-[40px] p-8 md:p-12 text-center space-y-6 relative overflow-hidden mt-12">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(45,106,79,0.15),transparent_50%)]" />
          <h3 className="text-2xl md:text-4xl font-black relative z-10 font-bold">Ready to Start Compounding?</h3>
          <p className="text-xs md:text-sm text-slate-350 max-w-lg mx-auto relative z-10 leading-relaxed">
            Create an account, submit your KYC validation papers, and allocate funding to the fixed yield plans.
          </p>
          <div className="relative z-10 pt-2">
            <button
              onClick={() => navigate("/register")}
              className="px-8 py-3.5 bg-white hover:bg-slate-50 text-[#1a3a2a] text-xs font-black rounded-2xl transition-all shadow-md"
            >
              Get Started Now
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
