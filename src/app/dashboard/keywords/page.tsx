"use client";

import { useState, useCallback } from "react";
import KeywordInput from "@/components/keywords/KeywordInput";
import SuggestionList from "@/components/keywords/SuggestionList";
import ClusterView from "@/components/keywords/ClusterView";
import RankingResults from "@/components/keywords/RankingResults";
import KeywordInsights from "@/components/keywords/KeywordInsights";
import type { KeywordAnalysis } from "@/lib/types/keywords";

interface ScanProgress {
  step: number;
  total: number;
  message: string;
}

export default function KeywordsPage() {
  const [seed, setSeed] = useState("");
  const [domain, setDomain] = useState("");
  const [country, setCountry] = useState("RO");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<ScanProgress | null>(null);
  const [analysis, setAnalysis] = useState<KeywordAnalysis | null>(null);

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
      setAnalysis(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Eroare necunoscută.");
    } finally {
      setIsLoading(false);
      setProgress(null);
    }
  }, [seed, domain, country, processStream]);

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
        </div>
        {error && (
          <span className="text-xs text-red-400 max-w-xs truncate">{error}</span>
        )}
      </div>

      {/* Search Form */}
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
        {analysis ? (
          <div className="p-5 space-y-4 max-w-4xl mx-auto">
            <SuggestionList suggestions={analysis.suggestions} />
            <ClusterView clusters={analysis.clusters} />
            {analysis.rankings && analysis.rankings.length > 0 && domain.trim() && (
              <RankingResults rankings={analysis.rankings} domain={domain.trim()} />
            )}
            {analysis.aiInsights && (
              <KeywordInsights insights={analysis.aiInsights} />
            )}
          </div>
        ) : (
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
