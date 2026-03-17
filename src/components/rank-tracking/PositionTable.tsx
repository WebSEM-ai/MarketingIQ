"use client";

import type { RankPosition } from "@/lib/types/rank-tracking";

interface PositionTableProps {
  positions: RankPosition[];
  domain: string;
}

function getPositionColor(pos: number | null): string {
  if (pos === null) return "text-gray-600";
  if (pos <= 3) return "text-emerald-400";
  if (pos <= 10) return "text-green-400";
  if (pos <= 20) return "text-yellow-400";
  if (pos <= 50) return "text-orange-400";
  return "text-red-400";
}

function getPositionBg(pos: number | null): string {
  if (pos === null) return "bg-gray-800/30";
  if (pos <= 3) return "bg-emerald-500/10";
  if (pos <= 10) return "bg-green-500/10";
  if (pos <= 20) return "bg-yellow-500/10";
  return "bg-gray-800/30";
}

export default function PositionTable({ positions, domain }: PositionTableProps) {
  const sorted = [...positions].sort((a, b) => {
    if (a.topPosition === null && b.topPosition === null) return 0;
    if (a.topPosition === null) return 1;
    if (b.topPosition === null) return -1;
    return a.topPosition - b.topPosition;
  });

  const ranked = positions.filter((p) => p.topPosition !== null);
  const top3 = ranked.filter((p) => p.topPosition! <= 3).length;
  const top10 = ranked.filter((p) => p.topPosition! <= 10).length;
  const top20 = ranked.filter((p) => p.topPosition! <= 20).length;

  return (
    <div className="bg-gray-900/50 border border-gray-800/50 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="20" x2="18" y2="10" />
            <line x1="12" y1="20" x2="12" y2="4" />
            <line x1="6" y1="20" x2="6" y2="14" />
          </svg>
          <h3 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
            Poziții ({positions.length} keywords)
          </h3>
        </div>
        <div className="flex items-center gap-3 text-[10px]">
          <span className="text-emerald-400">Top 3: {top3}</span>
          <span className="text-green-400">Top 10: {top10}</span>
          <span className="text-yellow-400">Top 20: {top20}</span>
          <span className="text-gray-500">Indexate: {ranked.length}/{positions.length}</span>
        </div>
      </div>

      {/* Summary bar */}
      <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden flex mb-4">
        {top3 > 0 && (
          <div
            className="h-full bg-emerald-500"
            style={{ width: `${(top3 / positions.length) * 100}%` }}
          />
        )}
        {(top10 - top3) > 0 && (
          <div
            className="h-full bg-green-500"
            style={{ width: `${((top10 - top3) / positions.length) * 100}%` }}
          />
        )}
        {(top20 - top10) > 0 && (
          <div
            className="h-full bg-yellow-500"
            style={{ width: `${((top20 - top10) / positions.length) * 100}%` }}
          />
        )}
        {(ranked.length - top20) > 0 && (
          <div
            className="h-full bg-orange-500"
            style={{ width: `${((ranked.length - top20) / positions.length) * 100}%` }}
          />
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-gray-500 border-b border-gray-800/50">
              <th className="text-left py-2 px-2 font-medium">Keyword</th>
              <th className="text-center py-2 px-2 font-medium w-20">Poziție</th>
              <th className="text-center py-2 px-2 font-medium w-16">Apariții</th>
              <th className="text-left py-2 px-2 font-medium">URL indexat</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((pos) => {
              const topResult = pos.results.find(
                (r) => r.domain.includes(domain.replace("www.", ""))
              );
              return (
                <tr
                  key={pos.keyword}
                  className={`border-b border-gray-800/30 ${getPositionBg(pos.topPosition)} hover:bg-gray-800/50 transition-colors`}
                >
                  <td className="py-2 px-2 text-gray-300 font-medium">
                    {pos.keyword}
                  </td>
                  <td className="py-2 px-2 text-center">
                    <span className={`font-bold text-sm ${getPositionColor(pos.topPosition)}`}>
                      {pos.topPosition ?? "—"}
                    </span>
                  </td>
                  <td className="py-2 px-2 text-center text-gray-500">
                    {pos.occurrences || "—"}
                  </td>
                  <td className="py-2 px-2 text-gray-500 truncate max-w-[300px]">
                    {topResult ? (
                      <a
                        href={topResult.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-emerald-400 transition-colors"
                        title={topResult.link}
                      >
                        {topResult.link.replace(/^https?:\/\//, "").slice(0, 60)}
                      </a>
                    ) : pos.topPosition === null ? (
                      <span className="text-gray-700 italic">neindexat</span>
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
