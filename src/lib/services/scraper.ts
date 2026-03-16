import { callTool } from "./mcp-client";
import type { SearchResult, SEOData, RankingData } from "@/lib/types/competitors";

export async function scrapeCompetitor(url: string): Promise<string> {
  const result = await callTool("web-scraping", "scrape_page", {
    url,
    render_js: false,
    return_page_markdown: true,
  }, 12000);

  if (typeof result === "string") return result;

  const data = result as Record<string, unknown>;
  return (data.markdown as string) || (data.content as string) || JSON.stringify(data);
}

export async function searchCompetitors(
  query: string,
  country?: string
): Promise<SearchResult[]> {
  const result = await callTool("google-search", "search_web", {
    query,
    country: country || "ro",
    language: "ro",
    num_results: 10,
  });

  const data = result as Record<string, unknown>;
  const organic = (data.organic_results || data.results || data) as Array<Record<string, unknown>>;

  if (!Array.isArray(organic)) return [];

  return organic.map((item, idx) => ({
    title: (item.title as string) || "",
    url: (item.link as string) || (item.url as string) || "",
    description: (item.snippet as string) || (item.description as string) || "",
    position: (item.position as number) || idx + 1,
  }));
}

export async function checkSEO(url: string): Promise<SEOData> {
  const result = await callTool("onpage-seo", "single_onpage_checker", { url }, 15000);

  const data = result as Record<string, unknown>;
  const metrics = (data.metrics || {}) as Record<string, unknown>;
  const score = (data.score || {}) as Record<string, unknown>;
  const issues = (data.issues || []) as Array<Record<string, unknown>>;

  return {
    title: (metrics.title as string) || undefined,
    description: (metrics.metaDescription as string) || undefined,
    h1: (metrics.h1Tags as string[]) || undefined,
    h2: (metrics.h2Tags as string[]) || undefined,
    wordCount: (metrics.wordCount as number) || undefined,
    images: (metrics.imageCount as number) || undefined,
    links: {
      internal: (metrics.internalLinks as number) || 0,
      external: (metrics.externalLinks as number) || 0,
    },
    loadTime: (metrics.loadTime as number) || undefined,
    score: (score.overall as number) || undefined,
    issues: issues.map(
      (i) => `[${(i.severity as string) || "info"}] ${(i.message as string) || ""}`
    ),
  };
}

export async function findRanking(
  keyword: string,
  domain: string
): Promise<RankingData> {
  try {
    const result = await callTool("google-rank-tracking", "find_domain_position", {
      query: keyword,
      domain,
      gl: "ro",
    });

    const data = result as Record<string, unknown>;

    return {
      keyword,
      position: (data.position as number) ?? null,
      url: data.url as string | undefined,
    };
  } catch {
    return { keyword, position: null };
  }
}
