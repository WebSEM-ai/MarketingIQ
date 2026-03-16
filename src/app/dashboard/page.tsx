"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MODULE_COLORS } from "@/lib/synergy/types";
import type { ModuleId } from "@/lib/synergy/types";
import { sendToModule } from "@/lib/synergy/actions";

const modules = [
  {
    href: "/dashboard/prompt-iq",
    id: "prompt-iq" as const,
    label: "PromptIQ",
    description: "Analizează și optimizează prompturi AI cu scoruri detaliate și sugestii inteligente.",
    color: "#3b82f6",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
      </svg>
    ),
    storageKey: null,
    status: "activ",
  },
  {
    href: "/dashboard/aeo",
    id: "aeo" as ModuleId,
    label: "AEO Tracker",
    description: "Monitorizează vizibilitatea pe motoarele AI: ChatGPT, Perplexity, Claude, Gemini, Grok.",
    color: "#06b6d4",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" />
        <line x1="12" y1="2" x2="12" y2="6" /><line x1="12" y1="18" x2="12" y2="22" />
        <line x1="2" y1="12" x2="6" y2="12" /><line x1="18" y1="12" x2="22" y2="12" />
      </svg>
    ),
    storageKey: "miq:aeo-history",
    status: "activ",
  },
  {
    href: "/dashboard/competitors",
    id: "competitors" as ModuleId,
    label: "Competitori",
    description: "Monitorizează competitorii, scanează site-uri și detectează schimbări.",
    color: "#f59e0b",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" />
      </svg>
    ),
    storageKey: "miq:competitors-analyses",
    status: "activ",
  },
  {
    href: "/dashboard/trends",
    id: "trends" as ModuleId,
    label: "Tendințe",
    description: "Analizează tendințe de căutare, topicuri în creștere și comparații.",
    color: "#22c55e",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    ),
    storageKey: "miq:trends-history",
    status: "activ",
  },
  {
    href: "/dashboard/keywords",
    id: "keywords" as ModuleId,
    label: "Cuvinte Cheie",
    description: "Cercetează keywords, analizează volume și obține sugestii relevante.",
    color: "#a855f7",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
      </svg>
    ),
    storageKey: "miq:keywords-history",
    status: "activ",
  },
  {
    href: "/dashboard/content",
    id: "content" as ModuleId,
    label: "Conținut",
    description: "Generează calendare de conținut, clustere tematice și analize de gap-uri.",
    color: "#f43f5e",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
        <polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
      </svg>
    ),
    storageKey: "miq:content-history",
    status: "activ",
  },
];

interface ModuleStats {
  count: number;
  lastTimestamp?: string;
  metric?: string;
}

interface ActivityItem {
  moduleId: string;
  moduleLabel: string;
  color: string;
  label: string;
  timestamp: string;
}

interface SynergySuggestion {
  text: string;
  source: ModuleId;
  target: ModuleId;
  data: Record<string, unknown>;
  label: string;
}

function formatTimeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "acum";
  if (mins < 60) return `acum ${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `acum ${hours}h`;
  const days = Math.floor(hours / 24);
  return `acum ${days}z`;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Record<string, ModuleStats>>({});
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [suggestions, setSuggestions] = useState<SynergySuggestion[]>([]);
  const router = useRouter();

  useEffect(() => {
    // Read localStorage to build stats, activity, and suggestions
    const newStats: Record<string, ModuleStats> = {};
    const allActivity: ActivityItem[] = [];
    const analyzedModules: Record<string, string[]> = {};

    // AEO
    try {
      const aeo = JSON.parse(localStorage.getItem("miq:aeo-history") || "[]");
      newStats["aeo"] = {
        count: aeo.length,
        lastTimestamp: aeo[0]?.timestamp,
        metric: aeo[0] ? `${aeo[0].avgVisibility}% vizibilitate` : undefined,
      };
      aeo.slice(0, 5).forEach((e: { prompt: string; timestamp: string }) => {
        allActivity.push({ moduleId: "aeo", moduleLabel: "AEO", color: "#06b6d4", label: e.prompt, timestamp: e.timestamp });
      });
      if (aeo.length > 0) analyzedModules["aeo"] = aeo.map((e: { prompt: string }) => e.prompt);
    } catch { /* empty */ }

    // Trends
    try {
      const trends = JSON.parse(localStorage.getItem("miq:trends-history") || "[]");
      newStats["trends"] = {
        count: trends.length,
        lastTimestamp: trends[0]?.timestamp,
        metric: trends.length > 0 ? `${trends.length} analize` : undefined,
      };
      trends.slice(0, 5).forEach((e: { query: string; timestamp: string }) => {
        allActivity.push({ moduleId: "trends", moduleLabel: "Tendințe", color: "#22c55e", label: e.query, timestamp: e.timestamp });
      });
      if (trends.length > 0) analyzedModules["trends"] = trends.map((e: { query: string }) => e.query);
    } catch { /* empty */ }

    // Keywords
    try {
      const kw = JSON.parse(localStorage.getItem("miq:keywords-history") || "[]");
      newStats["keywords"] = {
        count: kw.length,
        lastTimestamp: kw[0]?.timestamp,
        metric: kw[0] ? `${kw[0].suggestionCount} sugestii` : undefined,
      };
      kw.slice(0, 5).forEach((e: { seed: string; timestamp: string }) => {
        allActivity.push({ moduleId: "keywords", moduleLabel: "Cuvinte Cheie", color: "#a855f7", label: e.seed, timestamp: e.timestamp });
      });
      if (kw.length > 0) analyzedModules["keywords"] = kw.map((e: { seed: string }) => e.seed);
    } catch { /* empty */ }

    // Content
    try {
      const content = JSON.parse(localStorage.getItem("miq:content-history") || "[]");
      newStats["content"] = {
        count: content.length,
        lastTimestamp: content[0]?.timestamp,
        metric: content[0] ? `${content[0].calendarCount} articole` : undefined,
      };
      content.slice(0, 5).forEach((e: { label: string; timestamp: string }) => {
        allActivity.push({ moduleId: "content", moduleLabel: "Conținut", color: "#f43f5e", label: e.label, timestamp: e.timestamp });
      });
    } catch { /* empty */ }

    // Competitors
    try {
      const comp = JSON.parse(localStorage.getItem("miq:competitors-analyses") || "[]");
      newStats["competitors"] = {
        count: comp.length,
        lastTimestamp: comp[0]?.scan?.scannedAt,
        metric: comp.length > 0 ? `${comp.length} competitori` : undefined,
      };
      comp.slice(0, 5).forEach((e: { competitor: { name: string }; scan: { scannedAt: string } }) => {
        allActivity.push({ moduleId: "competitors", moduleLabel: "Competitori", color: "#f59e0b", label: e.competitor.name, timestamp: e.scan?.scannedAt || "" });
      });
    } catch { /* empty */ }

    setStats(newStats);

    // Sort activity by timestamp
    allActivity.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    setActivity(allActivity.slice(0, 10));

    // Generate synergy suggestions
    const newSuggestions: SynergySuggestion[] = [];

    // If keywords analyzed but not in trends
    if (analyzedModules["keywords"] && !analyzedModules["trends"]) {
      const kw = analyzedModules["keywords"][0];
      newSuggestions.push({
        text: `Ai cercetat "${kw}" în Cuvinte Cheie — verifică trendul?`,
        source: "keywords",
        target: "trends",
        data: { query: kw },
        label: kw,
      });
    }

    // If trends analyzed but not in keywords
    if (analyzedModules["trends"] && !analyzedModules["keywords"]) {
      const q = analyzedModules["trends"][0];
      newSuggestions.push({
        text: `Ai analizat trendul "${q}" — cercetează cuvintele cheie?`,
        source: "trends",
        target: "keywords",
        data: { seed: q },
        label: q,
      });
    }

    // If keywords analyzed but not AEO
    if (analyzedModules["keywords"] && !analyzedModules["aeo"]) {
      const kw = analyzedModules["keywords"][0];
      newSuggestions.push({
        text: `Verifică vizibilitatea AEO pentru "${kw}"?`,
        source: "keywords",
        target: "aeo",
        data: { prompt: kw },
        label: kw,
      });
    }

    // Cross-match: keywords in both trends and keywords → suggest content
    if (analyzedModules["keywords"] && analyzedModules["trends"]) {
      const overlap = analyzedModules["keywords"].find(k =>
        analyzedModules["trends"]?.some(t => t.toLowerCase().includes(k.toLowerCase()) || k.toLowerCase().includes(t.toLowerCase()))
      );
      if (overlap) {
        newSuggestions.push({
          text: `"${overlap}" apare în Keywords și Trends — generează o strategie de conținut?`,
          source: "keywords",
          target: "content",
          data: { keywords: [overlap] },
          label: overlap,
        });
      }
    }

    setSuggestions(newSuggestions.slice(0, 3));
  }, []);

  const handleSuggestionClick = (s: SynergySuggestion) => {
    const route = sendToModule(s.source, s.target, s.data as never, s.label);
    router.push(route);
  };

  return (
    <div className="h-full panel-scroll p-6">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white mb-2">
            Marketing<span className="text-blue-400">IQ</span> Dashboard
          </h1>
          <p className="text-sm text-gray-500">
            Platforma ta de marketing intelligence. Modulele comunică între ele — datele circulă cu un click.
          </p>
        </div>

        {/* Synergy Suggestions */}
        {suggestions.length > 0 && (
          <div className="mb-6">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Sugestii de Sinergie
            </h2>
            <div className="space-y-2">
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  onClick={() => handleSuggestionClick(s)}
                  className="w-full text-left flex items-center gap-3 bg-gray-900/50 hover:bg-gray-800/70 border border-gray-800/50 hover:border-blue-500/30 rounded-xl px-4 py-3 transition-all"
                >
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${MODULE_COLORS[s.target]}15` }}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={MODULE_COLORS[s.target]} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M7 17L17 7" />
                      <path d="M7 7h10v10" />
                    </svg>
                  </div>
                  <span className="text-sm text-gray-300 flex-1">{s.text}</span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4b5563" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Module Cards — data-aware */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {modules.map((mod) => {
            const modStats = stats[mod.id] || null;
            return (
              <Link
                key={mod.href}
                href={mod.href}
                className="group bg-gray-900/50 border border-gray-800/50 rounded-xl p-5 hover:bg-gray-900/80 hover:border-gray-700/50 transition-all duration-200"
              >
                <div className="flex items-start justify-between mb-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${mod.color}15`, color: mod.color }}
                  >
                    {mod.icon}
                  </div>
                  {modStats && modStats.count > 0 ? (
                    <span
                      className="text-[10px] px-2 py-0.5 rounded-full border"
                      style={{
                        backgroundColor: `${mod.color}15`,
                        borderColor: `${mod.color}30`,
                        color: mod.color,
                      }}
                    >
                      {modStats.count} analize
                    </span>
                  ) : (
                    <span
                      className="text-[10px] px-2 py-0.5 rounded-full border"
                      style={{
                        backgroundColor: `${mod.color}15`,
                        borderColor: `${mod.color}30`,
                        color: mod.color,
                      }}
                    >
                      Activ
                    </span>
                  )}
                </div>
                <h3 className="text-sm font-semibold text-white mb-1 group-hover:text-gray-100">
                  {mod.label}
                </h3>
                <p className="text-xs text-gray-500 leading-relaxed mb-2">
                  {mod.description}
                </p>
                {modStats && modStats.metric && (
                  <div className="flex items-center justify-between text-[11px]">
                    <span style={{ color: mod.color }}>{modStats.metric}</span>
                    {modStats.lastTimestamp && (
                      <span className="text-gray-600">{formatTimeAgo(modStats.lastTimestamp)}</span>
                    )}
                  </div>
                )}
              </Link>
            );
          })}
        </div>

        {/* Recent Activity */}
        {activity.length > 0 && (
          <div>
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Activitate Recentă
            </h2>
            <div className="bg-gray-900/50 border border-gray-800/50 rounded-xl divide-y divide-gray-800/30">
              {activity.map((item, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-2.5">
                  <div
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-[11px] text-gray-500 w-24 flex-shrink-0">
                    {item.moduleLabel}
                  </span>
                  <span className="text-sm text-gray-300 truncate flex-1">
                    {item.label}
                  </span>
                  {item.timestamp && (
                    <span className="text-[10px] text-gray-600 flex-shrink-0">
                      {formatTimeAgo(item.timestamp)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
