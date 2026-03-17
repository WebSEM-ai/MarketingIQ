import { getProductDetails, comparePrices } from "@/lib/services/google-shopping";

export const maxDuration = 30;

export async function POST(request: Request) {
  const body = await request.json();
  const { productId, country } = body as {
    productId: string;
    country?: string;
  };

  if (!productId) {
    return new Response(
      JSON.stringify({ error: "Product ID este obligatoriu." }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const [details, prices] = await Promise.allSettled([
      getProductDetails(productId, country),
      comparePrices(productId, country),
    ]);

    const productDetails =
      details.status === "fulfilled" ? details.value : null;
    const priceComparison =
      prices.status === "fulfilled" ? prices.value : [];

    return new Response(
      JSON.stringify({ details: productDetails, prices: priceComparison }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({
        error: err instanceof Error ? err.message : "Eroare la detalii produs.",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
