import { useNavigate } from "react-router-dom";

export default function AboutPage() {
  const navigate = useNavigate();

  return (
    <div className="bg-[#f5f8f5] py-20 px-6 md:px-12">
      <div className="max-w-5xl mx-auto space-y-16">
        
        {/* Hero */}
        <div className="text-center space-y-4">
          <span className="text-xs font-extrabold text-[#2d6a4f] bg-[#e6f4ea] border border-[#c4e1ce] px-4 py-1.5 rounded-full uppercase tracking-wider inline-block">
            Corporate Profile
          </span>
          <h1 className="text-4xl md:text-6xl font-black text-slate-850 leading-tight">
            About Crest Capital
          </h1>
          <p className="text-base md:text-lg text-slate-500 max-w-2xl mx-auto leading-relaxed">
            Pioneering the alignment of fixed-yield allocations, digital liquidity parameters, and secure decentralized custodian interfaces.
          </p>
        </div>

        {/* Vision & Mission */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 pt-6">
          <div className="bg-white border border-slate-100 rounded-3xl p-8 space-y-4 shadow-sm">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center">
              <svg className="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
            <h3 className="text-xl font-extrabold text-slate-850">Our Vision</h3>
            <p className="text-sm text-slate-500 leading-relaxed">
              We envision a borderless financial environment where retail traders and institutional partners access liquidity curves, secure margin lending, and premium commodities indices transparently and frictionlessly.
            </p>
          </div>

          <div className="bg-white border border-slate-100 rounded-3xl p-8 space-y-4 shadow-sm">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-xl font-extrabold text-slate-850">Our Mission</h3>
            <p className="text-sm text-slate-500 leading-relaxed">
              To engineer secure trading wrappers and automated audit crons, ensuring every digital settlement represents auditable value, matched by robust multi-sig custody vaults and automated credit scoring systems.
            </p>
          </div>
        </div>

        {/* Corporate Principles */}
        <div className="space-y-8 pt-6">
          <div className="text-center">
            <h2 className="text-2xl md:text-3xl font-black text-slate-850">Core Operational Values</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white border border-slate-100 rounded-3xl p-6 space-y-3 shadow-[0_10px_30px_rgba(15,23,42,0.01)]">
              <span className="text-2xl">🛡️</span>
              <h4 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider">Asset Safety First</h4>
              <p className="text-xs text-slate-400 leading-relaxed">Client deposits remain completely isolated inside verified custodian vaults, protected by multi-signature validation chains.</p>
            </div>
            <div className="bg-white border border-slate-100 rounded-3xl p-6 space-y-3 shadow-[0_10px_30px_rgba(15,23,42,0.01)]">
              <span className="text-2xl">⚖️</span>
              <h4 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider">Fully Regulated Curves</h4>
              <p className="text-xs text-slate-400 leading-relaxed">Our platforms maintain transparency, validating every position, loan limit increment, and yield payout ledger event dynamically.</p>
            </div>
            <div className="bg-white border border-slate-100 rounded-3xl p-6 space-y-3 shadow-[0_10px_30px_rgba(15,23,42,0.01)]">
              <span className="text-2xl">💡</span>
              <h4 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider">Continuous Innovation</h4>
              <p className="text-xs text-slate-400 leading-relaxed">From credit-score matching engines to dynamic margin calculations, we build high-end tools to secure capital compounding.</p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="bg-slate-900 text-white rounded-[40px] p-8 md:p-12 text-center space-y-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(45,106,79,0.15),transparent_50%)]" />
          <h3 className="text-2xl md:text-4xl font-black relative z-10">Compounding Capital Safely</h3>
          <p className="text-xs md:text-sm text-slate-350 max-w-lg mx-auto relative z-10 leading-relaxed">
            Register your profile, pass compliance KYC steps, and allocate capital to secure high-yield programs.
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
