"use client";

import { useState, useCallback } from "react";
import { usePersistedState } from "@/lib/hooks/usePersistedState";

interface ScanProgress { step: number; total: number; message: string; }
interface NewsArticle { position: number; title: string; link: string; source: string; date: string; isoDate?: string; snippet?: string; thumbnail?: string; }
interface NewsEntry {
  id: string; timestamp: string; query: string; country: string; timePeriod: string;
  articleCount: number; sourceCount: number;
  data: { query: string; country: string; timePeriod: string; articles: NewsArticle[]; totalResults: number; aiInsights?: string };
}

const COUNTRY_OPTIONS = [
  { label: "Romania", value: "ro" }, { label: "Global", value: "us" },
  { label: "UK", value: "uk" }, { label: "Germania", value: "de" }, { label: "Franța", value: "fr" },
];
const TIME_OPTIONS = [
  { label: "Ultima oră", value: "last_hour" }, { label: "Ultima zi", value: "last_day" },
  { label: "Ultima săptămână", value: "last_week" }, { label: "Ultima lună", value: "last_month" },
  { label: "Ultimul an", value: "last_year" },
];
const SORT_OPTIONS = [
  { label: "Relevanță", value: "relevance" }, { label: "Cele mai recente", value: "most_recent" },
];

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("ro-RO", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function renderMarkdown(text: string) {
  return text.split("\n").map((line, i) => {
    const t = line.trim();
    if (!t) return <div key={i} className="h-2" />;
    if (t.startsWith("**") && t.endsWith("**")) return <h4 key={i} className="text-sm font-semibold text-indigo-400 mt-3 mb-1">{t.replace(/\*\*/g, "")}</h4>;
    if (t.includes("**")) {
      const parts = t.split(/(\*\*[^*]+\*\*)/g);
      return <p key={i} className="text-sm text-gray-300 mb-1">{parts.map((p, j) => p.startsWith("**") && p.endsWith("**") ? <strong key={j} className="text-white font-semibold">{p.replace(/\*\*/g, "")}</strong> : <span key={j}>{p}</span>)}</p>;
    }
    if (t.startsWith("- ") || t.startsWith("* ")) return <div key={i} className="flex items-start gap-2 mb-1 pl-2"><span className="text-indigo-500 mt-1.5 text-[6px]">&#9679;</span><span className="text-sm text-gray-300">{t.slice(2)}</span></div>;
    const nm = t.match(/^(\d+)\.\s(.+)/);
    if (nm) return <div key={i} className="flex items-start gap-2 mb-1 pl-2"><span className="text-indigo-500 text-xs font-medium min-w-[16px]">{nm[1]}.</span><span className="text-sm text-gray-300">{nm[2]}</span></div>;
    return <p key={i} className="text-sm text-gray-300 mb-1">{t}</p>;
  });
}

export default function NewsPage() {
  const [query, setQuery] = useState("");
  const [country, setCountry] = useState("ro");
  const [timePeriod, setTimePeriod] = useState("last_week");
  const [sortBy, setSortBy] = useState("relevance");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<ScanProgress | null>(null);
  const [history, setHistory] = usePersistedState<NewsEntry[]>("news-history", []);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = history.find((e) => e.id === selectedId) || null;

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return;
    setIsLoading(true); setError(null); setProgress({ step: 0, total: 2, message: "Inițializez..." });

    try {
      const res = await fetch("/api/news/search", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: query.trim(), country, language: country === "ro" ? "ro" : "en", timePeriod, sortBy }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || "Eroare."); }
      const reader = res.body?.getReader(); if (!reader) throw new Error("Stream error.");
      const decoder = new TextDecoder(); let buffer = ""; let result: NewsEntry["data"] | null = null;

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
          } catch {
            // Incomplete JSON chunk, skip
          }
        }
      }
      if (!result) throw new Error("Nu s-a primit rezultatul.");

      const sources = Array.from(new Set(result.articles.map((a) => a.source).filter(Boolean)));
      const entry: NewsEntry = {
        id: crypto.randomUUID(), timestamp: new Date().toISOString(),
        query: query.trim(), country, timePeriod,
        articleCount: result.articles.length, sourceCount: sources.length,
        data: result,
      };
      setHistory((prev) => [entry, ...prev]); setSelectedId(entry.id); setQuery("");
    } catch (err) { setError(err instanceof Error ? err.message : "Eroare."); }
    finally { setIsLoading(false); setProgress(null); }
  }, [query, country, timePeriod, sortBy, setHistory]);

  const deleteEntry = useCallback((id: string) => { setHistory((prev) => prev.filter((e) => e.id !== id)); if (selectedId === id) setSelectedId(null); }, [selectedId, setHistory]);

  const articles = selected?.data.articles || [];
  const sources = selected ? Array.from(new Set(articles.map((a) => a.source).filter(Boolean))) : [];
  const sourceCounts: Record<string, number> = {};
  articles.forEach((a) => { if (a.source) sourceCounts[a.source] = (sourceCounts[a.source] || 0) + 1; });
  const topSources = Object.entries(sourceCounts).sort((a, b) => b[1] - a[1]).slice(0, 8);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-gray-800/50 px-5 py-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2" />
            </svg>
          </div>
          <h2 className="text-sm font-bold"><span className="text-indigo-400">Google</span><span className="text-white"> News</span></h2>
          {history.length > 0 && <span className="text-xs text-gray-500">{history.length} căutări</span>}
        </div>
        <div className="flex items-center gap-3">
          {error && <span className="text-xs text-red-400 max-w-xs truncate">{error}</span>}
          {selected && <button onClick={() => setSelectedId(null)} className="text-xs text-gray-400 hover:text-white transition-colors flex items-center gap-1"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>Istoric</button>}
        </div>
      </div>

      {/* Search Form */}
      {!selected && (
        <div className="flex-shrink-0 border-b border-gray-800/50 px-5 py-3 space-y-2">
          <div className="flex items-center gap-3 flex-wrap">
            <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === "Enter" && !isLoading && query.trim() && handleSearch()} placeholder="Caută știri (ex: brand, industrie, topic)..." className="flex-1 min-w-[200px] bg-gray-800/50 border border-gray-700/50 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20" disabled={isLoading} />
            <select value={country} onChange={(e) => setCountry(e.target.value)} className="bg-gray-800/50 border border-gray-700/50 rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-indigo-500/50 appearance-none cursor-pointer" disabled={isLoading}>
              {COUNTRY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <button onClick={handleSearch} disabled={isLoading || !query.trim()} className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-700 disabled:text-gray-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">{isLoading ? "Caut..." : "Caută Știri"}</button>
          </div>
          <div className="flex items-center gap-3">
            <select value={timePeriod} onChange={(e) => setTimePeriod(e.target.value)} className="bg-gray-800/50 border border-gray-700/50 rounded-lg px-2 py-1.5 text-xs text-gray-300 focus:outline-none focus:border-indigo-500/50 appearance-none cursor-pointer" disabled={isLoading}>
              {TIME_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="bg-gray-800/50 border border-gray-700/50 rounded-lg px-2 py-1.5 text-xs text-gray-300 focus:outline-none focus:border-indigo-500/50 appearance-none cursor-pointer" disabled={isLoading}>
              {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        </div>
      )}

      {/* Progress */}
      {progress && (
        <div className="flex-shrink-0 bg-gray-900/80 border-b border-gray-800/50 px-5 py-2.5">
          <div className="flex items-center gap-3">
            <svg className="animate-spin h-4 w-4 text-indigo-500" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
            <div className="flex-1"><div className="flex justify-between mb-1"><span className="text-xs text-gray-300">{progress.message}</span><span className="text-xs text-gray-500">{progress.step}/{progress.total}</span></div><div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden"><div className="h-full bg-indigo-500 rounded-full transition-all duration-500" style={{ width: `${(progress.step / progress.total) * 100}%` }} /></div></div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 min-h-0 panel-scroll">
        {selected ? (
          <div className="p-5 space-y-4 max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between bg-gray-900/50 border border-gray-800/50 rounded-xl px-4 py-3">
              <div>
                <p className="text-sm font-medium text-white">&ldquo;{selected.query}&rdquo;</p>
                <p className="text-xs text-gray-500">{COUNTRY_OPTIONS.find(o => o.value === selected.country)?.label} &middot; {TIME_OPTIONS.find(o => o.value === selected.timePeriod)?.label} &middot; {selected.articleCount} articole &middot; {selected.sourceCount} surse &middot; {formatDate(selected.timestamp)}</p>
              </div>
              <button onClick={() => setSelectedId(null)} className="text-gray-500 hover:text-white p-1"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg></button>
            </div>

            {/* Source Distribution */}
            {topSources.length > 0 && (
              <div className="bg-gray-900/50 border border-gray-800/50 rounded-xl p-4">
                <h3 className="text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-3">Surse ({sources.length})</h3>
                <div className="flex flex-wrap gap-2">
                  {topSources.map(([source, count]) => (
                    <span key={source} className="text-xs bg-gray-800/50 border border-gray-700/30 rounded-lg px-3 py-1.5 text-gray-300">
                      {source} <span className="text-indigo-400/70 ml-1">{count}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Articles */}
            <div className="bg-gray-900/50 border border-gray-800/50 rounded-xl p-4">
              <h3 className="text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-3">Articole ({articles.length})</h3>
              <div className="space-y-3">
                {articles.map((article) => (
                  <a key={article.position} href={article.link} target="_blank" rel="noopener noreferrer" className="block bg-gray-800/30 hover:bg-gray-800/60 border border-gray-700/20 hover:border-indigo-500/30 rounded-xl p-3 transition-all">
                    <div className="flex items-start gap-3">
                      <span className="text-[10px] text-gray-600 w-4 flex-shrink-0 mt-0.5">{article.position}</span>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-medium text-white mb-1 leading-relaxed hover:text-indigo-300 transition-colors">{article.title}</h4>
                        <div className="flex items-center gap-2 text-[10px] text-gray-500 mb-1">
                          <span className="text-indigo-400/70 font-medium">{article.source}</span>
                          <span>&middot;</span>
                          <span>{article.date}</span>
                        </div>
                        {article.snippet && <p className="text-[11px] text-gray-500 line-clamp-2 leading-relaxed">{article.snippet}</p>}
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            </div>

            {/* AI Insights */}
            {selected.data.aiInsights && (
              <div className="bg-gray-900/50 border border-gray-800/50 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg><h3 className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">Analiză AI Media</h3></div>
                <div className="space-y-0">{renderMarkdown(selected.data.aiInsights)}</div>
              </div>
            )}
          </div>
        ) : history.length > 0 ? (
          <div className="p-5 max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-4"><h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Istoric ({history.length})</h3>{history.length > 1 && <button onClick={() => { if (confirm("Ștergi tot?")) { setHistory([]); setSelectedId(null); } }} className="text-xs text-gray-600 hover:text-red-400">Șterge tot</button>}</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {history.map((e) => (
                <button key={e.id} onClick={() => setSelectedId(e.id)} className="group text-left bg-gray-900/50 hover:bg-gray-800/70 border border-gray-800/50 hover:border-indigo-500/30 rounded-xl p-4 transition-all">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-white truncate">&ldquo;{e.query}&rdquo;</p>
                      <p className="text-xs text-gray-500 mt-1">{e.articleCount} articole &middot; {e.sourceCount} surse</p>
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
            <div className="w-20 h-20 rounded-full bg-gray-900 border border-gray-800 flex items-center justify-center mb-4">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="1.5"><path d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2" /></svg>
            </div>
            <p className="text-sm text-gray-600 mb-1">Monitorizează Google News</p>
            <p className="text-xs text-gray-700">Caută știri despre brandul, industria sau competitorii tăi</p>
          </div>
        )}
      </div>
    </div>
  );
}
