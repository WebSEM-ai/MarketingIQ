import { searchVideos, searchChannels, searchShorts } from "@/lib/services/youtube";
import Anthropic from "@anthropic-ai/sdk";
import type { YouTubeVideo, YouTubeChannel, YouTubeShort } from "@/lib/types/youtube";

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

function formatViews(n: number | null): string {
  if (n === null) return "N/A";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

export async function POST(request: Request) {
  const body = await request.json();
  const { query, country } = body as {
    query: string;
    country?: string;
  };

  if (!query || !query.trim()) {
    return new Response(
      JSON.stringify({ error: "Termenul de căutare este obligatoriu." }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const co = country || "ro";
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const totalSteps = 4;

        // Step 1: Search videos
        sendEvent(controller, encoder, "progress", {
          step: 1,
          total: totalSteps,
          message: `Caut videoclipuri pentru "${query.trim()}"...`,
        });

        let videos: YouTubeVideo[] = [];
        try {
          videos = await searchVideos(query.trim(), co);
        } catch (err) {
          console.error("YouTube search_videos error:", err);
        }

        // Step 2: Search channels
        sendEvent(controller, encoder, "progress", {
          step: 2,
          total: totalSteps,
          message: "Caut canale relevante...",
        });

        let channels: YouTubeChannel[] = [];
        try {
          channels = await searchChannels(query.trim(), co);
        } catch (err) {
          console.error("YouTube search_channels error:", err);
        }

        // Step 3: Search Shorts
        sendEvent(controller, encoder, "progress", {
          step: 3,
          total: totalSteps,
          message: "Caut Shorts relevante...",
        });

        let shorts: YouTubeShort[] = [];
        try {
          shorts = await searchShorts(query.trim(), co);
        } catch (err) {
          console.error("YouTube search_shorts error:", err);
        }

        // Step 4: AI Insights
        sendEvent(controller, encoder, "progress", {
          step: 4,
          total: totalSteps,
          message: "Generez analiză AI YouTube...",
        });

        let aiInsights: string | undefined;

        try {
          const topVideos = videos.slice(0, 10).map((v) => ({
            title: v.title,
            views: formatViews(v.views),
            channel: v.channel.title,
            length: v.length,
            published: v.publishedTime,
          }));

          const topChannels = channels.slice(0, 5).map((c) => ({
            title: c.title,
            subscribers: c.subscribers,
            videos: c.videoCount,
          }));

          const message = await anthropic.messages.create({
            model: "claude-sonnet-4-20250514",
            max_tokens: 1500,
            messages: [
              {
                role: "user",
                content: `Ești un expert YouTube marketing și video SEO. Analizează aceste rezultate YouTube pentru "${query.trim()}" (piața: ${co.toUpperCase()}).

Top videoclipuri (${videos.length} total):
${JSON.stringify(topVideos, null, 2)}

Canale relevante (${channels.length} total):
${JSON.stringify(topChannels, null, 2)}

Shorts găsite: ${shorts.length}

Oferă o analiză strategică în limba română cu formatare markdown:

1. **Analiza Conținutului** — ce tipuri de videoclipuri domină, durate optime, stiluri care funcționează
2. **Analiza Competiției** — cine sunt creatorii dominanți, ce fac bine, cum te diferențiezi
3. **Oportunități** — nișe neacoperite, tipuri de conținut lipsă, angle-uri noi
4. **Strategie Video SEO** — titluri, thumbails, tags recomandate, timing-ul publicării
5. **Shorts vs Long-form** — cum să echilibrezi ambele formate

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
            query: query.trim(),
            country: co,
            videos,
            channels,
            shorts,
            aiInsights,
          },
        });
      } catch (err) {
        sendEvent(controller, encoder, "error", {
          error: err instanceof Error ? err.message : "Eroare la căutare YouTube.",
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
