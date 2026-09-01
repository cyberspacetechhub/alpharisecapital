import { useNavigate } from "react-router-dom";

export default function AboutPage() {
  const navigate = useNavigate();

  return (
    <div className="bg-[#0b0f14] text-slate-100 py-20 px-6 md:px-12">
      <div className="max-w-5xl mx-auto space-y-16">
        
        {/* Hero */}
        <div className="text-center space-y-4">
          <span className="text-xs font-extrabold text-[#00e676] bg-[#00c076]/15 border border-[#00c076]/30 px-4 py-1.5 rounded-full uppercase tracking-wider inline-block">
            Corporate Profile
          </span>
          <h1 className="text-4xl md:text-6xl font-black text-white leading-tight">
            About Alpha Rise Global
          </h1>
          <p className="text-base md:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Pioneering the alignment of fixed-yield allocations, digital liquidity parameters, and secure decentralized custodian interfaces.
          </p>
        </div>

        {/* Vision & Mission */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 pt-6">
          <div className="bg-[#121822] border border-white/10 rounded-3xl p-8 space-y-4 shadow-lg">
            <div className="w-12 h-12 rounded-2xl bg-[#00c076]/15 border border-[#00c076]/30 flex items-center justify-center text-[#00e676]">
              <svg className="w-6 h-6 text-[#00e676]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
            <h3 className="text-xl font-extrabold text-white">Our Vision</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              We envision a borderless financial environment where retail traders and institutional partners access liquidity curves, secure high-yield compounding, and premium commodities indices transparently and frictionlessly.
            </p>
          </div>

          <div className="bg-[#121822] border border-white/10 rounded-3xl p-8 space-y-4 shadow-lg">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <svg className="w-6 h-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-xl font-extrabold text-white">Our Mission</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              To engineer secure trading wrappers and automated audit crons, ensuring every digital settlement represents auditable value, matched by robust multi-sig custody vaults and automated yield distribution systems.
            </p>
          </div>
        </div>

        {/* Corporate Principles */}
        <div className="space-y-8 pt-6">
          <div className="text-center">
            <h2 className="text-2xl md:text-3xl font-black text-white">Core Operational Values</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-[#121822] border border-white/10 rounded-3xl p-6 space-y-3 shadow-lg">
              <span className="text-2xl">🛡️</span>
              <h4 className="text-sm font-extrabold text-white uppercase tracking-wider">Asset Safety First</h4>
              <p className="text-xs text-slate-400 leading-relaxed">Client deposits remain completely isolated inside verified custodian vaults, protected by multi-signature validation chains.</p>
            </div>
            <div className="bg-[#121822] border border-white/10 rounded-3xl p-6 space-y-3 shadow-lg">
              <span className="text-2xl">⚖️</span>
              <h4 className="text-sm font-extrabold text-white uppercase tracking-wider">Fully Regulated Curves</h4>
              <p className="text-xs text-slate-400 leading-relaxed">Our platforms maintain transparency, validating every position, compounding rate, and yield payout ledger event dynamically.</p>
            </div>
            <div className="bg-[#121822] border border-white/10 rounded-3xl p-6 space-y-3 shadow-lg">
              <span className="text-2xl">💡</span>
              <h4 className="text-sm font-extrabold text-white uppercase tracking-wider">Continuous Innovation</h4>
              <p className="text-xs text-slate-400 leading-relaxed">From daily yield matching engines to dynamic margin calculations, we build high-end tools to secure capital compounding.</p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="bg-[#121822] border border-white/10 text-white rounded-[40px] p-8 md:p-12 text-center space-y-6 relative overflow-hidden shadow-2xl">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(0,192,118,0.15),transparent_50%)]" />
          <h3 className="text-2xl md:text-4xl font-black relative z-10">Compounding Capital Safely</h3>
          <p className="text-xs md:text-sm text-slate-400 max-w-lg mx-auto relative z-10 leading-relaxed">
            Register your profile, pass compliance KYC steps, and allocate capital to secure high-yield programs.
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
