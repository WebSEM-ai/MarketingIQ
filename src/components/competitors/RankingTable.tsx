"use client";

import type { RankingData } from "@/lib/types/competitors";
import SynergyActionButton from "@/components/synergy/SynergyActionButton";

interface RankingTableProps {
  rankings: RankingData[];
}

function getPositionStyle(position: number | null) {
  if (position === null) return "text-gray-500 bg-gray-800/30";
  if (position <= 10) return "text-green-400 bg-green-500/10";
  if (position <= 30) return "text-amber-400 bg-amber-500/10";
  return "text-red-400 bg-red-500/10";
}

export default function RankingTable({ rankings }: RankingTableProps) {
  if (!rankings.length) return null;

  return (
    <div className="bg-gray-900/50 border border-gray-800/50 rounded-xl p-4">
      <h3 className="text-xs font-semibold text-amber-500 uppercase tracking-wider mb-3">
        Poziții în Google
      </h3>
      <div className="space-y-1.5">
        <div className="flex items-center text-[10px] text-gray-600 uppercase tracking-wider px-2 pb-1">
          <span className="flex-1">Cuvânt cheie</span>
          <span className="w-16 text-center">Poziție</span>
          <span className="w-16"></span>
        </div>
        {rankings.map((rank, i) => (
          <div
            key={i}
            className="flex items-center px-2 py-1.5 rounded-lg hover:bg-gray-800/30 transition-colors group"
          >
            <span className="flex-1 text-sm text-gray-300 truncate">{rank.keyword}</span>
            <span className={`w-16 text-center text-xs font-semibold rounded-md px-2 py-0.5 ${getPositionStyle(rank.position)}`}>
              {rank.position !== null ? `#${rank.position}` : "—"}
            </span>
            <div className="w-16 flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <SynergyActionButton
                source="competitors"
                target="trends"
                data={{ query: rank.keyword }}
                label={rank.keyword}
                icon="trends"
                title="Analizează trendul"
              />
              <SynergyActionButton
                source="competitors"
                target="aeo"
                data={{ prompt: rank.keyword }}
                label={rank.keyword}
                icon="aeo"
                title="Verifică AEO"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
