"use client";

import { useState, useCallback } from "react";
import AEOInput from "@/components/aeo/AEOInput";
import PlatformOverview from "@/components/aeo/PlatformOverview";
import VisibilityChart from "@/components/aeo/VisibilityChart";
import PlatformDetail from "@/components/aeo/PlatformDetail";
import AEOInsights from "@/components/aeo/AEOInsights";
import { usePersistedState } from "@/lib/hooks/usePersistedState";
import type { AEOPlatform, AEOAnalysis, PlatformResult } from "@/lib/types/aeo";

interface ScanProgress {
  step: number;
  total: number;
  message: string;
  platform?: string;
}

interface AEOEntry {
  id: string;
  timestamp: string;
  prompt: string;
  targetUrl: string;
  platformCount: number;
  avgVisibility: number;
  data: AEOAnalysis;
}

const ALL_PLATFORMS: AEOPlatform[] = ["perplexity", "chatgpt", "claude", "gemini", "grok"];

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("ro-RO", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function calcAvgVisibility(platforms: PlatformResult[]): number {
  if (!platforms.length) return 0;
  return Math.round(
    platforms.reduce((sum, p) => sum + p.responseQuality, 0) / platforms.length
  );
}

function getVisibilityColor(score: number): string {
  if (score >= 70) return "text-emerald-400";
  if (score >= 40) return "text-amber-400";
  return "text-red-400";
}

export default function AEOPage() {
  const [prompt, setPrompt] = useState("");
  const [targetUrl, setTargetUrl] = useState("");
  const [platforms, setPlatforms] = useState<AEOPlatform[]>([...ALL_PLATFORMS]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<ScanProgress | null>(null);
  const [history, setHistory] = usePersistedState<AEOEntry[]>("aeo-history", []);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selected = history.find((e) => e.id === selectedId) || null;

  const processStream = useCallback(
    async (p: string, url: string, plats: AEOPlatform[]) => {
      const res = await fetch("/api/aeo/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: p, targetUrl: url || undefined, platforms: plats }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Eroare la analiză.");
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error("Nu pot citi stream-ul.");

      const decoder = new TextDecoder();
      let buffer = "";
      let result: AEOAnalysis | null = null;
      let streamError: string | null = null;
      const collectedPlatforms: PlatformResult[] = [];

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
                platform: event.platform,
              });
            } else if (event.event === "platform_result") {
              collectedPlatforms.push(event.result as PlatformResult);
            } else if (event.event === "result") {
              result = event.analysis as AEOAnalysis;
            } else if (event.event === "error") {
              streamError = event.error;
            }
          } catch {
            // Incomplete JSON chunk, skip
          }
        }
      }

      if (streamError) throw new Error(streamError);

      if (result) return result;
      if (collectedPlatforms.length > 0) {
        return {
          prompt: p,
          targetUrl: url || "",
          platforms: collectedPlatforms,
        } as AEOAnalysis;
      }
      return null;
    },
    []
  );

  const handleTrack = useCallback(async () => {
    if (!prompt.trim()) return;

    setIsLoading(true);
    setError(null);
    setProgress({ step: 0, total: platforms.length + 1, message: "Inițializez analiza..." });

    try {
      const result = await processStream(prompt.trim(), targetUrl, platforms);
      if (!result) throw new Error("Nu s-a primit rezultatul.");

      const entry: AEOEntry = {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        prompt: prompt.trim(),
        targetUrl: targetUrl.trim(),
        platformCount: result.platforms.length,
        avgVisibility: calcAvgVisibility(result.platforms),
        data: result,
      };
      setHistory((prev) => [entry, ...prev]);
      setSelectedId(entry.id);
      setPrompt("");
      setTargetUrl("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Eroare necunoscută.");
    } finally {
      setIsLoading(false);
      setProgress(null);
    }
  }, [prompt, targetUrl, platforms, processStream, setHistory]);

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
          <div className="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#06b6d4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <circle cx="12" cy="12" r="6" />
              <circle cx="12" cy="12" r="2" />
              <line x1="12" y1="2" x2="12" y2="6" />
              <line x1="12" y1="18" x2="12" y2="22" />
              <line x1="2" y1="12" x2="6" y2="12" />
              <line x1="18" y1="12" x2="22" y2="12" />
            </svg>
          </div>
          <h2 className="text-sm font-bold">
            <span className="text-cyan-500">AEO</span>
            <span className="text-white"> Tracker</span>
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

      {/* Content */}
      <div className="flex-1 min-h-0 panel-scroll">
        <div className="p-5 space-y-4 max-w-4xl mx-auto">
          {/* Input form — always visible when not viewing results */}
          {!selected && (
            <>
              <AEOInput
                prompt={prompt}
                onPromptChange={setPrompt}
                targetUrl={targetUrl}
                onTargetUrlChange={setTargetUrl}
                platforms={platforms}
                onPlatformsChange={setPlatforms}
                onTrack={handleTrack}
                isLoading={isLoading}
              />

              {/* Progress bar */}
              {progress && (
                <div className="bg-gray-900/80 border border-gray-800/50 rounded-xl px-4 py-3">
                  <div className="flex items-center gap-3">
                    <svg className="animate-spin h-4 w-4 text-cyan-500 flex-shrink-0" viewBox="0 0 24 24" fill="none">
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
                          className="h-full bg-cyan-500 rounded-full transition-all duration-500 ease-out"
                          style={{ width: `${(progress.step / progress.total) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Results Detail */}
          {selected && !isLoading && (
            <>
              {/* Result header */}
              <div className="flex items-center justify-between bg-gray-900/50 border border-gray-800/50 rounded-xl px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#06b6d4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <circle cx="12" cy="12" r="6" />
                      <circle cx="12" cy="12" r="2" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">&ldquo;{selected.prompt}&rdquo;</p>
                    <p className="text-xs text-gray-500">
                      {selected.targetUrl && <>{selected.targetUrl} &middot; </>}
                      {selected.platformCount} platforme &middot; {formatDate(selected.timestamp)}
                    </p>
                  </div>
                </div>
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

              <PlatformOverview platforms={selected.data.platforms} />
              <VisibilityChart platforms={selected.data.platforms} />

              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  Detalii per Platformă
                </h3>
                <div className="space-y-2">
                  {selected.data.platforms.map((result) => (
                    <PlatformDetail
                      key={result.platform}
                      result={result}
                      targetUrl={selected.data.targetUrl}
                    />
                  ))}
                </div>
              </div>

              {selected.data.aiInsights && (
                <AEOInsights insights={selected.data.aiInsights} />
              )}
            </>
          )}

          {/* History Cards */}
          {!selected && !isLoading && history.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
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
                    className="group text-left bg-gray-900/50 hover:bg-gray-800/70 border border-gray-800/50 hover:border-cyan-500/30 rounded-xl p-4 transition-all"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-white truncate">
                          &ldquo;{entry.prompt}&rdquo;
                        </p>
                        {entry.targetUrl && (
                          <p className="text-xs text-cyan-500/70 truncate mt-0.5">
                            {entry.targetUrl}
                          </p>
                        )}
                        <p className="text-xs text-gray-500 mt-1">
                          {entry.platformCount} platforme &middot;{" "}
                          <span className={getVisibilityColor(entry.avgVisibility)}>
                            {entry.avgVisibility}% vizibilitate
                          </span>
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
          )}

          {/* Empty state */}
          {!selected && !isLoading && history.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center px-4">
              <div className="w-20 h-20 rounded-full bg-gray-900 border border-gray-800 flex items-center justify-center mb-4">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <circle cx="12" cy="12" r="6" />
                  <circle cx="12" cy="12" r="2" />
                  <line x1="12" y1="2" x2="12" y2="6" />
                  <line x1="12" y1="18" x2="12" y2="22" />
                  <line x1="2" y1="12" x2="6" y2="12" />
                  <line x1="18" y1="12" x2="22" y2="12" />
                </svg>
              </div>
              <p className="text-sm text-gray-600 mb-1">
                Verifică vizibilitatea pe motoarele AI
              </p>
              <p className="text-xs text-gray-700">
                Introdu un prompt și URL-ul tău pentru a vedea cum ești reprezentat pe platformele AI
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
