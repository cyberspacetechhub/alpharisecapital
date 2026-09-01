import React from "react";

interface PageLoaderProps {
  fullScreen?: boolean;
}

const PageLoader: React.FC<PageLoaderProps> = ({ fullScreen = true }) => {
  return (
    <div
      className={`flex flex-col items-center justify-center ${
        fullScreen ? "fixed inset-0 z-50 min-h-screen bg-[#0b0f14]" : "w-full py-12"
      }`}
    >
      <div className="relative flex items-center justify-center">
        <div className="w-16 h-16 rounded-full border-4 border-[#00c076]/20 border-t-[#00c076] animate-spin" />
        <img
          src="/branding/arglogo.jpeg"
          alt="Alpha Rise Global"
          className="absolute w-10 h-10 object-contain rounded-xl shadow-lg shadow-[#00c076]/30 animate-pulse"
        />
      </div>
      <p className="mt-4 text-sm font-bold text-[#00e676] tracking-wide animate-pulse">Loading Alpha Rise...</p>
    </div>
  );
};

export default PageLoader;
