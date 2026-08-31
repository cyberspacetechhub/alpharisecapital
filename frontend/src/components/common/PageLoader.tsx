import React from "react";

interface PageLoaderProps {
  fullScreen?: boolean;
}

const PageLoader: React.FC<PageLoaderProps> = ({ fullScreen = true }) => {
  return (
    <div
      className={`flex flex-col items-center justify-center ${
        fullScreen ? "fixed inset-0 z-50 min-h-screen bg-[#f0f7f4]" : "w-full py-12"
      }`}
    >
      <div className="relative flex items-center justify-center">
        <div className="w-16 h-16 rounded-full border-4 border-[#2d6a4f]/20 border-t-[#2d6a4f] animate-spin" />
        <div className="absolute inline-flex items-center justify-center w-10 h-10 rounded-xl bg-[#1a3a2a]">
          <svg className="w-5 h-5 text-white animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        </div>
      </div>
      <p className="mt-4 text-sm font-semibold text-[#1a3a2a] animate-pulse">Loading Alpha Rise...</p>
    </div>
  );
};

export default PageLoader;
