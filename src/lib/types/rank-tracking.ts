export interface RankPosition {
  keyword: string;
  topPosition: number | null;
  allPositions: number[];
  occurrences: number;
  results: RankResult[];
}

export interface RankResult {
  position: number;
  title: string;
  link: string;
  source: string;
  domain: string;
  snippet?: string;
  thumbnail?: string;
}

export interface SerpResult {
  position: number;
  title: string;
  link: string;
  source: string;
  domain: string;
  snippet?: string;
  snippetHighlights?: string[];
  richSnippet?: { extensions?: string[] };
  thumbnail?: string;
}

export interface RankAnalysis {
  domain: string;
  keywords: string[];
  country: string;
  device: string;
  positions: RankPosition[];
  serpResults?: SerpResult[];
  serpQuery?: string;
  aiInsights?: string;
}
