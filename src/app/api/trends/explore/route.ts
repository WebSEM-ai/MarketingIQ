import {
  getInterestOverTime,
  getRelatedQueries,
  getRelatedTopics,
  getInterestByRegion,
} from "@/lib/services/google-trends";
import Anthropic from "@anthropic-ai/sdk";
import type { InterestData, RelatedQuery, RelatedTopic, RegionInterest } from "@/lib/types/trends";

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
  const { query, timeframe, country } = body as {
    query: string;
    timeframe?: string;
    country?: string;
  };

  if (!query || !query.trim()) {
    return new Response(
      JSON.stringify({ error: "Termenul de căutare este obligatoriu." }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const tf = timeframe || "today 12-m";
  const co = country || "";
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        // Step 1: Interest over time
        sendEvent(controller, encoder, "progress", {
          step: 1,
          total: 4,
          message: "Analizez interesul în timp...",
        });

        let interest: InterestData = {
          query,
          timeframe: tf,
          country: co,
          timeline: [],
        };

        try {
          interest = await getInterestOverTime(query, tf, co);
        } catch (err) {
          console.error("Interest over time error:", err);
        }

        // Step 2: Related queries + topics in parallel
        sendEvent(controller, encoder, "progress", {
          step: 2,
          total: 4,
          message: "Caut interogări și topicuri asociate...",
        });

        let relatedQueries: RelatedQuery[] = [];
        let relatedTopics: RelatedTopic[] = [];

        const [queriesResult, topicsResult] = await Promise.allSettled([
          getRelatedQueries(query, co),
          getRelatedTopics(query, co),
        ]);

        if (queriesResult.status === "fulfilled") {
          relatedQueries = queriesResult.value;
        }
        if (topicsResult.status === "fulfilled") {
          relatedTopics = topicsResult.value;
        }

        // Step 3: Region interest
        sendEvent(controller, encoder, "progress", {
          step: 3,
          total: 4,
          message: "Analizez interesul pe regiuni...",
        });

        let regions: RegionInterest[] = [];
        try {
          regions = await getInterestByRegion(query, co);
        } catch (err) {
          console.error("Region interest error:", err);
        }

        // Step 4: Claude AI insights
        sendEvent(controller, encoder, "progress", {
          step: 4,
          total: 4,
          message: "Generez insights AI...",
        });

        let aiInsights: string | undefined;
        try {
          const topQueries = relatedQueries
            .filter((q) => q.type === "top")
            .slice(0, 5)
            .map((q) => `${q.query} (${q.value})`)
            .join(", ");

          const risingQueries = relatedQueries
            .filter((q) => q.type === "rising")
            .slice(0, 5)
            .map((q) => `${q.query} (${q.value})`)
            .join(", ");

          const topRegions = regions
            .slice(0, 5)
            .map((r) => `${r.name} (${r.value})`)
            .join(", ");

          const peakValue = interest.timeline.length
            ? Math.max(...interest.timeline.map((p) => p.value))
            : 0;
          const latestValue = interest.timeline.length
            ? interest.timeline[interest.timeline.length - 1].value
            : 0;

          const message = await anthropic.messages.create({
            model: "claude-sonnet-4-20250514",
            max_tokens: 1200,
            messages: [
              {
                role: "user",
                content: `Analizează tendința de căutare pentru "${query}" și oferă insights strategice de marketing.

Date:
- Perioadă: ${tf}
- Interes maxim: ${peakValue}, actual: ${latestValue}
- Puncte de date: ${interest.timeline.length}
- Top interogări asociate: ${topQueries || "N/A"}
- Interogări în creștere: ${risingQueries || "N/A"}
- Top regiuni: ${topRegions || "N/A"}
- Topicuri asociate: ${relatedTopics.slice(0, 5).map((t) => t.title).join(", ") || "N/A"}

Răspunde în română cu:
1. **Tendința generală** - Cum evoluează interesul (crește, scade, sezonier)
2. **Oportunități de conținut** - Ce subiecte asociate merită exploatate
3. **Audiența țintă** - Unde este cel mai mare interes geografic
4. **Recomandări strategice** - Acțiuni concrete pentru marketing
5. **Predicție** - Ce se poate anticipa pe termen scurt

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

        // Send final result
        sendEvent(controller, encoder, "result", {
          analysis: {
            query,
            interest,
            relatedQueries,
            relatedTopics,
            regions,
            aiInsights,
          },
        });
      } catch (err) {
        sendEvent(controller, encoder, "error", {
          error: err instanceof Error ? err.message : "Eroare la analiză.",
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
