"use client";

import { useState } from "react";

export default function Collapsible({
  title,
  badge,
  badgeColor,
  defaultOpen = false,
  children,
}: {
  title: string;
  badge?: string | number;
  badgeColor?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="bg-gray-900/50 border border-gray-800/50 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-gray-800/30 transition-colors"
      >
        <span className="text-xs font-semibold text-gray-300 uppercase tracking-wider">
          {title}
        </span>
        <div className="flex items-center gap-2">
          {badge !== undefined && (
            <span
              className="text-xs font-bold px-1.5 py-0.5 rounded"
              style={{
                color: badgeColor || "#9ca3af",
                backgroundColor: `${badgeColor || "#9ca3af"}15`,
              }}
            >
              {badge}
            </span>
          )}
          <svg
            className={`w-3.5 h-3.5 text-gray-500 transition-transform ${open ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>
      {open && <div className="px-4 pb-3 pt-1">{children}</div>}
    </div>
  );
}
