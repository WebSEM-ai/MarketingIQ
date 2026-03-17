/* ─────────────────────────────────────────────────────────
 *  Landing Page Analyzer — Type Definitions
 * ───────────────────────────────────────────────────────── */

export interface UXElement {
  name: string;
  score: number;           // 0-100
  status: "excellent" | "good" | "needs-work" | "missing" | "critical";
  findings: string[];
  recommendations: string[];
}

export interface TrackerInfo {
  name: string;
  detected: boolean;
  details?: string;
}

export interface SchemaMarkup {
  type: string;             // Product, Review, FAQ, etc.
  detected: boolean;
  details?: string;
}

export interface TechnicalElement {
  name: string;
  score: number;
  status: "good" | "warning" | "critical";
  findings: string[];
  recommendations: string[];
}

export interface LandingPageAnalysis {
  url: string;
  page_title?: string;
  overall_score: number;
  ux_score: number;
  technical_score: number;

  ux_elements: UXElement[];
  trackers: TrackerInfo[];
  schema_markup: SchemaMarkup[];
  technical_elements: TechnicalElement[];

  priority_actions: string[];
  strengths: string[];
  summary: string;
}

export interface LandingPageEntry {
  id: string;
  timestamp: string;
  url: string;
  pageTitle: string;
  overallScore: number;
  uxScore: number;
  technicalScore: number;
  data: LandingPageAnalysis;
}

export interface ScanProgress {
  step: number;
  total: number;
  message: string;
}
