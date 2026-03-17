/* ─────────────────────────────────────────────────────────
 *  Tracking Audit — MCP360 Service Wrappers
 *  Scrapes raw HTML (not markdown) to preserve <script> tags
 *  needed for tracking detection.
 * ───────────────────────────────────────────────────────── */

import { callTool } from "@/lib/services/mcp-client";

/** Scrape page with JS rendering, returning raw HTML (preserves script tags) */
export async function scrapePageHTML(url: string): Promise<string> {
  // Try 1: JS rendering (primary — tracking scripts need JS execution)
  try {
    const result = await callTool("web-scraping", "scrape_page", {
      url,
      render_js: true,
      return_page_markdown: false,
    }, 15000);
    const html = extractHTML(result);
    if (html && html.length > 100) return html;
  } catch (err) {
    console.log("JS render scrape failed:", err instanceof Error ? err.message : err);
  }

  // Try 2: Direct scrape without JS (still gets static HTML with script tags)
  try {
    const result = await callTool("web-scraping", "scrape_page", {
      url,
      render_js: false,
      return_page_markdown: false,
    }, 12000);
    const html = extractHTML(result);
    if (html && html.length > 100) return html;
  } catch (err) {
    console.log("Direct scrape failed:", err instanceof Error ? err.message : err);
  }

  // Try 3: Fallback — get markdown version (script tags stripped, but AI can still detect references)
  try {
    const result = await callTool("web-scraping", "scrape_page", {
      url,
      render_js: true,
      return_page_markdown: true,
    }, 15000);
    const text = extractHTML(result);
    if (text && text.length > 100) return text;
  } catch (err) {
    console.log("Markdown fallback failed:", err instanceof Error ? err.message : err);
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

function extractHTML(result: unknown): string {
  if (typeof result === "string") return result;
  const data = result as Record<string, unknown>;
  return (data.html as string) || (data.source as string) || (data.page_source as string) ||
    (data.content as string) || (data.markdown as string) || (data.text as string) || "";
}
