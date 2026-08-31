import { Outlet } from "react-router-dom";
import TraderSidebar from "./TraderSidebar";
import TraderHeader from "./TraderHeader";

export default function TraderLayout() {
  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <TraderSidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TraderHeader />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
