import { callTool } from "./mcp-client";
import type { RankPosition, SerpResult } from "@/lib/types/rank-tracking";

const SERVICE = "google-rank-tracking";
const TIMEOUT = 20000;

export async function findDomainPosition(
  keyword: string,
  domain: string,
  country?: string,
  device?: string
): Promise<RankPosition> {
  const args: Record<string, unknown> = { query: keyword, domain };
  if (country) args.gl = country.toLowerCase();
  if (device) args.device = device;

  try {
    const raw = (await callTool(SERVICE, "find_domain_position", args, TIMEOUT)) as Record<string, unknown>;

    const results = (raw.results || []) as Array<Record<string, unknown>>;

    return {
      keyword,
      topPosition: (raw.top_position as number) ?? null,
      allPositions: Array.isArray(raw.all_positions) ? (raw.all_positions as number[]) : [],
      occurrences: (raw.occurrences as number) || 0,
      results: results.map((r) => ({
        position: (r.position as number) || 0,
        title: (r.title as string) || "",
        link: (r.link as string) || "",
        source: (r.source as string) || "",
        domain: (r.domain as string) || "",
        snippet: r.snippet as string | undefined,
        thumbnail: r.thumbnail as string | undefined,
      })),
    };
  } catch {
    return {
      keyword,
      topPosition: null,
      allPositions: [],
      occurrences: 0,
      results: [],
    };
  }
}

export async function bulkFindDomainPosition(
  keywords: string[],
  domain: string,
  country?: string,
  device?: string
): Promise<RankPosition[]> {
  const args: Record<string, unknown> = {
    keywords: keywords.slice(0, 50),
    domain,
  };
  if (country) args.gl = country.toLowerCase();
  if (device) args.device = device;

  const raw = (await callTool(SERVICE, "bulk_find_domain_position", args, 30000)) as Record<string, unknown>;
  const results = (raw.results || raw.positions || []) as Array<Record<string, unknown>>;
  if (!Array.isArray(results)) return [];

  return results.map((item) => ({
    keyword: (item.keyword as string) || (item.query as string) || "",
    topPosition: (item.position as number) ?? (item.top_position as number) ?? null,
    allPositions: Array.isArray(item.all_positions) ? (item.all_positions as number[]) : [],
    occurrences: (item.occurrences as number) || (item.topPosition !== null ? 1 : 0),
    results: Array.isArray(item.results)
      ? (item.results as Array<Record<string, unknown>>).map((r) => ({
          position: (r.position as number) || 0,
          title: (r.title as string) || "",
          link: (r.link as string) || "",
          source: (r.source as string) || "",
          domain: (r.domain as string) || "",
          snippet: r.snippet as string | undefined,
        }))
      : [],
  }));
}

export async function getSearchResults(
  query: string,
  country?: string,
  device?: string,
  num?: number
): Promise<SerpResult[]> {
  const args: Record<string, unknown> = { query };
  if (country) args.gl = country.toLowerCase();
  if (device) args.device = device;
  if (num) args.num = num;

  const raw = (await callTool(SERVICE, "get_search_results", args, TIMEOUT)) as Record<string, unknown>;
  const results = (raw.results || []) as Array<Record<string, unknown>>;
  if (!Array.isArray(results)) return [];

  return results.map((r) => {
    const richSnippet = r.rich_snippet as Record<string, unknown> | undefined;
    return {
      position: (r.position as number) || 0,
      title: (r.title as string) || "",
      link: (r.link as string) || "",
      source: (r.source as string) || "",
      domain: (r.domain as string) || "",
      snippet: r.snippet as string | undefined,
      snippetHighlights: Array.isArray(r.snippet_highlighted_words)
        ? (r.snippet_highlighted_words as string[])
        : undefined,
      richSnippet: richSnippet
        ? { extensions: Array.isArray(richSnippet.extensions) ? (richSnippet.extensions as string[]) : undefined }
        : undefined,
      thumbnail: r.thumbnail as string | undefined,
    };
  });
}
