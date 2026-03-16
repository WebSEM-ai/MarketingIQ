"use client";

import { useState, useCallback } from "react";
import KeywordInput from "@/components/keywords/KeywordInput";
import SuggestionList from "@/components/keywords/SuggestionList";
import ClusterView from "@/components/keywords/ClusterView";
import RankingResults from "@/components/keywords/RankingResults";
import KeywordInsights from "@/components/keywords/KeywordInsights";
import { usePersistedState } from "@/lib/hooks/usePersistedState";
import type { KeywordAnalysis } from "@/lib/types/keywords";
import { useSynergyReceiver } from "@/lib/synergy/useSynergyReceiver";
import type { KeywordsPrefill } from "@/lib/synergy/types";
import SynergyBanner from "@/components/synergy/SynergyBanner";
import SynergyMenu from "@/components/synergy/SynergyMenu";

interface ScanProgress {
  step: number;
  total: number;
  message: string;
}

interface KeywordsEntry {
  id: string;
  timestamp: string;
  seed: string;
  domain: string;
  country: string;
  suggestionCount: number;
  clusterCount: number;
  data: KeywordAnalysis;
}

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

function getCountryLabel(value: string) {
  return COUNTRY_OPTIONS.find((o) => o.value === value)?.label || value;
}

export default function KeywordsPage() {
  const [seed, setSeed] = useState("");
  const [domain, setDomain] = useState("");
  const [country, setCountry] = useState("RO");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<ScanProgress | null>(null);
  const [history, setHistory] = usePersistedState<KeywordsEntry[]>("keywords-history", []);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selected = history.find((e) => e.id === selectedId) || null;

  // Synergy receiver
  const { incoming, dismiss: dismissSynergy } = useSynergyReceiver("keywords");

  const applySynergy = useCallback(() => {
    if (!incoming) return;
    const d = incoming.data as KeywordsPrefill;
    if (d.seed) setSeed(d.seed);
    if (d.domain) setDomain(d.domain);
    if (d.country) setCountry(d.country);
    setSelectedId(null);
    dismissSynergy();
  }, [incoming, dismissSynergy]);

  const processStream = useCallback(
    async (s: string, d: string, co: string) => {
      const res = await fetch("/api/keywords/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seed: s, domain: d || undefined, country: co }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Eroare la cercetare.");
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error("Nu pot citi stream-ul.");

      const decoder = new TextDecoder();
      let buffer = "";
      let result: KeywordAnalysis | null = null;
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
              result = event.analysis as KeywordAnalysis;
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

  const handleResearch = useCallback(async () => {
    if (!seed.trim()) return;

    setIsLoading(true);
    setError(null);
    setProgress({ step: 0, total: domain.trim() ? 4 : 3, message: "Inițializez cercetarea..." });

    try {
      const result = await processStream(seed.trim(), domain.trim(), country);
      if (!result) throw new Error("Nu s-a primit rezultatul.");

      const entry: KeywordsEntry = {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        seed: seed.trim(),
        domain: domain.trim(),
        country,
        suggestionCount: result.suggestions?.length || 0,
        clusterCount: result.clusters?.length || 0,
        data: result,
      };
      setHistory((prev) => [entry, ...prev]);
      setSelectedId(entry.id);
      setSeed("");
      setDomain("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Eroare necunoscută.");
    } finally {
      setIsLoading(false);
      setProgress(null);
    }
  }, [seed, domain, country, processStream, setHistory]);

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
          <div className="w-7 h-7 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
          </div>
          <h2 className="text-sm font-bold">
            <span className="text-purple-400">Cuvinte</span>
            <span className="text-white"> Cheie</span>
          </h2>
          {history.length > 0 && (
            <span className="text-xs text-gray-500">
              {history.length} cercetări
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

      {/* Search Form — visible when not viewing results */}
      {!selected && (
        <div className="flex-shrink-0 border-b border-gray-800/50 px-5 py-3">
          <KeywordInput
            seed={seed}
            domain={domain}
            country={country}
            isLoading={isLoading}
            onSeedChange={setSeed}
            onDomainChange={setDomain}
            onCountryChange={setCountry}
            onSubmit={handleResearch}
          />
        </div>
      )}

      {/* Progress Bar */}
      {progress && (
        <div className="flex-shrink-0 bg-gray-900/80 border-b border-gray-800/50 px-5 py-2.5">
          <div className="flex items-center gap-3">
            <svg className="animate-spin h-4 w-4 text-purple-500 flex-shrink-0" viewBox="0 0 24 24" fill="none">
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
                  className="h-full bg-purple-500 rounded-full transition-all duration-500 ease-out"
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
                <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8" />
                    <path d="M21 21l-4.35-4.35" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-white">&ldquo;{selected.seed}&rdquo;</p>
                  <p className="text-xs text-gray-500">
                    {getCountryLabel(selected.country)}
                    {selected.domain && <> &middot; {selected.domain}</>}
                    {" "}&middot; {selected.suggestionCount} sugestii &middot; {selected.clusterCount} clustere &middot; {formatDate(selected.timestamp)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <SynergyMenu
                  source="keywords"
                  targets={[
                    {
                      target: "trends",
                      data: { query: selected.seed },
                      label: selected.seed,
                      actionLabel: "Analiză Tendințe",
                    },
                    {
                      target: "content",
                      data: { keywords: selected.data.suggestions?.map(s => s.keyword) || [] },
                      label: selected.seed,
                      actionLabel: "Strategie Conținut",
                    },
                    {
                      target: "aeo",
                      data: { prompt: selected.seed },
                      label: selected.seed,
                      actionLabel: "Verifică AEO",
                    },
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

            <SuggestionList suggestions={selected.data.suggestions} />
            <ClusterView clusters={selected.data.clusters} />
            {selected.data.rankings && selected.data.rankings.length > 0 && selected.domain && (
              <RankingResults rankings={selected.data.rankings} domain={selected.domain} />
            )}
            {selected.data.aiInsights && (
              <KeywordInsights insights={selected.data.aiInsights} />
            )}
          </div>
        ) : history.length > 0 ? (
          /* History Cards */
          <div className="p-5 max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Istoric Cercetări ({history.length})
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
                  className="group text-left bg-gray-900/50 hover:bg-gray-800/70 border border-gray-800/50 hover:border-purple-500/30 rounded-xl p-4 transition-all"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-white truncate">
                        &ldquo;{entry.seed}&rdquo;
                      </p>
                      {entry.domain && (
                        <p className="text-xs text-purple-400/70 truncate mt-0.5">
                          {entry.domain}
                        </p>
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        {getCountryLabel(entry.country)} &middot; {entry.suggestionCount} sugestii &middot; {entry.clusterCount} clustere
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
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* Empty State */
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="w-20 h-20 rounded-full bg-gray-900 border border-gray-800 flex items-center justify-center mb-4">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
            </div>
            <p className="text-sm text-gray-600 mb-1">
              Cercetează cuvinte cheie
            </p>
            <p className="text-xs text-gray-700">
              Introdu un cuvânt cheie și apasă &ldquo;Cercetează&rdquo; pentru sugestii și analiză
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
