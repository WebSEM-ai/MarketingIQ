"use client";

import type { PlatformResult, AEOPlatform } from "@/lib/types/aeo";

interface VisibilityChartProps {
  platforms: PlatformResult[];
}

const PLATFORM_CONFIG: Record<AEOPlatform, { label: string; color: string }> = {
  perplexity: { label: "Perplexity", color: "#20808D" },
  chatgpt: { label: "ChatGPT", color: "#10a37f" },
  claude: { label: "Claude", color: "#d97706" },
  gemini: { label: "Gemini", color: "#8b5cf6" },
  grok: { label: "Grok", color: "#ef4444" },
};

export default function VisibilityChart({ platforms }: VisibilityChartProps) {
  if (!platforms.length) return null;

  const barHeight = 28;
  const gap = 8;
  const labelWidth = 90;
  const valueWidth = 40;
  const chartWidth = 600;
  const barAreaWidth = chartWidth - labelWidth - valueWidth;
  const svgHeight = platforms.length * (barHeight + gap) - gap + 20;

  return (
    <div className="bg-gray-900/50 border border-gray-800/50 rounded-xl p-4">
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
        Calitate Răspuns per Platformă
      </h3>
      <svg
        viewBox={`0 0 ${chartWidth} ${svgHeight}`}
        className="w-full"
        style={{ maxHeight: 250 }}
      >
        {platforms.map((result, i) => {
          const config = PLATFORM_CONFIG[result.platform];
          const y = i * (barHeight + gap);
          const barWidth = (result.responseQuality / 100) * barAreaWidth;

          return (
            <g key={result.platform}>
              {/* Platform label */}
              <text
                x={labelWidth - 8}
                y={y + barHeight / 2 + 1}
                textAnchor="end"
                dominantBaseline="central"
                className="fill-gray-300"
                fontSize="12"
                fontWeight="500"
              >
                {config.label}
              </text>

              {/* Background bar */}
              <rect
                x={labelWidth}
                y={y + 2}
                width={barAreaWidth}
                height={barHeight - 4}
                rx="4"
                fill="#1f2937"
              />

              {/* Value bar */}
              <rect
                x={labelWidth}
                y={y + 2}
                width={Math.max(barWidth, 0)}
                height={barHeight - 4}
                rx="4"
                fill={config.color}
                opacity="0.8"
                className="transition-all duration-700"
              />

              {/* Value text */}
              <text
                x={labelWidth + barAreaWidth + 8}
                y={y + barHeight / 2 + 1}
                textAnchor="start"
                dominantBaseline="central"
                className="fill-white"
                fontSize="12"
                fontWeight="600"
              >
                {result.responseQuality}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
