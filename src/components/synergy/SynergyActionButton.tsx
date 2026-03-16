"use client";

import { useRouter } from "next/navigation";
import type { ModuleId, KeywordsPrefill, TrendsPrefill, AEOPrefill, CompetitorsPrefill, ContentPrefill } from "@/lib/synergy/types";
import { MODULE_COLORS } from "@/lib/synergy/types";
import { sendToModule } from "@/lib/synergy/actions";

interface SynergyActionButtonProps {
  source: ModuleId;
  target: ModuleId;
  data: KeywordsPrefill | TrendsPrefill | AEOPrefill | CompetitorsPrefill | ContentPrefill;
  label: string;
  icon: "trends" | "keywords" | "aeo" | "competitors" | "content";
  title?: string;
  className?: string;
}

const ICONS: Record<string, React.ReactNode> = {
  trends: (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  ),
  keywords: (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <path d="M21 21l-4.35-4.35" />
    </svg>
  ),
  aeo: (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  ),
  competitors: (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
    </svg>
  ),
  content: (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  ),
};

export default function SynergyActionButton({
  source,
  target,
  data,
  label,
  icon,
  title,
  className = "",
}: SynergyActionButtonProps) {
  const router = useRouter();
  const color = MODULE_COLORS[target];

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const route = sendToModule(source, target, data, label);
    router.push(route);
  };

  return (
    <button
      onClick={handleClick}
      title={title}
      className={`inline-flex items-center justify-center w-6 h-6 rounded-md transition-all opacity-60 hover:opacity-100 ${className}`}
      style={{ color, backgroundColor: `${color}15` }}
    >
      {ICONS[icon]}
    </button>
  );
}
