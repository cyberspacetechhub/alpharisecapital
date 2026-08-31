import { Outlet } from "react-router-dom";
import PublicHeader from "./PublicHeader";
import PublicTicker from "./PublicTicker";
import PublicFooter from "./PublicFooter";
import ScrollToTopButton from "../common/ScrollToTopButton";

export default function PublicLayout() {
  return (
    <div className="flex flex-col min-h-screen pt-[76px]">
      <PublicHeader />
      <PublicTicker />
      <main className="flex-grow">
        <Outlet />
      </main>
      <ScrollToTopButton />
      <PublicFooter />
    </div>
  );
}
