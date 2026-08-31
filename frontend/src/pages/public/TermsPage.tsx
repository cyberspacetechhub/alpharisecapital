export default function TermsPage() {
  return (
    <div className="bg-[#f5f8f5] py-20 px-6 md:px-12">
      <div className="max-w-4xl mx-auto space-y-12">
        
        {/* Header */}
        <div className="text-center space-y-4">
          <span className="text-xs font-extrabold text-[#2d6a4f] bg-[#e6f4ea] border border-[#c4e1ce] px-4 py-1.5 rounded-full uppercase tracking-wider inline-block">
            Legals
          </span>
          <h1 className="text-4xl md:text-5xl font-black text-slate-850 leading-tight">
            Terms of Service
          </h1>
          <p className="text-xs text-slate-400">
            Last Updated: August 30, 2026
          </p>
        </div>

        {/* Legal copy */}
        <div className="bg-white border border-slate-100 rounded-3xl p-8 md:p-12 space-y-8 shadow-sm text-sm text-slate-600 leading-relaxed">
          
          <section className="space-y-3">
            <h3 className="text-lg font-extrabold text-slate-850">1. Acceptance of Terms</h3>
            <p>
              By creating a profile, passing KYC steps, and depositing capital on Crest Capital, you acknowledge that you have read, understood, and agreed to be bound by these Terms of Service. If you do not agree, do not register or deposit holdings.
            </p>
          </section>

          <section className="space-y-3">
            <h3 className="text-lg font-extrabold text-slate-850">2. Fixed-Yield Investment Programs</h3>
            <p>
              Crest Capital offers fixed-yield packages (Bronze, Silver, Gold, Platinum). You acknowledge that:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-500">
              <li>Yield rates compound daily according to plan percentages (from 2.5% to 7.5% Daily ROI).</li>
              <li>Reinvestment is restricted to initial balances and must be executed within 48 hours of maturity.</li>
              <li>Matured cycles stop generating yield unless actively reinvested.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h3 className="text-lg font-extrabold text-slate-850">3. Margin Leverage Risks</h3>
            <p>
              Opening leveraged LONG or SHORT positions carries significant capital risk. Leverage options up to 100x are available. Crest Capital reserves the right to liquidate open contracts when margin balances drop below maintenance requirements or general risk threshold flags.
            </p>
          </section>

          <section className="space-y-3">
            <h3 className="text-lg font-extrabold text-slate-850">4. Borrowing & Loan Protocols</h3>
            <p>
              All borrowing activities are governed by the following covenants:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-500">
              <li>Loan limit factors are determined dynamically by credit score values and administrator audits.</li>
              <li>Outstanding debt balances are subject to auto-debit triggers upon reaching maturity dates.</li>
              <li>Repayment delays may impact borrowing scores and yield payout withdrawals eligibility.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h3 className="text-lg font-extrabold text-slate-850">5. Compliance & KYC</h3>
            <p>
              Platform usage requires compliance verification. Users must upload valid government identification documents. Crest Capital reserves the right to block account login access, reject KYC, or freeze withdrawals in the event of compliance irregularities.
            </p>
          </section>

        </div>

      </div>
    </div>
  );
}
