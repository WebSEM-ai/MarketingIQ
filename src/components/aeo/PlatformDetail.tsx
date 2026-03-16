"use client";

import { useState } from "react";
import type { PlatformResult, AEOPlatform } from "@/lib/types/aeo";
import SynergyActionButton from "@/components/synergy/SynergyActionButton";

interface PlatformDetailProps {
  result: PlatformResult;
  targetUrl: string;
}

const PLATFORM_CONFIG: Record<AEOPlatform, { label: string; color: string }> = {
  perplexity: { label: "Perplexity", color: "#20808D" },
  chatgpt: { label: "ChatGPT", color: "#10a37f" },
  claude: { label: "Claude", color: "#d97706" },
  gemini: { label: "Gemini", color: "#8b5cf6" },
  grok: { label: "Grok", color: "#ef4444" },
};

export default function PlatformDetail({ result, targetUrl }: PlatformDetailProps) {
  const [expanded, setExpanded] = useState(false);
  const config = PLATFORM_CONFIG[result.platform];

  return (
    <div className="bg-gray-900/50 border border-gray-800/50 rounded-xl overflow-hidden">
      {/* Header - clickable */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-800/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div
            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
            style={{ backgroundColor: config.color }}
          />
          <span className="text-sm font-semibold text-white">{config.label}</span>
          <span
            className="text-[10px] px-2 py-0.5 rounded-full border font-medium"
            style={
              result.visibility === "visible"
                ? {
                    backgroundColor: `${config.color}15`,
                    borderColor: `${config.color}40`,
                    color: config.color,
                  }
                : {
                    backgroundColor: "rgba(31,41,55,0.5)",
                    borderColor: "rgba(55,65,81,0.5)",
                    color: "#6b7280",
                  }
            }
          >
            {result.visibility === "visible" ? "Vizibil" : "Invizibil"}
          </span>
          <span className="text-xs text-gray-500">
            Calitate: {result.responseQuality}/100
          </span>
        </div>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`text-gray-500 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="px-4 pb-4 border-t border-gray-800/50 pt-3 space-y-3">
          {/* AI Response */}
          {result.responseContent && (
            <div>
              <h4 className="text-xs font-medium text-gray-400 mb-1.5">
                Răspunsul AI ({result.responseLength} caractere)
              </h4>
              <div className="bg-gray-950/50 border border-gray-800/30 rounded-lg p-3 max-h-48 overflow-y-auto panel-scroll">
                <p className="text-xs text-gray-300 whitespace-pre-wrap leading-relaxed">
                  {result.responseContent}
                </p>
              </div>
            </div>
          )}

          {/* Top URLs */}
          {result.topUrls.length > 0 && (
            <div>
              <h4 className="text-xs font-medium text-gray-400 mb-1.5">
                URL-uri Citate ({result.topUrls.length})
              </h4>
              <div className="space-y-1">
                {result.topUrls.map((url, i) => {
                  const isTarget =
                    targetUrl && url.toLowerCase().includes(targetUrl.toLowerCase().replace(/^https?:\/\//, "").replace(/\/$/, ""));
                  return (
                    <div
                      key={i}
                      className={`flex items-center gap-2 px-2 py-1 rounded text-xs group/url ${
                        isTarget
                          ? "bg-green-500/10 border border-green-500/20"
                          : "bg-gray-800/30"
                      }`}
                    >
                      {isTarget && (
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                      <span
                        className={`truncate flex-1 ${isTarget ? "text-green-400" : "text-gray-400"}`}
                      >
                        {url}
                      </span>
                      {/* Synergy: analyze this URL as competitor */}
                      <SynergyActionButton
                        source="aeo"
                        target="competitors"
                        data={{ url }}
                        label={url}
                        icon="competitors"
                        title="Analizează ca competitor"
                        className="opacity-0 group-hover/url:opacity-60 hover:!opacity-100 flex-shrink-0"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Recommendation */}
          {result.recommendation && (
            <div>
              <h4 className="text-xs font-medium text-gray-400 mb-1.5">
                Recomandare
              </h4>
              <p className="text-xs text-gray-300 leading-relaxed">
                {result.recommendation}
              </p>
            </div>
          )}

          {/* Meta info */}
          <div className="flex items-center gap-4 text-[10px] text-gray-600 pt-1">
            <span>Total rezultate: {result.totalResults}</span>
            <span>
              {new Date(result.timestamp).toLocaleString("ro-RO")}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
