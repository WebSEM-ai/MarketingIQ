"use client";

import { useState, useCallback } from "react";
import AddCompetitorForm from "@/components/competitors/AddCompetitorForm";
import CompetitorCard from "@/components/competitors/CompetitorCard";
import CompetitorSearch from "@/components/competitors/CompetitorSearch";
import SEOReport from "@/components/competitors/SEOReport";
import AIInsights from "@/components/competitors/AIInsights";
import RankingTable from "@/components/competitors/RankingTable";
import type { CompetitorAnalysis } from "@/lib/types/competitors";

export default function CompetitorsPage() {
  const [analyses, setAnalyses] = useState<CompetitorAnalysis[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanningId, setScanningId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selected = analyses.find((a) => a.competitor.id === selectedId) || null;

  const scanCompetitor = useCallback(
    async (url: string, keywords: string[]) => {
      setIsScanning(true);
      setError(null);

      try {
        const res = await fetch("/api/competitors/scan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url, keywords }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Eroare la scanare.");
        }

        const analysis: CompetitorAnalysis = await res.json();
        setAnalyses((prev) => {
          const existing = prev.findIndex(
            (a) => a.competitor.url === analysis.competitor.url
          );
          if (existing >= 0) {
            const updated = [...prev];
            updated[existing] = analysis;
            return updated;
          }
          return [...prev, analysis];
        });
        setSelectedId(analysis.competitor.id);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Eroare necunoscută.");
      } finally {
        setIsScanning(false);
      }
    },
    []
  );

  const rescanCompetitor = useCallback(
    async (analysis: CompetitorAnalysis) => {
      setScanningId(analysis.competitor.id);
      setError(null);

      try {
        const res = await fetch("/api/competitors/scan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            url: analysis.competitor.url,
            keywords: analysis.rankings?.map((r) => r.keyword) || [],
          }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Eroare la re-scanare.");
        }

        const updated: CompetitorAnalysis = await res.json();
        setAnalyses((prev) =>
          prev.map((a) =>
            a.competitor.url === updated.competitor.url ? updated : a
          )
        );
        setSelectedId(updated.competitor.id);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Eroare necunoscută.");
      } finally {
        setScanningId(null);
      }
    },
    []
  );

  const handleAddFromSearch = useCallback(
    (url: string) => {
      scanCompetitor(url, []);
    },
    [scanCompetitor]
  );

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-gray-800/50 px-5 py-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 00-3-3.87" />
              <path d="M16 3.13a4 4 0 010 7.75" />
            </svg>
          </div>
          <h2 className="text-sm font-bold">
            <span className="text-amber-500">Monitor</span>
            <span className="text-white"> Competitori</span>
          </h2>
          {analyses.length > 0 && (
            <span className="text-xs text-gray-500">
              {analyses.length} competitor{analyses.length !== 1 ? "i" : ""}
            </span>
          )}
        </div>
        {error && (
          <span className="text-xs text-red-400 max-w-xs truncate">{error}</span>
        )}
      </div>

      {/* Main Grid */}
      <div className="flex-1 grid grid-cols-[380px_1fr] min-h-0">
        {/* LEFT PANEL — Competitor List + Add + Search */}
        <div className="border-r border-gray-800/50 panel-scroll p-4 space-y-4">
          <AddCompetitorForm onScan={scanCompetitor} isLoading={isScanning} />

          {analyses.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Competitori ({analyses.length})
              </h3>
              {analyses.map((analysis) => (
                <CompetitorCard
                  key={analysis.competitor.id}
                  competitor={analysis.competitor}
                  isSelected={analysis.competitor.id === selectedId}
                  onSelect={() => setSelectedId(analysis.competitor.id)}
                  onRescan={() => rescanCompetitor(analysis)}
                  isScanning={scanningId === analysis.competitor.id}
                />
              ))}
            </div>
          )}

          <CompetitorSearch onAdd={handleAddFromSearch} />
        </div>

        {/* RIGHT PANEL — Selected Competitor Details */}
        <div className="panel-scroll p-4">
          {selected ? (
            <div className="space-y-4 max-w-3xl">
              {/* Competitor header */}
              <div className="flex items-center gap-3 pb-3 border-b border-gray-800/30">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                  <span className="text-amber-500 text-sm font-bold">
                    {selected.competitor.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <h3 className="text-white font-semibold text-sm">
                    {selected.competitor.name}
                  </h3>
                  <a
                    href={selected.competitor.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-amber-500/70 hover:text-amber-400 transition-colors"
                  >
                    {selected.competitor.url}
                  </a>
                </div>
              </div>

              {/* SEO Report */}
              <SEOReport seo={selected.seo} />

              {/* Rankings */}
              {selected.rankings && selected.rankings.length > 0 && (
                <RankingTable rankings={selected.rankings} />
              )}

              {/* AI Insights */}
              {selected.aiInsights && (
                <AIInsights insights={selected.aiInsights} />
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center px-4">
              <div className="w-20 h-20 rounded-full bg-gray-900 border border-gray-800 flex items-center justify-center mb-4">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 00-3-3.87" />
                  <path d="M16 3.13a4 4 0 010 7.75" />
                </svg>
              </div>
              <p className="text-sm text-gray-600 mb-1">
                Selectează sau adaugă un competitor
              </p>
              <p className="text-xs text-gray-700">
                Introdu URL-ul unui competitor și apasă &ldquo;Scanează&rdquo; pentru analiză completă
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
