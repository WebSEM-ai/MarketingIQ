/* ─────────────────────────────────────────────────────────
 *  Cross-Module Alert Correlation Engine
 *  Reads localStorage data from all modules and produces
 *  actionable alerts (risks + opportunities).
 * ───────────────────────────────────────────────────────── */

export type AlertSeverity = "risk" | "opportunity" | "optimization";

export interface Alert {
  id: string;
  severity: AlertSeverity;
  title: string;
  description: string;
  modules: string[];      // module IDs involved
  action?: string;        // recommended action text
  actionRoute?: string;   // dashboard route to resolve
  timestamp: number;
}

/* ── Helper: safely parse localStorage ── */
function readStore<T>(key: string): T[] {
  try {
    return JSON.parse(localStorage.getItem(key) || "[]") as T[];
  } catch {
    return [];
  }
}

/* ── Type helpers for stored data ── */
interface AEOEntry {
  prompt: string;
  timestamp: string;
  avgVisibility: number;
  engines?: Array<{
    engine: string;
    mentioned: boolean;
    sentiment?: string;
    url?: string;
    claims?: string[];
  }>;
}

interface RankEntry {
  domain: string;
  timestamp: string;
  top10Count: number;
  top3Count?: number;
  keywordCount: number;
  keywords?: Array<{
    keyword: string;
    position: number;
    url?: string;
  }>;
}

interface KeywordEntry {
  seed: string;
  timestamp: string;
  suggestionCount: number;
  clusterCount: number;
  suggestions?: Array<{
    keyword: string;
    volume?: number;
    difficulty?: number;
    intent?: string;
  }>;
}

interface TrendEntry {
  query: string;
  timestamp: string;
  rising?: Array<{
    query: string;
    value: number;
  }>;
  interest?: number;
  changePercent?: number;
}

interface ShoppingEntry {
  query: string;
  timestamp: string;
  productCount: number;
  products?: Array<{
    title: string;
    price?: number;
    source?: string;
  }>;
  avgPrice?: number;
}

interface YouTubeEntry {
  query: string;
  timestamp: string;
  videoCount: number;
  videos?: Array<{
    title: string;
    views?: number;
    likes?: number;
    comments?: number;
    channelTitle?: string;
  }>;
}

interface ComplianceEntry {
  url?: string;
  product?: string;
  timestamp: string;
  score?: number;
  issues?: Array<{
    type: string;
    severity: string;
    text: string;
  }>;
}

interface GoogleAdsEntry {
  customerId: string;
  timestamp: string;
  totalClicks: number;
  totalImpressions?: number;
  totalCost?: number;
  campaigns?: Array<{
    name: string;
    status: string;
    clicks: number;
    impressions: number;
    cpc?: number;
    keywords?: string[];
  }>;
}

interface MetaAdsEntry {
  accountId: string;
  timestamp: string;
  activeCount: number;
  campaigns?: Array<{
    name: string;
    status: string;
    spend?: number;
    impressions?: number;
    clicks?: number;
  }>;
}

interface CompetitorEntry {
  competitor: { name: string; url?: string };
  scan: { scannedAt: string };
  seo?: { score?: number };
  changes?: Array<{ type: string; detail: string }>;
}

interface ContentEntry {
  label: string;
  timestamp: string;
  calendarCount: number;
}

/* ── CORRELATION RULES ── */

function ruleAEOCompliance(aeo: AEOEntry[], compliance: ComplianceEntry[]): Alert[] {
  const alerts: Alert[] = [];
  if (aeo.length === 0 || compliance.length === 0) return alerts;

  // Check if site appears in AI responses but has compliance issues
  const visibleInAI = aeo.filter(e => e.avgVisibility > 30);
  const hasIssues = compliance.filter(e => (e.issues && e.issues.length > 0) || (e.score !== undefined && e.score < 70));

  if (visibleInAI.length > 0 && hasIssues.length > 0) {
    alerts.push({
      id: "aeo-compliance-risk",
      severity: "risk",
      title: "Claim non-compliant vizibil în AI",
      description: `Apari în răspunsurile AI (${visibleInAI[0].avgVisibility}% vizibilitate), dar ai ${hasIssues.length} produs(e) cu probleme de compliance. Risc de vizibilitate negativă.`,
      modules: ["aeo", "compliance"],
      action: "Verifică și corectează claim-urile non-compliante",
      actionRoute: "/dashboard/compliance",
      timestamp: Date.now(),
    });
  }

  return alerts;
}

function ruleComplianceGoogleAds(compliance: ComplianceEntry[], gads: GoogleAdsEntry[]): Alert[] {
  const alerts: Alert[] = [];
  if (compliance.length === 0 || gads.length === 0) return alerts;

  const nonCompliant = compliance.filter(e => (e.issues && e.issues.some(i => i.severity === "high" || i.severity === "critical")) || (e.score !== undefined && e.score < 50));

  if (nonCompliant.length > 0 && gads.length > 0) {
    const productName = nonCompliant[0].product || nonCompliant[0].url || "Produs";
    alerts.push({
      id: "compliance-gads-risk",
      severity: "risk",
      title: "Produs cu risc de respingere Google Ads",
      description: `${productName} are probleme de compliance (${nonCompliant[0].issues?.length || 0} issues). Risc de respingere în Google Ads.`,
      modules: ["compliance", "google-ads"],
      action: "Modifică descrierea înainte de a lansa campania",
      actionRoute: "/dashboard/compliance",
      timestamp: Date.now(),
    });
  }

  return alerts;
}

function ruleTrendsShoppingOpportunity(trends: TrendEntry[], shopping: ShoppingEntry[]): Alert[] {
  const alerts: Alert[] = [];
  if (trends.length === 0 || shopping.length === 0) return alerts;

  // Find rising trends that overlap with shopping queries
  for (const trend of trends) {
    const risingTopics = trend.rising?.filter(r => r.value > 100) || [];
    if (trend.changePercent && trend.changePercent > 20) {
      const matchingShopping = shopping.find(s =>
        s.query.toLowerCase().includes(trend.query.toLowerCase()) ||
        trend.query.toLowerCase().includes(s.query.toLowerCase())
      );
      if (matchingShopping) {
        alerts.push({
          id: `trends-shopping-${trend.query.slice(0, 20)}`,
          severity: "opportunity",
          title: `Trend în creștere: "${trend.query}"`,
          description: `Căutările pentru "${trend.query}" au crescut cu ${trend.changePercent}%. Ai produse corespondente în Shopping. Oportunitate de a crește bugetul PPC.`,
          modules: ["trends", "shopping", "google-ads"],
          action: "Crește bugetul PPC pe acest segment",
          actionRoute: "/dashboard/trends",
          timestamp: Date.now(),
        });
        break; // one alert is enough
      }
    }
    // Check rising queries
    for (const rising of risingTopics.slice(0, 2)) {
      const matchShop = shopping.find(s =>
        s.query.toLowerCase().includes(rising.query.toLowerCase()) ||
        rising.query.toLowerCase().includes(s.query.toLowerCase())
      );
      if (matchShop) {
        alerts.push({
          id: `trends-rising-shopping-${rising.query.slice(0, 20)}`,
          severity: "opportunity",
          title: `Rising topic: "${rising.query}"`,
          description: `"${rising.query}" este în creștere accelerată (+${rising.value}%). Ai produse similare în Shopping — oportunitate de targetare rapidă.`,
          modules: ["trends", "shopping"],
          action: "Analizează produsele și lansează campanie",
          actionRoute: "/dashboard/shopping",
          timestamp: Date.now(),
        });
        break;
      }
    }
  }

  return alerts;
}

function ruleRankVsPPC(rank: RankEntry[], gads: GoogleAdsEntry[]): Alert[] {
  const alerts: Alert[] = [];
  if (rank.length === 0 || gads.length === 0) return alerts;

  const latest = rank[0];
  const top3Keywords = latest.keywords?.filter(k => k.position <= 3) || [];

  if (top3Keywords.length > 0) {
    // Check if any Google Ads campaigns target these same keywords
    const gadsKeywords: string[] = [];
    for (const g of gads) {
      for (const c of g.campaigns || []) {
        gadsKeywords.push(...(c.keywords || []));
      }
    }

    for (const kw of top3Keywords) {
      const isInAds = gadsKeywords.some(gk =>
        gk.toLowerCase() === kw.keyword.toLowerCase()
      );
      if (isInAds) {
        alerts.push({
          id: `rank-ppc-optimize-${kw.keyword.slice(0, 20)}`,
          severity: "optimization",
          title: `Poziția ${kw.position} SEO: "${kw.keyword}"`,
          description: `Ești pe poziția ${kw.position} organic pentru "${kw.keyword}". Poți reduce licitația PPC pentru acest termen și economisi buget.`,
          modules: ["rank-tracking", "google-ads"],
          action: "Reduce CPC-ul pe acest keyword",
          actionRoute: "/dashboard/rank-tracking",
          timestamp: Date.now(),
        });
        if (alerts.length >= 2) break;
      }
    }
  }

  // Generic alert if top positions exist
  if (alerts.length === 0 && latest.top3Count && latest.top3Count > 0) {
    alerts.push({
      id: "rank-ppc-generic-optimize",
      severity: "optimization",
      title: `${latest.top3Count} keywords în Top 3 SEO`,
      description: `Ai ${latest.top3Count} keywords în primele 3 poziții organice. Verifică dacă licitezi pe aceleași cuvinte în Google Ads — poți economisi buget.`,
      modules: ["rank-tracking", "google-ads"],
      action: "Compară keywords SEO vs PPC",
      actionRoute: "/dashboard/rank-tracking",
      timestamp: Date.now(),
    });
  }

  return alerts;
}

function ruleKeywordsGap(keywords: KeywordEntry[], rank: RankEntry[], gads: GoogleAdsEntry[]): Alert[] {
  const alerts: Alert[] = [];
  if (keywords.length === 0) return alerts;

  // Find high-intent keywords
  const highIntent = keywords.flatMap(k =>
    (k.suggestions || []).filter(s => s.intent === "commercial" || s.intent === "transactional")
  );

  if (highIntent.length === 0) return alerts;

  // Check coverage in rank tracking
  const rankedKeywords = new Set(
    rank.flatMap(r => (r.keywords || []).map(k => k.keyword.toLowerCase()))
  );

  // Check coverage in Google Ads
  const adsKeywords = new Set<string>();
  for (const g of gads) {
    for (const c of g.campaigns || []) {
      for (const k of c.keywords || []) {
        adsKeywords.add(k.toLowerCase());
      }
    }
  }

  const gaps = highIntent.filter(k =>
    !rankedKeywords.has(k.keyword.toLowerCase()) && !adsKeywords.has(k.keyword.toLowerCase())
  );

  if (gaps.length > 0) {
    const examples = gaps.slice(0, 3).map(g => g.keyword).join(", ");
    alerts.push({
      id: "keywords-gap-detected",
      severity: "opportunity",
      title: `${gaps.length} keywords cu intenție de cumpărare neacoperite`,
      description: `Ai ${gaps.length} termeni cu intenție comercială unde nu apari nici în SEO, nici în Ads: ${examples}${gaps.length > 3 ? "..." : ""}`,
      modules: ["keywords", "rank-tracking", "google-ads"],
      action: "Creează conținut SEO sau campanii Ads pentru acești termeni",
      actionRoute: "/dashboard/keywords",
      timestamp: Date.now(),
    });
  }

  return alerts;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function ruleYouTubeVirality(youtube: YouTubeEntry[], _meta: MetaAdsEntry[]): Alert[] {
  const alerts: Alert[] = [];
  if (youtube.length === 0) return alerts;

  for (const yt of youtube.slice(0, 3)) {
    if (!yt.videos || yt.videos.length === 0) continue;

    // Find videos with above-average engagement
    const totalViews = yt.videos.reduce((s, v) => s + (v.views || 0), 0);
    const avgViews = totalViews / yt.videos.length;

    const viral = yt.videos.filter(v => (v.views || 0) > avgViews * 2);
    if (viral.length > 0) {
      const top = viral[0];
      alerts.push({
        id: `youtube-viral-${top.title.slice(0, 20)}`,
        severity: "opportunity",
        title: `Video viral: "${top.title.slice(0, 50)}"`,
        description: `"${top.title.slice(0, 60)}" are ${(top.views || 0).toLocaleString()} views (${Math.round((top.views || 0) / avgViews)}x peste medie). Recomandăm repurpose pentru Meta Ads și Google News.`,
        modules: ["youtube", "meta-ads", "news"],
        action: "Transformă scriptul în ads și infografice",
        actionRoute: "/dashboard/youtube",
        timestamp: Date.now(),
      });
      break;
    }
  }

  return alerts;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function ruleTrendsWithoutAction(trends: TrendEntry[], keywords: KeywordEntry[], _content: ContentEntry[]): Alert[] {
  const alerts: Alert[] = [];
  if (trends.length === 0) return alerts;

  const recentTrend = trends[0];
  const hasKeywordResearch = keywords.some(k =>
    k.seed.toLowerCase().includes(recentTrend.query.toLowerCase()) ||
    recentTrend.query.toLowerCase().includes(k.seed.toLowerCase())
  );

  if (!hasKeywordResearch && recentTrend.interest && recentTrend.interest > 50) {
    alerts.push({
      id: `trend-no-keyword-${recentTrend.query.slice(0, 20)}`,
      severity: "opportunity",
      title: `Trend activ fără cercetare keywords`,
      description: `"${recentTrend.query}" are interes ridicat (${recentTrend.interest}/100), dar nu ai cercetat keywords-urile asociate. Oportunitate de a descoperi termeni profitabili.`,
      modules: ["trends", "keywords"],
      action: "Cercetează keywords pentru acest trend",
      actionRoute: "/dashboard/keywords",
      timestamp: Date.now(),
    });
  }

  return alerts;
}

function ruleCompetitorChanges(competitors: CompetitorEntry[]): Alert[] {
  const alerts: Alert[] = [];
  if (competitors.length === 0) return alerts;

  const withChanges = competitors.filter(c => c.changes && c.changes.length > 0);
  if (withChanges.length > 0) {
    const totalChanges = withChanges.reduce((s, c) => s + (c.changes?.length || 0), 0);
    alerts.push({
      id: "competitor-changes-detected",
      severity: "risk",
      title: `${totalChanges} schimbări detectate la competitori`,
      description: `${withChanges.length} competitor(i) au făcut modificări recente. Verifică dacă afectează strategia ta de conținut sau poziționarea.`,
      modules: ["competitors"],
      action: "Revizuiește schimbările competitorilor",
      actionRoute: "/dashboard/competitors",
      timestamp: Date.now(),
    });
  }

  return alerts;
}

interface LandingPageEntry {
  url: string;
  timestamp: string;
  overallScore: number;
  uxScore: number;
  technicalScore?: number;
}

function ruleLandingPageCompliance(landingPages: LandingPageEntry[], compliance: ComplianceEntry[]): Alert[] {
  const alerts: Alert[] = [];
  if (landingPages.length === 0 || compliance.length === 0) return alerts;

  for (const lp of landingPages) {
    const matchingCompliance = compliance.find(c =>
      c.url && lp.url && (c.url.includes(new URL(lp.url).hostname) || lp.url.includes(c.url.replace(/https?:\/\//, "").split("/")[0]))
    );
    if (matchingCompliance && matchingCompliance.score !== undefined && matchingCompliance.score < 70) {
      alerts.push({
        id: `lp-compliance-risk-${lp.url.slice(0, 30)}`,
        severity: "risk",
        title: "Landing page cu probleme de compliance",
        description: `Landing page-ul ${lp.url.replace(/https?:\/\//, "").slice(0, 40)} are UX score ${lp.uxScore}, dar și probleme de compliance (score ${matchingCompliance.score}). Risc de penalizare.`,
        modules: ["landing-page", "compliance"],
        action: "Corectează problemele de compliance",
        actionRoute: "/dashboard/compliance",
        timestamp: Date.now(),
      });
      break;
    }
  }

  return alerts;
}

function ruleLandingPageGoogleAds(landingPages: LandingPageEntry[], gads: GoogleAdsEntry[]): Alert[] {
  const alerts: Alert[] = [];
  if (landingPages.length === 0 || gads.length === 0) return alerts;

  const weakPages = landingPages.filter(lp => lp.uxScore < 50);
  if (weakPages.length > 0 && gads.some(g => g.campaigns?.some(c => c.status === "ENABLED"))) {
    alerts.push({
      id: "lp-gads-quality-risk",
      severity: "risk",
      title: "Landing page slab + campanii Google Ads active",
      description: `${weakPages.length} landing page(s) au UX score sub 50. Google Ads Quality Score este direct afectat — crește CPC-ul și scade Ad Rank-ul.`,
      modules: ["landing-page", "google-ads"],
      action: "Îmbunătățește UX-ul paginilor înainte de a continua ads",
      actionRoute: "/dashboard/landing-page",
      timestamp: Date.now(),
    });
  }

  return alerts;
}

function ruleLandingPageRank(landingPages: LandingPageEntry[], rank: RankEntry[]): Alert[] {
  const alerts: Alert[] = [];
  if (landingPages.length === 0 || rank.length === 0) return alerts;

  const latestRank = rank[0];
  const hasTopKeywords = (latestRank.top3Count && latestRank.top3Count > 0) || (latestRank.top10Count > 3);
  const weakUX = landingPages.some(lp => lp.uxScore < 60);

  if (hasTopKeywords && weakUX) {
    alerts.push({
      id: "lp-rank-optimization",
      severity: "optimization",
      title: "Top keywords dar UX slab pe landing page",
      description: `Ai ${latestRank.top3Count || 0} keywords în Top 3 și ${latestRank.top10Count} în Top 10, dar landing page-ul are UX sub 60. Îmbunătățirea UX poate crește CTR-ul organic.`,
      modules: ["landing-page", "rank-tracking"],
      action: "Optimizează UX pentru paginile cu trafic organic",
      actionRoute: "/dashboard/landing-page",
      timestamp: Date.now(),
    });
  }

  return alerts;
}

interface TrackingAuditAlertEntry {
  url: string;
  timestamp: string;
  overallScore: number;
  verdict: string;
  platformsDetected: string[];
  data?: {
    gdpr_violations?: string[];
    tracking_before_consent?: string[];
    platform_scores?: Record<string, number>;
  };
}

function ruleTrackingGDPRPreChecked(tracking: TrackingAuditAlertEntry[]): Alert[] {
  const alerts: Alert[] = [];
  if (tracking.length === 0) return alerts;

  for (const t of tracking) {
    const violations = t.data?.gdpr_violations || [];
    const hasPreChecked = violations.some(v =>
      v.toLowerCase().includes("pre-bif") || v.toLowerCase().includes("pre-check") || v.toLowerCase().includes("preselect")
    );
    if (hasPreChecked) {
      alerts.push({
        id: "tracking-gdpr-prechecked",
        severity: "risk",
        title: "Cookie-uri non-esențiale pre-bifate",
        description: `Bannerul GDPR de pe ${t.url.replace(/https?:\/\//, "").split("/")[0]} are categoriile de marketing bifate implicit — ilegal conform GDPR.`,
        modules: ["tracking-audit"],
        action: "Dezactivează cookie-urile pre-bifate imediat",
        actionRoute: "/dashboard/tracking-audit",
        timestamp: Date.now(),
      });
      break;
    }
  }

  return alerts;
}

function ruleTrackingBeforeConsent(tracking: TrackingAuditAlertEntry[]): Alert[] {
  const alerts: Alert[] = [];
  if (tracking.length === 0) return alerts;

  for (const t of tracking) {
    const beforeConsent = t.data?.tracking_before_consent || [];
    if (beforeConsent.length > 0) {
      alerts.push({
        id: "tracking-before-consent",
        severity: "risk",
        title: "Tracking activ înainte de consimțământ",
        description: `${beforeConsent.length} pixeli se încarcă înainte ca utilizatorul să accepte cookies pe ${t.url.replace(/https?:\/\//, "").split("/")[0]}.`,
        modules: ["tracking-audit"],
        action: "Mută scripturile de tracking după mecanismul de consimțământ",
        actionRoute: "/dashboard/tracking-audit",
        timestamp: Date.now(),
      });
      break;
    }
  }

  return alerts;
}

function ruleTrackingGoogleAds(tracking: TrackingAuditAlertEntry[], gads: GoogleAdsEntry[]): Alert[] {
  const alerts: Alert[] = [];
  if (tracking.length === 0 || gads.length === 0) return alerts;

  const weakTracking = tracking.filter(t => t.overallScore < 50);
  if (weakTracking.length > 0 && gads.some(g => g.campaigns?.some(c => c.status === "ENABLED"))) {
    alerts.push({
      id: "tracking-gads-roas-risk",
      severity: "risk",
      title: "Tracking slab + campanii Google Ads active",
      description: `Tracking-ul are scor ${weakTracking[0].overallScore}/100 dar ai campanii Google Ads active. ROAS-ul raportat nu este fiabil — pierzi date de conversie.`,
      modules: ["tracking-audit", "google-ads"],
      action: "Corectează tracking-ul înainte de a evalua performanța campaniilor",
      actionRoute: "/dashboard/tracking-audit",
      timestamp: Date.now(),
    });
  }

  return alerts;
}

/* ── MAIN ENGINE ── */

export function generateAlerts(): Alert[] {
  const aeo = readStore<AEOEntry>("miq:aeo-history");
  const rank = readStore<RankEntry>("miq:rank-history");
  const keywords = readStore<KeywordEntry>("miq:keywords-history");
  const trends = readStore<TrendEntry>("miq:trends-history");
  const shopping = readStore<ShoppingEntry>("miq:shopping-history");
  const youtube = readStore<YouTubeEntry>("miq:youtube-history");
  const compliance = readStore<ComplianceEntry>("miq:compliance-history");
  const gads = readStore<GoogleAdsEntry>("miq:google-ads-history");
  const meta = readStore<MetaAdsEntry>("miq:meta-ads-history");
  const competitors = readStore<CompetitorEntry>("miq:competitors-analyses");
  const content = readStore<ContentEntry>("miq:content-history");
  const landingPages = readStore<LandingPageEntry>("miq:landing-page-history");
  const trackingAudits = readStore<TrackingAuditAlertEntry>("miq:tracking-audit-history");

  const allAlerts: Alert[] = [
    ...ruleAEOCompliance(aeo, compliance),
    ...ruleComplianceGoogleAds(compliance, gads),
    ...ruleTrendsShoppingOpportunity(trends, shopping),
    ...ruleRankVsPPC(rank, gads),
    ...ruleKeywordsGap(keywords, rank, gads),
    ...ruleYouTubeVirality(youtube, meta),
    ...ruleTrendsWithoutAction(trends, keywords, content),
    ...ruleCompetitorChanges(competitors),
    ...ruleLandingPageCompliance(landingPages, compliance),
    ...ruleLandingPageGoogleAds(landingPages, gads),
    ...ruleLandingPageRank(landingPages, rank),
    ...ruleTrackingGDPRPreChecked(trackingAudits),
    ...ruleTrackingBeforeConsent(trackingAudits),
    ...ruleTrackingGoogleAds(trackingAudits, gads),
  ];

  // Deduplicate by id
  const seen = new Set<string>();
  const unique = allAlerts.filter(a => {
    if (seen.has(a.id)) return false;
    seen.add(a.id);
    return true;
  });

  // Sort: risks first, then opportunities, then optimizations
  const order: Record<AlertSeverity, number> = { risk: 0, opportunity: 1, optimization: 2 };
  unique.sort((a, b) => order[a.severity] - order[b.severity]);

  return unique;
}

/* ── Generate demo alerts when no real data exists ── */
export function generateDemoAlerts(): Alert[] {
  return [
    {
      id: "demo-aeo-compliance",
      severity: "risk",
      title: "Claim non-compliant vizibil în AI",
      description: "Apari în răspunsul AI, dar sursa conține un claim non-compliant. Risc de vizibilitate negativă.",
      modules: ["aeo", "compliance"],
      action: "Verifică conformitatea claim-urilor",
      actionRoute: "/dashboard/compliance",
      timestamp: Date.now(),
    },
    {
      id: "demo-compliance-gads",
      severity: "risk",
      title: "Produs cu risc de respingere Google Ads",
      description: "Produsul X va fi respins de Google Ads din cauza descrierii. Modifică înainte de a lansa campania.",
      modules: ["compliance", "google-ads"],
      action: "Corectează descrierea produsului",
      actionRoute: "/dashboard/compliance",
      timestamp: Date.now(),
    },
    {
      id: "demo-trends-shopping",
      severity: "opportunity",
      title: 'Trend +40%: "sirop tuse copii"',
      description: 'C\u0103ut\u0103rile pentru "sirop tuse copii" au crescut cu 40% \u00een ultimele 24h. Produsele tale din Shopping au CPC mic. Cre\u0219te bugetul PPC.',
      modules: ["trends", "shopping", "google-ads"],
      action: "Crește bugetul PPC pe acest segment",
      actionRoute: "/dashboard/trends",
      timestamp: Date.now(),
    },
    {
      id: "demo-rank-ppc",
      severity: "optimization",
      title: 'Pozitia 1 SEO: "spray propolis"',
      description: 'Esti pe Pozitia 1 organic pentru "spray propolis". Poti reduce licitatia PPC si economisi buget, mentinand prima pozitie.',
      modules: ["rank-tracking", "google-ads"],
      action: "Reduce CPC-ul pe acest keyword",
      actionRoute: "/dashboard/rank-tracking",
      timestamp: Date.now(),
    },
    {
      id: "demo-keywords-gap",
      severity: "opportunity",
      title: "Gap detectat: termeni high-intent neacoperiți",
      description: "Modulul Keywords indică termeni cu intenție mare de cumpărare unde nu apari nici în SEO, nici în Ads.",
      modules: ["keywords", "rank-tracking", "google-ads"],
      action: "Creează conținut SEO sau campanii Ads",
      actionRoute: "/dashboard/keywords",
      timestamp: Date.now(),
    },
    {
      id: "demo-youtube-viral",
      severity: "opportunity",
      title: 'Video viral: "rutina de imunitate"',
      description: "Ultimul video are engagement de 3x peste medie pe YouTube. Transformă scriptul în 3 postări Meta Ads și un infografic Google News.",
      modules: ["youtube", "meta-ads", "news"],
      action: "Repurpose conținut viral",
      actionRoute: "/dashboard/youtube",
      timestamp: Date.now(),
    },
  ];
}
