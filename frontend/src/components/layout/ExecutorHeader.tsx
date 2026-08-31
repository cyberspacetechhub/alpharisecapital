import { useNavigate } from "react-router-dom";
import { useUIStore } from "../../store/ui.store";
import { useAuth } from "../../hooks/useAuth";

const ExecutorHeader = () => {
  const { toggleSidebar } = useUIStore();
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-4 lg:px-6 shrink-0">
      {/* Left */}
      <div className="flex items-center gap-3">
        <button
          onClick={toggleSidebar}
          className="lg:hidden w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors"
        >
          <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <span className="lg:hidden font-bold text-[#1a3a2a] text-sm">Crest Capital</span>

        {/* Desktop breadcrumb label */}
        <div className="hidden lg:flex items-center gap-2">
          <span className="text-xs font-medium text-gray-400">Admin Panel</span>
          <span className="text-gray-300">/</span>
          <span className="text-xs font-semibold text-[#1a3a2a]">Executor</span>
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2">
        {/* Notifications */}
        <button
          onClick={() => navigate("/executor/messages")}
          className="relative w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors"
        >
          <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
        </button>

        {/* Avatar */}
        <button
          onClick={() => navigate("/executor/profile")}
          className="w-9 h-9 rounded-full bg-[#1a3a2a] flex items-center justify-center text-white text-sm font-bold uppercase"
        >
          {user?.username?.charAt(0) ?? "E"}
        </button>
      </div>
    </header>
  );
};

export default ExecutorHeader;
