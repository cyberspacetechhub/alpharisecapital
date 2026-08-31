export default function PolicyPage() {
  return (
    <div className="bg-[#f5f8f5] py-20 px-6 md:px-12">
      <div className="max-w-4xl mx-auto space-y-12">
        
        {/* Header */}
        <div className="text-center space-y-4">
          <span className="text-xs font-extrabold text-[#2d6a4f] bg-[#e6f4ea] border border-[#c4e1ce] px-4 py-1.5 rounded-full uppercase tracking-wider inline-block">
            Legals
          </span>
          <h1 className="text-4xl md:text-5xl font-black text-slate-850 leading-tight">
            Privacy Policy
          </h1>
          <p className="text-xs text-slate-400">
            Last Updated: August 30, 2026
          </p>
        </div>

        {/* Legal copy */}
        <div className="bg-white border border-slate-100 rounded-3xl p-8 md:p-12 space-y-8 shadow-sm text-sm text-slate-600 leading-relaxed">
          
          <section className="space-y-3">
            <h3 className="text-lg font-extrabold text-slate-850">1. Information We Collect</h3>
            <p>
              We collect information to verify credentials, approve compliance documents, and secure funding pipelines. This includes:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-500">
              <li>**Identification Info**: Name, email, registration country, and KYC documents (Passport/ID).</li>
              <li>**Financial Data**: Crypto wallet addresses, deposit proofs, and payout transaction ledgers.</li>
              <li>**System Data**: IP addresses, browser info, and analytical tracking metrics.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h3 className="text-lg font-extrabold text-slate-850">2. How We Use Information</h3>
            <p>
              Your data is processed only to execute services you contract, including:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-500">
              <li>Processing daily yield curve crons and updating wallet balances.</li>
              <li>Validating credit ratings for borrowing loan matching.</li>
              <li>Auditing recent withdrawal payouts and compliance updates.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h3 className="text-lg font-extrabold text-slate-850">3. Custody & Encryption Protocols</h3>
            <p>
              Crest Capital does not share personal documents with marketing agencies or third parties. All KYC materials are uploaded directly into isolated encrypted filesystems. Cold storage custodian networks protect financial balances.
            </p>
          </section>

          <section className="space-y-3">
            <h3 className="text-lg font-extrabold text-slate-850">4. Interactive Analytical Cookies</h3>
            <p>
              We employ tracking cookies to persist session tokens, maintain mobile layouts sidebar widths, and query ticking asset values on wallets. Disabling cookies may affect dashboard loading.
            </p>
          </section>

        </div>

      </div>
    </div>
  );
}
