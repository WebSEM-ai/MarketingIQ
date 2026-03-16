"use client";

import type { RegionInterest } from "@/lib/types/trends";

interface RegionMapProps {
  regions: RegionInterest[];
}

export default function RegionMap({ regions }: RegionMapProps) {
  if (!regions.length) {
    return (
      <div className="bg-gray-900/50 border border-gray-800/50 rounded-xl p-4">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
          Interes pe Regiuni
        </h3>
        <p className="text-sm text-gray-500">Nu sunt date disponibile.</p>
      </div>
    );
  }

  const maxVal = Math.max(...regions.map((r) => r.value), 1);
  const displayed = regions.slice(0, 15);

  return (
    <div className="bg-gray-900/50 border border-gray-800/50 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="2" y1="12" x2="22" y2="12" />
          <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
        </svg>
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
          Interes pe Regiuni
        </h3>
        <span className="text-xs text-gray-600 ml-auto">Top {displayed.length}</span>
      </div>

      <div className="space-y-1.5">
        {displayed.map((region, i) => (
          <div key={i} className="flex items-center gap-3">
            <span className="text-xs text-gray-600 w-4 text-right flex-shrink-0">
              {i + 1}
            </span>
            <span className="text-xs text-gray-300 w-28 truncate flex-shrink-0">
              {region.name}
            </span>
            <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${(region.value / maxVal) * 100}%`,
                  backgroundColor: `rgba(34, 197, 94, ${0.4 + (region.value / maxVal) * 0.6})`,
                }}
              />
            </div>
            <span className="text-xs text-gray-500 w-8 text-right flex-shrink-0">
              {region.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
