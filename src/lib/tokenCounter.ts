import { TokenEstimate } from "./types";

const MODELS = [
  { model: "GPT-4o", costPer1M: 5 },
  { model: "Claude 3.5 Sonnet", costPer1M: 3 },
  { model: "Gemini 1.5 Pro", costPer1M: 1.25 },
];

export function estimateTokens(text: string): TokenEstimate {
  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
  const tokenCount = Math.ceil(wordCount * 1.33);

  return {
    wordCount,
    tokenCount,
    costs: MODELS.map((m) => ({
      model: m.model,
      costPer1M: m.costPer1M,
      estimatedCost: parseFloat(((tokenCount / 1_000_000) * m.costPer1M).toFixed(6)),
    })),
  };
}
