const GEMINI_API_KEY = process.env.GOOGLE_GEMINI_API_KEY || "";
const GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models";
const GEMINI_MODEL = "gemini-2.5-flash-lite";

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function callGeminiAPI(prompt: string): Promise<string> {
  if (!GEMINI_API_KEY) throw new Error("GOOGLE_GEMINI_API_KEY missing");

  const url = `${GEMINI_BASE_URL}/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;
  const maxAttempts = 5;
  let attempt = 0;

  while (attempt < maxAttempts) {
    attempt++;
    const resp = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.4,
          topK: 30,
          topP: 0.9,
          maxOutputTokens: 8000,
        },
      }),
    });

    if (resp.ok) {
      const data = await resp.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) throw new Error("Gemini returned empty content");
      return text;
    }

    if ([429, 500, 502, 503].includes(resp.status)) {
      const backoff = Math.min(8000, 500 * Math.pow(2, attempt));
      console.log(`[Gemini] Rate limited (${resp.status}), retrying in ${backoff}ms (attempt ${attempt}/${maxAttempts})`);
      await delay(backoff);
      continue;
    }

    const errText = await resp.text();
    throw new Error(`Gemini API error ${resp.status}: ${errText}`);
  }

  throw new Error("Gemini API failed after retries");
}

export interface WorksheetItem {
  stem: string;
  passage?: string;
  diagramDescription?: string;
  options: Record<string, string>;
  correctAnswer: string;
  rationale: string;
}

function isElaReadingStandard(subject: string, standardCode: string, standardDescription: string): boolean {
  if (subject !== "ELA") return false;
  const code = standardCode.toLowerCase();
  const desc = standardDescription.toLowerCase();
  if (code.match(/^[\d]+\.rl\.|^[\d]+\.ri\.|^rl\.|^ri\./)) return true;
  if (desc.includes("read") || desc.includes("passage") || desc.includes("text") ||
      desc.includes("comprehension") || desc.includes("literary") || desc.includes("informational") ||
      desc.includes("evidence") || desc.includes("central idea") || desc.includes("theme") ||
      desc.includes("analyze") || desc.includes("author") || desc.includes("inference")) return true;
  return false;
}

function needsDiagramOrChart(subject: string, standardCode: string, standardDescription: string): boolean {
  const code = standardCode.toLowerCase();
  const desc = standardDescription.toLowerCase();
  if (desc.includes("graph") || desc.includes("chart") || desc.includes("diagram") ||
      desc.includes("table") || desc.includes("map") || desc.includes("plot") ||
      desc.includes("coordinate") || desc.includes("number line") || desc.includes("visual") ||
      desc.includes("data") || desc.includes("display") || desc.includes("represent") ||
      desc.includes("model") || desc.includes("figure") || desc.includes("illustration")) return true;
  if (subject === "Math" && (code.includes("sp.") || code.includes("g.") || code.includes("ns."))) return true;
  if (subject === "Science") return true;
  return false;
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
    ? "Generate ALL content (stems, options, rationale, passages) in Spanish."
    : "Generate all content in English.";

  const requiresPassage = isElaReadingStandard(params.subject, params.standardCode, params.standardDescription);
  const requiresDiagram = needsDiagramOrChart(params.subject, params.standardCode, params.standardDescription);

  let passageInstructions = "";
  let diagramInstructions = "";
  let extraJsonFields = "";

  if (requiresPassage) {
    passageInstructions = `
IMPORTANT: This is a reading standard. You MUST include a reading passage for the questions.
- Generate a grade-appropriate reading passage (150-250 words) that is relevant to the standard.
- For literary standards (RL): create a short fiction excerpt, poem, or narrative.
- For informational standards (RI): create a nonfiction passage (science article, biography, historical text).
- All questions must be answerable ONLY from the passage.
- Include the passage in a "passage" field in your JSON response.
- Group questions around the same passage (one passage for all items).`;
    extraJsonFields = `"passage": "The full reading passage text here...",`;
  }

  if (requiresDiagram) {
    diagramInstructions = `
IMPORTANT: This standard involves visual/graphical elements. For each question:
- Include a "diagramDescription" field that describes a diagram, chart, graph, table, number line, coordinate plane, or map that the student would reference.
- Write the description in clear detail so a teacher can draw/reproduce it. Example: "A bar graph showing rainfall in inches for January (3), February (2), March (5), April (7), May (4)."
- Questions MUST reference the described visual element.`;
    extraJsonFields += `"diagramDescription": "Detailed description of the visual element...",`;
  }

  const prompt = `You are an expert ACAP (Alabama Comprehensive Assessment Program) assessment writer.
Generate exactly ${params.itemCount} multiple-choice items for a printable worksheet.

Subject: ${params.subject}
Grade: ${params.grade}
Standard: ${params.standardCode} — ${params.standardDescription}
DOK Level: ${params.dokLevel}
${langInstr}
${passageInstructions}
${diagramInstructions}

Return ONLY valid JSON (no markdown fences, no extra text). The response must be a JSON array of objects:
[
  {
    ${extraJsonFields}
    "stem": "the question text",
    "options": {"A": "option text", "B": "option text", "C": "option text", "D": "option text"},
    "correctAnswer": "A",
    "rationale": "brief explanation"
  }
]`;

  console.log(`[Worksheet AI] Generating ${params.itemCount} items via Gemini (${GEMINI_MODEL}) for ${params.standardCode}, passage=${requiresPassage}, diagram=${requiresDiagram}`);

  const raw = await callGeminiAPI(prompt);
  let cleaned = raw.replace(/^```json?\n?/i, "").replace(/\n?```$/i, "").trim();

  function sanitizeJsonString(input: string): string {
    let result = '';
    let inString = false;
    let escape = false;
    for (let i = 0; i < input.length; i++) {
      const ch = input[i];
      if (escape) { result += ch; escape = false; continue; }
      if (ch === '\\' && inString) { result += ch; escape = true; continue; }
      if (ch === '"') { inString = !inString; result += ch; continue; }
      if (inString) {
        if (ch === '\n') { result += '\\n'; continue; }
        if (ch === '\r') { result += '\\r'; continue; }
        if (ch === '\t') { result += '\\t'; continue; }
        const code = ch.charCodeAt(0);
        if (code < 0x20) continue;
      }
      result += ch;
    }
    return result;
  }

  let items: any[];
  try {
    items = JSON.parse(cleaned);
  } catch (e1: any) {
    try {
      items = JSON.parse(sanitizeJsonString(cleaned));
    } catch (e2: any) {
      console.error("Worksheet AI parse error:", e2.message, "Raw:", raw.substring(0, 300));
      throw new Error("Failed to generate worksheet items. Please try again.");
    }
  }
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error("AI returned empty or non-array response");
  }
  return items.map((item: any) => ({
    stem: item.stem || "",
    passage: item.passage || undefined,
    diagramDescription: item.diagramDescription || undefined,
    options: item.options || {},
    correctAnswer: item.correctAnswer || "A",
    rationale: item.rationale || "",
  }));
}
