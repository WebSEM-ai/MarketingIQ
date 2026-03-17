import { scrapePage, getOnPageSEO } from "@/lib/services/landing-page";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
export const maxDuration = 90;

function sendEvent(c: ReadableStreamDefaultController, e: TextEncoder, event: string, data: unknown) {
  c.enqueue(e.encode(`data: ${JSON.stringify({ event, ...(data as object) })}\n\n`));
}

export async function POST(request: Request) {
  const body = await request.json();
  const { url } = body as { url: string };

  if (!url?.trim()) {
    return new Response(JSON.stringify({ error: "URL-ul este obligatoriu." }), { status: 400, headers: { "Content-Type": "application/json" } });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        // Step 1: Scrape page
        sendEvent(controller, encoder, "progress", { step: 1, total: 4, message: "Extrag conținutul paginii..." });

        let pageContent = "";
        try {
          pageContent = await scrapePage(url.trim());
        } catch (err) {
          sendEvent(controller, encoder, "result", {
            analysis: {
              url: url.trim(), page_title: "", overall_score: 0, ux_score: 0, technical_score: 0,
              ux_elements: [], trackers: [], schema_markup: [], technical_elements: [],
              priority_actions: [], strengths: [],
              summary: `Nu am putut accesa pagina: ${err instanceof Error ? err.message : "eroare necunoscută"}.`,
            },
          });
          controller.close();
          return;
        }

        if (!pageContent || pageContent.length < 50) {
          sendEvent(controller, encoder, "result", {
            analysis: {
              url: url.trim(), page_title: "", overall_score: 0, ux_score: 0, technical_score: 0,
              ux_elements: [], trackers: [], schema_markup: [], technical_elements: [],
              priority_actions: [], strengths: [],
              summary: "Pagina nu conține suficient conținut text pentru analiză.",
            },
          });
          controller.close();
          return;
        }

        // Step 2: SEO technical data
        sendEvent(controller, encoder, "progress", { step: 2, total: 4, message: "Analizez datele tehnice SEO..." });
        const seoData = await getOnPageSEO(url.trim());
        const seoSummary = JSON.stringify(seoData).slice(0, 4000);

        // Step 3: AI analysis
        sendEvent(controller, encoder, "progress", { step: 3, total: 4, message: "Analiză AI a landing page-ului..." });
        const truncated = pageContent.slice(0, 10000);

        let aiResult: string | undefined;
        try {
          const msg = await anthropic.messages.create({
            model: "claude-sonnet-4-20250514",
            max_tokens: 6000,
            messages: [{
              role: "user",
              content: `Ești un expert UX/UI și technical SEO auditor. Analizează această landing page de produs și generează un raport detaliat.

URL analizat: ${url.trim()}

Conținut pagină (markdown):
---
${truncated}
---

Date tehnice SEO (JSON):
---
${seoSummary}
---

Analizează TOATE elementele de mai jos și scorează fiecare 0-100:

**UX/UI Elements (10 categorii):**
1. Hero/Header — value proposition, headline quality, claritate mesaj principal
2. Imagini Produs — calitate, unghiuri multiple, zoom, galerie
3. Butoane CTA — vizibilitate, claritate text, contrast culori, plasare strategică
4. Avantaje/Beneficii — listate clar, cu iconuri/vizuale, ușor de scanat
5. Reviews/Testimoniale — prezente, credibile, structurate, cu nume/stele
6. Claim-uri — clare, specifice, cu dovezi/surse, fără exagerări
7. Trust Signals — certificări, garanții, plata securizată, logo-uri parteneri
8. Navigare/Layout — flux logic, ierarhie vizuală, whitespace, secțiuni clare
9. Mobile Hints — indicatori responsive design, touch-friendly, font sizes
10. Social Proof — nr. utilizatori, mențiuni media, rating-uri agregate

**Technical Elements (7 categorii):**
1. Trackere — GA4, GTM, Meta Pixel, TikTok Pixel, Hotjar, Clarity, etc.
2. Schema.org — Product, Review, FAQ, BreadcrumbList markup
3. Meta Tags — OG tags, Twitter cards, canonical, meta description
4. Scripturi — număr total, defer/async, third-party vs first-party
5. Performance — optimizare imagini, lazy loading, dimensiuni fișiere
6. Securitate — HTTPS, CSP headers, mixed content
7. Accesibilitate — alt tags, ARIA labels, heading hierarchy, contrast

Răspunde în format JSON STRICT (fără text înainte sau după):
{
  "page_title": "<titlul paginii>",
  "ux_score": <0-100 medie ponderată UX>,
  "technical_score": <0-100 medie ponderată technical>,
  "ux_elements": [
    {
      "name": "<Hero/Header|Imagini Produs|Butoane CTA|Avantaje/Beneficii|Reviews/Testimoniale|Claim-uri|Trust Signals|Navigare/Layout|Mobile Hints|Social Proof>",
      "score": <0-100>,
      "status": "<excellent|good|needs-work|missing|critical>",
      "findings": ["<observație 1>", "<observație 2>"],
      "recommendations": ["<recomandare 1>", "<recomandare 2>"]
    }
  ],
  "trackers": [
    {"name": "<GA4|GTM|Meta Pixel|TikTok Pixel|Hotjar|Clarity|etc.>", "detected": <true|false>, "details": "<detalii opționale>"}
  ],
  "schema_markup": [
    {"type": "<Product|Review|FAQ|BreadcrumbList|Organization|etc.>", "detected": <true|false>, "details": "<detalii opționale>"}
  ],
  "technical_elements": [
    {
      "name": "<Meta Tags|Scripturi|Performance|Securitate|Accesibilitate>",
      "score": <0-100>,
      "status": "<good|warning|critical>",
      "findings": ["<observație>"],
      "recommendations": ["<recomandare>"]
    }
  ],
  "priority_actions": [
    "<acțiune prioritară 1 — cea mai importantă>",
    "<acțiune prioritară 2>",
    "<acțiune prioritară 3>",
    "<acțiune prioritară 4>",
    "<acțiune prioritară 5>"
  ],
  "strengths": [
    "<punct forte 1>",
    "<punct forte 2>",
    "<punct forte 3>"
  ],
  "summary": "<rezumat 2-3 propoziții cu verdictul general>"
}`,
            }],
          });

          const tb = msg.content.find((b) => b.type === "text");
          if (tb && tb.type === "text") aiResult = tb.text;
        } catch (err) {
          console.error("AI analysis error:", err);
        }

        // Step 4: Parse and send
        sendEvent(controller, encoder, "progress", { step: 4, total: 4, message: "Finalizez raportul..." });

        let parsed: Record<string, unknown> | null = null;
        if (!aiResult) {
          parsed = {
            page_title: "", ux_score: 0, technical_score: 0,
            ux_elements: [], trackers: [], schema_markup: [], technical_elements: [],
            priority_actions: [], strengths: [],
            summary: "Analiza AI nu a putut fi generată. Încearcă din nou.",
          };
        } else {
          try {
            let jsonText = aiResult.trim();
            const jsonMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)```/);
            if (jsonMatch) jsonText = jsonMatch[1].trim();
            parsed = JSON.parse(jsonText);
          } catch {
            parsed = {
              page_title: "", ux_score: 0, technical_score: 0,
              ux_elements: [], trackers: [], schema_markup: [], technical_elements: [],
              priority_actions: [], strengths: [],
              summary: aiResult,
            };
          }
        }

        const uxScore = (parsed?.ux_score as number) || 0;
        const techScore = (parsed?.technical_score as number) || 0;
        const overallScore = Math.round(uxScore * 0.6 + techScore * 0.4);

        sendEvent(controller, encoder, "result", {
          analysis: {
            url: url.trim(),
            page_title: parsed?.page_title || "",
            overall_score: overallScore,
            ux_score: uxScore,
            technical_score: techScore,
            ux_elements: parsed?.ux_elements || [],
            trackers: parsed?.trackers || [],
            schema_markup: parsed?.schema_markup || [],
            technical_elements: parsed?.technical_elements || [],
            priority_actions: parsed?.priority_actions || [],
            strengths: parsed?.strengths || [],
            summary: parsed?.summary || "",
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
