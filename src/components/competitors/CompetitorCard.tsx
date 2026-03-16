"use client";

import type { Competitor } from "@/lib/types/competitors";

interface CompetitorCardProps {
  competitor: Competitor;
  isSelected: boolean;
  onSelect: () => void;
  onRescan: () => void;
  isScanning: boolean;
}

function ScoreGauge({ score }: { score: number }) {
  const size = 44;
  const radius = (size - 6) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;
  const color = score >= 70 ? "#22c55e" : score >= 40 ? "#f59e0b" : "#ef4444";

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="w-full h-full -rotate-90" viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#1f2937" strokeWidth="3" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-[10px] font-bold" style={{ color }}>{score}</span>
      </div>
    </div>
  );
}

export default function CompetitorCard({
  competitor,
  isSelected,
  onSelect,
  onRescan,
  isScanning,
}: CompetitorCardProps) {
  const statusColors = {
    active: "bg-green-500/20 text-green-400",
    pending: "bg-amber-500/20 text-amber-400",
    error: "bg-red-500/20 text-red-400",
  };

  const statusLabels = {
    active: "Activ",
    pending: "În așteptare",
    error: "Eroare",
  };

  return (
    <div
      onClick={onSelect}
      className={`bg-gray-900/50 border rounded-xl p-3 cursor-pointer transition-all hover:border-amber-500/30 ${
        isSelected ? "border-amber-500/50 bg-amber-500/5" : "border-gray-800/50"
      }`}
    >
      <div className="flex items-start gap-3">
        {competitor.seoScore !== undefined && (
          <ScoreGauge score={competitor.seoScore} />
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="text-sm font-medium text-white truncate">
              {competitor.name}
            </h4>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${statusColors[competitor.status]}`}>
              {statusLabels[competitor.status]}
            </span>
          </div>
          <p className="text-xs text-gray-500 truncate">{competitor.url}</p>
          {competitor.lastScanned && (
            <p className="text-[10px] text-gray-600 mt-1">
              Scanat: {new Date(competitor.lastScanned).toLocaleDateString("ro-RO")}
            </p>
          )}
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onRescan();
          }}
          disabled={isScanning}
          className="text-xs text-amber-500 hover:text-amber-400 disabled:text-gray-600 shrink-0"
          title="Re-scanează"
        >
          {isScanning ? (
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0118.8-4.3M22 12.5a10 10 0 01-18.8 4.2" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}
