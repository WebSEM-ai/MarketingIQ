import { trackOnPlatform } from "@/lib/services/aeo-tracker";
import Anthropic from "@anthropic-ai/sdk";
import type { AEOPlatform, PlatformResult } from "@/lib/types/aeo";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export const maxDuration = 60;

const ALL_PLATFORMS: AEOPlatform[] = ["perplexity", "chatgpt", "claude", "gemini", "grok"];

const PLATFORM_LABELS: Record<AEOPlatform, string> = {
  perplexity: "Perplexity",
  chatgpt: "ChatGPT",
  claude: "Claude",
  gemini: "Gemini",
  grok: "Grok",
};

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
  const { prompt, targetUrl, platforms: requestedPlatforms } = body as {
    prompt: string;
    targetUrl?: string;
    platforms?: string[];
  };

  if (!prompt || !prompt.trim()) {
    return new Response(
      JSON.stringify({ error: "Promptul este obligatoriu." }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const platforms: AEOPlatform[] = requestedPlatforms?.length
    ? (requestedPlatforms as AEOPlatform[])
    : ALL_PLATFORMS;

  const totalSteps = platforms.length + 1; // platforms + AI insights
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const results: PlatformResult[] = [];

      try {
        // Track each platform one by one
        for (let i = 0; i < platforms.length; i++) {
          const platform = platforms[i];
          sendEvent(controller, encoder, "progress", {
            step: i + 1,
            total: totalSteps,
            message: `Analizez ${PLATFORM_LABELS[platform]}...`,
            platform,
          });

          try {
            const result = await trackOnPlatform(prompt, platform, targetUrl);
            results.push(result);

            sendEvent(controller, encoder, "platform_result", {
              platform,
              result,
            });
          } catch (err) {
            console.error(`Error tracking ${platform}:`, err);
            // Push a failed result
            results.push({
              platform,
              position: null,
              responseQuality: 0,
              visibility: "eroare",
              targetUrlFound: false,
              recommendation: "Nu s-a putut analiza această platformă.",
              topUrls: [],
              responseContent: "",
              responseLength: 0,
              totalResults: 0,
              timestamp: new Date().toISOString(),
            });

            sendEvent(controller, encoder, "platform_error", {
              platform,
              error: err instanceof Error ? err.message : "Eroare necunoscută",
            });
          }
        }

        // AI Insights step
        sendEvent(controller, encoder, "progress", {
          step: totalSteps,
          total: totalSteps,
          message: "Generez insights AI strategice...",
        });

        let aiInsights: string | undefined;
        try {
          const platformSummary = results
            .map((r) => {
              return `- ${PLATFORM_LABELS[r.platform]}: vizibilitate=${r.visibility}, calitate=${r.responseQuality}/100, poziție=${r.position ?? "nelistat"}, URL găsit=${r.targetUrlFound ? "da" : "nu"}, URL-uri citate: ${r.topUrls.slice(0, 5).join(", ") || "niciunul"}`;
            })
            .join("\n");

          const message = await anthropic.messages.create({
            model: "claude-sonnet-4-20250514",
            max_tokens: 1200,
            messages: [
              {
                role: "user",
                content: `Ești un expert în AEO (Answer Engine Optimization). Analizează vizibilitatea unui brand/URL pe platformele AI și oferă recomandări strategice.

Prompt analizat: "${prompt}"
URL țintă: ${targetUrl || "nespecificat"}

Rezultate pe platforme:
${platformSummary}

Răspunde în română cu:
1. **Sumar vizibilitate** - Pe câte platforme apare brandul/URL-ul și ce calitate au răspunsurile
2. **Puncte forte** - Unde se descurcă bine
3. **Puncte slabe** - Unde lipsește sau are vizibilitate scăzută
4. **Recomandări AEO** - Acțiuni concrete pentru îmbunătățirea vizibilității pe motoarele AI
5. **Strategie de conținut** - Ce tip de conținut ar ajuta la o mai bună reprezentare

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
            prompt,
            targetUrl: targetUrl || "",
            platforms: results,
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
