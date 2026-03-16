"use client";

import type { KeywordRanking } from "@/lib/types/keywords";

interface RankingResultsProps {
  rankings: KeywordRanking[];
  domain: string;
}

function getPositionStyle(position: number | null): string {
  if (position === null) return "text-gray-500";
  if (position <= 10) return "text-green-400";
  if (position <= 30) return "text-yellow-400";
  return "text-red-400";
}

function getPositionBg(position: number | null): string {
  if (position === null) return "bg-gray-500/10";
  if (position <= 10) return "bg-green-500/10";
  if (position <= 30) return "bg-yellow-500/10";
  return "bg-red-500/10";
}

export default function RankingResults({ rankings, domain }: RankingResultsProps) {
  if (rankings.length === 0) return null;

  const found = rankings.filter((r) => r.position !== null).length;

  return (
    <div className="bg-gray-900/50 border border-gray-800/50 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 20V10" />
            <path d="M12 20V4" />
            <path d="M6 20v-6" />
          </svg>
          <h3 className="text-xs font-semibold text-purple-400 uppercase tracking-wider">
            Poziții pentru {domain}
          </h3>
        </div>
        <span className="text-xs text-gray-500">
          {found}/{rankings.length} găsite
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800/50">
              <th className="text-left text-xs text-gray-500 font-medium pb-2 pr-4">Cuvânt cheie</th>
              <th className="text-center text-xs text-gray-500 font-medium pb-2 px-4 w-20">Poziție</th>
              <th className="text-left text-xs text-gray-500 font-medium pb-2 pl-4">URL</th>
            </tr>
          </thead>
          <tbody>
            {rankings.map((r, i) => (
              <tr key={`${r.keyword}-${i}`} className="border-b border-gray-800/30 last:border-0">
                <td className="py-2 pr-4 text-gray-300">{r.keyword}</td>
                <td className="py-2 px-4 text-center">
                  <span
                    className={`inline-block min-w-[32px] text-xs font-medium px-2 py-0.5 rounded ${getPositionBg(r.position)} ${getPositionStyle(r.position)}`}
                  >
                    {r.position !== null ? `#${r.position}` : "—"}
                  </span>
                </td>
                <td className="py-2 pl-4 text-gray-500 text-xs truncate max-w-[200px]">
                  {r.url || "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
