"use client";

import { AppliedSuggestion } from "@/lib/types";

export default function PromptEditor({
  prompt,
  setPrompt,
  onAnalyze,
  isLoading,
  isDirty,
  appliedSuggestions,
  onRemoveSuggestion,
}: {
  prompt: string;
  setPrompt: (val: string) => void;
  onAnalyze: () => void;
  isLoading: boolean;
  isDirty: boolean;
  appliedSuggestions: AppliedSuggestion[];
  onRemoveSuggestion: (id: string) => void;
}) {
  return (
    <div className="flex flex-col h-full">
      {/* Textarea */}
      <div className="flex-1 relative">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Lipește promptul tău aici..."
          className="w-full h-full bg-gray-900/50 border border-gray-800 rounded-xl p-4 text-gray-100 placeholder-gray-600 text-sm resize-none focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-colors font-mono leading-relaxed"
          disabled={isLoading}
        />
      </div>

      {/* Applied suggestions chips */}
      {appliedSuggestions.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {appliedSuggestions.map((s) => (
            <span
              key={s.id}
              className="inline-flex items-center gap-1 text-[11px] bg-green-500/10 text-green-400 border border-green-500/20 px-2 py-0.5 rounded-full"
            >
              {s.label}
              <button
                onClick={() => onRemoveSuggestion(s.id)}
                className="hover:text-red-400 transition-colors ml-0.5"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Bottom bar */}
      <div className="flex items-center justify-between mt-3">
        <span className="text-xs text-gray-600">
          {prompt.length.toLocaleString()} caractere
        </span>
        <button
          onClick={onAnalyze}
          disabled={!prompt.trim() || isLoading}
          className={`px-5 py-2 text-sm font-semibold rounded-lg transition-all ${
            isDirty && !isLoading
              ? "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20 animate-pulse"
              : "bg-blue-600 hover:bg-blue-500 disabled:bg-gray-800 disabled:text-gray-600 text-white"
          }`}
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Analizez...
            </span>
          ) : isDirty ? (
            "Re-analizează"
          ) : (
            "Analizează"
          )}
        </button>
      </div>
    </div>
  );
}
