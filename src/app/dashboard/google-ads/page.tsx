"use client";

import { useState, useCallback } from "react";
import { usePersistedState } from "@/lib/hooks/usePersistedState";

interface ScanProgress { step: number; total: number; message: string; }
interface GoogleAdsEntry {
  id: string; timestamp: string; customerId: string; dateRange: string;
  campaignCount: number; totalClicks: number; totalCost: string;
  data: { customerId: string; dateRange: string; campaigns: Record<string, unknown>[]; metrics: Record<string, unknown>[]; keywordMetrics: Record<string, unknown>[]; devicePerf: Record<string, unknown>[]; aiInsights?: string };
}

const DATE_RANGES = [
  { label: "Ultimele 7 zile", value: "LAST_7_DAYS" },
  { label: "Ultimele 30 zile", value: "LAST_30_DAYS" },
  { label: "Luna aceasta", value: "THIS_MONTH" },
  { label: "Luna trecută", value: "LAST_MONTH" },
];

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("ro-RO", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function renderMarkdown(text: string) {
  return text.split("\n").map((line, i) => {
    const t = line.trim();
    if (!t) return <div key={i} className="h-2" />;
    if (t.startsWith("**") && t.endsWith("**")) return <h4 key={i} className="text-sm font-semibold text-amber-400 mt-3 mb-1">{t.replace(/\*\*/g, "")}</h4>;
    if (t.includes("**")) {
      const parts = t.split(/(\*\*[^*]+\*\*)/g);
      return <p key={i} className="text-sm text-gray-300 mb-1">{parts.map((p, j) => p.startsWith("**") && p.endsWith("**") ? <strong key={j} className="text-white font-semibold">{p.replace(/\*\*/g, "")}</strong> : <span key={j}>{p}</span>)}</p>;
    }
    if (t.startsWith("- ") || t.startsWith("* ")) return <div key={i} className="flex items-start gap-2 mb-1 pl-2"><span className="text-amber-500 mt-1.5 text-[6px]">&#9679;</span><span className="text-sm text-gray-300">{t.slice(2)}</span></div>;
    const nm = t.match(/^(\d+)\.\s(.+)/);
    if (nm) return <div key={i} className="flex items-start gap-2 mb-1 pl-2"><span className="text-amber-500 text-xs font-medium min-w-[16px]">{nm[1]}.</span><span className="text-sm text-gray-300">{nm[2]}</span></div>;
    return <p key={i} className="text-sm text-gray-300 mb-1">{t}</p>;
  });
}

function fmtNum(n: unknown): string {
  const v = Number(n);
  if (isNaN(v)) return "—";
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(1)}K`;
  return v.toLocaleString();
}

export default function GoogleAdsPage() {
  const [customerId, setCustomerId] = useState("");
  const [dateRange, setDateRange] = useState("LAST_30_DAYS");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<ScanProgress | null>(null);
  const [history, setHistory] = usePersistedState<GoogleAdsEntry[]>("google-ads-history", []);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = history.find((e) => e.id === selectedId) || null;

  const handleAnalyze = useCallback(async () => {
    if (!customerId.trim()) return;
    setIsLoading(true); setError(null); setProgress({ step: 0, total: 4, message: "Inițializez..." });

    try {
      const res = await fetch("/api/google-ads/analyze", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ customerId: customerId.trim(), dateRange }) });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || "Eroare."); }
      const reader = res.body?.getReader(); if (!reader) throw new Error("Stream error.");
      const decoder = new TextDecoder(); let buffer = ""; let result: GoogleAdsEntry["data"] | null = null;

      while (true) {
        const { done, value } = await reader.read(); if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const chunks = buffer.split("\n\n"); buffer = chunks.pop() || "";
        for (const chunk of chunks) {
          const tr = chunk.trim(); if (!tr.startsWith("data: ")) continue;
          try {
            const ev = JSON.parse(tr.slice(6));
            if (ev.event === "progress") setProgress({ step: ev.step, total: ev.total, message: ev.message });
            else if (ev.event === "result") result = ev.analysis;
            else if (ev.event === "error") throw new Error(ev.error);
          } catch { /* incomplete chunk */ }
        }
      }
      if (!result) throw new Error("Nu s-a primit rezultatul.");

      const mets = Array.isArray(result.metrics) ? result.metrics : [];
      const totalClicks = mets.reduce((s, m) => s + (Number(m.clicks) || 0), 0);
      const totalCost = mets.reduce((s, m) => s + (Number(m.cost) || Number(m.cost_micros) / 1_000_000 || 0), 0);

      const entry: GoogleAdsEntry = {
        id: crypto.randomUUID(), timestamp: new Date().toISOString(),
        customerId: customerId.trim(), dateRange,
        campaignCount: (Array.isArray(result.campaigns) ? result.campaigns : []).length,
        totalClicks, totalCost: totalCost > 0 ? totalCost.toFixed(2) : "0",
        data: result,
      };
      setHistory((prev) => [entry, ...prev]); setSelectedId(entry.id);
    } catch (err) { setError(err instanceof Error ? err.message : "Eroare."); }
    finally { setIsLoading(false); setProgress(null); }
  }, [customerId, dateRange, setHistory]);

  const deleteEntry = useCallback((id: string) => { setHistory((prev) => prev.filter((e) => e.id !== id)); if (selectedId === id) setSelectedId(null); }, [selectedId, setHistory]);

  const metrics = selected ? (Array.isArray(selected.data.metrics) ? selected.data.metrics : []) : [];
  const devicePerf = selected ? (Array.isArray(selected.data.devicePerf) ? selected.data.devicePerf : []) : [];

  return (
    <div className="h-full flex flex-col">
      <div className="flex-shrink-0 border-b border-gray-800/50 px-5 py-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2" /><polyline points="2 17 12 22 22 17" /><polyline points="2 12 12 17 22 12" /></svg>
          </div>
          <h2 className="text-sm font-bold"><span className="text-amber-400">Google</span><span className="text-white"> Ads</span></h2>
          {history.length > 0 && <span className="text-xs text-gray-500">{history.length} analize</span>}
        </div>
        <div className="flex items-center gap-3">
          {error && <span className="text-xs text-red-400 max-w-xs truncate">{error}</span>}
          {selected && <button onClick={() => setSelectedId(null)} className="text-xs text-gray-400 hover:text-white transition-colors flex items-center gap-1"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>Istoric</button>}
        </div>
      </div>

      {!selected && (
        <div className="flex-shrink-0 border-b border-gray-800/50 px-5 py-3">
          <div className="flex items-center gap-3">
            <input type="text" value={customerId} onChange={(e) => setCustomerId(e.target.value)} onKeyDown={(e) => e.key === "Enter" && !isLoading && customerId.trim() && handleAnalyze()} placeholder="Customer ID (1234567890)" className="flex-1 bg-gray-800/50 border border-gray-700/50 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 font-mono" disabled={isLoading} />
            <select value={dateRange} onChange={(e) => setDateRange(e.target.value)} className="bg-gray-800/50 border border-gray-700/50 rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-amber-500/50 appearance-none cursor-pointer" disabled={isLoading}>
              {DATE_RANGES.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
            </select>
            <button onClick={handleAnalyze} disabled={isLoading || !customerId.trim()} className="bg-amber-600 hover:bg-amber-500 disabled:bg-gray-700 disabled:text-gray-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">{isLoading ? "Analizez..." : "Analizează"}</button>
          </div>
        </div>
      )}

      {progress && (
        <div className="flex-shrink-0 bg-gray-900/80 border-b border-gray-800/50 px-5 py-2.5">
          <div className="flex items-center gap-3">
            <svg className="animate-spin h-4 w-4 text-amber-500" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
            <div className="flex-1"><div className="flex justify-between mb-1"><span className="text-xs text-gray-300">{progress.message}</span><span className="text-xs text-gray-500">{progress.step}/{progress.total}</span></div><div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden"><div className="h-full bg-amber-500 rounded-full transition-all duration-500" style={{ width: `${(progress.step / progress.total) * 100}%` }} /></div></div>
          </div>
        </div>
      )}

      <div className="flex-1 min-h-0 panel-scroll">
        {selected ? (
          <div className="p-5 space-y-4 max-w-4xl mx-auto">
            <div className="flex items-center justify-between bg-gray-900/50 border border-gray-800/50 rounded-xl px-4 py-3">
              <div>
                <p className="text-sm font-medium text-white font-mono">{selected.customerId}</p>
                <p className="text-xs text-gray-500">{selected.dateRange.replace(/_/g, " ")} &middot; {selected.campaignCount} campanii &middot; {formatDate(selected.timestamp)}</p>
              </div>
              <button onClick={() => setSelectedId(null)} className="text-gray-500 hover:text-white p-1"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg></button>
            </div>

            {/* Campaign Metrics */}
            {metrics.length > 0 && (
              <div className="bg-gray-900/50 border border-gray-800/50 rounded-xl p-4">
                <h3 className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-3">Performanță Campanii</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead><tr className="text-gray-500 border-b border-gray-800/50"><th className="text-left py-2 px-2">Campanie</th><th className="text-right py-2 px-2">Impresii</th><th className="text-right py-2 px-2">Clickuri</th><th className="text-right py-2 px-2">CTR</th><th className="text-right py-2 px-2">Cost</th><th className="text-right py-2 px-2">Conv.</th></tr></thead>
                    <tbody>
                      {metrics.map((m, i) => (
                        <tr key={i} className="border-b border-gray-800/30 hover:bg-gray-800/30">
                          <td className="py-2 px-2 text-gray-300 font-medium truncate max-w-[180px]">{(m.campaign_name || m.name || "—") as string}</td>
                          <td className="py-2 px-2 text-right text-gray-400">{fmtNum(m.impressions)}</td>
                          <td className="py-2 px-2 text-right text-gray-400">{fmtNum(m.clicks)}</td>
                          <td className="py-2 px-2 text-right text-amber-400/70">{m.ctr ? `${Number(m.ctr).toFixed(2)}%` : "—"}</td>
                          <td className="py-2 px-2 text-right text-gray-400">{m.cost ? Number(m.cost).toFixed(2) : m.cost_micros ? (Number(m.cost_micros) / 1_000_000).toFixed(2) : "—"}</td>
                          <td className="py-2 px-2 text-right text-green-400/70">{fmtNum(m.conversions)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Device Performance */}
            {devicePerf.length > 0 && (
              <div className="bg-gray-900/50 border border-gray-800/50 rounded-xl p-4">
                <h3 className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-3">Performanță pe Dispozitive</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {devicePerf.map((d, i) => (
                    <div key={i} className="bg-gray-800/40 rounded-lg p-3 text-center">
                      <p className="text-xs text-gray-400 mb-1">{(d.device as string) || (d.device_type as string) || "Unknown"}</p>
                      <p className="text-lg font-bold text-white">{fmtNum(d.clicks)}</p>
                      <p className="text-[10px] text-gray-500">clickuri &middot; CTR {d.ctr ? `${Number(d.ctr).toFixed(2)}%` : "—"}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selected.data.aiInsights && (
              <div className="bg-gray-900/50 border border-gray-800/50 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg><h3 className="text-xs font-semibold text-amber-400 uppercase tracking-wider">Analiză AI Google Ads</h3></div>
                <div className="space-y-0">{renderMarkdown(selected.data.aiInsights)}</div>
              </div>
            )}
          </div>
        ) : history.length > 0 ? (
          <div className="p-5 max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-4"><h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Istoric ({history.length})</h3>{history.length > 1 && <button onClick={() => { if (confirm("Ștergi tot?")) { setHistory([]); setSelectedId(null); } }} className="text-xs text-gray-600 hover:text-red-400">Șterge tot</button>}</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {history.map((e) => (
                <button key={e.id} onClick={() => setSelectedId(e.id)} className="group text-left bg-gray-900/50 hover:bg-gray-800/70 border border-gray-800/50 hover:border-amber-500/30 rounded-xl p-4 transition-all">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-white font-mono truncate">{e.customerId}</p>
                      <p className="text-xs text-amber-400/70 mt-0.5">{e.campaignCount} campanii &middot; {fmtNum(e.totalClicks)} clicks</p>
                      <p className="text-xs text-gray-500 mt-0.5">{e.dateRange.replace(/_/g, " ")}</p>
                      <p className="text-xs text-gray-600 mt-0.5">{formatDate(e.timestamp)}</p>
                    </div>
                    <div onClick={(ev) => { ev.stopPropagation(); deleteEntry(e.id); }} className="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-red-400 p-1 cursor-pointer"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" /></svg></div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="w-20 h-20 rounded-full bg-gray-900 border border-gray-800 flex items-center justify-center mb-4"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="1.5"><polygon points="12 2 2 7 12 12 22 7 12 2" /><polyline points="2 17 12 22 22 17" /><polyline points="2 12 12 17 22 12" /></svg></div>
            <p className="text-sm text-gray-600 mb-1">Analizează Google Ads</p>
            <p className="text-xs text-gray-700">Introdu Customer ID pentru campanii, metrici și analiză AI</p>
          </div>
        )}
      </div>
    </div>
  );
}
