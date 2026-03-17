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
            max_tokens: 4000,
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

**REGULI EDITORIALE STRICTE PENTRU CONȚINUT ONLINE (standard mai strict decât prospectul):**

Regula 1 — ASOCIEREA CU BOALA: Nu asocia direct produsul cu un diagnostic medical (sinuzită, infecție, boală). Folosește doar mențiuni autorizate.

Regula 2 — TERMINOLOGIE INTERZISĂ:
❌ Interzis: tratament, vindecare, prevenire, tămăduire, administrare
✅ Permis: suport, susținere, ameliorare, ajută, complementar, utilizare

Regula 3 — DISCLAIMERE OBLIGATORII: "Supliment alimentar, NU medicament", "Nu înlocuiesc dieta variată", "Consultați medicul dacă simptomele persistă"

Regula 4 — LIMBAJ MEDICAL vs DESCRIPTIV:
❌ Interzis: inflamație, infecție, congestie inflamatorie, edem, secreții purulente, agenți patogeni, bacterian/viral
✅ Permis: disconfort, presiune, senzație, secreții dense, stare de congestie
Regulă: Dacă termenul ar apărea într-o fișă medicală → evită-l. Dacă e limbaj uzual → permis.

Regula 5 — INTENSITATEA AFIRMAȚIILOR:
❌ "este eficient în…", "acționează asupra…", "reduce inflamația…", "are efect antiinflamator"
✅ "poate contribui la ameliorarea…", "ajută la ameliorarea…", "oferă suport natural…"
Online = material publicitar → toleranță mai mică decât prospectul.

Regula 6 — CAUZALITATE INTERZISĂ:
❌ "elimină cauza", "curăță sinusurile", "previne reapariția"
✅ "în contextul răcelilor care afectează…", "în episoadele de disconfort asociate"

Regula 7 — EVOLUȚIE SIMPTOME:
❌ "grăbește vindecarea", "scurtează durata", "previne complicațiile"
Obligatoriu: delimitare temporală + recomandare consult medical

Regula 8 — PUBLIC SENSIBIL: Menționați vârsta minimă și conținutul de alcool factual. NU relativizați, NU justificați.

Regula 9 — SEPARARE EDUCAȚIONAL-COMERCIAL: Prima parte = ghid general, a doua = produs ca opțiune complementară. NU introduceți produsul în primele paragrafe.

Regula 10 — COERENȚĂ CU PROSPECTUL: Online ai voie să spui MAI PUȚIN decât prospectul, niciodată MAI MULT.

CHECKLIST FINAL:
☐ Nu apare niciun diagnostic medical
☐ Nu apare niciun mecanism fiziologic
☐ Toate afirmațiile sunt "ajută / poate contribui"
☐ Disclaimerele sunt prezente și vizibile
☐ Dozajul este identic cu prospectul
☐ Este menționat conținutul de alcool (dacă există)
☐ Este menționată consultarea medicului
☐ Limbajul este descriptiv, nu clinic

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
