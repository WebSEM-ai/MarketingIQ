"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { generateAlerts, generateDemoAlerts } from "@/lib/alerts/engine";
import type { Alert, AlertSeverity } from "@/lib/alerts/engine";

/* ── Module label + color map ── */
const MODULE_META: Record<string, { label: string; color: string }> = {
  "aeo": { label: "AEO", color: "#06b6d4" },
  "rank-tracking": { label: "Rank", color: "#10b981" },
  "keywords": { label: "Keywords", color: "#a855f7" },
  "trends": { label: "Trends", color: "#22c55e" },
  "competitors": { label: "Competitori", color: "#f59e0b" },
  "content": { label: "Conținut", color: "#f43f5e" },
  "shopping": { label: "Shopping", color: "#f97316" },
  "youtube": { label: "YouTube", color: "#ef4444" },
  "compliance": { label: "Compliance", color: "#14b8a6" },
  "news": { label: "News", color: "#6366f1" },
  "meta-ads": { label: "Meta Ads", color: "#3b82f6" },
  "google-ads": { label: "Google Ads", color: "#eab308" },
};

const SEVERITY_CONFIG: Record<AlertSeverity, { icon: JSX.Element; bg: string; border: string; badge: string; badgeText: string; glow: string }> = {
  risk: {
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
    bg: "bg-red-950/40",
    border: "border-red-500/30",
    badge: "bg-red-500/20",
    badgeText: "text-red-400",
    glow: "shadow-red-500/10",
  },
  opportunity: {
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    ),
    bg: "bg-amber-950/30",
    border: "border-amber-500/30",
    badge: "bg-amber-500/20",
    badgeText: "text-amber-400",
    glow: "shadow-amber-500/10",
  },
  optimization: {
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 20V10" />
        <path d="M18 20V4" />
        <path d="M6 20v-4" />
      </svg>
    ),
    bg: "bg-emerald-950/30",
    border: "border-emerald-500/30",
    badge: "bg-emerald-500/20",
    badgeText: "text-emerald-400",
    glow: "shadow-emerald-500/10",
  },
};

const SEVERITY_LABEL: Record<AlertSeverity, string> = {
  risk: "RISC",
  opportunity: "OPORTUNITATE",
  optimization: "OPTIMIZARE",
};

export default function AlertBar() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [expanded, setExpanded] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Load dismissed alerts from localStorage
    try {
      const d = JSON.parse(localStorage.getItem("miq:dismissed-alerts") || "[]");
      setDismissed(new Set(d));
    } catch { /* */ }

    // Generate alerts
    let generated = generateAlerts();
    if (generated.length === 0) {
      generated = generateDemoAlerts();
    }
    setAlerts(generated);
  }, []);

  // Auto-rotate alerts
  useEffect(() => {
    if (isPaused || expanded || visibleAlerts.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % visibleAlerts.length);
    }, 6000);
    return () => clearInterval(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPaused, expanded, alerts, dismissed]);

  const visibleAlerts = alerts.filter((a) => !dismissed.has(a.id));

  const handleDismiss = useCallback((id: string) => {
    setDismissed((prev) => {
      const next = new Set(prev);
      next.add(id);
      try {
        localStorage.setItem("miq:dismissed-alerts", JSON.stringify(Array.from(next)));
      } catch { /* */ }
      return next;
    });
  }, []);

  const handleAction = useCallback((alert: Alert) => {
    if (alert.actionRoute) {
      router.push(alert.actionRoute);
    }
  }, [router]);

  if (visibleAlerts.length === 0) return null;

  const safeIndex = currentIndex % visibleAlerts.length;
  const current = visibleAlerts[safeIndex];
  const config = SEVERITY_CONFIG[current.severity];

  return (
    <div
      className="flex-shrink-0"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Main alert strip */}
      <div
        className={`relative ${config.bg} border-b ${config.border} transition-all duration-300`}
      >
        <div className="flex items-center gap-3 px-4 h-10">
          {/* Severity badge */}
          <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md ${config.badge} flex-shrink-0`}>
            <span className={config.badgeText}>{config.icon}</span>
            <span className={`text-[10px] font-bold tracking-wider ${config.badgeText}`}>
              {SEVERITY_LABEL[current.severity]}
            </span>
          </div>

          {/* Alert title */}
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex-1 min-w-0 flex items-center gap-2 text-left"
          >
            <span className="text-xs font-semibold text-white truncate">
              {current.title}
            </span>
            <span className="text-[11px] text-gray-400 truncate hidden sm:inline">
              — {current.description.slice(0, 80)}{current.description.length > 80 ? "..." : ""}
            </span>
          </button>

          {/* Module tags */}
          <div className="hidden md:flex items-center gap-1 flex-shrink-0">
            {current.modules.slice(0, 3).map((mod) => {
              const meta = MODULE_META[mod];
              if (!meta) return null;
              return (
                <span
                  key={mod}
                  className="text-[9px] font-medium px-1.5 py-0.5 rounded"
                  style={{
                    backgroundColor: `${meta.color}15`,
                    color: meta.color,
                  }}
                >
                  {meta.label}
                </span>
              );
            })}
          </div>

          {/* Navigation dots */}
          {visibleAlerts.length > 1 && (
            <div className="flex items-center gap-1 flex-shrink-0">
              {visibleAlerts.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentIndex(i)}
                  className={`w-1.5 h-1.5 rounded-full transition-all ${
                    i === safeIndex
                      ? "bg-white scale-110"
                      : "bg-gray-600 hover:bg-gray-500"
                  }`}
                />
              ))}
            </div>
          )}

          {/* Nav arrows */}
          {visibleAlerts.length > 1 && (
            <div className="flex items-center gap-0.5 flex-shrink-0">
              <button
                onClick={() => setCurrentIndex((safeIndex - 1 + visibleAlerts.length) % visibleAlerts.length)}
                className="p-1 text-gray-500 hover:text-gray-300 transition-colors"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>
              <button
                onClick={() => setCurrentIndex((safeIndex + 1) % visibleAlerts.length)}
                className="p-1 text-gray-500 hover:text-gray-300 transition-colors"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            </div>
          )}

          {/* Expand toggle */}
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1 text-gray-500 hover:text-gray-300 transition-colors flex-shrink-0"
          >
            <svg
              width="12" height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              className={`transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>

          {/* Dismiss */}
          <button
            onClick={() => handleDismiss(current.id)}
            className="p-1 text-gray-600 hover:text-gray-400 transition-colors flex-shrink-0"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Expanded detail panel */}
        {expanded && (
          <div className={`px-4 pb-3 pt-1 border-t ${config.border} animate-in slide-in-from-top-1 duration-200`}>
            <p className="text-[11px] text-gray-300 mb-2 leading-relaxed">
              {current.description}
            </p>
            <div className="flex items-center gap-3">
              {/* Module tags (visible on mobile when expanded) */}
              <div className="flex items-center gap-1 md:hidden">
                {current.modules.map((mod) => {
                  const meta = MODULE_META[mod];
                  if (!meta) return null;
                  return (
                    <span
                      key={mod}
                      className="text-[9px] font-medium px-1.5 py-0.5 rounded"
                      style={{
                        backgroundColor: `${meta.color}15`,
                        color: meta.color,
                      }}
                    >
                      {meta.label}
                    </span>
                  );
                })}
              </div>
              {current.action && current.actionRoute && (
                <button
                  onClick={() => handleAction(current)}
                  className={`ml-auto text-[11px] font-medium px-3 py-1 rounded-md ${config.badge} ${config.badgeText} hover:opacity-80 transition-opacity`}
                >
                  {current.action} &rarr;
                </button>
              )}
            </div>
          </div>
        )}

        {/* Auto-rotate progress bar */}
        {visibleAlerts.length > 1 && !isPaused && !expanded && (
          <div className="absolute bottom-0 left-0 h-[2px] bg-white/10 w-full overflow-hidden">
            <div
              className="h-full bg-white/30 animate-alert-progress"
              style={{ animationDuration: "6s" }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
