"use client";

import type { SynergyPayload } from "@/lib/synergy/types";
import { MODULE_LABELS, MODULE_COLORS } from "@/lib/synergy/types";

interface SynergyBannerProps {
  payload: SynergyPayload;
  onApply: () => void;
  onDismiss: () => void;
}

export default function SynergyBanner({ payload, onApply, onDismiss }: SynergyBannerProps) {
  const sourceLabel = MODULE_LABELS[payload.source];
  const sourceColor = MODULE_COLORS[payload.source];

  return (
    <div
      className="flex items-center gap-3 px-4 py-2.5 rounded-xl border"
      style={{
        backgroundColor: `${sourceColor}08`,
        borderColor: `${sourceColor}25`,
      }}
    >
      {/* Synergy icon */}
      <div
        className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: `${sourceColor}15` }}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={sourceColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M7 17L17 7" />
          <path d="M7 7h10v10" />
        </svg>
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-300">
          Date primite de la{" "}
          <span className="font-semibold" style={{ color: sourceColor }}>
            {sourceLabel}
          </span>
          :{" "}
          <span className="text-white font-medium">&ldquo;{payload.label}&rdquo;</span>
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={onApply}
          className="text-xs font-semibold px-3 py-1 rounded-lg transition-colors"
          style={{
            backgroundColor: `${sourceColor}20`,
            color: sourceColor,
          }}
        >
          Aplică
        </button>
        <button
          onClick={onDismiss}
          className="text-gray-500 hover:text-gray-300 transition-colors p-1"
          title="Ignoră"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
    </div>
  );
}
