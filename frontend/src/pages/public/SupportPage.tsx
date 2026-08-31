import { useNavigate } from "react-router-dom";

export default function SupportPage() {
  const navigate = useNavigate();

  return (
    <div className="bg-[#f5f8f5] py-20 px-6 md:px-12">
      <div className="max-w-4xl mx-auto space-y-16">
        
        {/* Hero */}
        <div className="text-center space-y-4">
          <span className="text-xs font-extrabold text-[#2d6a4f] bg-[#e6f4ea] border border-[#c4e1ce] px-4 py-1.5 rounded-full uppercase tracking-wider inline-block">
            Contact & Support
          </span>
          <h1 className="text-4xl md:text-6xl font-black text-slate-850 leading-tight">
            Client Support Desk
          </h1>
          <p className="text-base md:text-lg text-slate-500 max-w-xl mx-auto leading-relaxed">
            Need assistance with account audits, compliance KYC submissions, or loan applications? We are here to help.
          </p>
        </div>

        {/* Contact info grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Card 1: Official Channels */}
          <div className="bg-white border border-slate-100 rounded-3xl p-8 space-y-6 shadow-sm">
            <h3 className="text-lg font-extrabold text-slate-850">Help Desk Directory</h3>
            <p className="text-xs text-slate-450 leading-relaxed">
              Traders have access to direct in-app messaging panels. To message administrators or request credit score overrides, sign in to your dashboard panel.
            </p>
            <div className="space-y-3.5 pt-2 text-xs">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <strong className="block text-slate-700">Support Email:</strong>
                  <span className="text-slate-400 font-mono">support@crestcapital.com</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <strong className="block text-slate-700">Corporate Address:</strong>
                  <span className="text-slate-400">London City, UK EC2V 6DL</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => navigate("/login")}
              className="w-full py-3 bg-[#1a3a2a] hover:bg-[#2d6a4f] text-white text-xs font-black rounded-xl transition-colors text-center"
            >
              Sign In to Message Admins
            </button>
          </div>

          {/* Card 2: Contact form placeholder */}
          <div className="bg-white border border-slate-100 rounded-3xl p-8 space-y-4 shadow-sm">
            <h3 className="text-lg font-extrabold text-slate-850">Send Inquiry</h3>
            <div className="space-y-3 text-left">
              <div>
                <label className="block text-[10px] font-bold text-slate-450 uppercase mb-1">Full Name</label>
                <input
                  type="text"
                  placeholder="John Doe"
                  disabled
                  className="w-full px-4 py-2 border border-slate-100 rounded-xl text-xs bg-slate-50 cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-450 uppercase mb-1">Email Address</label>
                <input
                  type="email"
                  placeholder="john@example.com"
                  disabled
                  className="w-full px-4 py-2 border border-slate-100 rounded-xl text-xs bg-slate-50 cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-450 uppercase mb-1">Message</label>
                <textarea
                  rows={3}
                  placeholder="Enter details..."
                  disabled
                  className="w-full px-4 py-2 border border-slate-100 rounded-xl text-xs bg-slate-50 cursor-not-allowed resize-none"
                />
              </div>
              <p className="text-[10px] text-slate-400 italic">
                * Please sign in to submit support requests.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
