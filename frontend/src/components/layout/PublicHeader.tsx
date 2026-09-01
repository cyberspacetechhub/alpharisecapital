import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

export default function PublicHeader() {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#0b0f14]/90 backdrop-blur-lg border-b border-white/10 py-4 px-6 md:px-12 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        
        {/* Logo */}
        <div className="flex items-center gap-3.5 cursor-pointer" onClick={() => navigate("/")}>
          <img
            src="/branding/arglogo.jpeg"
            alt="Alpha Rise Global"
            className="w-10 h-10 md:w-11 md:h-11 object-contain rounded-2xl shadow-lg shadow-[#00c076]/20"
          />
          <span className="font-black text-white text-md md:text-2xl tracking-tight">Alpha Rise Global</span>
        </div>

        {/* Desktop Nav links */}
        <nav className="hidden md:flex items-center gap-10 text-sm font-bold text-slate-300">
          <button
            onClick={() => navigate("/")}
            className={`transition-colors ${isActive("/") ? "text-[#00e676]" : "hover:text-[#00e676]"}`}
          >
            Home
          </button>
          <button
            onClick={() => navigate("/about")}
            className={`transition-colors ${isActive("/about") ? "text-[#00e676]" : "hover:text-[#00e676]"}`}
          >
            About
          </button>
          <button
            onClick={() => navigate("/services")}
            className={`transition-colors ${isActive("/services") ? "text-[#00e676]" : "hover:text-[#00e676]"}`}
          >
            Services
          </button>
          <button
            onClick={() => navigate("/support")}
            className={`transition-colors ${isActive("/support") ? "text-[#00e676]" : "hover:text-[#00e676]"}`}
          >
            Support
          </button>
        </nav>

        {/* Desktop CTA Buttons / Mobile specific header */}
        <div className="flex items-center gap-3">
          {/* Desktop Only */}
          <button
            onClick={() => navigate("/login")}
            className="hidden md:inline-block px-6 py-3 rounded-2xl border border-white/15 hover:bg-white/5 text-xs font-black text-white transition-all hover:border-white/30"
          >
            Sign In
          </button>
          <button
            onClick={() => navigate("/register")}
            className="hidden md:inline-block px-6 py-3 rounded-2xl bg-[#00c076] hover:bg-[#00e676] text-[#080c10] text-xs font-black transition-all shadow-lg shadow-[#00c076]/20 hover:scale-[1.02]"
          >
            Register
          </button>

          {/* Mobile View UI Elements */}
          <div className="flex md:hidden items-center gap-3">
            {/* Mobile Person Icon for Login */}
            <button
              onClick={() => navigate("/login")}
              className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-200 hover:bg-white/10 transition-colors"
              aria-label="Login"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </button>

            {/* Hamburger Drawer Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-200 hover:bg-white/10 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-white/10 mt-4 py-4 px-2 space-y-3 flex flex-col text-sm font-bold text-slate-300 bg-[#121822] rounded-2xl border animate-fadeIn">
          <button
            onClick={() => { setMobileMenuOpen(false); navigate("/"); }}
            className={`text-left py-2.5 px-3 hover:bg-white/5 rounded-xl transition-colors ${isActive("/") ? "text-[#00e676] bg-[#00c076]/10" : ""}`}
          >
            Home
          </button>
          <button
            onClick={() => { setMobileMenuOpen(false); navigate("/about"); }}
            className={`text-left py-2.5 px-3 hover:bg-white/5 rounded-xl transition-colors ${isActive("/about") ? "text-[#00e676] bg-[#00c076]/10" : ""}`}
          >
            About
          </button>
          <button
            onClick={() => { setMobileMenuOpen(false); navigate("/services"); }}
            className={`text-left py-2.5 px-3 hover:bg-white/5 rounded-xl transition-colors ${isActive("/services") ? "text-[#00e676] bg-[#00c076]/10" : ""}`}
          >
            Services
          </button>
          <button
            onClick={() => { setMobileMenuOpen(false); navigate("/support"); }}
            className={`text-left py-2.5 px-3 hover:bg-white/5 rounded-xl transition-colors ${isActive("/support") ? "text-[#00e676] bg-[#00c076]/10" : ""}`}
          >
            Support
          </button>
        </div>
      )}
    </header>
  );
}
