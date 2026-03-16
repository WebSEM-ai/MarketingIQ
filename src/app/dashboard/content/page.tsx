"use client";

import { useState, useCallback } from "react";
import ContentInputForm from "@/components/content/ContentInput";
import ContentCalendar from "@/components/content/ContentCalendar";
import TopicClusters from "@/components/content/TopicClusters";
import GapAnalysis from "@/components/content/GapAnalysis";
import StrategyInsights from "@/components/content/StrategyInsights";
import { usePersistedState } from "@/lib/hooks/usePersistedState";
import type { ContentInput, ContentStrategy } from "@/lib/types/content";

interface ScanProgress {
  step: number;
  total: number;
  message: string;
}

interface ContentEntry {
  id: string;
  timestamp: string;
  label: string;
  calendarCount: number;
  clusterCount: number;
  gapCount: number;
  input: ContentInput;
  data: ContentStrategy;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("ro-RO", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ContentPage() {
  const [input, setInput] = useState<ContentInput>({
    business: "",
    audience: "",
    goals: "",
    competitors: "",
    existingContent: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<ScanProgress | null>(null);
  const [history, setHistory] = usePersistedState<ContentEntry[]>("content-history", []);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selected = history.find((e) => e.id === selectedId) || null;

  const processStream = useCallback(async (data: ContentInput) => {
    const res = await fetch("/api/content/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const json = await res.json();
      throw new Error(json.error || "Eroare la generare.");
    }

    const reader = res.body?.getReader();
    if (!reader) throw new Error("Nu pot citi stream-ul.");

    const decoder = new TextDecoder();
    let buffer = "";
    let result: ContentStrategy | null = null;
    let streamError: string | null = null;
    let partialCalendar: ContentStrategy["calendar"] = [];
    let partialClusters: ContentStrategy["clusters"] = [];
    let partialGaps: ContentStrategy["gaps"] = [];

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
          } else if (event.event === "partial") {
            if (event.type === "calendar") {
              partialCalendar = event.data || [];
            } else if (event.type === "clusters") {
              partialClusters = event.data?.clusters || [];
              partialGaps = event.data?.gaps || [];
            }
          } else if (event.event === "result") {
            result = event.strategy as ContentStrategy;
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
    if (partialCalendar.length > 0 || partialClusters.length > 0) {
      return {
        input: data,
        calendar: partialCalendar,
        clusters: partialClusters,
        gaps: partialGaps,
      } as ContentStrategy;
    }
    return null;
  }, []);

  const handleGenerate = useCallback(async () => {
    if (!input.business.trim() || !input.audience.trim() || !input.goals.trim())
      return;

    setIsLoading(true);
    setError(null);
    setProgress({ step: 0, total: 3, message: "Inițializez generarea..." });

    try {
      const result = await processStream(input);
      if (!result) throw new Error("Nu s-a primit rezultatul.");

      const entry: ContentEntry = {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        label: input.business.trim().slice(0, 60),
        calendarCount: result.calendar?.length || 0,
        clusterCount: result.clusters?.length || 0,
        gapCount: result.gaps?.length || 0,
        input: { ...input },
        data: result,
      };
      setHistory((prev) => [entry, ...prev]);
      setSelectedId(entry.id);
      setInput({ business: "", audience: "", goals: "", competitors: "", existingContent: "" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Eroare necunoscută.");
    } finally {
      setIsLoading(false);
      setProgress(null);
    }
  }, [input, processStream, setHistory]);

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
          <h2 className="text-sm font-bold">
            <span className="text-rose-500">Strategie</span>
            <span className="text-white"> Conținut</span>
          </h2>
          {history.length > 0 && (
            <span className="text-xs text-gray-500">
              {history.length} strategii
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {error && (
            <span className="text-xs text-red-400 max-w-xs truncate">
              {error}
            </span>
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

      {/* Progress Bar */}
      {progress && (
        <div className="flex-shrink-0 bg-gray-900/80 border-b border-gray-800/50 px-5 py-2.5">
          <div className="flex items-center gap-3">
            <svg
              className="animate-spin h-4 w-4 text-rose-500 flex-shrink-0"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-300">
                  {progress.message}
                </span>
                <span className="text-xs text-gray-500">
                  {progress.step}/{progress.total}
                </span>
              </div>
              <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-rose-500 rounded-full transition-all duration-500 ease-out"
                  style={{
                    width: `${(progress.step / progress.total) * 100}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 min-h-0 panel-scroll">
        <div className="p-5 space-y-4 max-w-4xl mx-auto">
          {selected ? (
            /* Detail View */
            <>
              {/* Result header */}
              <div className="flex items-center justify-between bg-gray-900/50 border border-gray-800/50 rounded-xl px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f43f5e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white truncate max-w-md">
                      {selected.label}
                    </p>
                    <p className="text-xs text-gray-500">
                      {selected.calendarCount} articole &middot; {selected.clusterCount} clustere &middot; {selected.gapCount} gaps &middot; {formatDate(selected.timestamp)}
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

              <ContentCalendar calendar={selected.data.calendar} />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TopicClusters clusters={selected.data.clusters} />
                <GapAnalysis gaps={selected.data.gaps} />
              </div>

              {selected.data.aiStrategy && (
                <StrategyInsights insights={selected.data.aiStrategy} />
              )}
            </>
          ) : (
            <>
              {/* Input Form */}
              <ContentInputForm
                input={input}
                onChange={setInput}
                onSubmit={handleGenerate}
                isLoading={isLoading}
              />

              {/* History Cards */}
              {!isLoading && history.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Istoric Strategii ({history.length})
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
                        className="group text-left bg-gray-900/50 hover:bg-gray-800/70 border border-gray-800/50 hover:border-rose-500/30 rounded-xl p-4 transition-all"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-white truncate">
                              {entry.label}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {entry.calendarCount} articole &middot; {entry.clusterCount} clustere &middot; {entry.gapCount} gaps
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
              {!isLoading && history.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 text-center px-4">
                  <div className="w-20 h-20 rounded-full bg-gray-900 border border-gray-800 flex items-center justify-center mb-4">
                    <svg
                      width="32"
                      height="32"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#374151"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                      <line x1="16" y1="13" x2="8" y2="13" />
                      <line x1="16" y1="17" x2="8" y2="17" />
                    </svg>
                  </div>
                  <p className="text-sm text-gray-600 mb-1">
                    Completează datele de mai sus
                  </p>
                  <p className="text-xs text-gray-700">
                    Introdu informațiile despre business și apasă
                    &ldquo;Generează Strategie&rdquo;
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
