"use client";

import { ActionableSuggestion } from "@/lib/types";

function getScoreColor(score: number): string {
  if (score >= 90) return "#22c55e";
  if (score >= 70) return "#3b82f6";
  if (score >= 41) return "#f59e0b";
  return "#ef4444";
}

export default function SuggestionChips({
  title,
  score,
  label,
  explanation,
  suggestions,
  onApply,
  appliedIds,
}: {
  title: string;
  score: number;
  label: string;
  explanation: string;
  suggestions: ActionableSuggestion[];
  onApply: (text: string, label: string) => void;
  appliedIds: Set<string>;
}) {
  const color = getScoreColor(score);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-gray-300">{title}</span>
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-bold" style={{ color }}>
            {score}
          </span>
          <span
            className="text-[9px] px-1.5 py-0.5 rounded font-medium"
            style={{ color, backgroundColor: `${color}15` }}
          >
            {label}
          </span>
        </div>
      </div>

      <p className="text-[11px] text-gray-500 leading-relaxed">{explanation}</p>

      {suggestions && suggestions.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {suggestions.map((s, i) => {
            const isApplied = appliedIds.has(`${title}-${i}`);
            return (
              <button
                key={i}
                onClick={() => {
                  if (!isApplied) onApply(s.textToAppend, s.label);
                }}
                disabled={isApplied}
                className={`text-[10px] px-2 py-1 rounded-md border transition-all ${
                  isApplied
                    ? "bg-green-500/10 text-green-500 border-green-500/20 cursor-default"
                    : "text-blue-400 bg-blue-500/5 border-blue-500/20 hover:bg-blue-500/15 hover:border-blue-500/40"
                }`}
              >
                {isApplied ? "✓ " : "+ "}
                {s.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
