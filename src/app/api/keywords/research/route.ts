import {
  getAutocompleteSuggestions,
  getRelatedSearches,
  checkBulkRankings,
} from "@/lib/services/keywords";
import Anthropic from "@anthropic-ai/sdk";
import type {
  KeywordSuggestion,
  KeywordCluster,
  KeywordRanking,
} from "@/lib/types/keywords";

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
  const { seed, domain, country } = body as {
    seed: string;
    domain?: string;
    country?: string;
  };

  if (!seed || !seed.trim()) {
    return new Response(
      JSON.stringify({ error: "Cuvântul cheie este obligatoriu." }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const co = country || "";
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const suggestions: KeywordSuggestion[] = [];

        // Step 1: Autocomplete suggestions
        sendEvent(controller, encoder, "progress", {
          step: 1,
          total: domain ? 4 : 3,
          message: "Obțin sugestii de autocompletare...",
        });

        try {
          const autocomplete = await getAutocompleteSuggestions(seed.trim(), co);
          for (const kw of autocomplete) {
            if (kw && kw.trim()) {
              suggestions.push({ keyword: kw.trim(), source: "autocomplete" });
            }
          }
        } catch (err) {
          console.error("Autocomplete error:", err);
        }

        // Step 2: Related searches
        sendEvent(controller, encoder, "progress", {
          step: 2,
          total: domain ? 4 : 3,
          message: "Caut căutări asociate...",
        });

        try {
          const related = await getRelatedSearches(seed.trim(), co);
          for (const kw of related) {
            if (kw && kw.trim()) {
              const exists = suggestions.some(
                (s) => s.keyword.toLowerCase() === kw.trim().toLowerCase()
              );
              if (!exists) {
                suggestions.push({ keyword: kw.trim(), source: "related" });
              }
            }
          }
        } catch (err) {
          console.error("Related searches error:", err);
        }

        // Step 3: Claude AI clustering + additional keywords
        sendEvent(controller, encoder, "progress", {
          step: 3,
          total: domain ? 4 : 3,
          message: "Analizez cu AI și grupez după intenție...",
        });

        let clusters: KeywordCluster[] = [];
        let aiInsights: string | undefined;
        const aiSuggestions: KeywordSuggestion[] = [];

        try {
          const allKeywords = suggestions.map((s) => s.keyword).join(", ");

          const message = await anthropic.messages.create({
            model: "claude-sonnet-4-20250514",
            max_tokens: 1500,
            messages: [
              {
                role: "user",
                content: `Ești un expert SEO. Analizează aceste cuvinte cheie legate de "${seed.trim()}" și oferă o analiză completă.

Cuvinte cheie găsite: ${allKeywords || "niciuna"}

Răspunde STRICT în acest format JSON (fără alte texte înainte sau după):
{
  "clusters": [
    {
      "name": "Numele clusterului",
      "intent": "informational|commercial|transactional|navigational",
      "keywords": ["kw1", "kw2"]
    }
  ],
  "additional_keywords": ["kw_nou1", "kw_nou2"],
  "insights": "Analiza strategică în limba română cu recomandări SEO. Folosește **bold** pentru headere și formatare markdown. Include: 1) Analiza intenției de căutare 2) Oportunități de conținut 3) Sugestii de long-tail keywords 4) Recomandări strategice."
}

Reguli:
- Grupează TOATE cuvintele cheie existente în clustere după intenția de căutare
- Adaugă 5-10 cuvinte cheie noi relevante în "additional_keywords"
- Intent-urile posibile: informational, commercial, transactional, navigational
- Insights-ul trebuie să fie detaliat și acționabil, în limba română
- Răspunde DOAR cu JSON valid`,
              },
            ],
          });

          const textBlock = message.content.find((b) => b.type === "text");
          if (textBlock && textBlock.type === "text") {
            try {
              // Extract JSON from response (handle potential markdown code blocks)
              let jsonText = textBlock.text.trim();
              const jsonMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)```/);
              if (jsonMatch) {
                jsonText = jsonMatch[1].trim();
              }

              const parsed = JSON.parse(jsonText) as {
                clusters?: Array<{
                  name?: string;
                  intent?: string;
                  keywords?: string[];
                }>;
                additional_keywords?: string[];
                insights?: string;
              };

              if (parsed.clusters && Array.isArray(parsed.clusters)) {
                clusters = parsed.clusters
                  .filter((c) => c.name && c.keywords && c.keywords.length > 0)
                  .map((c) => ({
                    name: c.name!,
                    intent: (["informational", "commercial", "transactional", "navigational"].includes(c.intent || "")
                      ? c.intent
                      : "informational") as KeywordCluster["intent"],
                    keywords: c.keywords!,
                  }));
              }

              if (parsed.additional_keywords && Array.isArray(parsed.additional_keywords)) {
                for (const kw of parsed.additional_keywords) {
                  if (kw && kw.trim()) {
                    const exists = suggestions.some(
                      (s) => s.keyword.toLowerCase() === kw.trim().toLowerCase()
                    );
                    if (!exists) {
                      aiSuggestions.push({ keyword: kw.trim(), source: "ai" });
                    }
                  }
                }
              }

              aiInsights = parsed.insights;
            } catch {
              aiInsights = textBlock.text;
            }
          }
        } catch {
          aiInsights = "Nu s-au putut genera insights AI.";
        }

        const allSuggestions = [...suggestions, ...aiSuggestions];

        // Step 4: Rankings (if domain provided)
        let rankings: KeywordRanking[] | undefined;

        if (domain && domain.trim()) {
          sendEvent(controller, encoder, "progress", {
            step: 4,
            total: 4,
            message: `Verific pozițiile pentru ${domain.trim()}...`,
          });

          try {
            const topKeywords = allSuggestions
              .slice(0, 30)
              .map((s) => s.keyword);
            if (topKeywords.length > 0) {
              rankings = await checkBulkRankings(topKeywords, domain.trim(), co);
            }
          } catch (err) {
            console.error("Rankings error:", err);
          }
        }

        // Send final result
        sendEvent(controller, encoder, "result", {
          analysis: {
            seed: seed.trim(),
            suggestions: allSuggestions,
            clusters,
            rankings,
            aiInsights,
          },
        });
      } catch (err) {
        sendEvent(controller, encoder, "error", {
          error: err instanceof Error ? err.message : "Eroare la cercetare.",
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
