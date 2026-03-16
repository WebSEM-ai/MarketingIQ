"use client";

import { SubScore } from "@/lib/types";

function getScoreColor(score: number): string {
  if (score >= 90) return "#22c55e";
  if (score >= 70) return "#3b82f6";
  if (score >= 41) return "#f59e0b";
  return "#ef4444";
}

export default function ScoreCard({
  title,
  data,
  weight,
}: {
  title: string;
  data: SubScore;
  weight: string;
}) {
  const color = getScoreColor(data.score);
  const percentage = data.score;

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          <span className="text-xs text-gray-500">Pondere: {weight}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold" style={{ color }}>
            {data.score}
          </span>
          <span
            className="text-xs font-medium px-2 py-0.5 rounded-full"
            style={{ color, backgroundColor: `${color}15` }}
          >
            {data.label}
          </span>
        </div>
      </div>

      <div className="w-full bg-gray-800 rounded-full h-2 mb-4">
        <div
          className="h-2 rounded-full transition-all duration-700"
          style={{ width: `${percentage}%`, backgroundColor: color }}
        />
      </div>

      <p className="text-sm text-gray-300 mb-3">{data.explanation}</p>

      <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700/50">
        <p className="text-xs text-gray-400">
          <span className="text-blue-400 font-medium">💡 Sugestie:</span>{" "}
          {data.suggestion}
        </p>
      </div>
    </div>
  );
}
