export interface Competitor {
  id: string;
  name: string;
  url: string;
  lastScanned?: string;
  seoScore?: number;
  status: 'active' | 'pending' | 'error';
}

export interface ScanResult {
  url: string;
  content: string;
  seoData?: SEOData;
  scannedAt: string;
  success: boolean;
}

export interface SEOData {
  title?: string;
  description?: string;
  h1?: string[];
  h2?: string[];
  wordCount?: number;
  images?: number;
  links?: { internal: number; external: number };
  loadTime?: number;
  score?: number;
  issues?: string[];
}

export interface CompetitorAnalysis {
  competitor: Competitor;
  scan: ScanResult;
  seo: SEOData;
  rankings?: RankingData[];
  aiInsights?: string;
}

export interface RankingData {
  keyword: string;
  position: number | null;
  url?: string;
}

export interface SearchResult {
  title: string;
  url: string;
  description: string;
  position: number;
}
