/* ─────────────────────────────────────────────────────────
 *  Tracking Audit — MCP360 Service Wrappers
 *  Tries raw HTML first (to preserve <script> tags), then
 *  falls back to markdown mode (which MCP360 handles better
 *  for Cloudflare-protected sites).
 * ───────────────────────────────────────────────────────── */

import { callTool } from "@/lib/services/mcp-client";

/** Scrape page with 4-tier fallback */
export async function scrapePageHTML(url: string): Promise<string> {
  // Try 1: JS render + raw HTML (ideal — preserves script tags)
  try {
    const result = await callTool("web-scraping", "scrape_page", {
      url,
      render_js: true,
      return_page_markdown: false,
    }, 15000);
    const html = extractContent(result);
    if (html && html.length > 200) return html;
  } catch (err) {
    console.log("Try 1 (JS+raw) failed:", err instanceof Error ? err.message : err);
  }

  // Try 2: JS render + markdown (works for Cloudflare sites like daciaplant.ro)
  // Script tags are stripped but AI can still detect tracking from noscript, data attributes, inline refs
  try {
    const result = await callTool("web-scraping", "scrape_page", {
      url,
      render_js: true,
      return_page_markdown: true,
    }, 15000);
    const text = extractContent(result);
    if (text && text.length > 100) return text;
  } catch (err) {
    console.log("Try 2 (JS+md) failed:", err instanceof Error ? err.message : err);
  }

  // Try 3: Direct scrape without JS (fast, works for simple sites)
  try {
    const result = await callTool("web-scraping", "scrape_page", {
      url,
      render_js: false,
      return_page_markdown: true,
    }, 12000);
    const text = extractContent(result);
    if (text && text.length > 100) return text;
  } catch (err) {
    console.log("Try 3 (direct) failed:", err instanceof Error ? err.message : err);
  }

  // Try 4: Google cache fallback
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
    console.log("Try 4 (Google cache) failed:", err instanceof Error ? err.message : err);
  }

  throw new Error("Pagina nu poate fi accesată (Cloudflare/protecție anti-bot). Încearcă un alt URL.");
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

function extractContent(result: unknown): string {
  if (typeof result === "string") return result;
  const data = result as Record<string, unknown>;
  return (data.html as string) || (data.source as string) || (data.page_source as string) ||
    (data.markdown as string) || (data.content as string) || (data.text as string) || "";
}
