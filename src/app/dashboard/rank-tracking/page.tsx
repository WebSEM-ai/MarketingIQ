"use client";

import { useState, useCallback } from "react";
import RankInput from "@/components/rank-tracking/RankInput";
import PositionTable from "@/components/rank-tracking/PositionTable";
import SerpPreview from "@/components/rank-tracking/SerpPreview";
import RankInsights from "@/components/rank-tracking/RankInsights";
import { usePersistedState } from "@/lib/hooks/usePersistedState";
import type { RankAnalysis } from "@/lib/types/rank-tracking";
import { useSynergyReceiver } from "@/lib/synergy/useSynergyReceiver";
import type { RankTrackingPrefill } from "@/lib/synergy/types";
import SynergyBanner from "@/components/synergy/SynergyBanner";
import SynergyMenu from "@/components/synergy/SynergyMenu";

interface ScanProgress {
  step: number;
  total: number;
  message: string;
}

interface RankEntry {
  id: string;
  timestamp: string;
  domain: string;
  country: string;
  device: string;
  keywordCount: number;
  top10Count: number;
  data: RankAnalysis;
}

const COUNTRY_OPTIONS = [
  { label: "Romania", value: "ro" },
  { label: "Global", value: "us" },
  { label: "UK", value: "uk" },
  { label: "Germania", value: "de" },
  { label: "Franța", value: "fr" },
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
  return COUNTRY_OPTIONS.find((o) => o.value === value)?.label || value.toUpperCase();
}

export default function RankTrackingPage() {
  const [domain, setDomain] = useState("");
  const [keywords, setKeywords] = useState("");
  const [country, setCountry] = useState("ro");
  const [device, setDevice] = useState("desktop");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<ScanProgress | null>(null);
  const [history, setHistory] = usePersistedState<RankEntry[]>("rank-history", []);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selected = history.find((e) => e.id === selectedId) || null;

  const { incoming, dismiss: dismissSynergy } = useSynergyReceiver("rank-tracking");

  const applySynergy = useCallback(() => {
    if (!incoming) return;
    const d = incoming.data as RankTrackingPrefill;
    if (d.domain) setDomain(d.domain);
    if (d.keywords?.length) setKeywords(d.keywords.join("\n"));
    if (d.country) setCountry(d.country);
    setSelectedId(null);
    dismissSynergy();
  }, [incoming, dismissSynergy]);

  const processStream = useCallback(
    async (dom: string, kwList: string[], co: string, dev: string) => {
      const res = await fetch("/api/rank-tracking/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain: dom, keywords: kwList, country: co, device: dev }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Eroare la verificare.");
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error("Nu pot citi stream-ul.");

      const decoder = new TextDecoder();
      let buffer = "";
      let result: RankAnalysis | null = null;
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

          try {
            const event = JSON.parse(trimmed.slice(6));

            if (event.event === "progress") {
              setProgress({ step: event.step, total: event.total, message: event.message });
            } else if (event.event === "result") {
              result = event.analysis as RankAnalysis;
            } else if (event.event === "error") {
              streamError = event.error;
            }
          } catch {
            // skip
          }
        }
      }

      if (streamError) throw new Error(streamError);
      return result;
    },
    []
  );

  const handleCheck = useCallback(async () => {
    if (!domain.trim() || !keywords.trim()) return;

    const kwList = keywords
      .split("\n")
      .map((k) => k.trim())
      .filter(Boolean)
      .slice(0, 50);

    if (kwList.length === 0) return;

    setIsLoading(true);
    setError(null);
    setProgress({ step: 0, total: 3, message: "Inițializez verificarea..." });

    try {
      const result = await processStream(domain.trim(), kwList, country, device);
      if (!result) throw new Error("Nu s-a primit rezultatul.");

      const top10 = result.positions.filter((p) => p.topPosition !== null && p.topPosition <= 10).length;

      const entry: RankEntry = {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        domain: domain.trim(),
        country,
        device,
        keywordCount: kwList.length,
        top10Count: top10,
        data: result,
      };
      setHistory((prev) => [entry, ...prev]);
      setSelectedId(entry.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Eroare necunoscută.");
    } finally {
      setIsLoading(false);
      setProgress(null);
    }
  }, [domain, keywords, country, device, processStream, setHistory]);

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
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="20" x2="18" y2="10" />
              <line x1="12" y1="20" x2="12" y2="4" />
              <line x1="6" y1="20" x2="6" y2="14" />
            </svg>
          </div>
          <h2 className="text-sm font-bold">
            <span className="text-emerald-400">Rank</span>
            <span className="text-white"> Tracking</span>
          </h2>
          {history.length > 0 && (
            <span className="text-xs text-gray-500">
              {history.length} verificări
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

      {/* Synergy */}
      {incoming && (
        <div className="flex-shrink-0 border-b border-gray-800/50 px-5 py-2">
          <SynergyBanner payload={incoming} onApply={applySynergy} onDismiss={dismissSynergy} />
        </div>
      )}

      {/* Input */}
      {!selected && (
        <div className="flex-shrink-0 border-b border-gray-800/50 px-5 py-3">
          <RankInput
            domain={domain}
            keywords={keywords}
            country={country}
            device={device}
            isLoading={isLoading}
            onDomainChange={setDomain}
            onKeywordsChange={setKeywords}
            onCountryChange={setCountry}
            onDeviceChange={setDevice}
            onSubmit={handleCheck}
          />
        </div>
      )}

      {/* Progress */}
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
                <span className="text-xs text-gray-500">{progress.step}/{progress.total}</span>
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
          <div className="p-5 space-y-4 max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between bg-gray-900/50 border border-gray-800/50 rounded-xl px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="20" x2="18" y2="10" />
                    <line x1="12" y1="20" x2="12" y2="4" />
                    <line x1="6" y1="20" x2="6" y2="14" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{selected.domain}</p>
                  <p className="text-xs text-gray-500">
                    {getCountryLabel(selected.country)} &middot; {selected.device} &middot; {selected.keywordCount} keywords &middot; {selected.top10Count} în Top 10 &middot; {formatDate(selected.timestamp)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <SynergyMenu
                  source="rank-tracking"
                  targets={[
                    {
                      target: "keywords",
                      data: { seed: selected.data.keywords[0], domain: selected.domain },
                      label: selected.domain,
                      actionLabel: "Cercetare Keywords",
                    },
                    {
                      target: "competitors",
                      data: { url: `https://${selected.domain}`, keywords: selected.data.keywords },
                      label: selected.domain,
                      actionLabel: "Analiză Competitori",
                    },
                    {
                      target: "content",
                      data: { keywords: selected.data.keywords },
                      label: selected.domain,
                      actionLabel: "Strategie Conținut",
                    },
                  ]}
                />
                <button
                  onClick={() => setSelectedId(null)}
                  className="text-gray-500 hover:text-white transition-colors p-1"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            </div>

            <PositionTable positions={selected.data.positions} domain={selected.domain} />
            {selected.data.serpResults && selected.data.serpResults.length > 0 && (
              <SerpPreview
                results={selected.data.serpResults}
                query={selected.data.serpQuery || selected.data.keywords[0]}
                highlightDomain={selected.domain}
              />
            )}
            {selected.data.aiInsights && (
              <RankInsights insights={selected.data.aiInsights} />
            )}
          </div>
        ) : history.length > 0 ? (
          <div className="p-5 max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Istoric Verificări ({history.length})
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
                      <p className="text-sm font-medium text-white truncate">{entry.domain}</p>
                      <p className="text-xs text-emerald-400/70 mt-0.5">
                        {entry.top10Count}/{entry.keywordCount} în Top 10
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {getCountryLabel(entry.country)} &middot; {entry.device}
                      </p>
                      <p className="text-xs text-gray-600 mt-0.5">{formatDate(entry.timestamp)}</p>
                    </div>
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteEntry(entry.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-red-400 transition-all p-1 cursor-pointer"
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
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="w-20 h-20 rounded-full bg-gray-900 border border-gray-800 flex items-center justify-center mb-4">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="20" x2="18" y2="10" />
                <line x1="12" y1="20" x2="12" y2="4" />
                <line x1="6" y1="20" x2="6" y2="14" />
              </svg>
            </div>
            <p className="text-sm text-gray-600 mb-1">Monitorizează pozițiile Google</p>
            <p className="text-xs text-gray-700">
              Introdu un domeniu și cuvintele cheie pentru a verifica pozițiile în SERP
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
