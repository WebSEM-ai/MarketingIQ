"use client";

import { useState } from "react";
import type { KeywordSuggestion } from "@/lib/types/keywords";
import SynergyActionButton from "@/components/synergy/SynergyActionButton";

interface SuggestionListProps {
  suggestions: KeywordSuggestion[];
}

const SOURCE_STYLES: Record<KeywordSuggestion["source"], { bg: string; text: string; label: string }> = {
  autocomplete: { bg: "bg-blue-500/10 border-blue-500/20", text: "text-blue-400", label: "autocomplete" },
  related: { bg: "bg-amber-500/10 border-amber-500/20", text: "text-amber-400", label: "asociat" },
  ai: { bg: "bg-purple-500/10 border-purple-500/20", text: "text-purple-400", label: "AI" },
};

export default function SuggestionList({ suggestions }: SuggestionListProps) {
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const handleCopy = async (keyword: string, idx: number) => {
    try {
      await navigator.clipboard.writeText(keyword);
      setCopiedIdx(idx);
      setTimeout(() => setCopiedIdx(null), 1500);
    } catch {
      // fallback
    }
  };

  if (suggestions.length === 0) return null;

  return (
    <div className="bg-gray-900/50 border border-gray-800/50 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="8" y1="6" x2="21" y2="6" />
            <line x1="8" y1="12" x2="21" y2="12" />
            <line x1="8" y1="18" x2="21" y2="18" />
            <line x1="3" y1="6" x2="3.01" y2="6" />
            <line x1="3" y1="12" x2="3.01" y2="12" />
            <line x1="3" y1="18" x2="3.01" y2="18" />
          </svg>
          <h3 className="text-xs font-semibold text-purple-400 uppercase tracking-wider">
            Sugestii Cuvinte Cheie
          </h3>
        </div>
        <span className="text-xs text-gray-500">{suggestions.length} cuvinte</span>
      </div>
      <div className="max-h-64 overflow-y-auto space-y-1 pr-1">
        {suggestions.map((s, i) => {
          const style = SOURCE_STYLES[s.source];
          return (
            <div
              key={`${s.keyword}-${i}`}
              className="w-full flex items-center justify-between gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-800/50 transition-colors text-left group"
            >
              <button
                onClick={() => handleCopy(s.keyword, i)}
                className="flex-1 min-w-0 text-left"
              >
                <span className="text-sm text-gray-300 truncate block">{s.keyword}</span>
              </button>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <span className={`text-[10px] px-1.5 py-0.5 rounded border ${style.bg} ${style.text}`}>
                  {style.label}
                </span>
                {/* Synergy: Send to Trends */}
                <SynergyActionButton
                  source="keywords"
                  target="trends"
                  data={{ query: s.keyword }}
                  label={s.keyword}
                  icon="trends"
                  title="Analizează trendul"
                  className="opacity-0 group-hover:opacity-60 hover:!opacity-100"
                />
                {/* Synergy: Send to AEO */}
                <SynergyActionButton
                  source="keywords"
                  target="aeo"
                  data={{ prompt: s.keyword }}
                  label={s.keyword}
                  icon="aeo"
                  title="Verifică vizibilitate AEO"
                  className="opacity-0 group-hover:opacity-60 hover:!opacity-100"
                />
                <span className="text-[10px] text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity w-12">
                  {copiedIdx === i ? "✓ copiat" : ""}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
