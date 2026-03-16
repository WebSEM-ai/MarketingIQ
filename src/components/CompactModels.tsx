"use client";

function getScoreColor(score: number): string {
  if (score >= 90) return "#22c55e";
  if (score >= 70) return "#3b82f6";
  if (score >= 41) return "#f59e0b";
  return "#ef4444";
}

const MODELS = [
  { key: "gpt4o", name: "GPT-4o", icon: "G" },
  { key: "claude35", name: "Claude", icon: "C" },
  { key: "gemini15", name: "Gemini", icon: "Ge" },
] as const;

export default function CompactModels({
  data,
}: {
  data: {
    gpt4o: { score: number; reason: string };
    claude35: { score: number; reason: string };
    gemini15: { score: number; reason: string };
  };
}) {
  return (
    <div className="space-y-2">
      {MODELS.map((m) => {
        const { score } = data[m.key];
        const color = getScoreColor(score);
        return (
          <div key={m.key} className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-gray-500 w-6">{m.icon}</span>
            <div className="flex-1 bg-gray-800 rounded-full h-1.5">
              <div
                className="h-1.5 rounded-full"
                style={{ width: `${score}%`, backgroundColor: color }}
              />
            </div>
            <span className="text-[11px] font-bold w-8 text-right" style={{ color }}>
              {score}
            </span>
          </div>
        );
      })}
    </div>
  );
}
