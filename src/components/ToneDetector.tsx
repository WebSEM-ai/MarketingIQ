"use client";

import { ToneBreakdown } from "@/lib/types";

const TONE_COLORS: Record<string, string> = {
  Formal: "#6366f1",
  Casual: "#f59e0b",
  Autoritar: "#ef4444",
  Tehnic: "#3b82f6",
  Creativ: "#a855f7",
  Prietenos: "#22c55e",
};

export default function ToneDetector({
  primary,
  breakdown,
}: {
  primary: string;
  breakdown: ToneBreakdown;
}) {
  const sorted = Object.entries(breakdown).sort(([, a], [, b]) => b - a);

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
      <h3 className="text-lg font-semibold text-white mb-4">
        Tone Detector
      </h3>

      <div className="flex items-center gap-3 mb-6">
        <span className="text-sm text-gray-400">Ton dominant:</span>
        <span
          className="text-sm font-semibold px-3 py-1 rounded-full"
          style={{
            color: TONE_COLORS[primary] || "#fff",
            backgroundColor: `${TONE_COLORS[primary] || "#fff"}20`,
          }}
        >
          {primary}
        </span>
      </div>

      <div className="space-y-3">
        {sorted.map(([tone, value]) => (
          <div key={tone} className="flex items-center gap-3">
            <span className="text-sm text-gray-400 w-24">{tone}</span>
            <div className="flex-1 bg-gray-800 rounded-full h-2">
              <div
                className="h-2 rounded-full transition-all duration-500"
                style={{
                  width: `${value}%`,
                  backgroundColor: TONE_COLORS[tone],
                }}
              />
            </div>
            <span className="text-sm text-gray-300 w-10 text-right">
              {value}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
