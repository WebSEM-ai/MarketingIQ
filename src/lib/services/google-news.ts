import { callTool } from "./mcp-client";

const SERVICE = "google-news";
const TIMEOUT = 15000;

export interface NewsArticle {
  position: number;
  title: string;
  link: string;
  source: string;
  date: string;
  isoDate?: string;
  snippet?: string;
  thumbnail?: string;
}

export async function searchNews(
  query: string,
  options?: {
    country?: string;
    language?: string;
    timePeriod?: string;
    sortBy?: string;
    num?: number;
    page?: number;
  }
): Promise<{ articles: NewsArticle[]; totalResults: number }> {
  const args: Record<string, unknown> = { q: query };
  if (options?.country) args.gl = options.country.toLowerCase();
  if (options?.language) args.hl = options.language;
  if (options?.timePeriod) args.time_period = options.timePeriod;
  if (options?.sortBy) args.sort_by = options.sortBy;
  if (options?.num) args.num = options.num;
  if (options?.page) args.page = options.page;

  const raw = (await callTool(SERVICE, "search_news", args, TIMEOUT)) as Record<string, unknown>;

  const results = (raw.organic_results || raw.news_results || raw.results || []) as Array<Record<string, unknown>>;
  const searchInfo = (raw.search_information || {}) as Record<string, unknown>;

  const articles: NewsArticle[] = Array.isArray(results)
    ? results.map((r, idx) => ({
        position: (r.position as number) || idx + 1,
        title: (r.title as string) || "",
        link: (r.link as string) || "",
        source: (r.source as string) || "",
        date: (r.date as string) || "",
        isoDate: r.iso_date as string | undefined,
        snippet: r.snippet as string | undefined,
        thumbnail: typeof r.thumbnail === "string" && !r.thumbnail.startsWith("data:") ? r.thumbnail : undefined,
      }))
    : [];

  return {
    articles,
    totalResults: (searchInfo.total_results as number) || articles.length,
  };
}

export async function searchNewsLight(
  query: string,
  options?: {
    country?: string;
    language?: string;
    timePeriod?: string;
    sortBy?: string;
    num?: number;
  }
): Promise<NewsArticle[]> {
  const args: Record<string, unknown> = { q: query };
  if (options?.country) args.gl = options.country.toLowerCase();
  if (options?.language) args.hl = options.language;
  if (options?.timePeriod) args.time_period = options.timePeriod;
  if (options?.sortBy) args.sort_by = options.sortBy;
  if (options?.num) args.num = options.num;

  const raw = (await callTool(SERVICE, "search_news_light", args, TIMEOUT)) as Record<string, unknown>;
  const results = (raw.organic_results || raw.news_results || raw.results || []) as Array<Record<string, unknown>>;

  return Array.isArray(results)
    ? results.map((r, idx) => ({
        position: (r.position as number) || idx + 1,
        title: (r.title as string) || "",
        link: (r.link as string) || "",
        source: (r.source as string) || "",
        date: (r.date as string) || "",
        isoDate: r.iso_date as string | undefined,
        snippet: r.snippet as string | undefined,
        thumbnail: typeof r.thumbnail === "string" && !r.thumbnail.startsWith("data:") ? r.thumbnail : undefined,
      }))
    : [];
}
