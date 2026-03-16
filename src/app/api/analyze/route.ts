import { NextRequest, NextResponse } from "next/server";
import { analyzePrompt } from "@/lib/anthropic";

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json();

    if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
      return NextResponse.json(
        { error: "Promptul este obligatoriu." },
        { status: 400 }
      );
    }

    if (prompt.length > 10000) {
      return NextResponse.json(
        { error: "Promptul nu poate depăși 10.000 de caractere." },
        { status: 400 }
      );
    }

    const result = await analyzePrompt(prompt.trim());
    return NextResponse.json(result);
  } catch (error) {
    console.error("Analysis error:", error);
    return NextResponse.json(
      { error: "Eroare la analiza promptului. Încearcă din nou." },
      { status: 500 }
    );
  }
}
