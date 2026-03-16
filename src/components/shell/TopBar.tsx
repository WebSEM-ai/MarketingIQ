"use client";

import { usePathname } from "next/navigation";

const breadcrumbMap: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/dashboard/prompt-iq": "PromptIQ",
  "/dashboard/competitors": "Competitori",
  "/dashboard/trends": "Tendințe",
  "/dashboard/keywords": "Cuvinte Cheie",
  "/dashboard/content": "Conținut",
};

const colorMap: Record<string, string> = {
  "/dashboard/prompt-iq": "#3b82f6",
  "/dashboard/competitors": "#f59e0b",
  "/dashboard/trends": "#22c55e",
  "/dashboard/keywords": "#a855f7",
  "/dashboard/content": "#f43f5e",
};

export default function TopBar() {
  const pathname = usePathname();
  const currentLabel = breadcrumbMap[pathname] || "Dashboard";
  const accentColor = colorMap[pathname];

  return (
    <header className="flex-shrink-0 h-12 bg-gray-950/80 backdrop-blur-sm border-b border-gray-800/50 px-5 flex items-center justify-between">
      <div className="flex items-center gap-2 text-sm">
        <span className="text-gray-500">MarketingIQ</span>
        <span className="text-gray-700">/</span>
        <span
          className="font-medium"
          style={{ color: accentColor || "#9ca3af" }}
        >
          {currentLabel}
        </span>
      </div>

      {/* Placeholder for ClientSelector + User avatar (Clerk) */}
      <div className="flex items-center gap-3">
        <div className="h-7 px-3 rounded-md bg-gray-800/50 border border-gray-700/50 flex items-center gap-2 text-xs text-gray-400">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          Selectează client
        </div>
        <div className="w-7 h-7 rounded-full bg-gray-800 border border-gray-700/50 flex items-center justify-center">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-500">
            <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        </div>
      </div>
    </header>
  );
}
