import { getCampaigns, getInsights } from "@/lib/services/meta-ads";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
export const maxDuration = 60;

function sendEvent(c: ReadableStreamDefaultController, e: TextEncoder, event: string, data: unknown) {
  c.enqueue(e.encode(`data: ${JSON.stringify({ event, ...(data as object) })}\n\n`));
}

export async function POST(request: Request) {
  const body = await request.json();
  const { accountId } = body as { accountId: string };

  if (!accountId?.trim()) {
    return new Response(JSON.stringify({ error: "Account ID este obligatoriu (format: act_XXXXXXXXX)." }), { status: 400, headers: { "Content-Type": "application/json" } });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        // Step 1: Get campaigns
        sendEvent(controller, encoder, "progress", { step: 1, total: 3, message: "Obțin campaniile Meta Ads..." });

        let campaigns: Record<string, unknown>[] = [];
        try {
          campaigns = await getCampaigns(accountId.trim(), undefined, 50);
        } catch (err) {
          console.error("Meta campaigns error:", err);
        }

        // Step 2: Get account insights
        sendEvent(controller, encoder, "progress", { step: 2, total: 3, message: "Obțin metrici de performanță..." });

        let insights: Record<string, unknown> = {};
        try {
          insights = await getInsights(accountId.trim());
        } catch (err) {
          console.error("Meta insights error:", err);
        }

        // Step 3: AI Analysis
        sendEvent(controller, encoder, "progress", { step: 3, total: 3, message: "Generez analiză AI..." });

        let aiInsights: string | undefined;
        try {
          const campaignSummary = (Array.isArray(campaigns) ? campaigns : []).slice(0, 15).map((c) => ({
            name: c.name, status: c.status || c.effective_status, objective: c.objective,
            budget: c.daily_budget || c.lifetime_budget,
          }));

          const msg = await anthropic.messages.create({
            model: "claude-sonnet-4-20250514",
            max_tokens: 1500,
            messages: [{
              role: "user",
              content: `Ești un expert Meta Ads. Analizează acest cont (${accountId}).

Campanii (${campaigns.length}):
${JSON.stringify(campaignSummary, null, 2)}

Insights cont:
${JSON.stringify(insights, null, 2)}

Oferă analiză strategică în limba română cu formatare markdown:
1. **Rezumat Cont** — status general, campanii active vs paused
2. **Analiza Obiectivelor** — distribuția obiectivelor, sunt potrivite?
3. **Performanță** — metrici cheie, ce funcționează
4. **Oportunități** — ce lipsește, ce poți optimiza
5. **Recomandări** — acțiuni concrete de îmbunătățire

Fii concis. Folosește **bold** pentru headere.`,
            }],
          });

          const tb = msg.content.find((b) => b.type === "text");
          if (tb && tb.type === "text") aiInsights = tb.text;
        } catch (err) {
          console.error("AI error:", err);
          aiInsights = "Nu s-au putut genera insights AI.";
        }

        sendEvent(controller, encoder, "result", {
          analysis: { accountId: accountId.trim(), campaigns, insights, aiInsights },
        });
      } catch (err) {
        sendEvent(controller, encoder, "error", { error: err instanceof Error ? err.message : "Eroare Meta Ads." });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, { headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" } });
}
