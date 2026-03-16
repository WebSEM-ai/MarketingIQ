"use client";

import { useState, useCallback } from "react";
import TrendChart from "@/components/trends/TrendChart";
import RelatedQueries from "@/components/trends/RelatedQueries";
import RelatedTopics from "@/components/trends/RelatedTopics";
import RegionMap from "@/components/trends/RegionMap";
import TrendInsights from "@/components/trends/TrendInsights";
import type { TrendAnalysis } from "@/lib/types/trends";

interface ScanProgress {
  step: number;
  total: number;
  message: string;
}

const TIMEFRAME_OPTIONS = [
  { label: "Ultimele 3 luni", value: "today 3-m" },
  { label: "Ultimul an", value: "today 12-m" },
  { label: "Tot timpul", value: "all" },
];

const COUNTRY_OPTIONS = [
  { label: "România", value: "RO" },
  { label: "Global", value: "" },
  { label: "SUA", value: "US" },
  { label: "UK", value: "GB" },
];

export default function TrendsPage() {
  const [query, setQuery] = useState("");
  const [timeframe, setTimeframe] = useState("today 12-m");
  const [country, setCountry] = useState("RO");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<ScanProgress | null>(null);
  const [analysis, setAnalysis] = useState<TrendAnalysis | null>(null);

  const processStream = useCallback(
    async (q: string, tf: string, co: string) => {
      const res = await fetch("/api/trends/explore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q, timeframe: tf, country: co }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Eroare la analiză.");
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error("Nu pot citi stream-ul.");

      const decoder = new TextDecoder();
      let buffer = "";
      let result: TrendAnalysis | null = null;
      let streamError: string | null = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const chunks = buffer.split("\n\n");
        buffer = chunks.pop() || "";

        for (const chunk of chunks) {
          const trimmed = chunk.trim();
          if (!trimmed.startsWith("data: ")) continue;

          const jsonStr = trimmed.slice(6);

          try {
            const event = JSON.parse(jsonStr);

            if (event.event === "progress") {
              setProgress({
                step: event.step,
                total: event.total,
                message: event.message,
              });
            } else if (event.event === "result") {
              result = event.analysis as TrendAnalysis;
            } else if (event.event === "error") {
              streamError = event.error;
            }
          } catch {
            // Incomplete JSON chunk, skip
          }
        }
      }

      if (streamError) throw new Error(streamError);
      return result;
    },
    []
  );

  const handleAnalyze = useCallback(async () => {
    if (!query.trim()) return;

    setIsLoading(true);
    setError(null);
    setProgress({ step: 0, total: 4, message: "Inițializez analiza..." });

    try {
      const result = await processStream(query.trim(), timeframe, country);
      if (!result) throw new Error("Nu s-a primit rezultatul.");
      setAnalysis(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Eroare necunoscută.");
    } finally {
      setIsLoading(false);
      setProgress(null);
    }
  }, [query, timeframe, country, processStream]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !isLoading) {
        handleAnalyze();
      }
    },
    [handleAnalyze, isLoading]
  );

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-gray-800/50 px-5 py-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
          </div>
          <h2 className="text-sm font-bold">
            <span className="text-emerald-500">Analiză</span>
            <span className="text-white"> Tendințe</span>
          </h2>
        </div>
        {error && (
          <span className="text-xs text-red-400 max-w-xs truncate">{error}</span>
        )}
      </div>

      {/* Search Form */}
      <div className="flex-shrink-0 border-b border-gray-800/50 px-5 py-3">
        <div className="flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Introdu un termen de căutare..."
              className="w-full bg-gray-800/50 border border-gray-700/50 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20"
              disabled={isLoading}
            />
          </div>
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            className="bg-gray-800/50 border border-gray-700/50 rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-emerald-500/50 appearance-none cursor-pointer"
            disabled={isLoading}
          >
            {TIMEFRAME_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <select
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className="bg-gray-800/50 border border-gray-700/50 rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-emerald-500/50 appearance-none cursor-pointer"
            disabled={isLoading}
          >
            {COUNTRY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <button
            onClick={handleAnalyze}
            disabled={isLoading || !query.trim()}
            className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-700 disabled:text-gray-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors flex-shrink-0"
          >
            {isLoading ? "Analizez..." : "Analizează"}
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      {progress && (
        <div className="flex-shrink-0 bg-gray-900/80 border-b border-gray-800/50 px-5 py-2.5">
          <div className="flex items-center gap-3">
            <svg className="animate-spin h-4 w-4 text-emerald-500 flex-shrink-0" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-300">{progress.message}</span>
                <span className="text-xs text-gray-500">
                  {progress.step}/{progress.total}
                </span>
              </div>
              <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${(progress.step / progress.total) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 min-h-0 panel-scroll">
        {analysis ? (
          <div className="p-5 space-y-4 max-w-4xl mx-auto">
            {/* Chart */}
            <TrendChart data={analysis.interest.timeline} query={analysis.query} />

            {/* Related Queries + Topics - 2 columns */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <RelatedQueries queries={analysis.relatedQueries} />
              <RelatedTopics topics={analysis.relatedTopics} />
            </div>

            {/* Region Map */}
            <RegionMap regions={analysis.regions} />

            {/* AI Insights */}
            {analysis.aiInsights && (
              <TrendInsights insights={analysis.aiInsights} />
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="w-20 h-20 rounded-full bg-gray-900 border border-gray-800 flex items-center justify-center mb-4">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
              </svg>
            </div>
            <p className="text-sm text-gray-600 mb-1">
              Caută o tendință de analizat
            </p>
            <p className="text-xs text-gray-700">
              Introdu un termen de căutare și apasă &ldquo;Analizează&rdquo; pentru a vedea tendințele
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
