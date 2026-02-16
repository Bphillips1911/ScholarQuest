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
      console.warn(`[Gemini] Attempt ${attempt}/${maxAttempts} failed with status ${resp.status}`);
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

export function generateFallbackItems(params: {
  subject: string; grade: number; standardCode: string; standardDescription: string;
  dokLevel: number; itemCount: number; language: string; includeTextDependentWriting?: boolean;
}): WorksheetItem[] {
  console.warn(`[Worksheet AI] Using fallback templates for ${params.standardCode} (${params.subject} G${params.grade})`);
  
  const items: WorksheetItem[] = [];
  const count = params.itemCount;
  
  if (params.subject === "Math") {
    const mathTemplates: WorksheetItem[] = [
      {
        stem: `Solve the following problem related to ${params.standardDescription}. Show all your work.`,
        options: { A: "12", B: "15", C: "18", D: "24" },
        correctAnswer: "C",
        rationale: `This question assesses understanding of ${params.standardCode}: ${params.standardDescription}`,
        type: "multiple_choice",
        visual: { type: "table", title: "Data Table", columns: ["Input (x)", "Output (y)"], rows: [["1","3"],["2","6"],["3","9"],["4","12"]] },
        diagramDescription: "A table showing input and output values"
      },
      {
        stem: `A student claims that the answer to a problem involving ${params.standardDescription.split(' ').slice(0,6).join(' ')} is always positive. Is this correct? Explain your reasoning.`,
        options: { A: "Always true", B: "Sometimes true", C: "Never true", D: "Cannot be determined" },
        correctAnswer: "B",
        rationale: "Students must analyze the claim and provide counterexamples.",
        type: "multiple_choice"
      },
      {
        stem: `Which of the following best represents the concept described in standard ${params.standardCode}?`,
        options: { A: "Option involving basic recall", B: "Option requiring analysis", C: "Option with common misconception", D: "Option requiring synthesis" },
        correctAnswer: "B",
        rationale: `Aligned to DOK ${params.dokLevel} requiring analytical thinking.`,
        type: "multiple_choice"
      },
      {
        stem: `Using the number line below, identify the value that satisfies the condition described in ${params.standardCode}.`,
        options: { A: "-3", B: "0", C: "2.5", D: "4" },
        correctAnswer: "C",
        rationale: "Number line analysis requires spatial reasoning.",
        type: "multiple_choice",
        visual: { type: "number_line", title: "Number Line", min: -5, max: 5, points: [{ value: 2.5, label: "P" }] },
        diagramDescription: "A number line from -5 to 5 with point P at 2.5"
      },
      {
        stem: `Explain how you would solve a problem involving ${params.standardDescription}. Show your complete solution with all steps.`,
        sampleAnswer: `Step 1: Identify the key information.\nStep 2: Apply the concept from ${params.standardCode}.\nStep 3: Calculate the result.\nStep 4: Verify the answer.`,
        correctAnswer: "See rubric",
        rationale: "Open response assessing procedural fluency and conceptual understanding.",
        type: "short_response",
        options: {},
        linesProvided: 8
      }
    ];
    for (let i = 0; i < count; i++) items.push({ ...mathTemplates[i % mathTemplates.length] });
  } else if (params.subject === "ELA") {
    const passage = `The morning sun cast long shadows across the schoolyard as Maya arrived early, clutching her notebook. She had spent the entire weekend preparing for the science fair, her project on renewable energy sources carefully documented with charts and data she had collected over three months. "This is going to be amazing," she whispered to herself, adjusting the poster board under her arm.\n\nAs she entered the gymnasium, Maya noticed that several other students had already set up their displays. Some projects looked polished and professional, while others appeared hastily assembled. She found her assigned table near the window and began arranging her materials methodically.\n\nMr. Thompson, the science teacher, walked by and paused at her table. "Impressive data collection, Maya," he said, examining her charts. "I can see you put real effort into the methodology." Maya beamed with pride, knowing that her careful approach to the scientific method had paid off.\n\nBy mid-morning, the judges began their rounds. Maya watched nervously as they stopped at each table, asking questions and taking notes. When they reached her display, she took a deep breath and began explaining her findings about solar panel efficiency in different weather conditions.\n\nThe lead judge, Dr. Chen, leaned forward with interest. "Tell me more about your control variables," she said. Maya explained how she had kept the panel angle constant while varying only the weather conditions, recording data at the same time each day for twelve weeks.`;
    
    const elaTemplates: WorksheetItem[] = [
      {
        stem: "Based on the passage, what can you infer about Maya's character? Use evidence from the text to support your answer.",
        passage,
        options: { A: "She is careless and unprepared", B: "She is methodical and dedicated", C: "She is competitive and aggressive", D: "She is shy and unsure of herself" },
        correctAnswer: "B",
        rationale: "Evidence: 'spent the entire weekend preparing,' 'carefully documented,' 'arranging her materials methodically'",
        type: "multiple_choice",
        passageReference: "Paragraphs 1-2"
      },
      {
        stem: "Which detail from the passage BEST supports the idea that Maya used the scientific method correctly?",
        passage,
        options: { A: "She arrived early to school", B: "She kept the panel angle constant while varying weather conditions", C: "She arranged her materials on the table", D: "She whispered to herself" },
        correctAnswer: "B",
        rationale: "Controlling variables is a key component of the scientific method.",
        type: "multiple_choice",
        passageReference: "Paragraph 5"
      },
      {
        stem: "Select ALL statements that are supported by evidence in the passage.",
        passage,
        options: { A: "Maya collected data over three months", B: "Maya won first place", C: "Mr. Thompson praised Maya's methodology", D: "The science fair was held in a classroom", E: "Dr. Chen asked about control variables" },
        correctAnswer: "A,C,E",
        correctAnswers: ["A", "C", "E"],
        rationale: "B is not stated. D contradicts 'gymnasium.'",
        type: "multiple_select"
      },
      {
        stem: "What is the meaning of 'methodically' as used in paragraph 2?",
        passage,
        options: { A: "Quickly and carelessly", B: "In a systematic and organized way", C: "With great difficulty", D: "Randomly and without planning" },
        correctAnswer: "B",
        rationale: "Context clues: 'carefully documented,' 'assigned table,' careful setup suggest organized behavior.",
        type: "multiple_choice",
        passageReference: "Paragraph 2"
      },
      {
        stem: "Based on the passage, explain how Maya demonstrated scientific thinking. Use at least two pieces of evidence from the text in your response.",
        passage,
        sampleAnswer: "Maya demonstrated scientific thinking by collecting data over twelve weeks and controlling her variables carefully. She kept the panel angle constant while only changing weather conditions, showing she understood the importance of a fair test.",
        correctAnswer: "See rubric",
        rationale: "Students should cite specific evidence about data collection, control variables, and methodology.",
        type: "short_response",
        options: {},
        linesProvided: 6
      }
    ];
    for (let i = 0; i < count; i++) items.push({ ...elaTemplates[i % elaTemplates.length] });
  } else {
    const sciTemplates: WorksheetItem[] = [
      {
        stem: `Which of the following best explains the concept related to ${params.standardDescription}?`,
        options: { A: "Explanation using common misconception", B: "Scientifically accurate explanation", C: "Partially correct explanation", D: "Unrelated explanation" },
        correctAnswer: "B",
        rationale: `This assesses understanding of ${params.standardCode}.`,
        type: "multiple_choice"
      },
      {
        stem: `A scientist is investigating a phenomenon related to ${params.standardDescription}. What would be the best experimental design?`,
        options: { A: "Observe without measuring", B: "Change all variables at once", C: "Control variables and measure one change", D: "Use only qualitative data" },
        correctAnswer: "C",
        rationale: "Proper experimental design requires controlling variables.",
        type: "multiple_choice"
      },
      {
        stem: `Describe how ${params.standardDescription} applies to a real-world situation. Provide a specific example and explain the science behind it.`,
        sampleAnswer: "A complete response should include a specific real-world example and scientific explanation.",
        correctAnswer: "See rubric",
        rationale: "Open response requires application of scientific concepts.",
        type: "short_response",
        options: {},
        linesProvided: 8
      }
    ];
    for (let i = 0; i < count; i++) items.push({ ...sciTemplates[i % sciTemplates.length] });
  }
  
  return items.slice(0, count);
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

  let raw: string;
  try {
    raw = await callGeminiAPI(prompt);
  } catch (aiError: any) {
    console.error(`[Worksheet AI] Gemini API failed: ${aiError.message}. Using fallback templates.`);
    return generateFallbackItems(params);
  }

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
          console.error("[Worksheet AI] JSON parse failed, using fallback. Raw:", raw.substring(0, 400));
          return generateFallbackItems(params);
        }
      } else {
        console.error("[Worksheet AI] No JSON found in response, using fallback. Raw:", raw.substring(0, 400));
        return generateFallbackItems(params);
      }
    }
  }

  const questions = parsed.questions || parsed;
  const items: any[] = Array.isArray(questions) ? questions : [];
  if (items.length === 0) {
    console.warn("[Worksheet AI] AI returned empty items, using fallback");
    return generateFallbackItems(params);
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

async function callGeminiRaw(prompt: string): Promise<string> {
  if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY missing");
  const url = `${GEMINI_BASE_URL}/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;
  const resp = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.9,
        maxOutputTokens: 8192,
      },
    }),
  });
  if (!resp.ok) {
    const errText = await resp.text();
    throw new Error(`Gemini API error ${resp.status}: ${errText}`);
  }
  const data = await resp.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Gemini returned empty content for illustration");
  return text;
}

export async function generatePassageIllustrationSVG(passageTitle: string, passageText: string): Promise<string | null> {
  const prompt = `
Create a simple, student-friendly SVG illustration for this reading passage.
Rules:
- Output ONLY raw SVG markup (no backticks, no markdown, no explanation).
- Size: width="900" height="320"
- Use simple shapes (rect, circle, line, path, polygon) and 2-4 colors.
- No text elements inside the SVG at all.
- Make it appropriate for grades 6-8.
- Keep it clean and minimal.

TITLE: ${passageTitle}
STORY (excerpt): ${String(passageText).slice(0, 900)}
`;

  try {
    const raw = await callGeminiRaw(prompt);
    let cleaned = String(raw).replace(/```xml\s*/gi, "").replace(/```svg\s*/gi, "").replace(/```\s*/g, "").trim();
    const match = cleaned.match(/<svg[\s\S]*<\/svg>/i);
    if (!match) {
      console.warn("[Illustration] Gemini did not return valid SVG. Raw (first 300):", cleaned.substring(0, 300));
      return null;
    }
    return match[0];
  } catch (e: any) {
    console.warn("[Illustration] Generation error:", e.message);
    return null;
  }
}
