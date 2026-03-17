import { bulkFindVideoPosition } from "@/lib/services/youtube";

export const maxDuration = 30;

export async function POST(request: Request) {
  const body = await request.json();
  const { keywords, videoUrl, country } = body as {
    keywords: string[];
    videoUrl: string;
    country?: string;
  };

  if (!keywords?.length || !videoUrl) {
    return new Response(
      JSON.stringify({ error: "Keywords și Video URL sunt obligatorii." }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const rankings = await bulkFindVideoPosition(keywords, videoUrl, country);

    return new Response(JSON.stringify({ rankings }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({
        error: err instanceof Error ? err.message : "Eroare la rank tracking.",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
