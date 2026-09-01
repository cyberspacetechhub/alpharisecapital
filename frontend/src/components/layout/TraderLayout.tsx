import { Outlet } from "react-router-dom";
import TraderSidebar from "./TraderSidebar";
import TraderHeader from "./TraderHeader";
import ImpersonationBanner from "./ImpersonationBanner";
import SmartsuppChat from "../ui/SmartsuppChat";

export default function TraderLayout() {
  return (
    <div className="flex h-screen bg-[#0b0f14] text-slate-100 overflow-hidden">
      <TraderSidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <ImpersonationBanner />
        <TraderHeader />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
      <SmartsuppChat />
    </div>
  );
}
