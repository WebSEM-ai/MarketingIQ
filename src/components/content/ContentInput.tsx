"use client";

import type { ContentInput as ContentInputType } from "@/lib/types/content";

interface ContentInputProps {
  input: ContentInputType;
  onChange: (input: ContentInputType) => void;
  onSubmit: () => void;
  isLoading: boolean;
}

export default function ContentInput({
  input,
  onChange,
  onSubmit,
  isLoading,
}: ContentInputProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey && !isLoading) {
      e.preventDefault();
      onSubmit();
    }
  };

  const canSubmit =
    input.business.trim() && input.audience.trim() && input.goals.trim();

  return (
    <div className="bg-gray-900/50 border border-gray-800/50 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-7 h-7 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
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
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
          </svg>
        </div>
        <h3 className="text-sm font-semibold text-white">
          Definește Strategia
        </h3>
      </div>

      <div className="space-y-3">
        {/* Business */}
        <div>
          <label className="block text-xs text-gray-400 mb-1">
            Business / Nișă *
          </label>
          <input
            type="text"
            value={input.business}
            onChange={(e) => onChange({ ...input, business: e.target.value })}
            onKeyDown={handleKeyDown}
            placeholder="ex: magazin online de cosmetice naturale"
            className="w-full bg-gray-800/50 border border-gray-700/50 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-rose-500/50 focus:ring-1 focus:ring-rose-500/20"
            disabled={isLoading}
          />
        </div>

        {/* Audience */}
        <div>
          <label className="block text-xs text-gray-400 mb-1">
            Audiență Țintă *
          </label>
          <input
            type="text"
            value={input.audience}
            onChange={(e) => onChange({ ...input, audience: e.target.value })}
            onKeyDown={handleKeyDown}
            placeholder="ex: femei 25-45 ani, interesate de skincare natural"
            className="w-full bg-gray-800/50 border border-gray-700/50 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-rose-500/50 focus:ring-1 focus:ring-rose-500/20"
            disabled={isLoading}
          />
        </div>

        {/* Goals */}
        <div>
          <label className="block text-xs text-gray-400 mb-1">
            Obiective *
          </label>
          <input
            type="text"
            value={input.goals}
            onChange={(e) => onChange({ ...input, goals: e.target.value })}
            onKeyDown={handleKeyDown}
            placeholder="ex: creștere trafic organic, brand awareness"
            className="w-full bg-gray-800/50 border border-gray-700/50 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-rose-500/50 focus:ring-1 focus:ring-rose-500/20"
            disabled={isLoading}
          />
        </div>

        {/* Competitors (optional) */}
        <div>
          <label className="block text-xs text-gray-400 mb-1">
            Competitori{" "}
            <span className="text-gray-600">(opțional)</span>
          </label>
          <textarea
            value={input.competitors || ""}
            onChange={(e) =>
              onChange({ ...input, competitors: e.target.value })
            }
            placeholder="ex: site-urile concurente"
            rows={2}
            className="w-full bg-gray-800/50 border border-gray-700/50 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-rose-500/50 focus:ring-1 focus:ring-rose-500/20 resize-none"
            disabled={isLoading}
          />
        </div>

        {/* Existing Content (optional) */}
        <div>
          <label className="block text-xs text-gray-400 mb-1">
            Conținut Existent{" "}
            <span className="text-gray-600">(opțional)</span>
          </label>
          <textarea
            value={input.existingContent || ""}
            onChange={(e) =>
              onChange({ ...input, existingContent: e.target.value })
            }
            placeholder="ex: blog cu 20 articole despre skincare"
            rows={2}
            className="w-full bg-gray-800/50 border border-gray-700/50 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-rose-500/50 focus:ring-1 focus:ring-rose-500/20 resize-none"
            disabled={isLoading}
          />
        </div>

        {/* Submit */}
        <button
          onClick={onSubmit}
          disabled={isLoading || !canSubmit}
          className="w-full bg-rose-600 hover:bg-rose-500 disabled:bg-gray-700 disabled:text-gray-500 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
        >
          {isLoading ? "Generez strategia..." : "Generează Strategie"}
        </button>
      </div>
    </div>
  );
}
