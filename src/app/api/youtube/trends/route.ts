import { getYouTubeTrends } from "@/lib/services/youtube";

export const maxDuration = 30;

export async function POST(request: Request) {
  const body = await request.json();
  const { category, country } = body as {
    category?: string;
    country?: string;
  };

  try {
    const trends = await getYouTubeTrends(category || "now", country || "ro");

    return new Response(JSON.stringify({ trends }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({
        error: err instanceof Error ? err.message : "Eroare la trends YouTube.",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
