import Anthropic from "@anthropic-ai/sdk";
import type { ContentInput, CalendarItem, TopicCluster, GapItem } from "@/lib/types/content";

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
  const input = body as ContentInput;

  if (!input.business?.trim() || !input.audience?.trim() || !input.goals?.trim()) {
    return new Response(
      JSON.stringify({ error: "Business, audiență și obiective sunt obligatorii." }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        // Step 1: Generate content calendar
        sendEvent(controller, encoder, "progress", {
          step: 1,
          total: 3,
          message: "Generez calendarul de conținut...",
        });

        let calendar: CalendarItem[] = [];

        try {
          const calendarPrompt = `Generează un calendar de conținut pe 4 săptămâni pentru: ${input.business}
Audiență: ${input.audience}
Obiective: ${input.goals}
${input.competitors ? `Competitori: ${input.competitors}` : ""}

Răspunde DOAR cu un array JSON valid (fără markdown, fără text extra):
[{"week":1,"title":"...","type":"blog|social|video|email|landing|infographic","topic":"...","keywords":["..."],"channel":"...","goal":"..."},...]

Generează 3-4 itemi pe săptămână (12-16 total). Fii specific și acționabil.`;

          const calendarMsg = await anthropic.messages.create({
            model: "claude-sonnet-4-20250514",
            max_tokens: 4000,
            messages: [{ role: "user", content: calendarPrompt }],
          });

          const calendarText = calendarMsg.content.find((b) => b.type === "text");
          if (calendarText && calendarText.type === "text") {
            const raw = calendarText.text.trim();
            // Try to extract JSON array from response
            const jsonMatch = raw.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
              calendar = JSON.parse(jsonMatch[0]) as CalendarItem[];
            } else {
              calendar = JSON.parse(raw) as CalendarItem[];
            }
          }
        } catch (err) {
          console.error("Calendar generation error:", err);
        }

        // Send calendar incrementally
        sendEvent(controller, encoder, "partial", {
          type: "calendar",
          data: calendar,
        });

        // Step 2: Generate topic clusters + gap analysis
        sendEvent(controller, encoder, "progress", {
          step: 2,
          total: 3,
          message: "Analizez clustere tematice și gap-uri...",
        });

        let clusters: TopicCluster[] = [];
        let gaps: GapItem[] = [];

        try {
          const clustersPrompt = `Bazat pe acest business: ${input.business}
Audiență: ${input.audience}
Conținut existent: ${input.existingContent || "Nimic specificat"}

Generează topic clusters și gap analysis. Răspunde DOAR cu JSON valid:
{"clusters":[{"pillar":"...","subtopics":["..."],"contentTypes":["..."],"priority":"high|medium|low"}],"gaps":[{"area":"...","description":"...","opportunity":"...","priority":"high|medium|low"}]}

Include 4-6 clusters și 3-5 gaps.`;

          const clustersMsg = await anthropic.messages.create({
            model: "claude-sonnet-4-20250514",
            max_tokens: 4000,
            messages: [{ role: "user", content: clustersPrompt }],
          });

          const clustersText = clustersMsg.content.find((b) => b.type === "text");
          if (clustersText && clustersText.type === "text") {
            const raw = clustersText.text.trim();
            // Try to extract JSON object from response
            const jsonMatch = raw.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              const parsed = JSON.parse(jsonMatch[0]);
              clusters = parsed.clusters || [];
              gaps = parsed.gaps || [];
            } else {
              const parsed = JSON.parse(raw);
              clusters = parsed.clusters || [];
              gaps = parsed.gaps || [];
            }
          }
        } catch (err) {
          console.error("Clusters/gaps generation error:", err);
        }

        // Send clusters + gaps incrementally
        sendEvent(controller, encoder, "partial", {
          type: "clusters",
          data: { clusters, gaps },
        });

        // Step 3: Generate strategy summary
        sendEvent(controller, encoder, "progress", {
          step: 3,
          total: 3,
          message: "Generez strategia finală...",
        });

        let aiStrategy: string | undefined;

        try {
          const calendarSummary = calendar
            .slice(0, 6)
            .map((c) => `${c.title} (${c.type}, ${c.channel})`)
            .join(", ");

          const clustersSummary = clusters
            .map((c) => `${c.pillar} (${c.priority})`)
            .join(", ");

          const gapsSummary = gaps
            .map((g) => `${g.area}: ${g.opportunity}`)
            .join("; ");

          const strategyPrompt = `Sumarizează strategia de conținut pentru: ${input.business}
Calendar generat: ${calendarSummary || "N/A"}
Clusters: ${clustersSummary || "N/A"}
Gaps: ${gapsSummary || "N/A"}

Oferă o strategie concisă și acționabilă în română cu:
1. Priorități imediate
2. Quick wins
3. Strategie pe termen lung
4. KPIs de monitorizat
5. Recomandări specifice`;

          const strategyMsg = await anthropic.messages.create({
            model: "claude-sonnet-4-20250514",
            max_tokens: 4000,
            messages: [{ role: "user", content: strategyPrompt }],
          });

          const strategyText = strategyMsg.content.find((b) => b.type === "text");
          aiStrategy =
            strategyText && strategyText.type === "text"
              ? strategyText.text
              : "Nu s-a putut genera strategia.";
        } catch {
          aiStrategy = "Nu s-a putut genera strategia AI.";
        }

        // Send final result
        sendEvent(controller, encoder, "result", {
          strategy: {
            input,
            calendar,
            clusters,
            gaps,
            aiStrategy,
          },
        });
      } catch (err) {
        sendEvent(controller, encoder, "error", {
          error: err instanceof Error ? err.message : "Eroare la generare.",
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
