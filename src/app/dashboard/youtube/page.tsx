"use client";

import { useState, useCallback } from "react";
import YouTubeInput from "@/components/youtube/YouTubeInput";
import VideoGrid from "@/components/youtube/VideoGrid";
import ChannelList from "@/components/youtube/ChannelList";
import ShortsGrid from "@/components/youtube/ShortsGrid";
import YouTubeInsights from "@/components/youtube/YouTubeInsights";
import { usePersistedState } from "@/lib/hooks/usePersistedState";
import type { YouTubeAnalysis } from "@/lib/types/youtube";
import { useSynergyReceiver } from "@/lib/synergy/useSynergyReceiver";
import type { YouTubePrefill } from "@/lib/synergy/types";
import SynergyBanner from "@/components/synergy/SynergyBanner";
import SynergyMenu from "@/components/synergy/SynergyMenu";

interface ScanProgress {
  step: number;
  total: number;
  message: string;
}

interface YouTubeEntry {
  id: string;
  timestamp: string;
  query: string;
  country: string;
  videoCount: number;
  channelCount: number;
  shortsCount: number;
  data: YouTubeAnalysis;
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

export default function YouTubePage() {
  const [query, setQuery] = useState("");
  const [country, setCountry] = useState("ro");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<ScanProgress | null>(null);
  const [history, setHistory] = usePersistedState<YouTubeEntry[]>("youtube-history", []);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selected = history.find((e) => e.id === selectedId) || null;

  // Synergy receiver
  const { incoming, dismiss: dismissSynergy } = useSynergyReceiver("youtube");

  const applySynergy = useCallback(() => {
    if (!incoming) return;
    const d = incoming.data as YouTubePrefill;
    if (d.query) setQuery(d.query);
    if (d.country) setCountry(d.country);
    setSelectedId(null);
    dismissSynergy();
  }, [incoming, dismissSynergy]);

  const processStream = useCallback(
    async (q: string, co: string) => {
      const res = await fetch("/api/youtube/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q, country: co }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Eroare la căutare.");
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error("Nu pot citi stream-ul.");

      const decoder = new TextDecoder();
      let buffer = "";
      let result: YouTubeAnalysis | null = null;
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
              result = event.analysis as YouTubeAnalysis;
            } else if (event.event === "error") {
              streamError = event.error;
            }
          } catch {
            // Incomplete JSON chunk
          }
        }
      }

      if (streamError) throw new Error(streamError);
      return result;
    },
    []
  );

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return;

    setIsLoading(true);
    setError(null);
    setProgress({ step: 0, total: 4, message: "Inițializez căutarea YouTube..." });

    try {
      const result = await processStream(query.trim(), country);
      if (!result) throw new Error("Nu s-a primit rezultatul.");

      const entry: YouTubeEntry = {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        query: query.trim(),
        country,
        videoCount: result.videos?.length || 0,
        channelCount: result.channels?.length || 0,
        shortsCount: result.shorts?.length || 0,
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
  }, [query, country, processStream, setHistory]);

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
          <div className="w-7 h-7 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22.54 6.42a2.78 2.78 0 00-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 00-1.94 2A29 29 0 001 11.75a29 29 0 00.46 5.33A2.78 2.78 0 003.4 19.13C5.12 19.56 12 19.56 12 19.56s6.88 0 8.6-.46a2.78 2.78 0 001.94-2 29 29 0 00.46-5.25 29 29 0 00-.46-5.43z" />
              <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" fill="#ef4444" stroke="none" />
            </svg>
          </div>
          <h2 className="text-sm font-bold">
            <span className="text-red-400">YouTube</span>
            <span className="text-white"> Research</span>
          </h2>
          {history.length > 0 && (
            <span className="text-xs text-gray-500">
              {history.length} căutări
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
      {!selected && (
        <div className="flex-shrink-0 border-b border-gray-800/50 px-5 py-3">
          <YouTubeInput
            query={query}
            country={country}
            isLoading={isLoading}
            onQueryChange={setQuery}
            onCountryChange={setCountry}
            onSubmit={handleSearch}
          />
        </div>
      )}

      {/* Progress Bar */}
      {progress && (
        <div className="flex-shrink-0 bg-gray-900/80 border-b border-gray-800/50 px-5 py-2.5">
          <div className="flex items-center gap-3">
            <svg className="animate-spin h-4 w-4 text-red-500 flex-shrink-0" viewBox="0 0 24 24" fill="none">
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
                  className="h-full bg-red-500 rounded-full transition-all duration-500 ease-out"
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
                <div className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22.54 6.42a2.78 2.78 0 00-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 00-1.94 2A29 29 0 001 11.75a29 29 0 00.46 5.33A2.78 2.78 0 003.4 19.13C5.12 19.56 12 19.56 12 19.56s6.88 0 8.6-.46a2.78 2.78 0 001.94-2 29 29 0 00.46-5.25 29 29 0 00-.46-5.43z" />
                    <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" fill="#ef4444" stroke="none" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-white">&ldquo;{selected.query}&rdquo;</p>
                  <p className="text-xs text-gray-500">
                    {getCountryLabel(selected.country)}
                    {" "}&middot; {selected.videoCount} video &middot; {selected.channelCount} canale &middot; {selected.shortsCount} shorts &middot; {formatDate(selected.timestamp)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <SynergyMenu
                  source="youtube"
                  targets={[
                    {
                      target: "keywords",
                      data: { seed: selected.query },
                      label: selected.query,
                      actionLabel: "Cercetare Keywords",
                    },
                    {
                      target: "trends",
                      data: { query: selected.query },
                      label: selected.query,
                      actionLabel: "Analiză Tendințe",
                    },
                    {
                      target: "content",
                      data: { keywords: [selected.query] },
                      label: selected.query,
                      actionLabel: "Strategie Conținut",
                    },
                    {
                      target: "aeo",
                      data: { prompt: selected.query },
                      label: selected.query,
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

            <VideoGrid videos={selected.data.videos} />
            <ChannelList channels={selected.data.channels} />
            <ShortsGrid shorts={selected.data.shorts} />
            {selected.data.aiInsights && (
              <YouTubeInsights insights={selected.data.aiInsights} />
            )}
          </div>
        ) : history.length > 0 ? (
          /* History Cards */
          <div className="p-5 max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Istoric Căutări ({history.length})
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
                  className="group text-left bg-gray-900/50 hover:bg-gray-800/70 border border-gray-800/50 hover:border-red-500/30 rounded-xl p-4 transition-all"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-white truncate">
                        &ldquo;{entry.query}&rdquo;
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {getCountryLabel(entry.country)} &middot; {entry.videoCount} video &middot; {entry.channelCount} canale
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
                <path d="M22.54 6.42a2.78 2.78 0 00-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 00-1.94 2A29 29 0 001 11.75a29 29 0 00.46 5.33A2.78 2.78 0 003.4 19.13C5.12 19.56 12 19.56 12 19.56s6.88 0 8.6-.46a2.78 2.78 0 001.94-2 29 29 0 00.46-5.25 29 29 0 00-.46-5.43z" />
                <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" />
              </svg>
            </div>
            <p className="text-sm text-gray-600 mb-1">
              Cercetează YouTube
            </p>
            <p className="text-xs text-gray-700">
              Caută videoclipuri, canale și Shorts — analizează competiția cu AI
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
