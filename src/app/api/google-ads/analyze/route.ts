import { getCampaigns, getCampaignMetrics, getKeywordMetrics, getDevicePerformance } from "@/lib/services/google-ads";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
export const maxDuration = 60;

function sendEvent(c: ReadableStreamDefaultController, e: TextEncoder, event: string, data: unknown) {
  c.enqueue(e.encode(`data: ${JSON.stringify({ event, ...(data as object) })}\n\n`));
}

export async function POST(request: Request) {
  const body = await request.json();
  const { customerId, dateRange } = body as { customerId: string; dateRange?: string };

  if (!customerId?.trim()) {
    return new Response(JSON.stringify({ error: "Customer ID este obligatoriu." }), { status: 400, headers: { "Content-Type": "application/json" } });
  }

  const dr = dateRange || "LAST_30_DAYS";
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        // Step 1: Campaigns
        sendEvent(controller, encoder, "progress", { step: 1, total: 4, message: "Obțin campaniile Google Ads..." });

        let campaigns: Record<string, unknown>[] = [];
        try {
          campaigns = await getCampaigns(customerId.trim());
        } catch (err) {
          console.error("Google campaigns error:", err);
        }

        // Step 2: Campaign metrics
        sendEvent(controller, encoder, "progress", { step: 2, total: 4, message: "Obțin metrici campanii..." });

        let metrics: Record<string, unknown>[] = [];
        try {
          metrics = await getCampaignMetrics(customerId.trim(), dr);
        } catch (err) {
          console.error("Google metrics error:", err);
        }

        // Step 3: Keywords + Device
        sendEvent(controller, encoder, "progress", { step: 3, total: 4, message: "Obțin keywords și dispozitive..." });

        let keywordMetrics: Record<string, unknown>[] = [];
        let devicePerf: Record<string, unknown>[] = [];
        try {
          [keywordMetrics, devicePerf] = await Promise.all([
            getKeywordMetrics(customerId.trim(), dr).catch(() => []),
            getDevicePerformance(customerId.trim(), dr).catch(() => []),
          ]);
        } catch { /* */ }

        // Step 4: AI
        sendEvent(controller, encoder, "progress", { step: 4, total: 4, message: "Generez analiză AI..." });

        let aiInsights: string | undefined;
        try {
          const campSum = (Array.isArray(campaigns) ? campaigns : []).slice(0, 10).map((c) => ({
            name: c.name, status: c.status, type: c.type, budget: c.budget,
          }));
          const metSum = (Array.isArray(metrics) ? metrics : []).slice(0, 10).map((m) => ({
            campaign: m.campaign_name || m.name, impressions: m.impressions, clicks: m.clicks,
            cost: m.cost, conversions: m.conversions, ctr: m.ctr,
          }));

          const msg = await anthropic.messages.create({
            model: "claude-sonnet-4-20250514",
            max_tokens: 1500,
            messages: [{
              role: "user",
              content: `Ești un expert Google Ads. Analizează contul ${customerId} (${dr}).

Campanii (${campaigns.length}):
${JSON.stringify(campSum, null, 2)}

Metrici:
${JSON.stringify(metSum, null, 2)}

Dispozitive:
${JSON.stringify(devicePerf, null, 2)}

Keywords top: ${(Array.isArray(keywordMetrics) ? keywordMetrics : []).length}

Analiză strategică în română cu markdown:
1. **Rezumat Performanță** — spend, CTR, conversii, cost/conversie
2. **Campanii Performante** — ce funcționează cel mai bine
3. **Analiza pe Dispozitive** — mobile vs desktop
4. **Oportunități de Optimizare** — keywords negative, bid adjustments
5. **Plan de Acțiune** — pași concreti

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
          analysis: { customerId: customerId.trim(), dateRange: dr, campaigns, metrics, keywordMetrics, devicePerf, aiInsights },
        });
      } catch (err) {
        sendEvent(controller, encoder, "error", { error: err instanceof Error ? err.message : "Eroare Google Ads." });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, { headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" } });
}
