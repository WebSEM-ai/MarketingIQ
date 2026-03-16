"use client";

import { useState, useCallback } from "react";
import TrendChart from "@/components/trends/TrendChart";
import RelatedQueries from "@/components/trends/RelatedQueries";
import RelatedTopics from "@/components/trends/RelatedTopics";
import RegionMap from "@/components/trends/RegionMap";
import TrendInsights from "@/components/trends/TrendInsights";
import { usePersistedState } from "@/lib/hooks/usePersistedState";
import type { TrendAnalysis } from "@/lib/types/trends";
import { useSynergyReceiver } from "@/lib/synergy/useSynergyReceiver";
import type { TrendsPrefill } from "@/lib/synergy/types";
import SynergyBanner from "@/components/synergy/SynergyBanner";
import SynergyMenu from "@/components/synergy/SynergyMenu";

interface ScanProgress {
  step: number;
  total: number;
  message: string;
}

interface TrendsEntry {
  id: string;
  timestamp: string;
  query: string;
  timeframe: string;
  country: string;
  data: TrendAnalysis;
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

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("ro-RO", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getTimeframeLabel(value: string) {
  return TIMEFRAME_OPTIONS.find((o) => o.value === value)?.label || value;
}

function getCountryLabel(value: string) {
  return COUNTRY_OPTIONS.find((o) => o.value === value)?.label || value;
}

export default function TrendsPage() {
  const [query, setQuery] = useState("");
  const [timeframe, setTimeframe] = useState("today 12-m");
  const [country, setCountry] = useState("RO");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<ScanProgress | null>(null);
  const [history, setHistory] = usePersistedState<TrendsEntry[]>("trends-history", []);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selected = history.find((e) => e.id === selectedId) || null;

  // Synergy receiver
  const { incoming, dismiss: dismissSynergy } = useSynergyReceiver("trends");

  const applySynergy = useCallback(() => {
    if (!incoming) return;
    const d = incoming.data as TrendsPrefill;
    if (d.query) setQuery(d.query);
    setSelectedId(null);
    dismissSynergy();
  }, [incoming, dismissSynergy]);

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

      const entry: TrendsEntry = {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        query: query.trim(),
        timeframe,
        country,
        data: result,
      };
      setHistory((prev) => [entry, ...prev]);
      setSelectedId(entry.id);
      setQuery("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Eroare necunoscută.");
    } finally {
      setIsLoading(false);
      setProgress(null);
    }
  }, [query, timeframe, country, processStream, setHistory]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !isLoading) {
        handleAnalyze();
      }
    },
    [handleAnalyze, isLoading]
  );

  const deleteEntry = useCallback(
    (id: string) => {
      setHistory((prev) => prev.filter((e) => e.id !== id));
      if (selectedId === id) setSelectedId(null);
    },
    [selectedId, setHistory]
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
          {history.length > 0 && (
            <span className="text-xs text-gray-500">
              {history.length} analize
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {error && (
            <span className="text-xs text-red-400 max-w-xs truncate">{error}</span>
          )}
          {selected && (
            <button
              onClick={() => setSelectedId(null)}
              className="text-xs text-gray-400 hover:text-white transition-colors flex items-center gap-1"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
              Istoric
            </button>
          )}
        </div>
      </div>

      {/* Synergy Banner */}
      {incoming && (
        <div className="flex-shrink-0 border-b border-gray-800/50 px-5 py-2">
          <SynergyBanner payload={incoming} onApply={applySynergy} onDismiss={dismissSynergy} />
        </div>
      )}

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
        {selected ? (
          /* Detail View */
          <div className="p-5 space-y-4 max-w-4xl mx-auto">
            {/* Result header */}
            <div className="flex items-center justify-between bg-gray-900/50 border border-gray-800/50 rounded-xl px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-white">&ldquo;{selected.query}&rdquo;</p>
                  <p className="text-xs text-gray-500">
                    {getCountryLabel(selected.country)} &middot; {getTimeframeLabel(selected.timeframe)} &middot; {formatDate(selected.timestamp)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <SynergyMenu
                  source="trends"
                  targets={[
                    {
                      target: "keywords",
                      data: { seed: selected.query, country: selected.country },
                      label: selected.query,
                      actionLabel: "Cercetează Cuvinte Cheie",
                    },
                    {
                      target: "aeo",
                      data: { prompt: selected.query },
                      label: selected.query,
                      actionLabel: "Verifică AEO",
                    },
                    ...(selected.data.relatedQueries?.filter(q => q.type === "rising").length > 0
                      ? [{
                          target: "content" as const,
                          data: {
                            goals: "trending topics",
                            keywords: selected.data.relatedQueries.filter(q => q.type === "rising").map(q => q.query),
                          },
                          label: selected.query,
                          actionLabel: "Strategie din Tendințe",
                        }]
                      : []),
                  ]}
                />
                <button
                  onClick={() => setSelectedId(null)}
                  className="text-gray-500 hover:text-white transition-colors p-1"
                  title="Închide"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            </div>

            <TrendChart data={selected.data.interest.timeline} query={selected.data.query} />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <RelatedQueries queries={selected.data.relatedQueries} />
              <RelatedTopics topics={selected.data.relatedTopics} />
            </div>

            <RegionMap regions={selected.data.regions} />

            {selected.data.aiInsights && (
              <TrendInsights insights={selected.data.aiInsights} />
            )}
          </div>
        ) : history.length > 0 ? (
          /* History Cards */
          <div className="p-5 max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Istoric Analize ({history.length})
              </h3>
              {history.length > 1 && (
                <button
                  onClick={() => {
                    if (confirm("Ștergi tot istoricul?")) {
                      setHistory([]);
                      setSelectedId(null);
                    }
                  }}
                  className="text-xs text-gray-600 hover:text-red-400 transition-colors"
                >
                  Șterge tot
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {history.map((entry) => (
                <button
                  key={entry.id}
                  onClick={() => setSelectedId(entry.id)}
                  className="group text-left bg-gray-900/50 hover:bg-gray-800/70 border border-gray-800/50 hover:border-emerald-500/30 rounded-xl p-4 transition-all"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-white truncate">
                        &ldquo;{entry.query}&rdquo;
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {getCountryLabel(entry.country)} &middot; {getTimeframeLabel(entry.timeframe)}
                      </p>
                      <p className="text-xs text-gray-600 mt-0.5">
                        {formatDate(entry.timestamp)}
                      </p>
                    </div>
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteEntry(entry.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-red-400 transition-all p-1 cursor-pointer"
                      title="Șterge"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                      </svg>
                    </div>
                  </div>
                  {entry.data.interest.timeline.length > 0 && (
                    <div className="mt-3 flex items-end gap-px h-8">
                      {entry.data.interest.timeline
                        .filter((_, i, arr) => i % Math.max(1, Math.floor(arr.length / 20)) === 0)
                        .map((point, i) => {
                          const max = Math.max(...entry.data.interest.timeline.map((p) => p.value), 1);
                          const h = Math.max(2, (point.value / max) * 32);
                          return (
                            <div
                              key={i}
                              className="flex-1 bg-emerald-500/30 rounded-sm min-w-[2px]"
                              style={{ height: `${h}px` }}
                            />
                          );
                        })}
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* Empty State */
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
