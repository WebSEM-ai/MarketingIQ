/* ─────────────────────────────────────────────────────────
 *  Landing Page Analyzer — MCP360 Service Wrappers
 * ───────────────────────────────────────────────────────── */

import { callTool } from "@/lib/services/mcp-client";

/** Scrape page with 3-tier fallback (same as compliance) */
export async function scrapePage(url: string): Promise<string> {
  // Try 1: Direct scrape (fast)
  try {
    const result = await callTool("web-scraping", "scrape_page", {
      url,
      render_js: false,
      return_page_markdown: true,
    }, 12000);
    const text = extractText(result);
    if (text && text.length > 100) return text;
  } catch (err) {
    console.log("Direct scrape failed:", err instanceof Error ? err.message : err);
  }

  // Try 2: JS rendering
  try {
    const result = await callTool("web-scraping", "scrape_page", {
      url,
      render_js: true,
      return_page_markdown: true,
    }, 15000);
    const text = extractText(result);
    if (text && text.length > 100) return text;
  } catch (err) {
    console.log("JS render failed:", err instanceof Error ? err.message : err);
  }

  // Try 3: Google cache
  try {
    const domain = new URL(url).hostname;
    const path = new URL(url).pathname;
    const searchQuery = `site:${domain} ${path.split("/").pop()?.replace(/[-_.]/g, " ") || ""}`;

    const searchResult = await callTool("google-search", "search_web", {
      query: searchQuery,
      num_results: 3,
    }, 12000);

    const searchData = searchResult as Record<string, unknown>;
    const organic = (searchData.organic_results || searchData.results || []) as Array<Record<string, unknown>>;
    const match = organic.find((r) => (r.link as string)?.includes(domain));

    if (match?.snippet) {
      return `[Via Google Cache] ${(match.title as string) || ""}\n\n${(match.snippet as string) || ""}`;
    }
  } catch (err) {
    console.log("Google cache fallback failed:", err instanceof Error ? err.message : err);
  }

  throw new Error("Pagina nu poate fi accesată. Încearcă un alt URL.");
}

/** Get on-page SEO data via MCP360 */
export async function getOnPageSEO(url: string): Promise<Record<string, unknown>> {
  try {
    const result = await callTool("onpage-seo", "single_onpage_checker", {
      url,
    }, 15000);
    return (result as Record<string, unknown>) || {};
  } catch (err) {
    console.log("OnPage SEO check failed:", err instanceof Error ? err.message : err);
    return {};
  }
}

function extractText(result: unknown): string {
  if (typeof result === "string") return result;
  const data = result as Record<string, unknown>;
  return (data.markdown as string) || (data.content as string) || (data.text as string) || "";
}
