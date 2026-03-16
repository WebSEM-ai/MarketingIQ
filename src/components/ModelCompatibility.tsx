"use client";

function getScoreColor(score: number): string {
  if (score >= 90) return "#22c55e";
  if (score >= 70) return "#3b82f6";
  if (score >= 41) return "#f59e0b";
  return "#ef4444";
}

const MODEL_INFO = {
  gpt4o: { name: "GPT-4o", icon: "🟢" },
  claude35: { name: "Claude 3.5 Sonnet", icon: "🟣" },
  gemini15: { name: "Gemini 1.5 Pro", icon: "🔵" },
};

export default function ModelCompatibility({
  data,
}: {
  data: {
    gpt4o: { score: number; reason: string };
    claude35: { score: number; reason: string };
    gemini15: { score: number; reason: string };
  };
}) {
  const models = Object.entries(data) as [
    keyof typeof MODEL_INFO,
    { score: number; reason: string }
  ][];

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
      <h3 className="text-lg font-semibold text-white mb-4">
        Model Compatibility
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {models.map(([key, { score, reason }]) => {
          const info = MODEL_INFO[key];
          const color = getScoreColor(score);

          return (
            <div
              key={key}
              className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-4 flex flex-col items-center text-center"
            >
              <span className="text-2xl mb-2">{info.icon}</span>
              <p className="text-sm font-semibold text-white mb-1">
                {info.name}
              </p>
              <p className="text-3xl font-bold mb-2" style={{ color }}>
                {score}%
              </p>
              <div className="w-full bg-gray-700 rounded-full h-1.5 mb-3">
                <div
                  className="h-1.5 rounded-full transition-all duration-500"
                  style={{ width: `${score}%`, backgroundColor: color }}
                />
              </div>
              <p className="text-xs text-gray-400">{reason}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
