"use client";

import type { SerpResult } from "@/lib/types/rank-tracking";

interface SerpPreviewProps {
  results: SerpResult[];
  query: string;
  highlightDomain?: string;
}

export default function SerpPreview({ results, query, highlightDomain }: SerpPreviewProps) {
  if (results.length === 0) return null;

  const isHighlighted = (domain: string) => {
    if (!highlightDomain) return false;
    const clean = highlightDomain.replace("www.", "");
    return domain.includes(clean);
  };

  return (
    <div className="bg-gray-900/50 border border-gray-800/50 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" />
          <path d="M21 21l-4.35-4.35" />
        </svg>
        <h3 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
          SERP: &ldquo;{query}&rdquo; (Top {results.length})
        </h3>
      </div>

      <div className="space-y-2.5">
        {results.map((result) => {
          const highlighted = isHighlighted(result.domain);
          return (
            <div
              key={result.position}
              className={`rounded-lg p-3 transition-all ${
                highlighted
                  ? "bg-emerald-500/10 border border-emerald-500/30"
                  : "bg-gray-800/30 border border-transparent hover:bg-gray-800/50"
              }`}
            >
              <div className="flex items-start gap-2">
                <span className={`text-[10px] font-bold w-5 text-center flex-shrink-0 mt-0.5 ${
                  highlighted ? "text-emerald-400" : "text-gray-600"
                }`}>
                  {result.position}
                </span>
                <div className="flex-1 min-w-0">
                  <a
                    href={result.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`text-xs font-medium block truncate ${
                      highlighted ? "text-emerald-300" : "text-blue-400"
                    } hover:underline`}
                  >
                    {result.title}
                  </a>
                  <p className="text-[10px] text-gray-500 truncate mt-0.5">
                    {result.source} — {result.domain}
                  </p>
                  {result.snippet && (
                    <p className="text-[10px] text-gray-500 mt-1 line-clamp-2 leading-relaxed">
                      {result.snippet}
                    </p>
                  )}
                  {result.richSnippet?.extensions && result.richSnippet.extensions.length > 0 && (
                    <div className="flex items-center gap-2 mt-1">
                      {result.richSnippet.extensions.map((ext, i) => (
                        <span key={i} className="text-[9px] px-1.5 py-0.5 rounded bg-gray-700/50 text-gray-400">
                          {ext}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
