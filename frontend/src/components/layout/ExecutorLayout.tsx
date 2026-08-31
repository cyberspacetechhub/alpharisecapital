import { Outlet } from "react-router-dom";
import ExecutorSidebar from "./ExecutorSidebar";
import ExecutorHeader from "./ExecutorHeader";

export default function ExecutorLayout() {
  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <ExecutorSidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <ExecutorHeader />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
