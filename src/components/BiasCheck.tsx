"use client";

import { BiasIssue } from "@/lib/types";

const LEVEL_CONFIG = {
  "Scăzut": { color: "#22c55e", bg: "#22c55e15" },
  Mediu: { color: "#f59e0b", bg: "#f59e0b15" },
  "Ridicat": { color: "#ef4444", bg: "#ef444415" },
};

export default function BiasCheck({
  level,
  score,
  issues,
  originalPrompt,
}: {
  level: "Scăzut" | "Mediu" | "Ridicat";
  score: number;
  issues: BiasIssue[];
  originalPrompt: string;
}) {
  const config = LEVEL_CONFIG[level] || LEVEL_CONFIG["Scăzut"];

  function highlightFragments(text: string, fragments: string[]): React.ReactNode[] {
    if (fragments.length === 0) return [text];

    const result: React.ReactNode[] = [];
    let remaining = text;
    let keyIdx = 0;

    for (const fragment of fragments) {
      const idx = remaining.toLowerCase().indexOf(fragment.toLowerCase());
      if (idx === -1) continue;

      if (idx > 0) {
        result.push(remaining.slice(0, idx));
      }
      result.push(
        <mark
          key={keyIdx++}
          className="bg-yellow-500/30 text-yellow-200 px-0.5 rounded"
        >
          {remaining.slice(idx, idx + fragment.length)}
        </mark>
      );
      remaining = remaining.slice(idx + fragment.length);
    }

    if (remaining) result.push(remaining);
    return result;
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Bias Check</h3>
        <div className="flex items-center gap-3">
          <span
            className="text-2xl font-bold"
            style={{ color: config.color }}
          >
            {score}
          </span>
          <span
            className="text-xs font-medium px-2 py-0.5 rounded-full"
            style={{ color: config.color, backgroundColor: config.bg }}
          >
            {level}
          </span>
        </div>
      </div>

      {issues.length > 0 ? (
        <>
          <div className="bg-gray-800/50 rounded-lg p-4 mb-4 text-sm text-gray-300 whitespace-pre-wrap font-mono leading-relaxed">
            {highlightFragments(
              originalPrompt,
              issues.map((i) => i.fragment)
            )}
          </div>

          <div className="space-y-3">
            {issues.map((issue, idx) => (
              <div
                key={idx}
                className="bg-gray-800/30 border border-gray-700/50 rounded-lg p-3"
              >
                <p className="text-sm text-yellow-400 font-medium mb-1">
                  &ldquo;{issue.fragment}&rdquo;
                </p>
                <p className="text-xs text-gray-400">{issue.explanation}</p>
              </div>
            ))}
          </div>
        </>
      ) : (
        <p className="text-sm text-gray-400">
          Nu au fost detectate probleme de bias în acest prompt.
        </p>
      )}
    </div>
  );
}
