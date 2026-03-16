import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const META_PROMPT = `Ești un expert în ingineria prompturilor AI. Analizează următorul prompt și returnează EXCLUSIV un JSON valid, fără text adițional, fără markdown, fără explicații în afara JSON-ului.

Promptul de analizat:
"""
{PROMPT}
"""

Returnează exact acest format JSON:

{
  "clarity": {
    "score": 0-100,
    "label": "Slab|Mediu|Bun|Excelent",
    "explanation": "...",
    "suggestion": "...",
    "actionable_suggestions": [
      { "label": "scurt, 3-5 cuvinte", "textToAppend": "textul exact de adăugat în prompt pentru a îmbunătăți claritatea", "category": "append" }
    ]
  },
  "context": {
    "score": 0-100,
    "label": "Slab|Mediu|Bun|Excelent",
    "explanation": "...",
    "suggestion": "...",
    "actionable_suggestions": [
      { "label": "scurt, 3-5 cuvinte", "textToAppend": "textul exact de adăugat în prompt", "category": "append" }
    ]
  },
  "structure": {
    "score": 0-100,
    "label": "Slab|Mediu|Bun|Excelent",
    "explanation": "...",
    "suggestion": "...",
    "actionable_suggestions": [
      { "label": "scurt, 3-5 cuvinte", "textToAppend": "textul exact de adăugat în prompt", "category": "append" }
    ]
  },
  "constraints": {
    "score": 0-100,
    "label": "Slab|Mediu|Bun|Excelent",
    "explanation": "...",
    "suggestion": "...",
    "actionable_suggestions": [
      { "label": "scurt, 3-5 cuvinte", "textToAppend": "textul exact de adăugat în prompt", "category": "append" }
    ]
  },
  "tone": {
    "primary": "Formal|Casual|Autoritar|Tehnic|Creativ|Prietenos",
    "breakdown": { "Formal": 0-100, "Casual": 0-100, "Autoritar": 0-100, "Tehnic": 0-100, "Creativ": 0-100, "Prietenos": 0-100 }
  },
  "bias": {
    "level": "Scăzut|Mediu|Ridicat",
    "score": 0-100,
    "issues": [ { "fragment": "textul exact din prompt", "explanation": "explicație" } ]
  },
  "hallucination_risk": {
    "score": 0-100,
    "level": "Scăzut|Mediu|Ridicat",
    "risks": [ "descriere risc 1", "descriere risc 2" ]
  },
  "model_compatibility": {
    "gpt4o": { "score": 0-100, "reason": "..." },
    "claude35": { "score": 0-100, "reason": "..." },
    "gemini15": { "score": 0-100, "reason": "..." }
  },
  "template_suggestion": {
    "has_variables": true|false,
    "template": "promptul cu [VARIABILE] înlocuite sau null dacă nu are",
    "variables_detected": ["lista variabilelor găsite"]
  },
  "overall_score": 0-100
}

IMPORTANT:
- Scorurile label: 0-40 = "Slab", 41-69 = "Mediu", 70-89 = "Bun", 90-100 = "Excelent"
- overall_score este media ponderată: (clarity.score * 0.25 + context.score * 0.25 + structure.score * 0.25 + constraints.score * 0.25)
- Fiecare categorie (clarity, context, structure, constraints) TREBUIE să aibă 3-5 actionable_suggestions
- actionable_suggestions.label = text scurt pentru buton (ex: "Adaugă rol expert", "Specifică formatul")
- actionable_suggestions.textToAppend = textul EXACT care se va adăuga la sfârșitul promptului (ex: "\\nEști un expert în marketing digital cu 10 ani experiență.")
- actionable_suggestions.category = "append" (adaugă la sfârșit), "prepend" (adaugă la început)
- textToAppend trebuie să fie text concret, specific pentru promptul analizat, NU generic
- Răspunde DOAR cu JSON valid, nimic altceva.`;

export async function analyzePrompt(prompt: string) {
  const message = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    messages: [
      {
        role: "user",
        content: META_PROMPT.replace("{PROMPT}", prompt),
      },
    ],
  });

  const textBlock = message.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("No text response from Claude");
  }

  const jsonStr = textBlock.text.trim();
  return JSON.parse(jsonStr);
}
