export interface KeywordSuggestion {
  keyword: string;
  source: "autocomplete" | "related" | "ai";
}

export interface KeywordCluster {
  name: string;
  intent: "informational" | "commercial" | "transactional" | "navigational";
  keywords: string[];
}

export interface KeywordRanking {
  keyword: string;
  position: number | null;
  url?: string;
}

export interface KeywordAnalysis {
  seed: string;
  suggestions: KeywordSuggestion[];
  clusters: KeywordCluster[];
  rankings?: KeywordRanking[];
  aiInsights?: string;
}
