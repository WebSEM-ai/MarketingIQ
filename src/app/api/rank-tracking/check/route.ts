import { bulkFindDomainPosition, getSearchResults } from "@/lib/services/rank-tracking";
import Anthropic from "@anthropic-ai/sdk";
import type { RankPosition, SerpResult } from "@/lib/types/rank-tracking";

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
    encoder.encode(`data: ${JSON.stringify({ event, ...(data as object) })}\n\n`)
  );
}

export async function POST(request: Request) {
  const body = await request.json();
  const { domain, keywords, country, device } = body as {
    domain: string;
    keywords: string[];
    country?: string;
    device?: string;
  };

  if (!domain?.trim() || !keywords?.length) {
    return new Response(
      JSON.stringify({ error: "Domeniul și cuvintele cheie sunt obligatorii." }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const co = country || "ro";
  const dev = device || "desktop";
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const totalSteps = 3;
        const kwList = keywords.map((k) => k.trim()).filter(Boolean).slice(0, 50);

        // Step 1: Bulk rank check
        sendEvent(controller, encoder, "progress", {
          step: 1,
          total: totalSteps,
          message: `Verific ${kwList.length} keywords pentru ${domain.trim()} (${dev})...`,
        });

        let positions: RankPosition[] = [];
        try {
          positions = await bulkFindDomainPosition(kwList, domain.trim(), co, dev);
        } catch (err) {
          console.error("Bulk rank error:", err);
          // Fallback: empty positions for each keyword
          positions = kwList.map((kw) => ({
            keyword: kw,
            topPosition: null,
            allPositions: [],
            occurrences: 0,
            results: [],
          }));
        }

        // Fill missing keywords
        for (const kw of kwList) {
          if (!positions.find((p) => p.keyword.toLowerCase() === kw.toLowerCase())) {
            positions.push({
              keyword: kw,
              topPosition: null,
              allPositions: [],
              occurrences: 0,
              results: [],
            });
          }
        }

        // Step 2: SERP results for top keyword
        sendEvent(controller, encoder, "progress", {
          step: 2,
          total: totalSteps,
          message: `Obțin rezultate SERP pentru "${kwList[0]}"...`,
        });

        let serpResults: SerpResult[] = [];
        try {
          serpResults = await getSearchResults(kwList[0], co, dev, 20);
        } catch (err) {
          console.error("SERP results error:", err);
        }

        // Step 3: AI Insights
        sendEvent(controller, encoder, "progress", {
          step: 3,
          total: totalSteps,
          message: "Generez analiză AI SEO...",
        });

        let aiInsights: string | undefined;

        try {
          const ranked = positions.filter((p) => p.topPosition !== null);
          const unranked = positions.filter((p) => p.topPosition === null);
          const top10 = ranked.filter((p) => p.topPosition! <= 10);
          const top3 = ranked.filter((p) => p.topPosition! <= 3);

          const positionSummary = positions.map((p) => ({
            keyword: p.keyword,
            position: p.topPosition ?? "neindexat",
            occurrences: p.occurrences,
          }));

          const serpCompetitors = serpResults.slice(0, 10).map((r) => ({
            position: r.position,
            domain: r.domain,
            title: r.title,
          }));

          const message = await anthropic.messages.create({
            model: "claude-sonnet-4-20250514",
            max_tokens: 1500,
            messages: [
              {
                role: "user",
                content: `Ești un expert SEO. Analizează pozițiile în Google pentru domeniul "${domain.trim()}" (piața: ${co.toUpperCase()}, device: ${dev}).

Rezumat poziții (${kwList.length} keywords):
- Top 3: ${top3.length} keywords
- Top 10: ${top10.length} keywords
- Indexate: ${ranked.length}/${kwList.length}
- Neindexate: ${unranked.length}

Detalii:
${JSON.stringify(positionSummary, null, 2)}

Top 10 competitori SERP pentru "${kwList[0]}":
${JSON.stringify(serpCompetitors, null, 2)}

Oferă o analiză strategică în limba română cu formatare markdown:

1. **Rezumat Vizibilitate** — scor general, distribuția pozițiilor
2. **Keywords Performante** — cele mai bune poziții, ce funcționează
3. **Oportunități de Îmbunătățire** — keywords aproape de top 10 care pot fi optimizate
4. **Analiza Competiției** — cine domină SERP-ul, cum te diferențiezi
5. **Plan de Acțiune** — pași concreti pentru creșterea pozițiilor

Fii concis și acționabil. Folosește **bold** pentru headere.`,
              },
            ],
          });

          const textBlock = message.content.find((b) => b.type === "text");
          if (textBlock && textBlock.type === "text") {
            aiInsights = textBlock.text;
          }
        } catch (err) {
          console.error("AI insights error:", err);
          aiInsights = "Nu s-au putut genera insights AI.";
        }

        // Send final result
        sendEvent(controller, encoder, "result", {
          analysis: {
            domain: domain.trim(),
            keywords: kwList,
            country: co,
            device: dev,
            positions,
            serpResults,
            serpQuery: kwList[0],
            aiInsights,
          },
        });
      } catch (err) {
        sendEvent(controller, encoder, "error", {
          error: err instanceof Error ? err.message : "Eroare la rank tracking.",
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
