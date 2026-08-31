import { useNavigate } from "react-router-dom";

export default function PublicFooter() {
  const navigate = useNavigate();

  return (
    <footer className="bg-[#0b1b14] text-white border-t border-white/5 py-16 px-6 md:px-12 mt-auto">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
        
        {/* Brand info */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-white font-black text-xl">
              C
            </div>
            <span className="font-extrabold text-white text-xl tracking-tight">Alpha Rise Global</span>
          </div>
          <p className="text-xs text-white/50 leading-relaxed">
            Institutional yield packages, digital credit facilities, and multi-asset margin positions management.
          </p>
          {/* Social SVGs */}
          <div className="flex gap-4 pt-2">
            <a href="#" className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors">
              <svg className="w-4 h-4 text-white/70" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
            </a>
            <a href="#" className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors">
              <svg className="w-4 h-4 text-white/70" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.27-.02-.11.02-1.93 1.23-5.46 3.62-.51.35-.98.53-1.39.52-.46-.01-1.33-.26-1.98-.48-.8-.27-1.43-.42-1.37-.89.03-.25.38-.51 1.03-.78 4.04-1.76 6.74-2.92 8.09-3.48 3.85-1.6 4.64-1.88 5.17-1.89.11 0 .37.03.54.17.14.12.18.28.2.45-.02.07-.02.13-.03.17z"/>
              </svg>
            </a>
          </div>
        </div>

        {/* Sitemaps */}
        <div>
          <h4 className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-4">Resource Centers</h4>
          <ul className="text-xs text-white/60 space-y-3 font-semibold text-left">
            <li><button onClick={() => navigate("/")} className="hover:text-white transition-colors">Home Page</button></li>
            <li><button onClick={() => navigate("/about")} className="hover:text-white transition-colors">About Us</button></li>
            <li><button onClick={() => navigate("/services")} className="hover:text-white transition-colors">Services</button></li>
            <li><button onClick={() => navigate("/support")} className="hover:text-white transition-colors">Support Center</button></li>
          </ul>
        </div>

        <div>
          <h4 className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-4">Legals</h4>
          <ul className="text-xs text-white/60 space-y-3 font-semibold text-left">
            <li><button onClick={() => navigate("/terms")} className="hover:text-white transition-colors">Terms of Service</button></li>
            <li><button onClick={() => navigate("/policy")} className="hover:text-white transition-colors">Privacy Policy</button></li>
          </ul>
        </div>

        <div>
          <h4 className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-4">Contact Support</h4>
          <ul className="text-xs text-white/60 space-y-3 font-semibold text-left">
            <li className="text-[10px] text-white/40">Registered Office:</li>
            <li className="font-mono text-white/80">London City, UK EC2V 6DL</li>
          </ul>
        </div>

      </div>

      <div className="max-w-7xl mx-auto border-t border-white/5 mt-16 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-white/45">
        <span>&copy; {new Date().getFullYear()} Alpha Rise Global Securities. All rights reserved.</span>
        <span className="hover:text-white transition-colors cursor-pointer">Security Cleared clearance certificate 2026</span>
      </div>
    </footer>
  );
}
