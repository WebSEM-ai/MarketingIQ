import { searchProducts, filterByPriceRange } from "@/lib/services/google-shopping";
import Anthropic from "@anthropic-ai/sdk";
import type { ShoppingProduct, PriceRange } from "@/lib/types/shopping";

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

function calcPriceRange(products: ShoppingProduct[]): PriceRange | undefined {
  const prices = products
    .map((p) => p.extractedPrice)
    .filter((p): p is number => p !== null && p > 0);

  if (prices.length === 0) return undefined;

  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const avg = Math.round((prices.reduce((a, b) => a + b, 0) / prices.length) * 100) / 100;

  // Try to detect currency from first product price string
  const firstPrice = products.find((p) => p.price)?.price || "";
  let currency = "RON";
  if (firstPrice.includes("$") || firstPrice.includes("USD")) currency = "USD";
  else if (firstPrice.includes("€") || firstPrice.includes("EUR")) currency = "EUR";
  else if (firstPrice.includes("£") || firstPrice.includes("GBP")) currency = "GBP";
  else if (firstPrice.includes("RON") || firstPrice.includes("Lei") || firstPrice.includes("lei")) currency = "RON";

  const sellers = new Set(products.map((p) => p.seller).filter(Boolean));

  return { min, max, avg, currency, sellerCount: sellers.size };
}

export async function POST(request: Request) {
  const body = await request.json();
  const { query, country, minPrice, maxPrice, condition, sortBy } = body as {
    query: string;
    country?: string;
    minPrice?: number;
    maxPrice?: number;
    condition?: string;
    sortBy?: string;
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
        let products: ShoppingProduct[] = [];
        const hasPriceFilter = minPrice !== undefined && maxPrice !== undefined;
        const totalSteps = 2;

        // Step 1: Search products
        sendEvent(controller, encoder, "progress", {
          step: 1,
          total: totalSteps,
          message: hasPriceFilter
            ? `Caut produse "${query.trim()}" între ${minPrice}-${maxPrice}...`
            : `Caut produse pentru "${query.trim()}"...`,
        });

        try {
          if (hasPriceFilter) {
            products = await filterByPriceRange(
              query.trim(),
              minPrice!,
              maxPrice!,
              co,
              sortBy
            );
          } else {
            products = await searchProducts(query.trim(), co, { condition });
          }
        } catch (err) {
          console.error("Shopping search error:", err);
        }

        const priceRange = calcPriceRange(products);

        // Step 2: AI Insights
        sendEvent(controller, encoder, "progress", {
          step: 2,
          total: totalSteps,
          message: "Generez analiză AI de piață...",
        });

        let aiInsights: string | undefined;

        try {
          const productSummary = products.slice(0, 15).map((p) => ({
            title: p.title,
            price: p.price,
            seller: p.seller,
            rating: p.rating,
            reviews: p.reviews,
          }));

          const message = await anthropic.messages.create({
            model: "claude-sonnet-4-20250514",
            max_tokens: 1500,
            messages: [
              {
                role: "user",
                content: `Ești un expert în ecommerce și analiza prețurilor. Analizează aceste rezultate Google Shopping pentru "${query.trim()}" (piața: ${co.toUpperCase()}).

Produse găsite (${products.length}):
${JSON.stringify(productSummary, null, 2)}

${priceRange ? `Interval preț: ${priceRange.min} - ${priceRange.max} ${priceRange.currency} (medie: ${priceRange.avg}), ${priceRange.sellerCount} selleri` : "Nu s-au extras prețuri."}

Oferă o analiză strategică în limba română cu formatare markdown:

1. **Analiza Pieței** — overview al ofertelor, competiție între selleri
2. **Analiza Prețurilor** — distribuția prețurilor, ce e scump/ieftin și de ce
3. **Cele Mai Bune Oferte** — produse cu cel mai bun raport calitate/preț (bazat pe rating + preț)
4. **Recomandări** — sfaturi pentru cumpărător SAU pentru un seller care vrea să concureze pe această piață
5. **Tendințe** — ce indică aceste rezultate despre piață

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
            products,
            priceRange,
            aiInsights,
          },
        });
      } catch (err) {
        sendEvent(controller, encoder, "error", {
          error: err instanceof Error ? err.message : "Eroare la căutare.",
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
