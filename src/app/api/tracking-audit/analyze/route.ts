import { scrapePageHTML, getOnPageSEO } from "@/lib/services/tracking-audit";
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
        // Step 1: Scrape page HTML (with script tags)
        sendEvent(controller, encoder, "progress", { step: 1, total: 4, message: "Deschid pagina și extrag codul sursă..." });

        let pageHTML = "";
        try {
          pageHTML = await scrapePageHTML(url.trim());
        } catch (err) {
          sendEvent(controller, encoder, "result", {
            analysis: {
              url: url.trim(), overall_score: 0, verdict: "Eroare", verdict_tagline: "Pagina nu a putut fi accesată",
              platform_scores: { meta: 0, google: 0, tiktok: 0, gtm: 0, gdpr: 0, datalayer: 0 },
              platforms_detected: [], issues: [], gdpr_violations: [], tracking_before_consent: [],
              datalayer_events: [], quick_wins: [],
              summary: `Nu am putut accesa pagina: ${err instanceof Error ? err.message : "eroare necunoscută"}.`,
            },
          });
          controller.close();
          return;
        }

        if (!pageHTML || pageHTML.length < 50) {
          sendEvent(controller, encoder, "result", {
            analysis: {
              url: url.trim(), overall_score: 0, verdict: "Eroare", verdict_tagline: "Conținut insuficient",
              platform_scores: { meta: 0, google: 0, tiktok: 0, gtm: 0, gdpr: 0, datalayer: 0 },
              platforms_detected: [], issues: [], gdpr_violations: [], tracking_before_consent: [],
              datalayer_events: [], quick_wins: [],
              summary: "Pagina nu conține suficient conținut pentru analiză.",
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
        sendEvent(controller, encoder, "progress", { step: 3, total: 4, message: "Analizez tracking-ul cu AI..." });

        // Truncate to 15KB (larger than landing-page because we need script content)
        const truncated = pageHTML.slice(0, 15000);

        let aiResult: string | undefined;
        try {
          const msg = await anthropic.messages.create({
            model: "claude-sonnet-4-20250514",
            max_tokens: 6000,
            messages: [{
              role: "user",
              content: `Ești un expert în web tracking, tag management și GDPR compliance cu 15 ani experiență.
Analizează codul sursă al acestei pagini și evaluează implementarea completă a tracking-ului.

URL analizat: ${url.trim()}

Conținut pagină (HTML/source):
---
${truncated}
---

Date tehnice SEO (JSON):
---
${seoSummary}
---

Analizează TOATE elementele de mai jos:

**META PIXEL (Facebook/Instagram):**
- Caută: facebook.com/tr, fbq(), connect.facebook.net/en_US/fbevents.js
- Evenimente: PageView, ViewContent, AddToCart, Purchase, InitiateCheckout, Lead
- Parametri: content_type, content_ids, value, currency
- Pixel ID prezent? Care e ID-ul?
- Conversions API (server-side) detectat?
- Duplicate pixel fires?

**GOOGLE ANALYTICS / GA4:**
- Caută: gtag.js, googletagmanager.com/gtag, GA4 measurement ID (G-XXXXXXXXX)
- Universal Analytics (UA-) încă activ? (deprecat)
- Evenimente ecommerce: purchase, add_to_cart, view_item, begin_checkout
- Parametri tranzacție: transaction_id, value, currency, items array
- Google Ads conversion tracking (AW-) prezent?

**GOOGLE TAG MANAGER:**
- Caută: googletagmanager.com/gtm.js, container ID (GTM-XXXXXXX)
- noscript fallback prezent?
- DataLayer inițializat ÎNAINTE de GTM snippet?
- Containere multiple? (fiecare e un risc)

**TIKTOK PIXEL:**
- Caută: analytics.tiktok.com, ttq.load(), ttq.track()
- Evenimente standard: ViewContent, AddToCart, PlaceAnOrder, CompletePayment
- Pixel ID prezent?

**GDPR / COOKIE CONSENT (CRITIC!):**
- Banner de cookies detectat? (CookieBot, OneTrust, CookieYes, Complianz, GDPR Cookie Compliance, custom)
- Categorii pre-bifate (pre-checked)? → ÎNCĂLCARE GDPR CRITICĂ dacă da
- Buton de refuz (Reject/Decline/Refuză) vizibil pe primul ecran?
- Scripturi de tracking încărcate ÎNAINTE de mecanismul de consimțământ?
  (caută dacă script-urile fb, gtag, ttq sunt în <head> fără condiționare de cookie consent)
- Dark patterns: culori manipulative pe butoane?
- Cookie policy link prezent?

**DATALAYER:**
- window.dataLayer inițializat?
- Evenimente push detectate (dataLayer.push)
- Structura datelor ecommerce (items, value, currency)
- Parametri lipsă per eveniment

Scorează FIECARE platformă 0-100. Dacă o platformă NU este detectată, scorul e 0.
Scorul general: medie ponderată (platformele detectate au greutate mai mare).

Răspunde STRICT în JSON (fără text înainte sau după):
{
  "overall_score": <0-100>,
  "verdict": "<Critic|Slab|Mediu|Bun|Excelent>",
  "verdict_tagline": "<frază scurtă 10-15 cuvinte>",
  "platform_scores": {
    "meta": <0-100>,
    "google": <0-100>,
    "tiktok": <0-100>,
    "gtm": <0-100>,
    "gdpr": <0-100>,
    "datalayer": <0-100>
  },
  "platforms_detected": ["meta", "google", "tiktok", "gtm"],
  "issues": [
    {
      "severity": "<critical|warning|good>",
      "platform": "<meta|google|tiktok|gtm|gdpr|datalayer>",
      "text": "<titlu scurt al problemei sau aspectului pozitiv>",
      "detail": "<explicație tehnică detaliată>",
      "suggestion": "<recomandare concretă de remediere>"
    }
  ],
  "gdpr_violations": ["<descriere violare GDPR 1>"],
  "tracking_before_consent": ["<script/pixel care se încarcă înainte de consent>"],
  "datalayer_events": [
    {
      "event": "<numele evenimentului detectat>",
      "has_required_params": <true|false>,
      "missing_params": ["<parametru lipsă>"]
    }
  ],
  "quick_wins": [
    "<acțiune rapidă 1 — impact maxim>",
    "<acțiune rapidă 2>",
    "<acțiune rapidă 3>"
  ],
  "summary": "<rezumat 2-3 propoziții în română cu verdictul general>"
}`,
            }],
          });

          const tb = msg.content.find((b) => b.type === "text");
          if (tb && tb.type === "text") aiResult = tb.text;
        } catch (err) {
          console.error("AI tracking analysis error:", err);
        }

        // Step 4: Parse and send
        sendEvent(controller, encoder, "progress", { step: 4, total: 4, message: "Finalizez raportul..." });

        let parsed: Record<string, unknown> | null = null;
        if (!aiResult) {
          parsed = {
            overall_score: 0, verdict: "Eroare", verdict_tagline: "Analiza nu a putut fi generată",
            platform_scores: { meta: 0, google: 0, tiktok: 0, gtm: 0, gdpr: 0, datalayer: 0 },
            platforms_detected: [], issues: [], gdpr_violations: [], tracking_before_consent: [],
            datalayer_events: [], quick_wins: [],
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
              overall_score: 0, verdict: "Eroare", verdict_tagline: "Parsare eșuată",
              platform_scores: { meta: 0, google: 0, tiktok: 0, gtm: 0, gdpr: 0, datalayer: 0 },
              platforms_detected: [], issues: [], gdpr_violations: [], tracking_before_consent: [],
              datalayer_events: [], quick_wins: [],
              summary: aiResult,
            };
          }
        }

        sendEvent(controller, encoder, "result", {
          analysis: {
            url: url.trim(),
            overall_score: (parsed?.overall_score as number) || 0,
            verdict: parsed?.verdict || "Necunoscut",
            verdict_tagline: parsed?.verdict_tagline || "",
            platform_scores: parsed?.platform_scores || { meta: 0, google: 0, tiktok: 0, gtm: 0, gdpr: 0, datalayer: 0 },
            platforms_detected: parsed?.platforms_detected || [],
            issues: parsed?.issues || [],
            gdpr_violations: parsed?.gdpr_violations || [],
            tracking_before_consent: parsed?.tracking_before_consent || [],
            datalayer_events: parsed?.datalayer_events || [],
            quick_wins: parsed?.quick_wins || [],
            summary: parsed?.summary || "",
          },
        });
      } catch (err) {
        sendEvent(controller, encoder, "result", {
          analysis: {
            url: url.trim(), overall_score: 0, verdict: "Eroare", verdict_tagline: "Eroare neașteptată",
            platform_scores: { meta: 0, google: 0, tiktok: 0, gtm: 0, gdpr: 0, datalayer: 0 },
            platforms_detected: [], issues: [], gdpr_violations: [], tracking_before_consent: [],
            datalayer_events: [], quick_wins: [],
            summary: `Eroare: ${err instanceof Error ? err.message : "Eroare necunoscută."}`,
          },
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, { headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" } });
}
