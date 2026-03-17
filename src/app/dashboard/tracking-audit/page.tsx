"use client";

import { useState, useCallback } from "react";
import { usePersistedState } from "@/lib/hooks/usePersistedState";
import type { TrackingAuditAnalysis, TrackingAuditEntry, ScanProgress, TrackingIssue, DataLayerEvent } from "@/lib/types/tracking-audit";

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

function getVerdictColor(verdict: string) {
  const map: Record<string, string> = {
    Excelent: "#10b981", Bun: "#22c55e", Mediu: "#f59e0b", Slab: "#f97316", Critic: "#ef4444",
  };
  return map[verdict] || "#6b7280";
}

function getSeverityStyle(sev: string) {
  const map: Record<string, string> = {
    critical: "text-red-400 bg-red-500/10 border-red-500/30",
    warning: "text-yellow-400 bg-yellow-500/10 border-yellow-500/30",
    good: "text-green-400 bg-green-500/10 border-green-500/30",
  };
  return map[sev] || "text-gray-400 bg-gray-700/50 border-gray-600/30";
}

const PLATFORM_LABELS: Record<string, string> = {
  meta: "Meta Pixel", google: "Google / GA4", tiktok: "TikTok Pixel",
  gtm: "Google Tag Manager", gdpr: "GDPR Compliance", datalayer: "DataLayer",
};

const PLATFORM_ICONS: Record<string, string> = {
  meta: "#3b82f6", google: "#22c55e", tiktok: "#06b6d4",
  gtm: "#f59e0b", gdpr: "#ef4444", datalayer: "#a855f7",
};

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

/* ── Score Hero ── */
function ScoreHero({ data }: { data: TrackingAuditAnalysis }) {
  const verdictColor = getVerdictColor(data.verdict);
  return (
    <div className="bg-gray-900/50 border border-gray-800/50 rounded-xl p-5">
      <div className="flex items-center gap-6 flex-wrap">
        <ScoreGauge score={data.overall_score} size={100} strokeWidth={7} label="Overall" />
        <div className="flex gap-3">
          {data.platforms_detected.map((p) => (
            <ScoreGauge
              key={p}
              score={(data.platform_scores as Record<string, number>)[p] || 0}
              size={56}
              strokeWidth={4}
              label={p.toUpperCase().slice(0, 4)}
            />
          ))}
          <ScoreGauge score={data.platform_scores.gdpr} size={56} strokeWidth={4} label="GDPR" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-bold" style={{ color: verdictColor }}>{data.verdict}</span>
            <span className="text-xs text-gray-500">— {data.verdict_tagline}</span>
          </div>
          <p className="text-[10px] text-gray-500 truncate mb-2">{data.url}</p>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {data.platforms_detected.map((p) => (
              <span key={p} className="text-[10px] px-2 py-0.5 rounded-full border border-gray-700/50 text-gray-400" style={{ borderColor: `${PLATFORM_ICONS[p]}40`, color: PLATFORM_ICONS[p] }}>
                {PLATFORM_LABELS[p] || p}
              </span>
            ))}
          </div>
          <p className="text-xs text-gray-400 leading-relaxed">{data.summary}</p>
        </div>
      </div>
    </div>
  );
}

/* ── Platform Card ── */
function PlatformCard({ platform, score, issues }: { platform: string; score: number; issues: TrackingIssue[] }) {
  const color = PLATFORM_ICONS[platform] || "#6b7280";
  return (
    <div className="bg-gray-800/30 border border-gray-700/20 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
          <span className="text-xs font-semibold text-white">{PLATFORM_LABELS[platform] || platform}</span>
        </div>
        <span className="text-sm font-bold" style={{ color: getScoreColor(score) }}>{score}</span>
      </div>
      <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden mb-3">
        <div className="h-full rounded-full transition-all" style={{ width: `${Math.max(2, score)}%`, backgroundColor: getScoreColor(score) }} />
      </div>
      {issues.length > 0 ? (
        <div className="space-y-2">
          {issues.map((issue, i) => (
            <div key={i} className="space-y-0.5">
              <div className="flex items-center gap-1.5">
                <span className={`text-[9px] px-1 py-0.5 rounded border font-medium ${getSeverityStyle(issue.severity)}`}>
                  {issue.severity === "critical" ? "CRITIC" : issue.severity === "warning" ? "ATENȚIE" : "OK"}
                </span>
                <span className="text-[11px] text-gray-300">{issue.text}</span>
              </div>
              {issue.detail && <p className="text-[10px] text-gray-500 pl-1">{issue.detail}</p>}
              {issue.suggestion && <p className="text-[10px] text-amber-400/70 pl-1">→ {issue.suggestion}</p>}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-[10px] text-gray-600">Nicio observație</p>
      )}
    </div>
  );
}

/* ── GDPR Section ── */
function GDPRTab({ data }: { data: TrackingAuditAnalysis }) {
  const gdprIssues = data.issues.filter(i => i.platform === "gdpr");
  return (
    <div className="space-y-4">
      {/* GDPR Score */}
      <div className="bg-gray-900/50 border border-gray-800/50 rounded-xl p-4">
        <div className="flex items-center gap-4 mb-3">
          <ScoreGauge score={data.platform_scores.gdpr} size={64} strokeWidth={5} label="GDPR" />
          <div>
            <h3 className="text-xs font-semibold text-white">GDPR Compliance Score</h3>
            <p className="text-[10px] text-gray-500 mt-0.5">{gdprIssues.filter(i => i.severity === "critical").length} probleme critice, {gdprIssues.filter(i => i.severity === "warning").length} avertismente</p>
          </div>
        </div>
      </div>

      {/* GDPR Violations */}
      {data.gdpr_violations.length > 0 && (
        <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4">
          <h3 className="text-xs font-semibold text-red-400 uppercase tracking-wider mb-3">Încălcări GDPR ({data.gdpr_violations.length})</h3>
          <div className="space-y-2">
            {data.gdpr_violations.map((v, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="text-[9px] px-1 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/30 font-bold flex-shrink-0">CRITIC</span>
                <p className="text-xs text-gray-300">{v}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tracking Before Consent */}
      {data.tracking_before_consent.length > 0 && (
        <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4">
          <h3 className="text-xs font-semibold text-red-400 uppercase tracking-wider mb-3">Tracking Activ Înainte de Consimțământ</h3>
          <div className="space-y-1.5">
            {data.tracking_before_consent.map((t, i) => (
              <div key={i} className="flex items-center gap-2 text-xs">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                <span className="text-gray-300">{t}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* GDPR Issues */}
      {gdprIssues.length > 0 && (
        <div className="bg-gray-900/50 border border-gray-800/50 rounded-xl p-4">
          <h3 className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-3">Detalii GDPR</h3>
          <div className="space-y-2">
            {gdprIssues.map((issue, i) => (
              <div key={i} className="bg-gray-800/30 border border-gray-700/20 rounded-lg p-3 space-y-1">
                <div className="flex items-center gap-1.5">
                  <span className={`text-[9px] px-1 py-0.5 rounded border font-medium ${getSeverityStyle(issue.severity)}`}>
                    {issue.severity === "critical" ? "CRITIC" : issue.severity === "warning" ? "ATENȚIE" : "OK"}
                  </span>
                  <span className="text-[11px] text-gray-300">{issue.text}</span>
                </div>
                {issue.detail && <p className="text-[10px] text-gray-500">{issue.detail}</p>}
                {issue.suggestion && <p className="text-[10px] text-amber-400/70">→ {issue.suggestion}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {data.gdpr_violations.length === 0 && data.tracking_before_consent.length === 0 && gdprIssues.length === 0 && (
        <div className="bg-green-500/5 border border-green-500/20 rounded-xl p-6 text-center">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" className="mx-auto mb-2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
          <p className="text-xs text-green-400">Nu au fost detectate încălcări GDPR majore</p>
        </div>
      )}
    </div>
  );
}

/* ── DataLayer Tab ── */
function DataLayerTab({ events, issues }: { events: DataLayerEvent[]; issues: TrackingIssue[] }) {
  const dlIssues = issues.filter(i => i.platform === "datalayer");
  return (
    <div className="space-y-4">
      {events.length > 0 ? (
        <div className="bg-gray-900/50 border border-gray-800/50 rounded-xl p-4">
          <h3 className="text-xs font-semibold text-purple-400 uppercase tracking-wider mb-3">Evenimente DataLayer ({events.length})</h3>
          <div className="space-y-2">
            {events.map((ev, i) => (
              <div key={i} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border ${ev.has_required_params ? "bg-green-500/5 border-green-500/20" : ev.missing_params.length > 0 ? "bg-yellow-500/5 border-yellow-500/20" : "bg-red-500/5 border-red-500/20"}`}>
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${ev.has_required_params ? "bg-green-500" : "bg-yellow-500"}`} />
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-mono font-semibold text-white">{ev.event}</span>
                  {ev.missing_params.length > 0 && (
                    <p className="text-[10px] text-yellow-400 mt-0.5">
                      Parametri lipsă: {ev.missing_params.join(", ")}
                    </p>
                  )}
                </div>
                {ev.has_required_params ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-gray-900/50 border border-gray-800/50 rounded-xl p-6 text-center">
          <p className="text-xs text-gray-500">Nu au fost detectate evenimente DataLayer</p>
        </div>
      )}

      {dlIssues.length > 0 && (
        <div className="bg-gray-900/50 border border-gray-800/50 rounded-xl p-4">
          <h3 className="text-xs font-semibold text-purple-400 uppercase tracking-wider mb-3">Observații DataLayer</h3>
          <div className="space-y-2">
            {dlIssues.map((issue, i) => (
              <div key={i} className="bg-gray-800/30 border border-gray-700/20 rounded-lg p-3 space-y-1">
                <div className="flex items-center gap-1.5">
                  <span className={`text-[9px] px-1 py-0.5 rounded border font-medium ${getSeverityStyle(issue.severity)}`}>
                    {issue.severity === "critical" ? "CRITIC" : issue.severity === "warning" ? "ATENȚIE" : "OK"}
                  </span>
                  <span className="text-[11px] text-gray-300">{issue.text}</span>
                </div>
                {issue.suggestion && <p className="text-[10px] text-amber-400/70">→ {issue.suggestion}</p>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Main Page ── */

export default function TrackingAuditPage() {
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<ScanProgress | null>(null);
  const [history, setHistory] = usePersistedState<TrackingAuditEntry[]>("tracking-audit-history", []);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"platforms" | "gdpr" | "datalayer" | "recommendations">("platforms");
  const selected = history.find((e) => e.id === selectedId) || null;

  const handleAnalyze = useCallback(async () => {
    if (!url.trim()) return;
    setIsLoading(true);
    setError(null);
    setProgress({ step: 0, total: 4, message: "Inițializez..." });

    try {
      const res = await fetch("/api/tracking-audit/analyze", {
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
      let result: TrackingAuditAnalysis | null = null;
      let streamError: string | null = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const chunks = buffer.split("\n\n");
        buffer = chunks.pop() || "";
        for (const chunk of chunks) {
          const tr = chunk.trim();
          if (!tr.startsWith("data: ")) continue;
          let ev: Record<string, unknown>;
          try { ev = JSON.parse(tr.slice(6)); } catch { continue; }
          if (ev.event === "progress") setProgress({ step: ev.step as number, total: ev.total as number, message: ev.message as string });
          else if (ev.event === "result") result = ev.analysis as TrackingAuditAnalysis;
          else if (ev.event === "error") streamError = (ev.error as string) || "Eroare la analiză.";
        }
      }
      if (streamError) throw new Error(streamError);
      if (!result) throw new Error("Nu s-a primit rezultatul. Posibil timeout — încearcă din nou.");

      const entry: TrackingAuditEntry = {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        url: url.trim(),
        overallScore: result.overall_score,
        verdict: result.verdict,
        platformsDetected: result.platforms_detected,
        data: result,
      };
      setHistory((prev) => [entry, ...prev]);
      setSelectedId(entry.id);
      setActiveTab("platforms");
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
          <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
          </div>
          <h2 className="text-sm font-bold">
            <span className="text-amber-400">Tracking</span>
            <span className="text-white"> Audit</span>
          </h2>
          {history.length > 0 && <span className="text-xs text-gray-500">{history.length} audituri</span>}
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
              placeholder="URL website de auditat (https://...)"
              className="flex-1 min-w-[300px] bg-gray-800/50 border border-gray-700/50 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20"
              disabled={isLoading}
            />
            <button
              onClick={handleAnalyze}
              disabled={isLoading || !url.trim()}
              className="bg-amber-600 hover:bg-amber-500 disabled:bg-gray-700 disabled:text-gray-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              {isLoading ? "Analizez..." : "Audit Tracking"}
            </button>
          </div>
        </div>
      )}

      {/* Progress */}
      {progress && (
        <div className="flex-shrink-0 bg-gray-900/80 border-b border-gray-800/50 px-5 py-2.5">
          <div className="flex items-center gap-3">
            <svg className="animate-spin h-4 w-4 text-amber-500" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <div className="flex-1">
              <div className="flex justify-between mb-1">
                <span className="text-xs text-gray-300">{progress.message}</span>
                <span className="text-xs text-gray-500">{progress.step}/{progress.total}</span>
              </div>
              <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
                <div className="h-full bg-amber-500 rounded-full transition-all duration-500" style={{ width: `${(progress.step / progress.total) * 100}%` }} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 min-h-0 panel-scroll">
        {selected && data ? (
          <div className="p-5 space-y-4 max-w-5xl mx-auto">
            <ScoreHero data={data} />

            {/* Tabs */}
            <div className="flex gap-1 bg-gray-900/50 border border-gray-800/50 rounded-xl p-1">
              {(["platforms", "gdpr", "datalayer", "recommendations"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 text-xs font-medium px-3 py-2 rounded-lg transition-colors ${
                    activeTab === tab
                      ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                      : "text-gray-500 hover:text-gray-300 border border-transparent"
                  }`}
                >
                  {tab === "platforms" ? "Platforme" : tab === "gdpr" ? "GDPR" : tab === "datalayer" ? "DataLayer" : "Recomandări"}
                </button>
              ))}
            </div>

            {/* Tab: Platforms */}
            {activeTab === "platforms" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {["meta", "google", "gtm", "tiktok", "datalayer"].map((platform) => {
                  const score = (data.platform_scores as Record<string, number>)[platform] || 0;
                  const detected = data.platforms_detected.includes(platform);
                  const platformIssues = data.issues.filter(i => i.platform === platform);
                  if (!detected && score === 0 && platformIssues.length === 0) {
                    return (
                      <div key={platform} className="bg-gray-800/20 border border-gray-800/30 rounded-xl p-4 opacity-50">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-3 h-3 rounded-full bg-gray-700" />
                          <span className="text-xs font-semibold text-gray-600">{PLATFORM_LABELS[platform]}</span>
                        </div>
                        <p className="text-[10px] text-gray-700">Nu a fost detectat</p>
                      </div>
                    );
                  }
                  return <PlatformCard key={platform} platform={platform} score={score} issues={platformIssues} />;
                })}
              </div>
            )}

            {/* Tab: GDPR */}
            {activeTab === "gdpr" && <GDPRTab data={data} />}

            {/* Tab: DataLayer */}
            {activeTab === "datalayer" && <DataLayerTab events={data.datalayer_events} issues={data.issues} />}

            {/* Tab: Recommendations */}
            {activeTab === "recommendations" && (
              <div className="space-y-4">
                {data.quick_wins.length > 0 && (
                  <div className="bg-gray-900/50 border border-gray-800/50 rounded-xl p-4">
                    <h3 className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-3">Quick Wins</h3>
                    <div className="space-y-2">
                      {data.quick_wins.map((action, i) => (
                        <div key={i} className="flex items-start gap-3 bg-gray-800/30 border border-gray-700/20 rounded-lg p-3">
                          <span className="w-5 h-5 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center flex-shrink-0 text-[10px] font-bold text-amber-400">{i + 1}</span>
                          <p className="text-xs text-gray-300">{action}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* All issues grouped by severity */}
                {["critical", "warning", "good"].map((sev) => {
                  const filtered = data.issues.filter(i => i.severity === sev);
                  if (filtered.length === 0) return null;
                  const sevLabel = sev === "critical" ? "Probleme Critice" : sev === "warning" ? "Avertismente" : "Aspecte Pozitive";
                  const sevColor = sev === "critical" ? "text-red-400" : sev === "warning" ? "text-yellow-400" : "text-green-400";
                  return (
                    <div key={sev} className="bg-gray-900/50 border border-gray-800/50 rounded-xl p-4">
                      <h3 className={`text-xs font-semibold uppercase tracking-wider mb-3 ${sevColor}`}>{sevLabel} ({filtered.length})</h3>
                      <div className="space-y-2">
                        {filtered.map((issue, i) => (
                          <div key={i} className="bg-gray-800/30 border border-gray-700/20 rounded-lg p-3 space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-gray-600">{PLATFORM_LABELS[issue.platform] || issue.platform}</span>
                              <span className="text-[11px] text-gray-300">{issue.text}</span>
                            </div>
                            {issue.detail && <p className="text-[10px] text-gray-500">{issue.detail}</p>}
                            {issue.suggestion && <p className="text-[10px] text-amber-400/70">→ {issue.suggestion}</p>}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="flex justify-center pt-2">
              <button onClick={() => setSelectedId(null)} className="text-xs text-gray-500 hover:text-white transition-colors">Înapoi la istoric</button>
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
                  onClick={() => { setSelectedId(e.id); setActiveTab("platforms"); }}
                  className="group text-left bg-gray-900/50 hover:bg-gray-800/70 border border-gray-800/50 hover:border-amber-500/30 rounded-xl p-4 transition-all"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg font-bold" style={{ color: getScoreColor(e.overallScore) }}>{e.overallScore}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full border" style={{ borderColor: `${getVerdictColor(e.verdict)}40`, color: getVerdictColor(e.verdict) }}>{e.verdict}</span>
                      </div>
                      <div className="flex flex-wrap gap-1 mb-1">
                        {e.platformsDetected.map((p) => (
                          <span key={p} className="text-[9px] px-1.5 py-0.5 rounded bg-gray-800/50 text-gray-500">{p}</span>
                        ))}
                      </div>
                      <p className="text-[10px] text-gray-500 truncate">{e.url}</p>
                      <p className="text-[10px] text-gray-600 mt-0.5">{formatDate(e.timestamp)}</p>
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
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
              </svg>
            </div>
            <p className="text-sm text-gray-600 mb-1">Audit complet de tracking</p>
            <p className="text-xs text-gray-700">Meta Pixel, GA4, GTM, TikTok, GDPR compliance, DataLayer</p>
          </div>
        )}
      </div>
    </div>
  );
}
