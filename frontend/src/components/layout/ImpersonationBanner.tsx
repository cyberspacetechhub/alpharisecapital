import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/auth.store";

export default function ImpersonationBanner() {
  const navigate = useNavigate();
  const { user, impersonatorAdmin, stopImpersonation } = useAuthStore();

  if (!impersonatorAdmin) return null;

  const handleExit = () => {
    stopImpersonation();
    navigate("/executor/clients");
  };

  return (
    <div className="bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 text-slate-950 px-4 py-2 text-xs font-bold flex flex-wrap items-center justify-between gap-3 shadow-md border-b border-amber-700/30 z-50">
      <div className="flex items-center gap-2">
        <span className="p-1 rounded bg-slate-950 text-amber-400 font-mono text-[10px]">ADMIN VIEW</span>
        <span>
          Cross-Section Active: Logged in as <span className="underline">{user?.username}</span> ({user?.email})
        </span>
      </div>
      <button
        onClick={handleExit}
        className="px-3 py-1 rounded-lg bg-slate-950 text-amber-300 hover:bg-slate-900 font-extrabold transition-all shadow-sm hover:scale-105"
      >
        Exit Impersonation & Return to Admin Panel →
      </button>
    </div>
  );
}
