"use client";

import type { PlatformResult, AEOPlatform } from "@/lib/types/aeo";

interface PlatformOverviewProps {
  platforms: PlatformResult[];
}

const PLATFORM_CONFIG: Record<AEOPlatform, { label: string; color: string }> = {
  perplexity: { label: "Perplexity", color: "#20808D" },
  chatgpt: { label: "ChatGPT", color: "#10a37f" },
  claude: { label: "Claude", color: "#d97706" },
  gemini: { label: "Gemini", color: "#8b5cf6" },
  grok: { label: "Grok", color: "#ef4444" },
};

function QualityGauge({ value, color }: { value: number; color: string }) {
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <svg width="64" height="64" viewBox="0 0 72 72" className="flex-shrink-0">
      <circle
        cx="36"
        cy="36"
        r={radius}
        fill="none"
        stroke="#1f2937"
        strokeWidth="5"
      />
      <circle
        cx="36"
        cy="36"
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth="5"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform="rotate(-90 36 36)"
        className="transition-all duration-700"
      />
      <text
        x="36"
        y="36"
        textAnchor="middle"
        dominantBaseline="central"
        className="fill-white text-sm font-bold"
        fontSize="14"
      >
        {value}
      </text>
    </svg>
  );
}

export default function PlatformOverview({ platforms }: PlatformOverviewProps) {
  if (!platforms.length) return null;

  return (
    <div>
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
        Rezultate pe Platforme
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
        {platforms.map((result) => {
          const config = PLATFORM_CONFIG[result.platform];
          const isVisible = result.visibility === "visible";
          const hasUrl = result.targetUrlFound;

          return (
            <div
              key={result.platform}
              className="bg-gray-900/50 rounded-xl p-4 transition-all"
              style={{
                borderWidth: "1px",
                borderStyle: "solid",
                borderColor: hasUrl ? `${config.color}60` : "rgba(31,41,55,0.5)",
              }}
            >
              {/* Platform name */}
              <div className="flex items-center gap-2 mb-3">
                <div
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: config.color }}
                />
                <span className="text-sm font-semibold text-white">
                  {config.label}
                </span>
              </div>

              {/* Quality gauge */}
              <div className="flex justify-center mb-3">
                <QualityGauge value={result.responseQuality} color={config.color} />
              </div>

              {/* Visibility badge */}
              <div className="flex items-center justify-center mb-2">
                <span
                  className="text-[10px] px-2 py-0.5 rounded-full border font-medium"
                  style={
                    isVisible
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
                  {isVisible ? "Vizibil" : "Invizibil"}
                </span>
              </div>

              {/* Position */}
              {result.position !== null && (
                <div className="text-center mb-2">
                  <span className="text-xs text-gray-500">Poziție: </span>
                  <span className="text-xs font-semibold text-white">
                    #{result.position}
                  </span>
                </div>
              )}

              {/* Target URL found */}
              <div className="flex items-center justify-center gap-1">
                {hasUrl ? (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                )}
                <span className={`text-[10px] ${hasUrl ? "text-green-400" : "text-gray-500"}`}>
                  URL {hasUrl ? "găsit" : "negăsit"}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
