"use client";

import { useState, useCallback } from "react";
import { usePersistedState } from "@/lib/hooks/usePersistedState";

interface ScanProgress { step: number; total: number; message: string; }
interface MetaEntry {
  id: string; timestamp: string; accountId: string;
  campaignCount: number; activeCount: number;
  data: { accountId: string; campaigns: Record<string, unknown>[]; insights: Record<string, unknown>; aiInsights?: string };
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("ro-RO", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function renderMarkdown(text: string) {
  return text.split("\n").map((line, i) => {
    const t = line.trim();
    if (!t) return <div key={i} className="h-2" />;
    if (t.startsWith("**") && t.endsWith("**")) return <h4 key={i} className="text-sm font-semibold text-blue-400 mt-3 mb-1">{t.replace(/\*\*/g, "")}</h4>;
    if (t.includes("**")) {
      const parts = t.split(/(\*\*[^*]+\*\*)/g);
      return <p key={i} className="text-sm text-gray-300 mb-1">{parts.map((p, j) => p.startsWith("**") && p.endsWith("**") ? <strong key={j} className="text-white font-semibold">{p.replace(/\*\*/g, "")}</strong> : <span key={j}>{p}</span>)}</p>;
    }
    if (t.startsWith("- ") || t.startsWith("* ")) return <div key={i} className="flex items-start gap-2 mb-1 pl-2"><span className="text-blue-500 mt-1.5 text-[6px]">&#9679;</span><span className="text-sm text-gray-300">{t.slice(2)}</span></div>;
    const nm = t.match(/^(\d+)\.\s(.+)/);
    if (nm) return <div key={i} className="flex items-start gap-2 mb-1 pl-2"><span className="text-blue-500 text-xs font-medium min-w-[16px]">{nm[1]}.</span><span className="text-sm text-gray-300">{nm[2]}</span></div>;
    return <p key={i} className="text-sm text-gray-300 mb-1">{t}</p>;
  });
}

export default function MetaAdsPage() {
  const [accountId, setAccountId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<ScanProgress | null>(null);
  const [history, setHistory] = usePersistedState<MetaEntry[]>("meta-ads-history", []);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = history.find((e) => e.id === selectedId) || null;

  const handleAnalyze = useCallback(async () => {
    if (!accountId.trim()) return;
    setIsLoading(true); setError(null); setProgress({ step: 0, total: 3, message: "Inițializez..." });

    try {
      const res = await fetch("/api/meta-ads/analyze", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ accountId: accountId.trim() }) });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || "Eroare."); }
      const reader = res.body?.getReader(); if (!reader) throw new Error("Stream error.");
      const decoder = new TextDecoder(); let buffer = ""; let result: MetaEntry["data"] | null = null;

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

      const camps = Array.isArray(result.campaigns) ? result.campaigns : [];
      const entry: MetaEntry = {
        id: crypto.randomUUID(), timestamp: new Date().toISOString(), accountId: accountId.trim(),
        campaignCount: camps.length,
        activeCount: camps.filter((c) => c.status === "ACTIVE" || c.effective_status === "ACTIVE").length,
        data: result,
      };
      setHistory((prev) => [entry, ...prev]); setSelectedId(entry.id);
    } catch (err) { setError(err instanceof Error ? err.message : "Eroare."); }
    finally { setIsLoading(false); setProgress(null); }
  }, [accountId, setHistory]);

  const deleteEntry = useCallback((id: string) => { setHistory((prev) => prev.filter((e) => e.id !== id)); if (selectedId === id) setSelectedId(null); }, [selectedId, setHistory]);

  const campaigns = selected ? (Array.isArray(selected.data.campaigns) ? selected.data.campaigns : []) : [];

  return (
    <div className="h-full flex flex-col">
      <div className="flex-shrink-0 border-b border-gray-800/50 px-5 py-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" /></svg>
          </div>
          <h2 className="text-sm font-bold"><span className="text-blue-400">Meta</span><span className="text-white"> Ads</span></h2>
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
            <input type="text" value={accountId} onChange={(e) => setAccountId(e.target.value)} onKeyDown={(e) => e.key === "Enter" && !isLoading && accountId.trim() && handleAnalyze()} placeholder="Account ID (act_XXXXXXXXX)" className="flex-1 bg-gray-800/50 border border-gray-700/50 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 font-mono" disabled={isLoading} />
            <button onClick={handleAnalyze} disabled={isLoading || !accountId.trim()} className="bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:text-gray-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">{isLoading ? "Analizez..." : "Analizează"}</button>
          </div>
        </div>
      )}

      {progress && (
        <div className="flex-shrink-0 bg-gray-900/80 border-b border-gray-800/50 px-5 py-2.5">
          <div className="flex items-center gap-3">
            <svg className="animate-spin h-4 w-4 text-blue-500" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
            <div className="flex-1"><div className="flex justify-between mb-1"><span className="text-xs text-gray-300">{progress.message}</span><span className="text-xs text-gray-500">{progress.step}/{progress.total}</span></div><div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden"><div className="h-full bg-blue-500 rounded-full transition-all duration-500" style={{ width: `${(progress.step / progress.total) * 100}%` }} /></div></div>
          </div>
        </div>
      )}

      <div className="flex-1 min-h-0 panel-scroll">
        {selected ? (
          <div className="p-5 space-y-4 max-w-4xl mx-auto">
            <div className="flex items-center justify-between bg-gray-900/50 border border-gray-800/50 rounded-xl px-4 py-3">
              <div>
                <p className="text-sm font-medium text-white font-mono">{selected.accountId}</p>
                <p className="text-xs text-gray-500">{selected.campaignCount} campanii &middot; {selected.activeCount} active &middot; {formatDate(selected.timestamp)}</p>
              </div>
              <button onClick={() => setSelectedId(null)} className="text-gray-500 hover:text-white p-1"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg></button>
            </div>

            {/* Campaigns Table */}
            {campaigns.length > 0 && (
              <div className="bg-gray-900/50 border border-gray-800/50 rounded-xl p-4">
                <h3 className="text-xs font-semibold text-blue-400 uppercase tracking-wider mb-3">Campanii ({campaigns.length})</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead><tr className="text-gray-500 border-b border-gray-800/50"><th className="text-left py-2 px-2">Nume</th><th className="text-center py-2 px-2">Status</th><th className="text-center py-2 px-2">Obiectiv</th><th className="text-right py-2 px-2">Budget</th></tr></thead>
                    <tbody>
                      {campaigns.map((c, i) => {
                        const status = (c.effective_status as string) || (c.status as string) || "";
                        const isActive = status === "ACTIVE";
                        return (
                          <tr key={i} className="border-b border-gray-800/30 hover:bg-gray-800/30">
                            <td className="py-2 px-2 text-gray-300 font-medium truncate max-w-[200px]">{(c.name as string) || "—"}</td>
                            <td className="py-2 px-2 text-center"><span className={`text-[10px] px-2 py-0.5 rounded-full ${isActive ? "bg-green-500/10 text-green-400" : "bg-gray-700/50 text-gray-500"}`}>{status}</span></td>
                            <td className="py-2 px-2 text-center text-gray-500">{((c.objective as string) || "").replace("OUTCOME_", "")}</td>
                            <td className="py-2 px-2 text-right text-gray-400">{c.daily_budget ? `${c.daily_budget}/zi` : c.lifetime_budget ? `${c.lifetime_budget} total` : "—"}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {selected.data.aiInsights && (
              <div className="bg-gray-900/50 border border-gray-800/50 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg><h3 className="text-xs font-semibold text-blue-400 uppercase tracking-wider">Analiză AI Meta Ads</h3></div>
                <div className="space-y-0">{renderMarkdown(selected.data.aiInsights)}</div>
              </div>
            )}
          </div>
        ) : history.length > 0 ? (
          <div className="p-5 max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-4"><h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Istoric ({history.length})</h3>{history.length > 1 && <button onClick={() => { if (confirm("Ștergi tot?")) { setHistory([]); setSelectedId(null); } }} className="text-xs text-gray-600 hover:text-red-400">Șterge tot</button>}</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {history.map((e) => (
                <button key={e.id} onClick={() => setSelectedId(e.id)} className="group text-left bg-gray-900/50 hover:bg-gray-800/70 border border-gray-800/50 hover:border-blue-500/30 rounded-xl p-4 transition-all">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-white font-mono truncate">{e.accountId}</p>
                      <p className="text-xs text-blue-400/70 mt-0.5">{e.activeCount}/{e.campaignCount} active</p>
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
            <div className="w-20 h-20 rounded-full bg-gray-900 border border-gray-800 flex items-center justify-center mb-4"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="1.5"><path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" /></svg></div>
            <p className="text-sm text-gray-600 mb-1">Analizează Meta Ads</p>
            <p className="text-xs text-gray-700">Introdu Account ID-ul pentru campanii, metrici și analiză AI</p>
          </div>
        )}
      </div>
    </div>
  );
}
