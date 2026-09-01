import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useUIStore } from "../../store/ui.store";
import { useAuth } from "../../hooks/useAuth";
import { messageApi } from "../../api/message.api";
import { userApi } from "../../api/user.api";

const TraderHeader = () => {
  const { toggleSidebar } = useUIStore();
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: profileData } = useQuery({
    queryKey: ["my-profile"],
    queryFn: () => userApi.getMe().then((r) => r.data.data),
    staleTime: 1000 * 60 * 5,
  });

  const { data: unreadData } = useQuery({
    queryKey: ["unread-notifications-count"],
    queryFn: () => messageApi.getUnreadCount().then((r) => r.data.data),
    refetchInterval: 15000, // check every 15s
  });

  const unreadCount = unreadData?.unreadCount ?? 0;
  const avatarUrl = profileData?.profile?.avatar || user?.avatar;

  return (
    <header className="h-16 bg-[#121822] border-b border-white/10 flex items-center justify-between px-4 lg:px-6 shrink-0">
      {/* Left — hamburger + brand on mobile */}
      <div className="flex items-center gap-3">
        <button
          onClick={toggleSidebar}
          className="lg:hidden w-9 h-9 flex items-center justify-center rounded-xl hover:bg-white/5 text-slate-300 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <div className="lg:hidden flex items-center gap-2">
          <img src="/branding/arglogo.png" alt="Alpha Rise Global" className="w-7 h-7 object-contain rounded-lg" />
          <span className="font-black text-[#00e676] text-sm tracking-tight">Alpha Rise Global</span>
        </div>
      </div>

      {/* Right — notifications + avatar */}
      <div className="flex items-center gap-3">
        {/* Notifications */}
        <button
          onClick={() => navigate("/trader/notifications")}
          className="relative w-9 h-9 flex items-center justify-center rounded-xl hover:bg-white/5 text-slate-300 transition-colors"
        >
          <svg className="w-5 h-5 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          {/* unread dot */}
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 w-4 h-4 bg-rose-500 text-white font-mono text-[9px] font-bold rounded-full flex items-center justify-center scale-90">
              {unreadCount}
            </span>
          )}
        </button>

        {/* Avatar */}
        <button
          onClick={() => navigate("/trader/profile")}
          className="w-9 h-9 rounded-full bg-[#00c076] text-[#080c10] flex items-center justify-center text-sm font-black uppercase shadow-sm shadow-[#00c076]/20 hover:bg-[#00e676] transition-colors overflow-hidden border border-white/10"
        >
          {avatarUrl ? (
            <img src={avatarUrl} alt={user?.username || "Avatar"} className="w-full h-full object-cover" />
          ) : (
            user?.username?.charAt(0) ?? "T"
          )}
        </button>
      </div>
    </header>
  );
};

export default TraderHeader;
