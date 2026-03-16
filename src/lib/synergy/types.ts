export type ModuleId = "keywords" | "trends" | "aeo" | "competitors" | "content";

export const MODULE_LABELS: Record<ModuleId, string> = {
  keywords: "Cuvinte Cheie",
  trends: "Tendințe",
  aeo: "AEO Tracker",
  competitors: "Competitori",
  content: "Strategie Conținut",
};

export const MODULE_ROUTES: Record<ModuleId, string> = {
  keywords: "/dashboard/keywords",
  trends: "/dashboard/trends",
  aeo: "/dashboard/aeo",
  competitors: "/dashboard/competitors",
  content: "/dashboard/content",
};

export const MODULE_COLORS: Record<ModuleId, string> = {
  keywords: "#a855f7",
  trends: "#22c55e",
  aeo: "#06b6d4",
  competitors: "#f59e0b",
  content: "#f43f5e",
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

export type SynergyData =
  | { target: "keywords"; data: KeywordsPrefill }
  | { target: "trends"; data: TrendsPrefill }
  | { target: "aeo"; data: AEOPrefill }
  | { target: "competitors"; data: CompetitorsPrefill }
  | { target: "content"; data: ContentPrefill };

export interface SynergyPayload {
  source: ModuleId;
  target: ModuleId;
  data: KeywordsPrefill | TrendsPrefill | AEOPrefill | CompetitorsPrefill | ContentPrefill;
  label: string; // human-readable description e.g. "best SEO tools 2026"
  timestamp: number;
}
