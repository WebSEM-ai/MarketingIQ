"use client";

import { useState, useCallback } from "react";
import { usePersistedState } from "@/lib/hooks/usePersistedState";

interface ScanProgress { step: number; total: number; message: string; }
interface ComplianceIssue { severity: string; category: string; description: string; regulation: string; recommendation: string; quote?: string; }
interface ComplianceData { compliance_score: number; risk_level: string; product_name?: string; product_type?: string; issues: ComplianceIssue[]; missing_elements: string[]; positive_aspects: string[]; summary: string; action_plan: string; }
interface ComplianceEntry {
  id: string; timestamp: string; url: string; productType: string;
  score: number; riskLevel: string; issueCount: number; productName: string;
  data: { url: string; productType: string; pageLength: number; compliance: ComplianceData };
}

const PRODUCT_TYPES = [
  { label: "Supliment alimentar", value: "supliment-alimentar" },
  { label: "Produs naturist", value: "produs-naturist" },
  { label: "Produs cosmetic", value: "produs-cosmetic" },
  { label: "Dispozitiv medical", value: "dispozitiv-medical" },
  { label: "Produs OTC", value: "produs-otc" },
];

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

function getRiskBadge(risk: string) {
  const colors: Record<string, string> = { "scăzut": "bg-green-500/10 text-green-400 border-green-500/30", "mediu": "bg-yellow-500/10 text-yellow-400 border-yellow-500/30", "ridicat": "bg-orange-500/10 text-orange-400 border-orange-500/30", "critic": "bg-red-500/10 text-red-400 border-red-500/30" };
  return colors[risk] || "bg-gray-700/50 text-gray-400 border-gray-600/30";
}

function getSeverityColor(sev: string) {
  const c: Record<string, string> = { "critic": "text-red-400 bg-red-500/10", "major": "text-orange-400 bg-orange-500/10", "minor": "text-yellow-400 bg-yellow-500/10", "info": "text-blue-400 bg-blue-500/10" };
  return c[sev] || "text-gray-400 bg-gray-700/50";
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

export default function CompliancePage() {
  const [url, setUrl] = useState("");
  const [productType, setProductType] = useState("supliment-alimentar");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<ScanProgress | null>(null);
  const [history, setHistory] = usePersistedState<ComplianceEntry[]>("compliance-history", []);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = history.find((e) => e.id === selectedId) || null;

  const handleCheck = useCallback(async () => {
    if (!url.trim()) return;
    setIsLoading(true); setError(null); setProgress({ step: 0, total: 3, message: "Inițializez..." });

    try {
      const res = await fetch("/api/compliance/check", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: url.trim(), productType }) });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || "Eroare."); }
      const reader = res.body?.getReader(); if (!reader) throw new Error("Stream error.");
      const decoder = new TextDecoder(); let buffer = ""; let result: ComplianceEntry["data"] | null = null;

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

      const c = result.compliance as ComplianceData;
      const entry: ComplianceEntry = {
        id: crypto.randomUUID(), timestamp: new Date().toISOString(),
        url: url.trim(), productType,
        score: c?.compliance_score || 0, riskLevel: c?.risk_level || "necunoscut",
        issueCount: c?.issues?.length || 0, productName: c?.product_name || url.trim().replace(/https?:\/\//, "").split("/").pop() || "",
        data: result,
      };
      setHistory((prev) => [entry, ...prev]); setSelectedId(entry.id);
    } catch (err) { setError(err instanceof Error ? err.message : "Eroare."); }
    finally { setIsLoading(false); setProgress(null); }
  }, [url, productType, setHistory]);

  const deleteEntry = useCallback((id: string) => { setHistory((prev) => prev.filter((e) => e.id !== id)); if (selectedId === id) setSelectedId(null); }, [selectedId, setHistory]);

  const comp = selected?.data.compliance as ComplianceData | undefined;
  const scoreColor = comp ? getScoreColor(comp.compliance_score) : "#4b5563";
  const scoreArc = comp ? describeArc(50, 50, 40, 0, Math.max(1, (comp.compliance_score / 100) * 360 - 0.1)) : "";

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-gray-800/50 px-5 py-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#14b8a6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
            </svg>
          </div>
          <h2 className="text-sm font-bold"><span className="text-teal-400">Compliance</span><span className="text-white"> Checker</span></h2>
          {history.length > 0 && <span className="text-xs text-gray-500">{history.length} analize</span>}
        </div>
        <div className="flex items-center gap-3">
          {error && <span className="text-xs text-red-400 max-w-xs truncate">{error}</span>}
          {selected && <button onClick={() => setSelectedId(null)} className="text-xs text-gray-400 hover:text-white transition-colors flex items-center gap-1"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>Istoric</button>}
        </div>
      </div>

      {/* Input */}
      {!selected && (
        <div className="flex-shrink-0 border-b border-gray-800/50 px-5 py-3 space-y-2">
          <div className="flex items-center gap-3 flex-wrap">
            <input type="url" value={url} onChange={(e) => setUrl(e.target.value)} onKeyDown={(e) => e.key === "Enter" && !isLoading && url.trim() && handleCheck()} placeholder="Link produs (https://...)" className="flex-1 min-w-[300px] bg-gray-800/50 border border-gray-700/50 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/20" disabled={isLoading} />
            <select value={productType} onChange={(e) => setProductType(e.target.value)} className="bg-gray-800/50 border border-gray-700/50 rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-teal-500/50 appearance-none cursor-pointer" disabled={isLoading}>
              {PRODUCT_TYPES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <button onClick={handleCheck} disabled={isLoading || !url.trim()} className="bg-teal-600 hover:bg-teal-500 disabled:bg-gray-700 disabled:text-gray-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">{isLoading ? "Analizez..." : "Verifică Compliance"}</button>
          </div>
        </div>
      )}

      {/* Progress */}
      {progress && (
        <div className="flex-shrink-0 bg-gray-900/80 border-b border-gray-800/50 px-5 py-2.5">
          <div className="flex items-center gap-3">
            <svg className="animate-spin h-4 w-4 text-teal-500" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
            <div className="flex-1"><div className="flex justify-between mb-1"><span className="text-xs text-gray-300">{progress.message}</span><span className="text-xs text-gray-500">{progress.step}/{progress.total}</span></div><div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden"><div className="h-full bg-teal-500 rounded-full transition-all duration-500" style={{ width: `${(progress.step / progress.total) * 100}%` }} /></div></div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 min-h-0 panel-scroll">
        {selected && comp ? (
          <div className="p-5 space-y-4 max-w-4xl mx-auto">
            {/* Score Hero */}
            <div className="bg-gray-900/50 border border-gray-800/50 rounded-xl p-5">
              <div className="flex items-center gap-6">
                <div className="flex-shrink-0 relative">
                  <svg width="100" height="100" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="40" fill="none" stroke="#1f2937" strokeWidth="7" />
                    <path d={scoreArc} fill="none" stroke={scoreColor} strokeWidth="7" strokeLinecap="round" />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-bold" style={{ color: scoreColor }}>{comp.compliance_score}</span>
                    <span className="text-[9px] text-gray-500">/ 100</span>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-semibold text-white truncate">{comp.product_name || selected.url}</h3>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border ${getRiskBadge(comp.risk_level)}`}>
                      Risc {comp.risk_level}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mb-2 truncate">{selected.url}</p>
                  <p className="text-xs text-gray-400 leading-relaxed">{comp.summary}</p>
                  <div className="flex items-center gap-4 mt-3 text-[10px]">
                    <span className="text-red-400">{comp.issues.filter(i => i.severity === "critic").length} critice</span>
                    <span className="text-orange-400">{comp.issues.filter(i => i.severity === "major").length} majore</span>
                    <span className="text-yellow-400">{comp.issues.filter(i => i.severity === "minor").length} minore</span>
                    <span className="text-gray-500">{comp.missing_elements.length} elemente lipsă</span>
                  </div>
                </div>
                <button onClick={() => setSelectedId(null)} className="text-gray-500 hover:text-white p-1 self-start"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg></button>
              </div>
            </div>

            {/* Issues */}
            {comp.issues.length > 0 && (
              <div className="bg-gray-900/50 border border-gray-800/50 rounded-xl p-4">
                <h3 className="text-xs font-semibold text-teal-400 uppercase tracking-wider mb-3">Probleme Identificate ({comp.issues.length})</h3>
                <div className="space-y-2">
                  {comp.issues.map((issue, i) => (
                    <div key={i} className="bg-gray-800/30 border border-gray-700/20 rounded-xl p-3">
                      <div className="flex items-start gap-2 mb-1">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium flex-shrink-0 ${getSeverityColor(issue.severity)}`}>{issue.severity.toUpperCase()}</span>
                        <span className="text-[10px] text-gray-500 flex-shrink-0">{issue.category}</span>
                      </div>
                      <p className="text-xs text-gray-300 mb-1">{issue.description}</p>
                      {issue.quote && <p className="text-[10px] text-gray-500 italic border-l-2 border-gray-700 pl-2 mb-1">&ldquo;{issue.quote}&rdquo;</p>}
                      <p className="text-[10px] text-gray-500"><strong className="text-gray-400">Regulament:</strong> {issue.regulation}</p>
                      <p className="text-[10px] text-teal-400/70 mt-1"><strong className="text-teal-400">Recomandare:</strong> {issue.recommendation}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Missing Elements */}
            {comp.missing_elements.length > 0 && (
              <div className="bg-gray-900/50 border border-gray-800/50 rounded-xl p-4">
                <h3 className="text-xs font-semibold text-orange-400 uppercase tracking-wider mb-3">Elemente Obligatorii Lipsă</h3>
                <div className="space-y-1.5">
                  {comp.missing_elements.map((el, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>
                      <span className="text-gray-300">{el}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Positive */}
            {comp.positive_aspects.length > 0 && (
              <div className="bg-gray-900/50 border border-gray-800/50 rounded-xl p-4">
                <h3 className="text-xs font-semibold text-green-400 uppercase tracking-wider mb-3">Aspecte Conforme</h3>
                <div className="space-y-1.5">
                  {comp.positive_aspects.map((el, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
                      <span className="text-gray-300">{el}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Plan */}
            {comp.action_plan && (
              <div className="bg-gray-900/50 border border-gray-800/50 rounded-xl p-4">
                <h3 className="text-xs font-semibold text-teal-400 uppercase tracking-wider mb-3">Plan de Acțiune</h3>
                <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-line">{comp.action_plan}</p>
              </div>
            )}
          </div>
        ) : history.length > 0 ? (
          <div className="p-5 max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-4"><h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Istoric ({history.length})</h3>{history.length > 1 && <button onClick={() => { if (confirm("Ștergi tot?")) { setHistory([]); setSelectedId(null); } }} className="text-xs text-gray-600 hover:text-red-400">Șterge tot</button>}</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {history.map((e) => (
                <button key={e.id} onClick={() => setSelectedId(e.id)} className="group text-left bg-gray-900/50 hover:bg-gray-800/70 border border-gray-800/50 hover:border-teal-500/30 rounded-xl p-4 transition-all">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg font-bold" style={{ color: getScoreColor(e.score) }}>{e.score}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${getRiskBadge(e.riskLevel)}`}>{e.riskLevel}</span>
                      </div>
                      <p className="text-xs font-medium text-white truncate">{e.productName}</p>
                      <p className="text-[10px] text-gray-500 truncate mt-0.5">{e.url}</p>
                      <p className="text-[10px] text-gray-500 mt-1">{e.issueCount} probleme &middot; {formatDate(e.timestamp)}</p>
                    </div>
                    <div onClick={(ev) => { ev.stopPropagation(); deleteEntry(e.id); }} className="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-red-400 p-1 cursor-pointer"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" /></svg></div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="w-20 h-20 rounded-full bg-gray-900 border border-gray-800 flex items-center justify-center mb-4">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="1.5"><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" /></svg>
            </div>
            <p className="text-sm text-gray-600 mb-1">Verifică conformitatea produselor</p>
            <p className="text-xs text-gray-700">Introdu link-ul unui produs pharma/naturist pentru analiza compliance EU/RO</p>
          </div>
        )}
      </div>
    </div>
  );
}
