"use client";

import type { TopicCluster } from "@/lib/types/content";
import SynergyMenu from "@/components/synergy/SynergyMenu";

interface TopicClustersProps {
  clusters: TopicCluster[];
}

const PRIORITY_COLORS: Record<string, string> = {
  high: "bg-rose-500/20 text-rose-400 border-rose-500/30",
  medium: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  low: "bg-gray-500/20 text-gray-400 border-gray-500/30",
};

const PRIORITY_LABELS: Record<string, string> = {
  high: "Prioritate mare",
  medium: "Prioritate medie",
  low: "Prioritate scăzută",
};

export default function TopicClusters({ clusters }: TopicClustersProps) {
  if (!clusters.length) return null;

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
          <circle cx="12" cy="12" r="3" />
          <circle cx="12" cy="5" r="1.5" />
          <circle cx="18" cy="9" r="1.5" />
          <circle cx="18" cy="16" r="1.5" />
          <circle cx="12" cy="19" r="1.5" />
          <circle cx="6" cy="16" r="1.5" />
          <circle cx="6" cy="9" r="1.5" />
        </svg>
        <h3 className="text-xs font-semibold text-rose-500 uppercase tracking-wider">
          Clustere Tematice
        </h3>
      </div>

      <div className="space-y-3">
        {clusters.map((cluster, idx) => (
          <div
            key={idx}
            className="bg-gray-800/30 border border-gray-700/30 rounded-lg p-3 group"
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <h4 className="text-sm font-semibold text-white flex-1">
                {cluster.pillar}
              </h4>
              <div className="flex items-center gap-1.5">
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded border whitespace-nowrap ${
                    PRIORITY_COLORS[cluster.priority] || PRIORITY_COLORS.low
                  }`}
                >
                  {PRIORITY_LABELS[cluster.priority] || cluster.priority}
                </span>
                <SynergyMenu
                  source="content"
                  targets={[
                    {
                      target: "keywords",
                      data: { seed: cluster.pillar },
                      label: cluster.pillar,
                      actionLabel: "Cercetează Cuvinte Cheie",
                    },
                    {
                      target: "trends",
                      data: { query: cluster.pillar },
                      label: cluster.pillar,
                      actionLabel: "Analiză Tendințe",
                    },
                  ]}
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                />
              </div>
            </div>

            {/* Subtopics */}
            <div className="mb-2">
              <span className="text-[10px] text-gray-500 uppercase tracking-wider">
                Subtopicuri
              </span>
              <div className="flex flex-wrap gap-1 mt-1">
                {cluster.subtopics.map((sub, si) => (
                  <span
                    key={si}
                    className="text-[11px] text-gray-300 bg-gray-800/50 border border-gray-700/30 px-2 py-0.5 rounded"
                  >
                    {sub}
                  </span>
                ))}
              </div>
            </div>

            {/* Content Types */}
            <div>
              <span className="text-[10px] text-gray-500 uppercase tracking-wider">
                Tipuri de conținut
              </span>
              <div className="flex flex-wrap gap-1 mt-1">
                {cluster.contentTypes.map((ct, ci) => (
                  <span
                    key={ci}
                    className="text-[10px] text-rose-400 bg-rose-500/10 border border-rose-500/20 px-1.5 py-0.5 rounded"
                  >
                    {ct}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
