import { callTool } from "@/lib/services/mcp-client";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
export const maxDuration = 90;

function sendEvent(c: ReadableStreamDefaultController, e: TextEncoder, event: string, data: unknown) {
  c.enqueue(e.encode(`data: ${JSON.stringify({ event, ...(data as object) })}\n\n`));
}

async function scrapeUrl(url: string): Promise<string> {
  const result = await callTool("web-scraping", "scrape_page", {
    url,
    render_js: false,
    return_page_markdown: true,
  }, 15000);

  if (typeof result === "string") return result;
  const data = result as Record<string, unknown>;
  return (data.markdown as string) || (data.content as string) || (data.text as string) || JSON.stringify(data);
}

export async function POST(request: Request) {
  const body = await request.json();
  const { url, productType } = body as { url: string; productType?: string };

  if (!url?.trim()) {
    return new Response(JSON.stringify({ error: "URL-ul produsului este obligatoriu." }), { status: 400, headers: { "Content-Type": "application/json" } });
  }

  const type = productType || "supliment-alimentar";
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        // Step 1: Fetch page
        sendEvent(controller, encoder, "progress", { step: 1, total: 3, message: `Extrag conținutul paginii...` });

        let pageContent = "";
        try {
          pageContent = await scrapeUrl(url.trim());
        } catch (err) {
          console.error("Scrape error:", err);
          sendEvent(controller, encoder, "error", { error: "Nu am putut accesa pagina. Verifică URL-ul." });
          controller.close();
          return;
        }

        if (!pageContent || pageContent.length < 50) {
          sendEvent(controller, encoder, "error", { error: "Pagina nu conține suficient conținut pentru analiză." });
          controller.close();
          return;
        }

        // Truncate to avoid token limits
        const truncated = pageContent.slice(0, 12000);

        // Step 2: Compliance analysis
        sendEvent(controller, encoder, "progress", { step: 2, total: 3, message: "Analizez conformitatea regulamentară..." });

        let complianceResult: string | undefined;
        try {
          const msg = await anthropic.messages.create({
            model: "claude-sonnet-4-20250514",
            max_tokens: 3000,
            messages: [{
              role: "user",
              content: `Ești un expert în reglementări farmaceutice și suplimente alimentare din România și UE. Analizează acest conținut al unei pagini de produs (tip: ${type}) pentru conformitate cu regulamentele aplicabile.

URL analizat: ${url.trim()}

Conținut pagină:
---
${truncated}
---

Analizează STRICT conform acestor reglementări:

**Regulament UE 1924/2006 — Mențiuni nutriționale și de sănătate:**
- Mențiuni de sănătate neautorizate (claims care promit vindecarea/prevenirea bolilor)
- Mențiuni funcționale fără autorizație EFSA
- Mențiuni exagerate sau înșelătoare

**Legislație România (ANMDMR, ANPC):**
- Lipsa mențiunii "Supliment alimentar" (obligatorie pentru suplimente)
- Lipsa disclaimerului "Acest produs nu este un medicament"
- Lipsa avertismentului "A nu se depăși doza zilnică recomandată"
- Lipsa mențiunii "A se păstra la loc ferit de copii"
- Lipsa compoziției/ingredientelor
- Lipsa dozajului recomandat
- Lipsa producătorului/distribuitorului

**Directiva 2002/46/CE — Suplimente alimentare:**
- Etichetare incompletă
- Informații nutriționale lipsă

**Regulament UE 432/2012 — Claims autorizate:**
- Verifică dacă mențiunile de sănătate sunt pe lista claims autorizate EFSA

**Publicitate înșelătoare (Legea 363/2007, OG 21/1992):**
- Promisiuni absolute de vindecare
- Testimoniale false/exagerate
- Comparații cu medicamente
- Imagini medicale înșelătoare

Răspunde în format JSON STRICT (fără text înainte sau după):
{
  "compliance_score": <0-100>,
  "risk_level": "scăzut|mediu|ridicat|critic",
  "product_name": "<detectat din pagină>",
  "product_type": "<supliment alimentar|produs cosmetic|dispozitiv medical|produs naturist>",
  "issues": [
    {
      "severity": "critic|major|minor|info",
      "category": "<categorie regulament>",
      "description": "<descriere problemă>",
      "regulation": "<regulament încălcat>",
      "recommendation": "<recomandare de remediere>",
      "quote": "<citat din pagină care încalcă, dacă există>"
    }
  ],
  "missing_elements": [
    "<element obligatoriu lipsă>"
  ],
  "positive_aspects": [
    "<ce este conform>"
  ],
  "summary": "<rezumat 2-3 propoziții>",
  "action_plan": "<plan de acțiune prioritizat>"
}`,
            }],
          });

          const tb = msg.content.find((b) => b.type === "text");
          if (tb && tb.type === "text") complianceResult = tb.text;
        } catch (err) {
          console.error("AI compliance error:", err);
        }

        // Step 3: Parse and send
        sendEvent(controller, encoder, "progress", { step: 3, total: 3, message: "Finalizez raportul..." });

        let parsed: Record<string, unknown> | null = null;
        if (complianceResult) {
          try {
            let jsonText = complianceResult.trim();
            const jsonMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)```/);
            if (jsonMatch) jsonText = jsonMatch[1].trim();
            parsed = JSON.parse(jsonText);
          } catch {
            // If parsing fails, send as raw insights
            parsed = {
              compliance_score: 0,
              risk_level: "necunoscut",
              issues: [],
              missing_elements: [],
              positive_aspects: [],
              summary: complianceResult,
              action_plan: "",
            };
          }
        }

        sendEvent(controller, encoder, "result", {
          analysis: {
            url: url.trim(),
            productType: type,
            pageLength: pageContent.length,
            compliance: parsed,
          },
        });
      } catch (err) {
        sendEvent(controller, encoder, "error", { error: err instanceof Error ? err.message : "Eroare la analiză." });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, { headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" } });
}
