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

export default function ContentPage() {
  const [input, setInput] = usePersistedState<ContentInput>("content-input", {
    business: "",
    audience: "",
    goals: "",
    competitors: "",
    existingContent: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<ScanProgress | null>(null);
  const [strategy, setStrategy] = usePersistedState<ContentStrategy | null>("content-strategy", null);

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
    return result;
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
      setStrategy(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Eroare necunoscută.");
    } finally {
      setIsLoading(false);
      setProgress(null);
    }
  }, [input, processStream]);

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
        </div>
        {error && (
          <span className="text-xs text-red-400 max-w-xs truncate">
            {error}
          </span>
        )}
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
          {/* Input Form */}
          <ContentInputForm
            input={input}
            onChange={setInput}
            onSubmit={handleGenerate}
            isLoading={isLoading}
          />

          {/* Results */}
          {strategy ? (
            <>
              {/* Calendar */}
              <ContentCalendar calendar={strategy.calendar} />

              {/* Clusters + Gaps - 2 columns */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TopicClusters clusters={strategy.clusters} />
                <GapAnalysis gaps={strategy.gaps} />
              </div>

              {/* Strategy Insights */}
              {strategy.aiStrategy && (
                <StrategyInsights insights={strategy.aiStrategy} />
              )}
            </>
          ) : (
            !isLoading && (
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
            )
          )}
        </div>
      </div>
    </div>
  );
}
