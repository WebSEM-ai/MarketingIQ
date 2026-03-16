"use client";

import type { KeywordCluster } from "@/lib/types/keywords";

interface ClusterViewProps {
  clusters: KeywordCluster[];
}

const INTENT_STYLES: Record<KeywordCluster["intent"], { bg: string; text: string; label: string }> = {
  informational: { bg: "bg-blue-500/10 border-blue-500/20", text: "text-blue-400", label: "Informațional" },
  commercial: { bg: "bg-amber-500/10 border-amber-500/20", text: "text-amber-400", label: "Comercial" },
  transactional: { bg: "bg-green-500/10 border-green-500/20", text: "text-green-400", label: "Tranzacțional" },
  navigational: { bg: "bg-gray-500/10 border-gray-500/20", text: "text-gray-400", label: "Navigațional" },
};

export default function ClusterView({ clusters }: ClusterViewProps) {
  if (clusters.length === 0) return null;

  return (
    <div className="bg-gray-900/50 border border-gray-800/50 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7" />
          <rect x="14" y="3" width="7" height="7" />
          <rect x="14" y="14" width="7" height="7" />
          <rect x="3" y="14" width="7" height="7" />
        </svg>
        <h3 className="text-xs font-semibold text-purple-400 uppercase tracking-wider">
          Clustere după Intenție
        </h3>
      </div>
      <div className="space-y-3">
        {clusters.map((cluster, i) => {
          const style = INTENT_STYLES[cluster.intent];
          return (
            <div
              key={`${cluster.name}-${i}`}
              className="border border-gray-800/50 rounded-lg p-3"
            >
              <div className="flex items-center gap-2 mb-2">
                <h4 className="text-sm font-medium text-white">{cluster.name}</h4>
                <span className={`text-[10px] px-1.5 py-0.5 rounded border ${style.bg} ${style.text}`}>
                  {style.label}
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {cluster.keywords.map((kw, j) => (
                  <span
                    key={`${kw}-${j}`}
                    className="text-xs bg-gray-800/50 text-gray-300 px-2 py-1 rounded-md border border-gray-700/30"
                  >
                    {kw}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
