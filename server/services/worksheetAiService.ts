const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_GEMINI_API_KEY || "";
const GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models";
const GEMINI_MODEL = "gemini-2.5-flash";

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function callGeminiAPI(prompt: string): Promise<string> {
  if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY missing");

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
          temperature: 0.8,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 65536,
          responseMimeType: "application/json",
        },
      }),
    });

    if (resp.ok) {
      const data = await resp.json();
      const candidate = data?.candidates?.[0];
      if (candidate?.finishReason === "MAX_TOKENS") {
        console.warn("[Gemini] Response truncated by MAX_TOKENS");
      }
      const text = candidate?.content?.parts?.[0]?.text;
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
  type?: string;
  passageReference?: string;
  sampleAnswer?: string;
  rubric?: string;
  linesProvided?: number;
  visual?: any;
  correctAnswers?: string[];
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

function isElaWritingStandard(subject: string, standardCode: string, standardDescription: string): boolean {
  if (subject !== "ELA") return false;
  const code = standardCode.toLowerCase();
  const desc = standardDescription.toLowerCase();
  if (code.includes("w.") || code.includes("cl.")) return true;
  if (desc.includes("write") || desc.includes("writing") || desc.includes("argument") ||
      desc.includes("narrative") || desc.includes("informative") || desc.includes("explanatory") ||
      desc.includes("claim") || desc.includes("evidence") || desc.includes("opinion") ||
      desc.includes("compose") || desc.includes("draft") || desc.includes("essay")) return true;
  return false;
}

function needsDiagramOrChart(subject: string, standardCode: string, standardDescription: string): boolean {
  const desc = standardDescription.toLowerCase();
  if (desc.includes("graph") || desc.includes("chart") || desc.includes("diagram") ||
      desc.includes("table") || desc.includes("map") || desc.includes("plot") ||
      desc.includes("coordinate") || desc.includes("number line") || desc.includes("visual") ||
      desc.includes("data") || desc.includes("display") || desc.includes("represent") ||
      desc.includes("model") || desc.includes("figure") || desc.includes("illustration")) return true;
  const code = standardCode.toLowerCase();
  if (subject === "Math" && (code.includes("sp.") || code.includes("dsp.") || code.includes("g.") || code.includes("gm.") || code.includes("ns."))) return true;
  if (subject === "Science") return true;
  return false;
}

function getDokGuidance(dokLevel: number): string {
  switch (dokLevel) {
    case 1: return "Recall and Reproduction: Facts, definitions, simple procedures.";
    case 2: return "Skills/Concepts: Classify, compare, organize, estimate, interpret.";
    case 3: return "Strategic Thinking: Analyze, evaluate, justify, cite evidence, draw conclusions, formulate hypotheses. Requires reasoning and planning.";
    case 4: return "Extended Thinking: Synthesize across sources, design investigations, apply concepts in novel contexts, connect and relate ideas across disciplines.";
    default: return "";
  }
}

export async function generateWorksheetItems(params: {
  subject: string;
  grade: number;
  standardCode: string;
  standardDescription: string;
  dokLevel: number;
  itemCount: number;
  language: string;
  includeTextDependentWriting?: boolean;
}): Promise<WorksheetItem[]> {
  const langInstr = params.language === "es"
    ? "Generate ALL content (stems, options, rationale, passages) in Spanish."
    : "Generate all content in English.";

  const isELA = params.subject === "ELA";
  const isMath = params.subject === "Math";
  const requiresPassage = isElaReadingStandard(params.subject, params.standardCode, params.standardDescription);
  const requiresWriting = isElaWritingStandard(params.subject, params.standardCode, params.standardDescription);
  const requiresDiagram = needsDiagramOrChart(params.subject, params.standardCode, params.standardDescription);
  const includeTDW = params.includeTextDependentWriting || (isELA && params.dokLevel >= 3);

  let prompt = `You are an expert Alabama educator creating EduCAP assessment materials aligned to ACAP standards.

Create a ${params.subject} worksheet for Grade ${params.grade} aligned to standard: ${params.standardCode} — ${params.standardDescription}

Requirements:
- Generate EXACTLY ${params.itemCount} questions
- All questions must be DOK Level ${params.dokLevel}
- ${langInstr}

DOK Level ${params.dokLevel} Guidelines:
${getDokGuidance(params.dokLevel)}

`;

  if (isELA && (requiresPassage || requiresWriting || includeTDW)) {
    prompt += `
ELA-SPECIFIC REQUIREMENTS:
1. Include a FULL-LENGTH reading passage (400-600 words for grades 6-8)
2. The passage should be engaging, grade-appropriate, and build reading stamina
3. Match the genre/style specified in the standard (narrative, informational, argumentative)
4. Include vocabulary appropriate for the grade level

5. Questions should reference the passage with:
   - Textual evidence questions (cite paragraphs)
   - Inference questions
   - Main idea/theme questions
   - Author's purpose questions
   - Vocabulary in context

6. Include diverse question types:
   - Multiple choice (4 options) — at least 60% of items
   - Multiple select (select all that apply) — at least 1 item
   - Short constructed response (2-3 sentences with text evidence) — at least 1 item
`;

    if (includeTDW) {
      prompt += `
TEXT-DEPENDENT WRITING (REQUIRED — DOK ${params.dokLevel}):
Include at least 1 Text-Dependent Writing prompt as the LAST question.
This must be DOK Level 3-4 extended writing that:
- Requires students to analyze, evaluate, or synthesize information from the passage
- Demands textual evidence and citations from the passage
- Requires a multi-paragraph response (introduction, body, conclusion)
- Includes a detailed scoring rubric (4-point scale)
- Provides a sample/model response
- The prompt type should match the standard:
  * Argumentative: take a position and defend with evidence
  * Informative/Explanatory: explain a concept using text evidence
  * Narrative: write a continuation or response to the passage
`;
    }

    prompt += `
Return ONLY valid JSON (no markdown, no extra text). Use this exact structure:
{
  "passage": {
    "title": "Engaging title",
    "author": "Author name",
    "genre": "narrative/informational/argumentative",
    "text": "FULL passage text, 400-600 words, multiple paragraphs",
    "wordCount": 500
  },
  "questions": [
    {
      "type": "multiple_choice",
      "stem": "According to paragraph 3, which statement best describes...?",
      "options": {"A": "option", "B": "option", "C": "option", "D": "option"},
      "correctAnswer": "B",
      "rationale": "Explanation with passage reference",
      "passageReference": "Paragraph 3"
    },
    {
      "type": "multiple_select",
      "stem": "Select ALL statements supported by evidence in the passage.",
      "options": {"A": "opt1", "B": "opt2", "C": "opt3", "D": "opt4"},
      "correctAnswers": ["B", "C"],
      "correctAnswer": "B,C",
      "rationale": "Why B and C are correct"
    },
    {
      "type": "short_response",
      "stem": "Based on the passage, explain the author's main purpose. Use evidence from the text.",
      "sampleAnswer": "Example strong response",
      "rubric": "2 points: Clear with evidence. 1 point: Vague. 0 points: No evidence.",
      "correctAnswer": "See rubric",
      "rationale": "Key points to look for",
      "linesProvided": 6
    }${includeTDW ? `,
    {
      "type": "text_dependent_writing",
      "stem": "Write a multi-paragraph response analyzing [topic from passage]. Use specific evidence from the text to support your analysis.",
      "sampleAnswer": "Multi-paragraph model response with introduction, body paragraphs with evidence, and conclusion",
      "rubric": "4: Thorough analysis with multiple text evidence. 3: Good analysis with some evidence. 2: Basic with limited evidence. 1: Minimal. 0: Off-topic.",
      "correctAnswer": "See rubric",
      "rationale": "Key analytical points and evidence to include",
      "linesProvided": 20
    }` : ''}
  ]
}`;
  } else if (isMath) {
    prompt += `
MATH-SPECIFIC REQUIREMENTS:
1. Include structured visual data for at least 50% of questions. When a question benefits from a visual (table, bar chart, number line, coordinate plane), include a "visual" object in JSON with structured data the renderer can use.
2. Supported visual types:
   - "table": { "type": "table", "title": "Title", "columns": ["Col1","Col2"], "rows": [["val1","val2"]] }
   - "bar_chart": { "type": "bar_chart", "title": "Title", "labels": ["A","B","C"], "values": [10,20,30] }
   - "number_line": { "type": "number_line", "title": "Title", "min": -5, "max": 5, "points": [{"value": 2, "label": "P"}] }
   - "coordinate_plane": { "type": "coordinate_plane", "title": "Title", "points": [{"x": 3, "y": 4}, {"x": -1, "y": 2}] }
3. If a question does not need a visual, omit the "visual" field entirely.
4. Also include a "diagramDescription" text field describing the visual for accessibility.
5. Question types:
   - Multiple choice with visual analysis
   - Multiple select (at least 1)
   - Short response requiring work shown (at least 1)

Return ONLY valid JSON (no markdown, no extra text). Use this exact structure:
{
  "questions": [
    {
      "type": "multiple_choice",
      "stem": "Question text referencing the visual",
      "visual": {
        "type": "bar_chart",
        "title": "Population Data",
        "labels": ["A","B","C","D"],
        "values": [75000,210000,15000,180000]
      },
      "diagramDescription": "A bar graph showing population data for groups A, B, C, D",
      "options": {"A": "opt1", "B": "opt2", "C": "opt3", "D": "opt4"},
      "correctAnswer": "B",
      "rationale": "Explanation"
    },
    {
      "type": "multiple_select",
      "stem": "Select ALL true statements based on the table.",
      "visual": {
        "type": "table",
        "title": "Data Table",
        "columns": ["Item", "Value"],
        "rows": [["X", "100"], ["Y", "250"]]
      },
      "diagramDescription": "A data table with items and values",
      "options": {"A": "opt1", "B": "opt2", "C": "opt3", "D": "opt4", "E": "opt5"},
      "correctAnswers": ["A", "C"],
      "correctAnswer": "A,C",
      "rationale": "Why A and C are correct"
    },
    {
      "type": "short_response",
      "stem": "Show your work to solve...",
      "diagramDescription": "Visual description if needed",
      "sampleAnswer": "Step-by-step solution",
      "correctAnswer": "The answer",
      "rationale": "Solution steps",
      "linesProvided": 6
    }
  ]
}`;
  } else {
    prompt += `
Include diagram/visual descriptions where appropriate for Science standards.

Return ONLY valid JSON (no markdown, no extra text). Use this exact structure:
{
  "questions": [
    {
      "type": "multiple_choice",
      "stem": "Question text",
      "diagramDescription": "Visual description if applicable",
      "options": {"A": "opt1", "B": "opt2", "C": "opt3", "D": "opt4"},
      "correctAnswer": "B",
      "rationale": "Explanation"
    }
  ]
}`;
  }

  console.log(`[Worksheet AI] Generating ${params.itemCount} items via Gemini (${GEMINI_MODEL}) for ${params.standardCode}, passage=${requiresPassage}, diagram=${requiresDiagram}, TDW=${includeTDW}`);

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

  let parsed: any;
  try {
    parsed = JSON.parse(cleaned);
  } catch (e1: any) {
    try {
      parsed = JSON.parse(sanitizeJsonString(cleaned));
    } catch (e2: any) {
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          parsed = JSON.parse(sanitizeJsonString(jsonMatch[0]));
        } catch (e3: any) {
          console.error("Worksheet AI parse error:", e3.message, "Raw:", raw.substring(0, 400));
          throw new Error("Failed to generate worksheet items. Please try again.");
        }
      } else {
        console.error("Worksheet AI parse error:", e2.message, "Raw:", raw.substring(0, 400));
        throw new Error("Failed to generate worksheet items. Please try again.");
      }
    }
  }

  const questions = parsed.questions || parsed;
  const items: any[] = Array.isArray(questions) ? questions : [];
  if (items.length === 0) {
    throw new Error("AI returned empty or invalid response");
  }

  const passageData = parsed.passage || null;

  return items.map((item: any) => ({
    stem: item.stem || item.text || "",
    passage: passageData ? (typeof passageData === 'string' ? passageData : passageData.text) : (item.passage || undefined),
    diagramDescription: item.diagramDescription || (item.visual?.description) || undefined,
    options: item.options || {},
    correctAnswer: item.correctAnswer || (item.correctAnswers ? item.correctAnswers.join(",") : "A"),
    rationale: item.rationale || item.explanation || "",
    type: item.type || "multiple_choice",
    passageReference: item.passageReference || undefined,
    sampleAnswer: item.sampleAnswer || undefined,
    rubric: item.rubric || undefined,
    linesProvided: item.linesProvided || undefined,
    visual: item.visual || undefined,
    correctAnswers: item.correctAnswers || undefined,
  }));
}
