import { searchNews } from "@/lib/services/google-news";
import type { NewsArticle } from "@/lib/services/google-news";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
export const maxDuration = 60;

function sendEvent(c: ReadableStreamDefaultController, e: TextEncoder, event: string, data: unknown) {
  c.enqueue(e.encode(`data: ${JSON.stringify({ event, ...(data as object) })}\n\n`));
}

export async function POST(request: Request) {
  const body = await request.json();
  const { query, country, language, timePeriod, sortBy } = body as {
    query: string; country?: string; language?: string; timePeriod?: string; sortBy?: string;
  };

  if (!query?.trim()) {
    return new Response(JSON.stringify({ error: "Termenul de căutare este obligatoriu." }), { status: 400, headers: { "Content-Type": "application/json" } });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        // Step 1: Search news
        sendEvent(controller, encoder, "progress", { step: 1, total: 2, message: `Caut știri pentru "${query.trim()}"...` });

        let articles: NewsArticle[] = [];
        let totalResults = 0;
        try {
          const result = await searchNews(query.trim(), {
            country: country || "ro",
            language: language || "ro",
            timePeriod: timePeriod || "last_week",
            sortBy: sortBy || "relevance",
            num: 30,
          });
          articles = result.articles;
          totalResults = result.totalResults;
        } catch (err) {
          console.error("News search error:", err);
        }

        // Step 2: AI Analysis
        sendEvent(controller, encoder, "progress", { step: 2, total: 2, message: "Generez analiză AI media..." });

        let aiInsights: string | undefined;
        try {
          const topArticles = articles.slice(0, 15).map((a) => ({
            title: a.title, source: a.source, date: a.date, snippet: a.snippet?.slice(0, 100),
          }));

          const sources = Array.from(new Set(articles.map((a) => a.source).filter(Boolean)));

          const msg = await anthropic.messages.create({
            model: "claude-sonnet-4-20250514",
            max_tokens: 1500,
            messages: [{
              role: "user",
              content: `Ești un expert în media monitoring și PR digital. Analizează aceste rezultate Google News pentru "${query.trim()}" (${country?.toUpperCase() || "RO"}).

Articole (${articles.length} din ~${totalResults} total):
${JSON.stringify(topArticles, null, 2)}

Surse unice: ${sources.join(", ")}

Analiză strategică în română cu markdown:

1. **Rezumat Media** — câte articole, surse dominante, frecvența publicării
2. **Sentimentul General** — tonul acoperirilor (pozitiv/neutru/negativ)
3. **Teme Principale** — ce subiecte apar cel mai des
4. **Surse Cheie** — cine scrie cel mai mult, autoritatea surselor
5. **Oportunități PR** — angle-uri neacoperite, publicații de vizat
6. **Recomandări** — acțiuni concrete de PR/comunicare

Fii concis. **Bold** pentru headere.`,
            }],
          });

          const tb = msg.content.find((b) => b.type === "text");
          if (tb && tb.type === "text") aiInsights = tb.text;
        } catch (err) {
          console.error("AI error:", err);
          aiInsights = "Nu s-au putut genera insights AI.";
        }

        sendEvent(controller, encoder, "result", {
          analysis: {
            query: query.trim(), country: country || "ro", timePeriod: timePeriod || "last_week",
            articles, totalResults, aiInsights,
          },
        });
      } catch (err) {
        sendEvent(controller, encoder, "error", { error: err instanceof Error ? err.message : "Eroare." });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, { headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" } });
}
