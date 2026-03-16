"use client";

import type { GapItem } from "@/lib/types/content";

interface GapAnalysisProps {
  gaps: GapItem[];
}

const PRIORITY_COLORS: Record<string, string> = {
  high: "bg-rose-500/20 text-rose-400 border-rose-500/30",
  medium: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  low: "bg-gray-500/20 text-gray-400 border-gray-500/30",
};

const PRIORITY_LABELS: Record<string, string> = {
  high: "Ridicat",
  medium: "Mediu",
  low: "Scăzut",
};

export default function GapAnalysis({ gaps }: GapAnalysisProps) {
  if (!gaps.length) return null;

  return (
    <div className="bg-gray-900/50 border border-gray-800/50 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#f43f5e"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
          <line x1="8" y1="11" x2="14" y2="11" />
        </svg>
        <h3 className="text-xs font-semibold text-rose-500 uppercase tracking-wider">
          Analiză Gap-uri
        </h3>
      </div>

      <div className="space-y-2">
        {gaps.map((gap, idx) => (
          <div
            key={idx}
            className="bg-gray-800/30 border border-gray-700/30 rounded-lg p-3"
          >
            <div className="flex items-start justify-between gap-2 mb-1">
              <h4 className="text-sm font-semibold text-white">{gap.area}</h4>
              <span
                className={`text-[10px] font-semibold px-2 py-0.5 rounded border whitespace-nowrap ${
                  PRIORITY_COLORS[gap.priority] || PRIORITY_COLORS.low
                }`}
              >
                {PRIORITY_LABELS[gap.priority] || gap.priority}
              </span>
            </div>

            <p className="text-xs text-gray-400 mb-1.5">{gap.description}</p>

            <div className="flex items-start gap-1.5">
              <span className="text-rose-500 mt-0.5 text-[8px]">&#9679;</span>
              <p className="text-xs text-rose-300/80">{gap.opportunity}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
