"use client";

function getRiskColor(score: number): string {
  if (score <= 33) return "#22c55e";
  if (score <= 66) return "#f59e0b";
  return "#ef4444";
}

export default function HallucinationRisk({
  score,
  level,
  risks,
}: {
  score: number;
  level: string;
  risks: string[];
}) {
  const color = getRiskColor(score);

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">
          Hallucination Risk
        </h3>
        <div className="flex items-center gap-3">
          <span className="text-2xl font-bold" style={{ color }}>
            {score}%
          </span>
          <span
            className="text-xs font-medium px-2 py-0.5 rounded-full"
            style={{ color, backgroundColor: `${color}15` }}
          >
            {level}
          </span>
        </div>
      </div>

      {/* Visual indicator bar */}
      <div className="relative w-full h-3 bg-gray-800 rounded-full mb-5 overflow-hidden">
        <div
          className="absolute left-0 top-0 h-full rounded-full transition-all duration-700"
          style={{ width: `${score}%`, backgroundColor: color }}
        />
        {/* Gradient overlay: green -> yellow -> red */}
        <div className="absolute inset-0 opacity-20 bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 rounded-full" />
      </div>

      {risks.length > 0 ? (
        <div className="space-y-2">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">
            Riscuri detectate
          </p>
          {risks.map((risk, idx) => (
            <div
              key={idx}
              className="flex items-start gap-2 text-sm text-gray-300"
            >
              <span className="text-red-400 mt-0.5">⚠</span>
              <span>{risk}</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-400">
          Nu au fost detectate riscuri semnificative de halucinare.
        </p>
      )}
    </div>
  );
}
