"use client";

import type { TimelinePoint } from "@/lib/types/trends";

interface TrendChartProps {
  data: TimelinePoint[];
  query: string;
}

export default function TrendChart({ data, query }: TrendChartProps) {
  if (!data.length) {
    return (
      <div className="bg-gray-900/50 border border-gray-800/50 rounded-xl p-4">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
          Interes în Timp
        </h3>
        <p className="text-sm text-gray-500">Nu sunt date disponibile.</p>
      </div>
    );
  }

  const padding = { top: 20, right: 20, bottom: 40, left: 40 };
  const width = 800;
  const height = 200;
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const maxVal = Math.max(...data.map((d) => d.value), 1);
  const minVal = 0;

  const points = data.map((d, i) => ({
    x: padding.left + (i / (data.length - 1 || 1)) * chartW,
    y: padding.top + chartH - ((d.value - minVal) / (maxVal - minVal || 1)) * chartH,
    date: d.date,
    value: d.value,
  }));

  // Build SVG path
  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");

  // Area path (line + close to bottom)
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${padding.top + chartH} L ${points[0].x} ${padding.top + chartH} Z`;

  // Y-axis labels
  const ySteps = 4;
  const yLabels = Array.from({ length: ySteps + 1 }, (_, i) => {
    const val = Math.round(minVal + ((maxVal - minVal) * i) / ySteps);
    const y = padding.top + chartH - (i / ySteps) * chartH;
    return { val, y };
  });

  // X-axis labels — every ~4th point
  const step = Math.max(1, Math.floor(data.length / 6));
  const xLabels = data
    .map((d, i) => ({ label: d.date, x: points[i].x, show: i % step === 0 || i === data.length - 1 }))
    .filter((l) => l.show);

  return (
    <div className="bg-gray-900/50 border border-gray-800/50 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
          Interes în Timp
        </h3>
        <span className="text-xs text-emerald-500 font-medium">&ldquo;{query}&rdquo;</span>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ height: 200 }}>
        <defs>
          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#22c55e" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {yLabels.map((yl, i) => (
          <line
            key={i}
            x1={padding.left}
            y1={yl.y}
            x2={width - padding.right}
            y2={yl.y}
            stroke="#1f2937"
            strokeWidth="1"
          />
        ))}

        {/* Area fill */}
        <path d={areaPath} fill="url(#areaGrad)" />

        {/* Line */}
        <path d={linePath} fill="none" stroke="#22c55e" strokeWidth="2" strokeLinejoin="round" />

        {/* Y-axis labels */}
        {yLabels.map((yl, i) => (
          <text
            key={i}
            x={padding.left - 8}
            y={yl.y + 4}
            textAnchor="end"
            className="fill-gray-500"
            fontSize="10"
          >
            {yl.val}
          </text>
        ))}

        {/* X-axis labels */}
        {xLabels.map((xl, i) => (
          <text
            key={i}
            x={xl.x}
            y={height - 8}
            textAnchor="middle"
            className="fill-gray-500"
            fontSize="9"
          >
            {xl.label}
          </text>
        ))}
      </svg>
    </div>
  );
}
