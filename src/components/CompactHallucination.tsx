"use client";

function getRiskColor(score: number): string {
  if (score <= 33) return "#22c55e";
  if (score <= 66) return "#f59e0b";
  return "#ef4444";
}

export default function CompactHallucination({
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
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-gray-400">Risc halucinare</span>
        <span className="text-xs font-bold" style={{ color }}>
          {score}% — {level}
        </span>
      </div>
      <div className="w-full bg-gray-800 rounded-full h-1.5">
        <div
          className="h-1.5 rounded-full transition-all duration-500"
          style={{ width: `${score}%`, backgroundColor: color }}
        />
      </div>
      {risks.length > 0 && (
        <div className="space-y-0.5">
          {risks.slice(0, 3).map((risk, i) => (
            <p key={i} className="text-[10px] text-gray-500 flex items-start gap-1">
              <span className="text-red-400 mt-px">!</span>
              {risk.slice(0, 100)}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
