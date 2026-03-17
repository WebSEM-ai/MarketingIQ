"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { ModuleId, KeywordsPrefill, TrendsPrefill, AEOPrefill, CompetitorsPrefill, ContentPrefill, ShoppingPrefill } from "@/lib/synergy/types";
import { MODULE_LABELS, MODULE_COLORS } from "@/lib/synergy/types";
import { sendToModule } from "@/lib/synergy/actions";

interface SynergyTarget {
  target: ModuleId;
  data: KeywordsPrefill | TrendsPrefill | AEOPrefill | CompetitorsPrefill | ContentPrefill | ShoppingPrefill;
  label: string;
  actionLabel?: string;
}

interface SynergyMenuProps {
  source: ModuleId;
  targets: SynergyTarget[];
  className?: string;
}

export default function SynergyMenu({ source, targets, className = "" }: SynergyMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  if (targets.length === 0) return null;

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setOpen(!open);
        }}
        className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-gray-800/50 hover:bg-gray-700/50 text-gray-400 hover:text-white transition-all"
        title="Trimite către alt modul"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M7 17L17 7" />
          <path d="M7 7h10v10" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 z-50 bg-gray-900 border border-gray-700/50 rounded-lg shadow-xl py-1 min-w-[180px]">
          <div className="px-3 py-1.5 text-[10px] text-gray-500 uppercase tracking-wider">
            Trimite către
          </div>
          {targets.map((t, i) => {
            const color = MODULE_COLORS[t.target];
            return (
              <button
                key={i}
                onClick={(e) => {
                  e.stopPropagation();
                  const route = sendToModule(source, t.target, t.data, t.label);
                  setOpen(false);
                  router.push(route);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-300 hover:bg-gray-800/50 transition-colors"
              >
                <div
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: color }}
                />
                <span className="flex-1 text-left">
                  {t.actionLabel || MODULE_LABELS[t.target]}
                </span>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-600">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
