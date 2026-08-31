import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

export default function PublicHeader() {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("theme") === "dark" || document.documentElement.classList.contains("dark");
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [darkMode]);

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-lg border-b border-slate-100 py-4 px-6 md:px-12 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        
        {/* Logo */}
        <div className="flex items-center gap-3.5 cursor-pointer" onClick={() => navigate("/")}>
          <div className="w-11 h-11 rounded-2xl bg-[#1a3a2a] flex items-center justify-center text-white font-black text-xl shadow-md shadow-[#1a3a2a]/10">
            C
          </div>
          <span className="font-black text-slate-850 text-lg md:text-2xl tracking-tight">Alpha Rise Global</span>
        </div>

        {/* Desktop Nav links */}
        <nav className="hidden md:flex items-center gap-10 text-sm font-bold text-slate-500">
          <button
            onClick={() => navigate("/")}
            className={`transition-colors ${isActive("/") ? "text-[#2d6a4f]" : "hover:text-[#2d6a4f]"}`}
          >
            Home
          </button>
          <button
            onClick={() => navigate("/about")}
            className={`transition-colors ${isActive("/about") ? "text-[#2d6a4f]" : "hover:text-[#2d6a4f]"}`}
          >
            About
          </button>
          <button
            onClick={() => navigate("/services")}
            className={`transition-colors ${isActive("/services") ? "text-[#2d6a4f]" : "hover:text-[#2d6a4f]"}`}
          >
            Services
          </button>
          <button
            onClick={() => navigate("/support")}
            className={`transition-colors ${isActive("/support") ? "text-[#2d6a4f]" : "hover:text-[#2d6a4f]"}`}
          >
            Support
          </button>
        </nav>

        {/* Desktop CTA Buttons / Mobile specific header */}
        <div className="flex items-center gap-3">
          {/* Dark Mode Toggle */}
          <button
            onClick={() => setDarkMode((prev) => !prev)}
            className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-slate-50 border border-slate-200 text-slate-500 transition-colors shrink-0"
            aria-label="Toggle Dark Mode"
          >
            {darkMode ? (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m12.728 12.728l.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </button>

          {/* Desktop Only */}
          <button
            onClick={() => navigate("/login")}
            className="hidden md:inline-block px-6 py-3 rounded-2xl border border-slate-200 hover:bg-slate-50 text-xs font-black text-slate-700 transition-all hover:border-slate-350"
          >
            Sign In
          </button>
          <button
            onClick={() => navigate("/register")}
            className="hidden md:inline-block px-6 py-3 rounded-2xl bg-[#1a3a2a] hover:bg-[#2d6a4f] text-white text-xs font-black transition-all shadow-md shadow-[#1a3a2a]/10"
          >
            Register
          </button>

          {/* Mobile View UI Elements */}
          <div className="flex md:hidden items-center gap-3">
            {/* Mobile Person Icon for Login */}
            <button
              onClick={() => navigate("/login")}
              className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-150 flex items-center justify-center text-slate-600 hover:bg-slate-100 transition-colors"
              aria-label="Login"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </button>

            {/* Mobile Register Button */}
            {/* <button
              onClick={() => navigate("/register")}
              className="px-4 py-2.5 rounded-xl bg-[#1a3a2a] text-white text-xs font-extrabold hover:bg-[#2d6a4f] transition-colors"
            >
              Register
            </button> */}

            {/* Hamburger Drawer Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-700 hover:bg-slate-100 transition-colors"
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
        <div className="md:hidden border-t border-slate-100 mt-4 py-4 px-2 space-y-3 flex flex-col text-sm font-bold text-slate-600 bg-white rounded-2xl animate-fadeIn">
          <button
            onClick={() => { setMobileMenuOpen(false); navigate("/"); }}
            className={`text-left py-2 px-3 hover:bg-slate-50 rounded-xl ${isActive("/") ? "text-[#2d6a4f] bg-slate-50/50" : ""}`}
          >
            Home
          </button>
          <button
            onClick={() => { setMobileMenuOpen(false); navigate("/about"); }}
            className={`text-left py-2 px-3 hover:bg-slate-50 rounded-xl ${isActive("/about") ? "text-[#2d6a4f] bg-slate-50/50" : ""}`}
          >
            About
          </button>
          <button
            onClick={() => { setMobileMenuOpen(false); navigate("/services"); }}
            className={`text-left py-2 px-3 hover:bg-slate-50 rounded-xl ${isActive("/services") ? "text-[#2d6a4f] bg-slate-50/50" : ""}`}
          >
            Services
          </button>
          <button
            onClick={() => { setMobileMenuOpen(false); navigate("/support"); }}
            className={`text-left py-2 px-3 hover:bg-slate-50 rounded-xl ${isActive("/support") ? "text-[#2d6a4f] bg-slate-50/50" : ""}`}
          >
            Support
          </button>
        </div>
      )}
    </header>
  );
}
