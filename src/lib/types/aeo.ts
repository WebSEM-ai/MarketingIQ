export type AEOPlatform = "perplexity" | "chatgpt" | "claude" | "grok" | "gemini";

export interface PlatformResult {
  platform: AEOPlatform;
  position: number | null;
  responseQuality: number;
  visibility: string;
  targetUrlFound: boolean;
  recommendation: string;
  topUrls: string[];
  responseContent: string;
  responseLength: number;
  totalResults: number;
  timestamp: string;
}

export interface AEOAnalysis {
  prompt: string;
  targetUrl: string;
  platforms: PlatformResult[];
  aiInsights?: string;
}
