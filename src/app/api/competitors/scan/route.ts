import { scrapeCompetitor, checkSEO, findRanking } from "@/lib/services/scraper";
import Anthropic from "@anthropic-ai/sdk";
import type { SEOData, RankingData } from "@/lib/types/competitors";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export const maxDuration = 60;

function sendEvent(
  controller: ReadableStreamDefaultController,
  encoder: TextEncoder,
  event: string,
  data: unknown
) {
  controller.enqueue(
    encoder.encode(`data: ${JSON.stringify({ event, ...data as object })}\n\n`)
  );
}

export async function POST(request: Request) {
  const body = await request.json();
  const { url, keywords } = body as { url: string; keywords?: string[] };

  if (!url) {
    return new Response(JSON.stringify({ error: "URL-ul este obligatoriu." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  let domain: string;
  try {
    domain = new URL(url.startsWith("http") ? url : `https://${url}`).hostname;
  } catch {
    return new Response(JSON.stringify({ error: "URL invalid." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const normalizedUrl = url.startsWith("http") ? url : `https://${url}`;
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        // Step 1: Scrape + SEO in parallel
        sendEvent(controller, encoder, "progress", {
          step: 1,
          total: 4,
          message: "Scanez site-ul și verific SEO...",
        });

        const [contentResult, seoResult] = await Promise.allSettled([
          scrapeCompetitor(normalizedUrl),
          checkSEO(normalizedUrl),
        ]);

        const scrapedContent =
          contentResult.status === "fulfilled" ? contentResult.value : "";
        const seo: SEOData =
          seoResult.status === "fulfilled" ? seoResult.value : {};

        const scrapeOk = contentResult.status === "fulfilled";
        const seoOk = seoResult.status === "fulfilled";

        sendEvent(controller, encoder, "progress", {
          step: 2,
          total: 4,
          message: seoOk
            ? `SEO analizat${scrapeOk ? " + conținut extras" : " (scrape timeout, continui)"}. Verific keywords...`
            : "Verific pozițiile pe keywords...",
        });

        // Step 2: Rankings
        let rankings: RankingData[] = [];
        if (keywords && keywords.length > 0) {
          const rankResults = await Promise.allSettled(
            keywords.slice(0, 10).map((kw) => findRanking(kw.trim(), domain))
          );
          rankings = rankResults
            .filter((r) => r.status === "fulfilled")
            .map((r) => (r as PromiseFulfilledResult<RankingData>).value);
        }

        sendEvent(controller, encoder, "progress", {
          step: 3,
          total: 4,
          message: "Generez analiza AI...",
        });

        // Step 3: Claude AI insights
        let aiInsights: string | undefined;
        try {
          const truncated = scrapedContent.slice(0, 6000);
          const message = await anthropic.messages.create({
            model: "claude-sonnet-4-20250514",
            max_tokens: 1500,
            messages: [
              {
                role: "user",
                content: `Analizează acest competitor (${normalizedUrl}) și oferă insights strategice.

Date SEO:
- Titlu: ${seo.title || "N/A"}
- Descriere: ${seo.description || "N/A"}
- Cuvinte: ${seo.wordCount || "N/A"}
- Scor SEO: ${seo.score || "N/A"}
- Probleme: ${seo.issues?.join(", ") || "Niciuna"}

Conținut (truncat):
${truncated}

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

          const textBlock = message.content.find((b) => b.type === "text");
          aiInsights =
            textBlock && textBlock.type === "text"
              ? textBlock.text
              : "Nu s-au putut genera insights.";
        } catch {
          aiInsights = "Nu s-au putut genera insights AI.";
        }

        // Step 4: Done — send final result
        sendEvent(controller, encoder, "progress", {
          step: 4,
          total: 4,
          message: "Complet!",
        });

        sendEvent(controller, encoder, "result", {
          analysis: {
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
              content: "",
              seoData: seo,
              scannedAt: new Date().toISOString(),
              success: contentResult.status === "fulfilled",
            },
            seo,
            rankings,
            aiInsights,
          },
        });
      } catch (err) {
        sendEvent(controller, encoder, "error", {
          error: err instanceof Error ? err.message : "Eroare la scanare.",
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
