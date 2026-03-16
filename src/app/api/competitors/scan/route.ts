import { NextResponse } from "next/server";
import { scrapeCompetitor, checkSEO, findRanking } from "@/lib/services/scraper";
import Anthropic from "@anthropic-ai/sdk";
import type { CompetitorAnalysis, SEOData, RankingData } from "@/lib/types/competitors";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

async function generateInsights(
  url: string,
  content: string,
  seo: SEOData
): Promise<string> {
  const truncatedContent = content.slice(0, 6000);

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1500,
    messages: [
      {
        role: "user",
        content: `Analizează acest competitor (${url}) și oferă insights strategice.

Date SEO:
- Titlu: ${seo.title || "N/A"}
- Descriere: ${seo.description || "N/A"}
- Cuvinte: ${seo.wordCount || "N/A"}
- Scor SEO: ${seo.score || "N/A"}
- Probleme: ${seo.issues?.join(", ") || "Niciuna"}

Conținut (truncat):
${truncatedContent}

Răspunde în română cu:
1. **Puncte forte** - Ce face bine acest competitor
2. **Puncte slabe** - Unde are lacune
3. **Strategie de conținut** - Ce abordare folosește
4. **Avantaje competitive** - Ce îl diferențiază
5. **Oportunități** - Unde poți profita

Fii concis și acționabil.`,
      },
    ],
  });

  const textBlock = message.content.find((block) => block.type === "text");
  return textBlock && textBlock.type === "text" ? textBlock.text : "Nu s-au putut genera insights.";
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { url, keywords } = body as { url: string; keywords?: string[] };

    if (!url) {
      return NextResponse.json({ error: "URL-ul este obligatoriu." }, { status: 400 });
    }

    // Extract domain name from URL
    let domain: string;
    try {
      domain = new URL(url.startsWith("http") ? url : `https://${url}`).hostname;
    } catch {
      return NextResponse.json({ error: "URL invalid." }, { status: 400 });
    }

    const normalizedUrl = url.startsWith("http") ? url : `https://${url}`;

    // Run scrape and SEO check in parallel
    const [content, seoData] = await Promise.allSettled([
      scrapeCompetitor(normalizedUrl),
      checkSEO(normalizedUrl),
    ]);

    const scrapedContent =
      content.status === "fulfilled" ? content.value : "";
    const seo: SEOData =
      seoData.status === "fulfilled" ? seoData.value : {};

    // Find rankings for keywords in parallel
    let rankings: RankingData[] = [];
    if (keywords && keywords.length > 0) {
      const rankingResults = await Promise.allSettled(
        keywords.slice(0, 10).map((kw) => findRanking(kw.trim(), domain))
      );
      rankings = rankingResults
        .filter((r) => r.status === "fulfilled")
        .map((r) => (r as PromiseFulfilledResult<RankingData>).value);
    }

    // Generate AI insights
    let aiInsights: string | undefined;
    try {
      aiInsights = await generateInsights(normalizedUrl, scrapedContent, seo);
    } catch {
      aiInsights = "Nu s-au putut genera insights AI.";
    }

    const analysis: CompetitorAnalysis = {
      competitor: {
        id: `comp-${Date.now()}`,
        name: domain.replace("www.", ""),
        url: normalizedUrl,
        lastScanned: new Date().toISOString(),
        seoScore: seo.score,
        status: "active",
      },
      scan: {
        url: normalizedUrl,
        content: scrapedContent.slice(0, 10000),
        seoData: seo,
        scannedAt: new Date().toISOString(),
        success: content.status === "fulfilled",
      },
      seo,
      rankings,
      aiInsights,
    };

    return NextResponse.json(analysis);
  } catch (err) {
    console.error("Competitors scan error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Eroare la scanare." },
      { status: 500 }
    );
  }
}
