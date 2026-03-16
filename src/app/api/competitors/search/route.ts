import { NextResponse } from "next/server";
import { searchCompetitors } from "@/lib/services/scraper";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { query, country } = body as { query: string; country?: string };

    if (!query) {
      return NextResponse.json(
        { error: "Query-ul este obligatoriu." },
        { status: 400 }
      );
    }

    const results = await searchCompetitors(query, country);

    return NextResponse.json({ results });
  } catch (err) {
    console.error("Competitors search error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Eroare la căutare." },
      { status: 500 }
    );
  }
}
