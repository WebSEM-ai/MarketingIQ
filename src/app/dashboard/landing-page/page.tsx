"use client";

import { useState, useCallback } from "react";
import { usePersistedState } from "@/lib/hooks/usePersistedState";
import type { LandingPageAnalysis, LandingPageEntry, ScanProgress, UXElement, TechnicalElement, TrackerInfo, SchemaMarkup } from "@/lib/types/landing-page";

/* ── Helpers ── */
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("ro-RO", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function getScoreColor(score: number) {
  if (score >= 80) return "#10b981";
  if (score >= 60) return "#22c55e";
  if (score >= 40) return "#f59e0b";
  if (score >= 20) return "#f97316";
  return "#ef4444";
}

function getStatusBadge(status: string) {
  const map: Record<string, string> = {
    excellent: "bg-green-500/10 text-green-400 border-green-500/30",
    good: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    "needs-work": "bg-yellow-500/10 text-yellow-400 border-yellow-500/30",
    missing: "bg-red-500/10 text-red-400 border-red-500/30",
    critical: "bg-red-500/10 text-red-400 border-red-500/30",
    warning: "bg-yellow-500/10 text-yellow-400 border-yellow-500/30",
  };
  return map[status] || "bg-gray-700/50 text-gray-400 border-gray-600/30";
}

function polarToCartesian(cx: number, cy: number, r: number, deg: number) {
  const rad = ((deg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}
function describeArc(cx: number, cy: number, r: number, start: number, end: number) {
  const s = polarToCartesian(cx, cy, r, end);
  const e = polarToCartesian(cx, cy, r, start);
  const large = end - start <= 180 ? "0" : "1";
  return `M ${s.x} ${s.y} A ${r} ${r} 0 ${large} 0 ${e.x} ${e.y}`;
}

function ScoreGauge({ score, size, strokeWidth, label }: { score: number; size: number; strokeWidth: number; label?: string }) {
  const half = size / 2;
  const r = half - strokeWidth;
  const color = getScoreColor(score);
  const arc = describeArc(half, half, r, 0, Math.max(1, (score / 100) * 360 - 0.1));
  return (
    <div className="flex-shrink-0 relative">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={half} cy={half} r={r} fill="none" stroke="#1f2937" strokeWidth={strokeWidth} />
        <path d={arc} fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-bold" style={{ color, fontSize: size * 0.25 }}>{score}</span>
        {label && <span className="text-gray-500" style={{ fontSize: size * 0.1 }}>{label}</span>}
      </div>
    </div>
  );
}

/* ── Sub-components ── */

function ScoreHero({ data }: { data: LandingPageAnalysis }) {
  return (
    <div className="bg-gray-900/50 border border-gray-800/50 rounded-xl p-5">
      <div className="flex items-center gap-6 flex-wrap">
        <ScoreGauge score={data.overall_score} size={100} strokeWidth={7} label="Overall" />
        <ScoreGauge score={data.ux_score} size={72} strokeWidth={5} label="UX" />
        <ScoreGauge score={data.technical_score} size={72} strokeWidth={5} label="Tech" />
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-white truncate">{data.page_title || data.url}</h3>
          <p className="text-[10px] text-gray-500 truncate mt-0.5">{data.url}</p>
          <p className="text-xs text-gray-400 leading-relaxed mt-2">{data.summary}</p>
        </div>
      </div>
    </div>
  );
}

function UXElementCard({ el }: { el: UXElement }) {
  return (
    <div className="bg-gray-800/30 border border-gray-700/20 rounded-xl p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-white">{el.name}</span>
        <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${getStatusBadge(el.status)}`}>{el.status}</span>
      </div>
      <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden mb-2">
        <div className="h-full rounded-full transition-all" style={{ width: `${Math.max(2, el.score)}%`, backgroundColor: getScoreColor(el.score) }} />
      </div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] text-gray-500">Scor</span>
        <span className="text-xs font-bold" style={{ color: getScoreColor(el.score) }}>{el.score}</span>
      </div>
      {el.findings.length > 0 && (
        <div className="space-y-1 mb-2">
          {el.findings.map((f, i) => (
            <p key={i} className="text-[10px] text-gray-400 flex items-start gap-1">
              <span className="text-gray-600 mt-0.5">•</span>
              <span>{f}</span>
            </p>
          ))}
        </div>
      )}
      {el.recommendations.length > 0 && (
        <div className="space-y-1 border-t border-gray-700/20 pt-1.5 mt-1.5">
          {el.recommendations.map((r, i) => (
            <p key={i} className="text-[10px] text-pink-400/70 flex items-start gap-1">
              <span className="text-pink-500 mt-0.5">→</span>
              <span>{r}</span>
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

function TechnicalElementCard({ el }: { el: TechnicalElement }) {
  return (
    <div className="bg-gray-800/30 border border-gray-700/20 rounded-xl p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-white">{el.name}</span>
        <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${getStatusBadge(el.status)}`}>{el.status}</span>
      </div>
      <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden mb-2">
        <div className="h-full rounded-full transition-all" style={{ width: `${Math.max(2, el.score)}%`, backgroundColor: getScoreColor(el.score) }} />
      </div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] text-gray-500">Scor</span>
        <span className="text-xs font-bold" style={{ color: getScoreColor(el.score) }}>{el.score}</span>
      </div>
      {el.findings.map((f, i) => (
        <p key={i} className="text-[10px] text-gray-400 flex items-start gap-1 mb-0.5">
          <span className="text-gray-600 mt-0.5">•</span><span>{f}</span>
        </p>
      ))}
      {el.recommendations.map((r, i) => (
        <p key={i} className="text-[10px] text-pink-400/70 flex items-start gap-1 mb-0.5">
          <span className="text-pink-500 mt-0.5">→</span><span>{r}</span>
        </p>
      ))}
    </div>
  );
}

function TrackerGrid({ trackers }: { trackers: TrackerInfo[] }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
      {trackers.map((t, i) => (
        <div key={i} className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${t.detected ? "bg-green-500/5 border-green-500/20" : "bg-gray-800/30 border-gray-700/20"}`}>
          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${t.detected ? "bg-green-500" : "bg-gray-600"}`} />
          <div className="min-w-0">
            <span className={`text-xs font-medium ${t.detected ? "text-green-400" : "text-gray-500"}`}>{t.name}</span>
            {t.details && <p className="text-[9px] text-gray-600 truncate">{t.details}</p>}
          </div>
        </div>
      ))}
    </div>
  );
}

function SchemaGrid({ schemas }: { schemas: SchemaMarkup[] }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
      {schemas.map((s, i) => (
        <div key={i} className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${s.detected ? "bg-blue-500/5 border-blue-500/20" : "bg-gray-800/30 border-gray-700/20"}`}>
          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${s.detected ? "bg-blue-500" : "bg-gray-600"}`} />
          <div className="min-w-0">
            <span className={`text-xs font-medium ${s.detected ? "text-blue-400" : "text-gray-500"}`}>{s.type}</span>
            {s.details && <p className="text-[9px] text-gray-600 truncate">{s.details}</p>}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Main Page ── */

export default function LandingPagePage() {
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<ScanProgress | null>(null);
  const [history, setHistory] = usePersistedState<LandingPageEntry[]>("landing-page-history", []);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"ux" | "technical" | "recommendations">("ux");
  const selected = history.find((e) => e.id === selectedId) || null;

  const handleAnalyze = useCallback(async () => {
    if (!url.trim()) return;
    setIsLoading(true);
    setError(null);
    setProgress({ step: 0, total: 4, message: "Inițializez..." });

    try {
      const res = await fetch("/api/landing-page/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Eroare.");
      }
      const reader = res.body?.getReader();
      if (!reader) throw new Error("Stream error.");
      const decoder = new TextDecoder();
      let buffer = "";
      let result: LandingPageAnalysis | null = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const chunks = buffer.split("\n\n");
        buffer = chunks.pop() || "";
        for (const chunk of chunks) {
          const tr = chunk.trim();
          if (!tr.startsWith("data: ")) continue;
          try {
            const ev = JSON.parse(tr.slice(6));
            if (ev.event === "progress") setProgress({ step: ev.step, total: ev.total, message: ev.message });
            else if (ev.event === "result") result = ev.analysis as LandingPageAnalysis;
            else if (ev.event === "error") throw new Error(ev.error);
          } catch { /* incomplete chunk */ }
        }
      }
      if (!result) throw new Error("Nu s-a primit rezultatul.");

      const entry: LandingPageEntry = {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        url: url.trim(),
        pageTitle: result.page_title || url.trim().replace(/https?:\/\//, "").split("/").slice(0, 2).join("/"),
        overallScore: result.overall_score,
        uxScore: result.ux_score,
        technicalScore: result.technical_score,
        data: result,
      };
      setHistory((prev) => [entry, ...prev]);
      setSelectedId(entry.id);
      setActiveTab("ux");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Eroare.");
    } finally {
      setIsLoading(false);
      setProgress(null);
    }
  }, [url, setHistory]);

  const deleteEntry = useCallback((id: string) => {
    setHistory((prev) => prev.filter((e) => e.id !== id));
    if (selectedId === id) setSelectedId(null);
  }, [selectedId, setHistory]);

  const data = selected?.data;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-gray-800/50 px-5 py-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-pink-500/10 border border-pink-500/20 flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ec4899" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" /><line x1="3" y1="9" x2="21" y2="9" /><line x1="9" y1="21" x2="9" y2="9" />
            </svg>
          </div>
          <h2 className="text-sm font-bold">
            <span className="text-pink-400">Landing Page</span>
            <span className="text-white"> Analyzer</span>
          </h2>
          {history.length > 0 && <span className="text-xs text-gray-500">{history.length} analize</span>}
        </div>
        <div className="flex items-center gap-3">
          {error && <span className="text-xs text-red-400 max-w-xs truncate">{error}</span>}
          {selected && (
            <button onClick={() => setSelectedId(null)} className="text-xs text-gray-400 hover:text-white transition-colors flex items-center gap-1">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
              Istoric
            </button>
          )}
        </div>
      </div>

      {/* Input */}
      {!selected && (
        <div className="flex-shrink-0 border-b border-gray-800/50 px-5 py-3">
          <div className="flex items-center gap-3 flex-wrap">
            <input
              type="url" value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !isLoading && url.trim() && handleAnalyze()}
              placeholder="Link landing page (https://...)"
              className="flex-1 min-w-[300px] bg-gray-800/50 border border-gray-700/50 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-pink-500/50 focus:ring-1 focus:ring-pink-500/20"
              disabled={isLoading}
            />
            <button
              onClick={handleAnalyze}
              disabled={isLoading || !url.trim()}
              className="bg-pink-600 hover:bg-pink-500 disabled:bg-gray-700 disabled:text-gray-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              {isLoading ? "Analizez..." : "Analizează Landing Page"}
            </button>
          </div>
        </div>
      )}

      {/* Progress */}
      {progress && (
        <div className="flex-shrink-0 bg-gray-900/80 border-b border-gray-800/50 px-5 py-2.5">
          <div className="flex items-center gap-3">
            <svg className="animate-spin h-4 w-4 text-pink-500" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <div className="flex-1">
              <div className="flex justify-between mb-1">
                <span className="text-xs text-gray-300">{progress.message}</span>
                <span className="text-xs text-gray-500">{progress.step}/{progress.total}</span>
              </div>
              <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
                <div className="h-full bg-pink-500 rounded-full transition-all duration-500" style={{ width: `${(progress.step / progress.total) * 100}%` }} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 min-h-0 panel-scroll">
        {selected && data ? (
          <div className="p-5 space-y-4 max-w-5xl mx-auto">
            {/* Score Hero */}
            <ScoreHero data={data} />

            {/* Tabs */}
            <div className="flex gap-1 bg-gray-900/50 border border-gray-800/50 rounded-xl p-1">
              {(["ux", "technical", "recommendations"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 text-xs font-medium px-3 py-2 rounded-lg transition-colors ${
                    activeTab === tab
                      ? "bg-pink-500/10 text-pink-400 border border-pink-500/20"
                      : "text-gray-500 hover:text-gray-300 border border-transparent"
                  }`}
                >
                  {tab === "ux" ? "UX Analysis" : tab === "technical" ? "Technical" : "Recomandări"}
                </button>
              ))}
            </div>

            {/* Tab: UX */}
            {activeTab === "ux" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {data.ux_elements.map((el, i) => (
                  <UXElementCard key={i} el={el} />
                ))}
              </div>
            )}

            {/* Tab: Technical */}
            {activeTab === "technical" && (
              <div className="space-y-4">
                {data.trackers.length > 0 && (
                  <div className="bg-gray-900/50 border border-gray-800/50 rounded-xl p-4">
                    <h3 className="text-xs font-semibold text-pink-400 uppercase tracking-wider mb-3">Trackere Detectate</h3>
                    <TrackerGrid trackers={data.trackers} />
                  </div>
                )}
                {data.schema_markup.length > 0 && (
                  <div className="bg-gray-900/50 border border-gray-800/50 rounded-xl p-4">
                    <h3 className="text-xs font-semibold text-blue-400 uppercase tracking-wider mb-3">Schema.org Markup</h3>
                    <SchemaGrid schemas={data.schema_markup} />
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {data.technical_elements.map((el, i) => (
                    <TechnicalElementCard key={i} el={el} />
                  ))}
                </div>
              </div>
            )}

            {/* Tab: Recommendations */}
            {activeTab === "recommendations" && (
              <div className="space-y-4">
                {data.priority_actions.length > 0 && (
                  <div className="bg-gray-900/50 border border-gray-800/50 rounded-xl p-4">
                    <h3 className="text-xs font-semibold text-pink-400 uppercase tracking-wider mb-3">Acțiuni Prioritare</h3>
                    <div className="space-y-2">
                      {data.priority_actions.map((action, i) => (
                        <div key={i} className="flex items-start gap-3 bg-gray-800/30 border border-gray-700/20 rounded-lg p-3">
                          <span className="w-5 h-5 rounded-full bg-pink-500/10 border border-pink-500/20 flex items-center justify-center flex-shrink-0 text-[10px] font-bold text-pink-400">
                            {i + 1}
                          </span>
                          <p className="text-xs text-gray-300">{action}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {data.strengths.length > 0 && (
                  <div className="bg-gray-900/50 border border-gray-800/50 rounded-xl p-4">
                    <h3 className="text-xs font-semibold text-green-400 uppercase tracking-wider mb-3">Puncte Forte</h3>
                    <div className="space-y-1.5">
                      {data.strengths.map((s, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2">
                            <path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
                          </svg>
                          <span className="text-gray-300">{s}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Close button */}
            <div className="flex justify-center pt-2">
              <button onClick={() => setSelectedId(null)} className="text-xs text-gray-500 hover:text-white transition-colors">
                Înapoi la istoric
              </button>
            </div>
          </div>
        ) : history.length > 0 ? (
          <div className="p-5 max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Istoric ({history.length})</h3>
              {history.length > 1 && (
                <button onClick={() => { if (confirm("Ștergi tot?")) { setHistory([]); setSelectedId(null); } }} className="text-xs text-gray-600 hover:text-red-400">Șterge tot</button>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {history.map((e) => (
                <button
                  key={e.id}
                  onClick={() => { setSelectedId(e.id); setActiveTab("ux"); }}
                  className="group text-left bg-gray-900/50 hover:bg-gray-800/70 border border-gray-800/50 hover:border-pink-500/30 rounded-xl p-4 transition-all"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="text-lg font-bold" style={{ color: getScoreColor(e.overallScore) }}>{e.overallScore}</span>
                        <div className="flex gap-2 text-[10px] text-gray-500">
                          <span>UX: <span style={{ color: getScoreColor(e.uxScore) }}>{e.uxScore}</span></span>
                          <span>Tech: <span style={{ color: getScoreColor(e.technicalScore) }}>{e.technicalScore}</span></span>
                        </div>
                      </div>
                      <p className="text-xs font-medium text-white truncate">{e.pageTitle}</p>
                      <p className="text-[10px] text-gray-500 truncate mt-0.5">{e.url}</p>
                      <p className="text-[10px] text-gray-500 mt-1">{formatDate(e.timestamp)}</p>
                    </div>
                    <div
                      onClick={(ev) => { ev.stopPropagation(); deleteEntry(e.id); }}
                      className="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-red-400 p-1 cursor-pointer"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
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
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2" /><line x1="3" y1="9" x2="21" y2="9" /><line x1="9" y1="21" x2="9" y2="9" />
              </svg>
            </div>
            <p className="text-sm text-gray-600 mb-1">Analizează landing pages de produs</p>
            <p className="text-xs text-gray-700">Introdu URL-ul unei pagini de produs pentru analiza UX/UI și tehnică</p>
          </div>
        )}
      </div>
    </div>
  );
}
