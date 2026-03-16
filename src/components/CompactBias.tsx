"use client";

import { BiasIssue } from "@/lib/types";

const LEVEL_COLORS: Record<string, string> = {
  "Scăzut": "#22c55e",
  Mediu: "#f59e0b",
  "Ridicat": "#ef4444",
};

export default function CompactBias({
  level,
  score,
  issues,
}: {
  level: string;
  score: number;
  issues: BiasIssue[];
}) {
  const color = LEVEL_COLORS[level] || "#9ca3af";

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-gray-400">Nivel bias</span>
        <span className="text-xs font-bold" style={{ color }}>
          {level} ({score})
        </span>
      </div>
      {issues.length > 0 && (
        <div className="space-y-1">
          {issues.slice(0, 3).map((issue, i) => (
            <p key={i} className="text-[10px] text-gray-500 leading-relaxed">
              <span className="text-yellow-500">&ldquo;{issue.fragment.slice(0, 50)}&rdquo;</span>
              {" — "}{issue.explanation.slice(0, 80)}
            </p>
          ))}
        </div>
      )}
      {issues.length === 0 && (
        <p className="text-[10px] text-gray-600">Fără probleme de bias detectate.</p>
      )}
    </div>
  );
}
