/* ─────────────────────────────────────────────────────────
 *  Tracking Audit Module — Type Definitions
 * ───────────────────────────────────────────────────────── */

export interface TrackingIssue {
  severity: "critical" | "warning" | "good";
  platform: string;
  text: string;
  detail: string;
  suggestion: string;
}

export interface DataLayerEvent {
  event: string;
  has_required_params: boolean;
  missing_params: string[];
}

export interface TrackingAuditAnalysis {
  url: string;
  overall_score: number;
  verdict: string;
  verdict_tagline: string;
  platform_scores: {
    meta: number;
    google: number;
    tiktok: number;
    gtm: number;
    gdpr: number;
    datalayer: number;
  };
  platforms_detected: string[];
  issues: TrackingIssue[];
  gdpr_violations: string[];
  tracking_before_consent: string[];
  datalayer_events: DataLayerEvent[];
  quick_wins: string[];
  summary: string;
}

export interface TrackingAuditEntry {
  id: string;
  timestamp: string;
  url: string;
  overallScore: number;
  verdict: string;
  platformsDetected: string[];
  data: TrackingAuditAnalysis;
}

export interface ScanProgress {
  step: number;
  total: number;
  message: string;
}
