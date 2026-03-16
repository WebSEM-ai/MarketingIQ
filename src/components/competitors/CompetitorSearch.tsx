"use client";

import { useState } from "react";
import type { SearchResult } from "@/lib/types/competitors";

interface CompetitorSearchProps {
  onAdd: (url: string) => void;
}

export default function CompetitorSearch({ onAdd }: CompetitorSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!query.trim() || isSearching) return;

    setIsSearching(true);
    setError(null);

    try {
      const res = await fetch("/api/competitors/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: query.trim() }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Eroare la căutare.");
      }

      const data = await res.json();
      setResults(data.results || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Eroare necunoscută.");
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="bg-gray-900/50 border border-gray-800/50 rounded-xl p-4 space-y-3">
      <h3 className="text-xs font-semibold text-amber-500 uppercase tracking-wider">
        Caută Competitori
      </h3>

      <div className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          placeholder="ex: agenție SEO București"
          className="flex-1 bg-gray-800/50 border border-gray-700/50 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-amber-500/50"
          disabled={isSearching}
        />
        <button
          onClick={handleSearch}
          disabled={!query.trim() || isSearching}
          className="bg-amber-600 hover:bg-amber-500 disabled:bg-gray-700 disabled:text-gray-500 text-white text-sm rounded-lg px-3 py-2 transition-colors shrink-0"
        >
          {isSearching ? (
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
            </svg>
          )}
        </button>
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}

      {results.length > 0 && (
        <div className="space-y-1.5 max-h-60 overflow-y-auto">
          {results.map((result, i) => (
            <div
              key={i}
              className="flex items-start gap-2 p-2 rounded-lg hover:bg-gray-800/30 transition-colors group"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white truncate">{result.title}</p>
                <p className="text-xs text-gray-500 truncate">{result.url}</p>
                <p className="text-xs text-gray-600 line-clamp-1">{result.description}</p>
              </div>
              <button
                onClick={() => onAdd(result.url)}
                className="text-xs text-amber-500 hover:text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 px-2 py-1 rounded-md shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                Adaugă
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
