export type ModuleId = "keywords" | "trends" | "aeo" | "competitors" | "content" | "shopping" | "youtube" | "rank-tracking" | "landing-page";

export const MODULE_LABELS: Record<ModuleId, string> = {
  keywords: "Cuvinte Cheie",
  trends: "Tendințe",
  aeo: "AEO Tracker",
  competitors: "Competitori",
  content: "Strategie Conținut",
  shopping: "Google Shopping",
  youtube: "YouTube Research",
  "rank-tracking": "Rank Tracking",
  "landing-page": "Landing Page",
};

export const MODULE_ROUTES: Record<ModuleId, string> = {
  keywords: "/dashboard/keywords",
  trends: "/dashboard/trends",
  aeo: "/dashboard/aeo",
  competitors: "/dashboard/competitors",
  content: "/dashboard/content",
  shopping: "/dashboard/shopping",
  youtube: "/dashboard/youtube",
  "rank-tracking": "/dashboard/rank-tracking",
  "landing-page": "/dashboard/landing-page",
};

export const MODULE_COLORS: Record<ModuleId, string> = {
  keywords: "#a855f7",
  trends: "#22c55e",
  aeo: "#06b6d4",
  competitors: "#f59e0b",
  content: "#f43f5e",
  shopping: "#f97316",
  youtube: "#ef4444",
  "rank-tracking": "#10b981",
  "landing-page": "#ec4899",
};

// Data payloads per target module
export interface KeywordsPrefill {
  seed: string;
  domain?: string;
  country?: string;
}

export interface TrendsPrefill {
  query: string;
}

export interface AEOPrefill {
  prompt: string;
  targetUrl?: string;
}

export interface CompetitorsPrefill {
  url: string;
  keywords?: string[];
}

export interface ContentPrefill {
  business?: string;
  audience?: string;
  goals?: string;
  competitors?: string;
  keywords?: string[];
}

export interface ShoppingPrefill {
  query: string;
  country?: string;
}

export interface YouTubePrefill {
  query: string;
  country?: string;
}

export interface RankTrackingPrefill {
  domain: string;
  keywords?: string[];
  country?: string;
}

export interface LandingPagePrefill {
  url: string;
}

export type SynergyData =
  | { target: "keywords"; data: KeywordsPrefill }
  | { target: "trends"; data: TrendsPrefill }
  | { target: "aeo"; data: AEOPrefill }
  | { target: "competitors"; data: CompetitorsPrefill }
  | { target: "content"; data: ContentPrefill }
  | { target: "shopping"; data: ShoppingPrefill }
  | { target: "youtube"; data: YouTubePrefill }
  | { target: "rank-tracking"; data: RankTrackingPrefill }
  | { target: "landing-page"; data: LandingPagePrefill };

export interface SynergyPayload {
  source: ModuleId;
  target: ModuleId;
  data: KeywordsPrefill | TrendsPrefill | AEOPrefill | CompetitorsPrefill | ContentPrefill | ShoppingPrefill | YouTubePrefill | RankTrackingPrefill | LandingPagePrefill;
  label: string;
  timestamp: number;
}
