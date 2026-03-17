"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MODULE_COLORS } from "@/lib/synergy/types";
import type { ModuleId } from "@/lib/synergy/types";
import { sendToModule } from "@/lib/synergy/actions";

/* ── Module registry ── */
const modules = [
  {
    href: "/dashboard/prompt-iq",
    id: "prompt-iq" as const,
    label: "PromptIQ",
    description: "Analizează și optimizează prompturi AI cu scoruri detaliate.",
    color: "#3b82f6",
    icon: (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" /></svg>),
    storageKey: null,
    status: "activ",
  },
  {
    href: "/dashboard/aeo", id: "aeo" as ModuleId, label: "AEO Tracker",
    description: "Vizibilitate pe motoarele AI.", color: "#06b6d4",
    icon: (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /></svg>),
    storageKey: "miq:aeo-history", status: "activ",
  },
  {
    href: "/dashboard/competitors", id: "competitors" as ModuleId, label: "Competitori",
    description: "Scanează site-uri și detectează schimbări.", color: "#f59e0b",
    icon: (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" /></svg>),
    storageKey: "miq:competitors-analyses", status: "activ",
  },
  {
    href: "/dashboard/trends", id: "trends" as ModuleId, label: "Tendințe",
    description: "Tendințe de căutare și topicuri în creștere.", color: "#22c55e",
    icon: (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>),
    storageKey: "miq:trends-history", status: "activ",
  },
  {
    href: "/dashboard/keywords", id: "keywords" as ModuleId, label: "Cuvinte Cheie",
    description: "Cercetare keywords cu sugestii și clustere.", color: "#a855f7",
    icon: (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></svg>),
    storageKey: "miq:keywords-history", status: "activ",
  },
  {
    href: "/dashboard/content", id: "content" as ModuleId, label: "Conținut",
    description: "Calendare, clustere tematice și gap analysis.", color: "#f43f5e",
    icon: (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>),
    storageKey: "miq:content-history", status: "activ",
  },
  {
    href: "/dashboard/shopping", id: "shopping" as ModuleId, label: "Google Shopping",
    description: "Produse, prețuri și analiză piață.", color: "#f97316",
    icon: (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 01-8 0" /></svg>),
    storageKey: "miq:shopping-history", status: "activ",
  },
  {
    href: "/dashboard/youtube", id: "youtube" as ModuleId, label: "YouTube",
    description: "Videoclipuri, canale și Shorts.", color: "#ef4444",
    icon: (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22.54 6.42a2.78 2.78 0 00-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 00-1.94 2A29 29 0 001 11.75a29 29 0 00.46 5.33A2.78 2.78 0 003.4 19.13C5.12 19.56 12 19.56 12 19.56s6.88 0 8.6-.46a2.78 2.78 0 001.94-2 29 29 0 00.46-5.25 29 29 0 00-.46-5.43z" /><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" /></svg>),
    storageKey: "miq:youtube-history", status: "activ",
  },
  {
    href: "/dashboard/rank-tracking", id: "rank-tracking" as ModuleId, label: "Rank Tracking",
    description: "Poziții Google, SERP și analiză SEO.", color: "#10b981",
    icon: (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg>),
    storageKey: "miq:rank-history", status: "activ",
  },
  {
    href: "/dashboard/meta-ads", id: "meta-ads" as const, label: "Meta Ads",
    description: "Campanii Facebook & Instagram cu analiză AI.", color: "#3b82f6",
    icon: (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" /></svg>),
    storageKey: "miq:meta-ads-history", status: "activ",
  },
  {
    href: "/dashboard/google-ads", id: "google-ads" as const, label: "Google Ads",
    description: "Campanii, keywords și metrici cu analiză AI.", color: "#eab308",
    icon: (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2" /><polyline points="2 17 12 22 22 17" /><polyline points="2 12 12 17 22 12" /></svg>),
    storageKey: "miq:google-ads-history", status: "activ",
  },
];

/* ── Types ── */
interface ModuleStats { count: number; lastTimestamp?: string; metric?: string; }
interface ActivityItem { moduleId: string; moduleLabel: string; color: string; label: string; timestamp: string; }
interface SynergySuggestion { text: string; source: ModuleId; target: ModuleId; data: Record<string, unknown>; label: string; }
interface HealthPillar { label: string; score: number; color: string; detail: string; href: string; }

/* ── Helpers ── */
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

function getScoreColor(score: number): string {
  if (score >= 80) return "#10b981";
  if (score >= 60) return "#22c55e";
  if (score >= 40) return "#f59e0b";
  if (score >= 20) return "#f97316";
  return "#ef4444";
}

function getScoreLabel(score: number): string {
  if (score >= 80) return "Excelent";
  if (score >= 60) return "Bun";
  if (score >= 40) return "Mediu";
  if (score >= 20) return "Slab";
  return "Critic";
}

/* ── SVG arc for score gauge ── */
function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`;
}
function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Record<string, ModuleStats>>({});
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [suggestions, setSuggestions] = useState<SynergySuggestion[]>([]);
  const [healthScore, setHealthScore] = useState(0);
  const [pillars, setPillars] = useState<HealthPillar[]>([]);
  const [totalAnalyses, setTotalAnalyses] = useState(0);
  const [activeModules, setActiveModules] = useState(0);
  const router = useRouter();

  useEffect(() => {
    const newStats: Record<string, ModuleStats> = {};
    const allActivity: ActivityItem[] = [];
    const analyzedModules: Record<string, string[]> = {};
    const newPillars: HealthPillar[] = [];
    let total = 0;
    let modulesUsed = 0;

    /* ── AEO ── */
    let aeoScore = 0;
    try {
      const aeo = JSON.parse(localStorage.getItem("miq:aeo-history") || "[]");
      newStats["aeo"] = { count: aeo.length, lastTimestamp: aeo[0]?.timestamp, metric: aeo[0] ? `${aeo[0].avgVisibility}% viz` : undefined };
      aeo.slice(0, 5).forEach((e: { prompt: string; timestamp: string }) => {
        allActivity.push({ moduleId: "aeo", moduleLabel: "AEO", color: "#06b6d4", label: e.prompt, timestamp: e.timestamp });
      });
      if (aeo.length > 0) {
        analyzedModules["aeo"] = aeo.map((e: { prompt: string }) => e.prompt);
        modulesUsed++;
        total += aeo.length;
        const avgViz = aeo.reduce((sum: number, e: { avgVisibility: number }) => sum + (e.avgVisibility || 0), 0) / aeo.length;
        aeoScore = Math.round(avgViz);
      }
    } catch { /* */ }
    newPillars.push({ label: "Vizibilitate AI", score: aeoScore, color: "#06b6d4", detail: aeoScore > 0 ? `${aeoScore}% medie pe platforme AI` : "Neanalizat", href: "/dashboard/aeo" });

    /* ── Rank Tracking ── */
    let rankScore = 0;
    try {
      const rank = JSON.parse(localStorage.getItem("miq:rank-history") || "[]");
      newStats["rank-tracking"] = { count: rank.length, lastTimestamp: rank[0]?.timestamp, metric: rank[0] ? `${rank[0].top10Count}/${rank[0].keywordCount} Top 10` : undefined };
      rank.slice(0, 5).forEach((e: { domain: string; timestamp: string }) => {
        allActivity.push({ moduleId: "rank-tracking", moduleLabel: "Rank", color: "#10b981", label: e.domain, timestamp: e.timestamp });
      });
      if (rank.length > 0) {
        modulesUsed++;
        total += rank.length;
        const latest = rank[0];
        const ratio = latest.keywordCount > 0 ? (latest.top10Count / latest.keywordCount) : 0;
        rankScore = Math.round(ratio * 100);
      }
    } catch { /* */ }
    newPillars.push({ label: "Poziții Google", score: rankScore, color: "#10b981", detail: rankScore > 0 ? `${rankScore}% keywords în Top 10` : "Neanalizat", href: "/dashboard/rank-tracking" });

    /* ── Keywords ── */
    let kwScore = 0;
    try {
      const kw = JSON.parse(localStorage.getItem("miq:keywords-history") || "[]");
      newStats["keywords"] = { count: kw.length, lastTimestamp: kw[0]?.timestamp, metric: kw[0] ? `${kw[0].suggestionCount} sugestii` : undefined };
      kw.slice(0, 5).forEach((e: { seed: string; timestamp: string }) => {
        allActivity.push({ moduleId: "keywords", moduleLabel: "Keywords", color: "#a855f7", label: e.seed, timestamp: e.timestamp });
      });
      if (kw.length > 0) {
        analyzedModules["keywords"] = kw.map((e: { seed: string }) => e.seed);
        modulesUsed++;
        total += kw.length;
        const avgSugg = kw.reduce((s: number, e: { suggestionCount: number }) => s + (e.suggestionCount || 0), 0) / kw.length;
        const avgCluster = kw.reduce((s: number, e: { clusterCount: number }) => s + (e.clusterCount || 0), 0) / kw.length;
        kwScore = Math.min(100, Math.round((avgSugg / 30) * 60 + (avgCluster / 4) * 40));
      }
    } catch { /* */ }
    newPillars.push({ label: "Cercetare Keywords", score: kwScore, color: "#a855f7", detail: kwScore > 0 ? `${newStats["keywords"]?.metric || ""}` : "Neanalizat", href: "/dashboard/keywords" });

    /* ── Competitors ── */
    let compScore = 0;
    try {
      const comp = JSON.parse(localStorage.getItem("miq:competitors-analyses") || "[]");
      newStats["competitors"] = { count: comp.length, lastTimestamp: comp[0]?.scan?.scannedAt, metric: comp.length > 0 ? `${comp.length} competitori` : undefined };
      comp.slice(0, 5).forEach((e: { competitor: { name: string }; scan: { scannedAt: string } }) => {
        allActivity.push({ moduleId: "competitors", moduleLabel: "Competitori", color: "#f59e0b", label: e.competitor.name, timestamp: e.scan?.scannedAt || "" });
      });
      if (comp.length > 0) {
        modulesUsed++;
        total += comp.length;
        const avgSeo = comp.reduce((s: number, e: { seo?: { score?: number } }) => s + (e.seo?.score || 0), 0) / comp.length;
        compScore = Math.round(avgSeo > 0 ? Math.min(100, avgSeo) : Math.min(100, comp.length * 25));
      }
    } catch { /* */ }
    newPillars.push({ label: "Intel Competitiv", score: compScore, color: "#f59e0b", detail: compScore > 0 ? `${newStats["competitors"]?.count || 0} competitori monitorizați` : "Neanalizat", href: "/dashboard/competitors" });

    /* ── Content ── */
    let contentScore = 0;
    try {
      const content = JSON.parse(localStorage.getItem("miq:content-history") || "[]");
      newStats["content"] = { count: content.length, lastTimestamp: content[0]?.timestamp, metric: content[0] ? `${content[0].calendarCount} articole` : undefined };
      content.slice(0, 5).forEach((e: { label: string; timestamp: string }) => {
        allActivity.push({ moduleId: "content", moduleLabel: "Conținut", color: "#f43f5e", label: e.label, timestamp: e.timestamp });
      });
      if (content.length > 0) {
        modulesUsed++;
        total += content.length;
        const avgCal = content.reduce((s: number, e: { calendarCount: number }) => s + (e.calendarCount || 0), 0) / content.length;
        contentScore = Math.min(100, Math.round(avgCal * 5));
      }
    } catch { /* */ }
    newPillars.push({ label: "Strategie Conținut", score: contentScore, color: "#f43f5e", detail: contentScore > 0 ? `${newStats["content"]?.metric || ""}` : "Neanalizat", href: "/dashboard/content" });

    /* ── Trends ── */
    try {
      const trends = JSON.parse(localStorage.getItem("miq:trends-history") || "[]");
      newStats["trends"] = { count: trends.length, lastTimestamp: trends[0]?.timestamp, metric: trends.length > 0 ? `${trends.length} analize` : undefined };
      trends.slice(0, 5).forEach((e: { query: string; timestamp: string }) => {
        allActivity.push({ moduleId: "trends", moduleLabel: "Tendințe", color: "#22c55e", label: e.query, timestamp: e.timestamp });
      });
      if (trends.length > 0) {
        analyzedModules["trends"] = trends.map((e: { query: string }) => e.query);
        modulesUsed++;
        total += trends.length;
      }
    } catch { /* */ }

    /* ── Shopping ── */
    try {
      const shop = JSON.parse(localStorage.getItem("miq:shopping-history") || "[]");
      newStats["shopping"] = { count: shop.length, lastTimestamp: shop[0]?.timestamp, metric: shop[0] ? `${shop[0].productCount} produse` : undefined };
      shop.slice(0, 5).forEach((e: { query: string; timestamp: string }) => {
        allActivity.push({ moduleId: "shopping", moduleLabel: "Shopping", color: "#f97316", label: e.query, timestamp: e.timestamp });
      });
      if (shop.length > 0) { analyzedModules["shopping"] = shop.map((e: { query: string }) => e.query); modulesUsed++; total += shop.length; }
    } catch { /* */ }

    /* ── YouTube ── */
    try {
      const yt = JSON.parse(localStorage.getItem("miq:youtube-history") || "[]");
      newStats["youtube"] = { count: yt.length, lastTimestamp: yt[0]?.timestamp, metric: yt[0] ? `${yt[0].videoCount} video` : undefined };
      yt.slice(0, 5).forEach((e: { query: string; timestamp: string }) => {
        allActivity.push({ moduleId: "youtube", moduleLabel: "YouTube", color: "#ef4444", label: e.query, timestamp: e.timestamp });
      });
      if (yt.length > 0) { analyzedModules["youtube"] = yt.map((e: { query: string }) => e.query); modulesUsed++; total += yt.length; }
    } catch { /* */ }

    /* ── Meta Ads ── */
    try {
      const meta = JSON.parse(localStorage.getItem("miq:meta-ads-history") || "[]");
      newStats["meta-ads"] = { count: meta.length, lastTimestamp: meta[0]?.timestamp, metric: meta[0] ? `${meta[0].activeCount} active` : undefined };
      meta.slice(0, 3).forEach((e: { accountId: string; timestamp: string }) => {
        allActivity.push({ moduleId: "meta-ads", moduleLabel: "Meta Ads", color: "#3b82f6", label: e.accountId, timestamp: e.timestamp });
      });
      if (meta.length > 0) { modulesUsed++; total += meta.length; }
    } catch { /* */ }

    /* ── Google Ads ── */
    try {
      const gads = JSON.parse(localStorage.getItem("miq:google-ads-history") || "[]");
      newStats["google-ads"] = { count: gads.length, lastTimestamp: gads[0]?.timestamp, metric: gads[0] ? `${gads[0].totalClicks} clicks` : undefined };
      gads.slice(0, 3).forEach((e: { customerId: string; timestamp: string }) => {
        allActivity.push({ moduleId: "google-ads", moduleLabel: "Google Ads", color: "#eab308", label: e.customerId, timestamp: e.timestamp });
      });
      if (gads.length > 0) { modulesUsed++; total += gads.length; }
    } catch { /* */ }

    /* ── Compute overall health score ── */
    const pillarScores = newPillars.map((p) => p.score);
    const activePillars = pillarScores.filter((s) => s > 0);
    const avgPillarScore = activePillars.length > 0 ? activePillars.reduce((a, b) => a + b, 0) / activePillars.length : 0;
    const coverageBonus = Math.min(20, (modulesUsed / 11) * 20);
    const overall = Math.round(Math.min(100, avgPillarScore * 0.8 + coverageBonus));

    setStats(newStats);
    setPillars(newPillars);
    setHealthScore(overall);
    setTotalAnalyses(total);
    setActiveModules(modulesUsed);

    allActivity.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    setActivity(allActivity.slice(0, 8));

    /* ── Synergy suggestions ── */
    const newSuggestions: SynergySuggestion[] = [];
    if (analyzedModules["keywords"] && !analyzedModules["trends"]) {
      const kw = analyzedModules["keywords"][0];
      newSuggestions.push({ text: `Ai cercetat "${kw}" — verifică trendul?`, source: "keywords", target: "trends", data: { query: kw }, label: kw });
    }
    if (analyzedModules["trends"] && !analyzedModules["keywords"]) {
      const q = analyzedModules["trends"][0];
      newSuggestions.push({ text: `Ai analizat trendul "${q}" — cercetează keywords?`, source: "trends", target: "keywords", data: { seed: q }, label: q });
    }
    if (analyzedModules["keywords"] && !analyzedModules["aeo"]) {
      const kw = analyzedModules["keywords"][0];
      newSuggestions.push({ text: `Verifică vizibilitatea AEO pentru "${kw}"?`, source: "keywords", target: "aeo", data: { prompt: kw }, label: kw });
    }
    if (analyzedModules["keywords"] && analyzedModules["trends"]) {
      const overlap = analyzedModules["keywords"].find(k => analyzedModules["trends"]?.some(t => t.toLowerCase().includes(k.toLowerCase()) || k.toLowerCase().includes(t.toLowerCase())));
      if (overlap) newSuggestions.push({ text: `"${overlap}" apare în Keywords și Trends — strategie conținut?`, source: "keywords", target: "content", data: { keywords: [overlap] }, label: overlap });
    }
    setSuggestions(newSuggestions.slice(0, 3));
  }, []);

  const handleSuggestionClick = (s: SynergySuggestion) => {
    const route = sendToModule(s.source, s.target, s.data as never, s.label);
    router.push(route);
  };

  const scoreColor = getScoreColor(healthScore);
  const scoreArc = describeArc(60, 60, 50, 0, Math.max(1, (healthScore / 100) * 360 - 0.1));

  return (
    <div className="h-full panel-scroll p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white mb-1">
            Marketing<span className="text-blue-400">IQ</span> Dashboard
          </h1>
          <p className="text-sm text-gray-500">
            Health Score agregat din toate modulele — o privire de ansamblu asupra prezenței tale digitale.
          </p>
        </div>

        {/* ── HEALTH SCORE HERO ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          {/* Main Score */}
          <div className="bg-gray-900/50 border border-gray-800/50 rounded-2xl p-6 flex items-center gap-6">
            <div className="flex-shrink-0 relative">
              <svg width="120" height="120" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="50" fill="none" stroke="#1f2937" strokeWidth="8" />
                <path d={scoreArc} fill="none" stroke={scoreColor} strokeWidth="8" strokeLinecap="round" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold" style={{ color: scoreColor }}>{healthScore}</span>
                <span className="text-[10px] text-gray-500">/ 100</span>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-sm font-semibold text-white mb-1">Marketing Health Score</h2>
              <p className="text-xs mb-3" style={{ color: scoreColor }}>{getScoreLabel(healthScore)}</p>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <p className="text-lg font-bold text-white">{totalAnalyses}</p>
                  <p className="text-[10px] text-gray-500">Analize total</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-white">{activeModules}<span className="text-gray-600 text-sm">/11</span></p>
                  <p className="text-[10px] text-gray-500">Module active</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-white">{pillars.filter(p => p.score > 0).length}<span className="text-gray-600 text-sm">/5</span></p>
                  <p className="text-[10px] text-gray-500">Piloni acoperiți</p>
                </div>
              </div>
            </div>
          </div>

          {/* Pillars */}
          <div className="lg:col-span-2 bg-gray-900/50 border border-gray-800/50 rounded-2xl p-5">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Piloni Marketing Health</h3>
            <div className="space-y-3">
              {pillars.map((p) => (
                <Link key={p.label} href={p.href} className="flex items-center gap-3 group">
                  <span className="text-xs text-gray-400 w-32 flex-shrink-0 group-hover:text-white transition-colors truncate">{p.label}</span>
                  <div className="flex-1 h-5 bg-gray-800/50 rounded-full overflow-hidden relative">
                    <div
                      className="h-full rounded-full transition-all duration-700 ease-out"
                      style={{
                        width: `${Math.max(2, p.score)}%`,
                        background: `linear-gradient(90deg, ${p.color}80, ${p.color})`,
                      }}
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-400">
                      {p.detail}
                    </span>
                  </div>
                  <span className="text-sm font-bold w-8 text-right" style={{ color: p.score > 0 ? p.color : "#4b5563" }}>
                    {p.score}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* ── SYNERGY + QUICK ACTIONS ── */}
        {suggestions.length > 0 && (
          <div className="mb-6">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Recomandări de Acțiune
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  onClick={() => handleSuggestionClick(s)}
                  className="text-left flex items-center gap-3 bg-gray-900/50 hover:bg-gray-800/70 border border-gray-800/50 hover:border-blue-500/30 rounded-xl px-4 py-3 transition-all"
                >
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${MODULE_COLORS[s.target]}15` }}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={MODULE_COLORS[s.target]} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M7 17L17 7" /><path d="M7 7h10v10" />
                    </svg>
                  </div>
                  <span className="text-xs text-gray-300 flex-1">{s.text}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── MODULE GRID ── */}
        <div className="mb-6">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Module</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {modules.map((mod) => {
              const modStats = stats[mod.id] || null;
              return (
                <Link
                  key={mod.href}
                  href={mod.href}
                  className="group bg-gray-900/50 border border-gray-800/50 rounded-xl p-4 hover:bg-gray-900/80 hover:border-gray-700/50 transition-all duration-200"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `${mod.color}15`, color: mod.color }}
                    >
                      {mod.icon}
                    </div>
                    {modStats && modStats.count > 0 && (
                      <span className="text-[10px] font-medium" style={{ color: mod.color }}>
                        {modStats.count}
                      </span>
                    )}
                  </div>
                  <h3 className="text-xs font-semibold text-white mb-0.5 group-hover:text-gray-100 truncate">
                    {mod.label}
                  </h3>
                  {modStats && modStats.metric ? (
                    <p className="text-[10px] text-gray-500 truncate">{modStats.metric}</p>
                  ) : (
                    <p className="text-[10px] text-gray-600 truncate">{mod.description}</p>
                  )}
                  {modStats?.lastTimestamp && (
                    <p className="text-[9px] text-gray-700 mt-1">{formatTimeAgo(modStats.lastTimestamp)}</p>
                  )}
                </Link>
              );
            })}
          </div>
        </div>

        {/* ── ACTIVITY ── */}
        {activity.length > 0 && (
          <div>
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Activitate Recentă
            </h2>
            <div className="bg-gray-900/50 border border-gray-800/50 rounded-xl divide-y divide-gray-800/30">
              {activity.map((item, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-2.5">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="text-[11px] text-gray-500 w-20 flex-shrink-0">{item.moduleLabel}</span>
                  <span className="text-sm text-gray-300 truncate flex-1">{item.label}</span>
                  {item.timestamp && (
                    <span className="text-[10px] text-gray-600 flex-shrink-0">{formatTimeAgo(item.timestamp)}</span>
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
