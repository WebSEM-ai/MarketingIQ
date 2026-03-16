import { callTool } from "./mcp-client";
import type { KeywordRanking } from "@/lib/types/keywords";

const SEARCH_SERVICE = "google-search";
const RANK_SERVICE = "google-rank-tracking";
const TIMEOUT = 12000;

export async function getAutocompleteSuggestions(
  query: string,
  country?: string
): Promise<string[]> {
  const args: Record<string, unknown> = { query };
  if (country) args.country = country;

  const raw = (await callTool(SEARCH_SERVICE, "get_autocomplete", args, TIMEOUT)) as
    | { suggestions?: Array<string | { value?: string; query?: string }> }
    | string[];

  if (Array.isArray(raw)) {
    return raw.map((item) =>
      typeof item === "string" ? item : String(item)
    );
  }

  const suggestions = (raw as { suggestions?: Array<string | { value?: string; query?: string }> })?.suggestions || [];

  return suggestions.map((item) => {
    if (typeof item === "string") return item;
    return item.value || item.query || String(item);
  });
}

export async function getRelatedSearches(
  query: string,
  country?: string
): Promise<string[]> {
  const args: Record<string, unknown> = { query };
  if (country) args.country = country;

  const raw = (await callTool(SEARCH_SERVICE, "get_related_searches", args, TIMEOUT)) as
    | { related_searches?: Array<string | { query?: string; value?: string }> }
    | string[];

  if (Array.isArray(raw)) {
    return raw.map((item) =>
      typeof item === "string" ? item : String(item)
    );
  }

  const related = (raw as { related_searches?: Array<string | { query?: string; value?: string }> })?.related_searches || [];

  return related.map((item) => {
    if (typeof item === "string") return item;
    return item.query || item.value || String(item);
  });
}

export async function checkBulkRankings(
  keywords: string[],
  domain: string,
  country?: string
): Promise<KeywordRanking[]> {
  const batch = keywords.slice(0, 50);

  const args: Record<string, unknown> = {
    keywords: batch,
    domain,
  };
  if (country) args.gl = country;

  const raw = (await callTool(RANK_SERVICE, "bulk_find_domain_position", args, TIMEOUT)) as
    | Array<{ keyword?: string; position?: number | null; url?: string }>
    | { results?: Array<{ keyword?: string; position?: number | null; url?: string }> };

  const results = Array.isArray(raw) ? raw : (raw as { results?: Array<{ keyword?: string; position?: number | null; url?: string }> })?.results || [];

  return results.map((item) => ({
    keyword: item.keyword || "",
    position: item.position ?? null,
    url: item.url,
  }));
}
