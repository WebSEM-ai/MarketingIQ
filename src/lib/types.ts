export interface ActionableSuggestion {
  label: string;
  textToAppend: string;
  category: "prepend" | "append" | "replace";
}

export interface SubScore {
  score: number;
  label: "Slab" | "Mediu" | "Bun" | "Excelent";
  explanation: string;
  suggestion: string;
  actionable_suggestions: ActionableSuggestion[];
}

export interface ToneBreakdown {
  Formal: number;
  Casual: number;
  Autoritar: number;
  Tehnic: number;
  Creativ: number;
  Prietenos: number;
}

export interface BiasIssue {
  fragment: string;
  explanation: string;
}

export interface AnalysisResult {
  clarity: SubScore;
  context: SubScore;
  structure: SubScore;
  constraints: SubScore;
  tone: {
    primary: string;
    breakdown: ToneBreakdown;
  };
  bias: {
    level: "Scăzut" | "Mediu" | "Ridicat";
    score: number;
    issues: BiasIssue[];
  };
  hallucination_risk: {
    score: number;
    level: "Scăzut" | "Mediu" | "Ridicat";
    risks: string[];
  };
  model_compatibility: {
    gpt4o: { score: number; reason: string };
    claude35: { score: number; reason: string };
    gemini15: { score: number; reason: string };
  };
  template_suggestion: {
    has_variables: boolean;
    template: string | null;
    variables_detected: string[];
  };
  overall_score: number;
}

export interface TokenEstimate {
  wordCount: number;
  tokenCount: number;
  costs: {
    model: string;
    costPer1M: number;
    estimatedCost: number;
  }[];
}

export interface AppliedSuggestion {
  id: string;
  label: string;
  text: string;
}
