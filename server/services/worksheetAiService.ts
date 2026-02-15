import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

export interface WorksheetItem {
  stem: string;
  options: Record<string, string>;
  correctAnswer: string;
  rationale: string;
}

export async function generateWorksheetItems(params: {
  subject: string;
  grade: number;
  standardCode: string;
  standardDescription: string;
  dokLevel: number;
  itemCount: number;
  language: string;
}): Promise<WorksheetItem[]> {
  const langInstr = params.language === "es"
    ? "Generate ALL content (stems, options, rationale) in Spanish."
    : "Generate all content in English.";

  const prompt = `You are an expert ACAP (Alabama Comprehensive Assessment Program) assessment writer.
Generate exactly ${params.itemCount} multiple-choice items for a printable worksheet.

Subject: ${params.subject}
Grade: ${params.grade}
Standard: ${params.standardCode} — ${params.standardDescription}
DOK Level: ${params.dokLevel}
${langInstr}

Return a JSON array of objects, each with:
- "stem": the question text
- "options": an object with keys "A","B","C","D" and string values
- "correctAnswer": one of "A","B","C","D"
- "rationale": a brief explanation of why the correct answer is right

Return ONLY valid JSON. No markdown fences or extra text.`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.7,
    max_tokens: 4000,
  });

  const raw = response.choices[0]?.message?.content?.trim() || "[]";
  const cleaned = raw.replace(/^```json?\n?/i, "").replace(/\n?```$/i, "").trim();

  try {
    const items = JSON.parse(cleaned);
    if (!Array.isArray(items) || items.length === 0) {
      throw new Error("AI returned empty or non-array response");
    }
    return items.map((item: any) => ({
      stem: item.stem || "",
      options: item.options || {},
      correctAnswer: item.correctAnswer || "A",
      rationale: item.rationale || "",
    }));
  } catch (e: any) {
    console.error("Worksheet AI parse error:", e.message, "Raw:", raw.substring(0, 200));
    throw new Error("Failed to generate worksheet items. Please try again.");
  }
}
