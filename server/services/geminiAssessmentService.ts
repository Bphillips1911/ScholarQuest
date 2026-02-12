import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY || "");

export interface GeminiGeneratedItem {
  itemType: string;
  dokLevel: number;
  stem: string;
  options: { key: string; text: string }[];
  correctAnswer: string;
  explanation: string;
  difficulty: number;
  domain: string;
  standardCode: string;
}

interface BuilderParams {
  subject: string;
  gradeLevels: number[];
  itemCount: number;
  dokMix: { dok2: number; dok3: number; dok4: number };
  domainWeights: Record<string, number>;
  writingTypes?: string[];
}

const SUBJECT_DOMAINS: Record<string, Record<string, string[]>> = {
  Math: {
    "Number Systems": [
      "Apply properties of operations to solve multi-step problems with rational numbers",
      "Solve problems involving operations with integers, fractions, and decimals",
    ],
    "Ratios & Proportional": [
      "Analyze proportional relationships and use them to solve real-world problems",
      "Use ratios and proportional reasoning to solve multi-step problems",
    ],
    "Expressions & Equations": [
      "Write and solve multi-step linear equations and inequalities",
      "Analyze and solve pairs of simultaneous linear equations",
    ],
    "Geometry": [
      "Apply geometric properties to solve problems involving area, volume, and surface area",
      "Use transformations and coordinate geometry to solve problems",
    ],
    "Statistics": [
      "Draw inferences about populations based on random sampling",
      "Investigate patterns of association in bivariate data",
    ],
  },
  ELA: {
    "Reading Literature": [
      "Analyze how elements of a story interact and develop over the course of a text",
      "Determine a theme or central idea and analyze its development",
    ],
    "Reading Informational": [
      "Analyze the structure an author uses to organize a text including how sections contribute to the whole",
      "Evaluate an argument and specific claims in a text, assessing reasoning and evidence",
    ],
    "Writing": [
      "Write arguments to support claims with clear reasons and relevant evidence",
      "Write informative/explanatory texts to examine a topic with relevant facts and details",
    ],
    "Language": [
      "Demonstrate command of conventions of standard English grammar and usage",
      "Determine or clarify the meaning of unknown and multiple-meaning words and phrases",
    ],
  },
  Science: {
    "Physical Science": [
      "Analyze and interpret data on the properties of substances to determine whether they are pure substances or mixtures",
      "Develop and use models to describe the atomic composition of simple molecules and extended structures",
    ],
    "Life Science": [
      "Construct explanations based on evidence for how genetic variations of traits in a population increase survival",
      "Analyze and interpret data to provide evidence for the effects of resource availability on organisms",
    ],
    "Earth Science": [
      "Develop a model to describe the cycling of Earth's materials and the flow of energy",
      "Analyze and interpret data on natural hazards to forecast future catastrophic events",
    ],
  },
};

function buildPrompt(params: BuilderParams, batchDok: number, batchCount: number, domains: string[]): string {
  const domainDescriptions = domains.map(d => {
    const standards = SUBJECT_DOMAINS[params.subject]?.[d] || [];
    return `- ${d}: ${standards.join("; ")}`;
  }).join("\n");

  const gradeText = params.gradeLevels.join(", ");

  let writingInstruction = "";
  if (params.subject === "ELA" && params.writingTypes && params.writingTypes.length > 0) {
    writingInstruction = `\nInclude writing-related items covering these types: ${params.writingTypes.join(", ")}. These may be grammar, revision, or editing items aligned to writing standards.`;
  }

  return `You are an expert assessment item writer for the Alabama Comprehensive Assessment Program (ACAP) for grades ${gradeText} ${params.subject}.

Generate exactly ${batchCount} multiple-choice assessment items at DOK Level ${batchDok} (Webb's Depth of Knowledge).

DOK Level Guidelines:
- DOK 2: Skill/Concept — requires mental processing beyond recall; compare, classify, organize, estimate, interpret
- DOK 3: Strategic Thinking — requires reasoning, planning, using evidence, complex/abstract thinking, multi-step
- DOK 4: Extended Thinking — requires investigation, complex reasoning, applying concepts across multiple contexts

Subject: ${params.subject}
Grade Levels: ${gradeText}
Target Domains (distribute items across these proportionally):
${domainDescriptions}
${writingInstruction}

REQUIREMENTS:
1. Each item MUST have exactly 4 answer options (A, B, C, D)
2. Exactly ONE correct answer per item
3. All distractors must be plausible but clearly incorrect
4. Items must be grade-appropriate and standards-aligned
5. Stems should be clear and unambiguous
6. Avoid "all of the above" or "none of the above"
7. Include varied cognitive demands matching DOK ${batchDok}
8. Each item must have a brief explanation of why the correct answer is right

Respond ONLY with a valid JSON array. Each object must have these exact fields:
[
  {
    "itemType": "MC",
    "dokLevel": ${batchDok},
    "stem": "The question text here",
    "options": [
      {"key": "A", "text": "Option A text"},
      {"key": "B", "text": "Option B text"},
      {"key": "C", "text": "Option C text"},
      {"key": "D", "text": "Option D text"}
    ],
    "correctAnswer": "A",
    "explanation": "Brief explanation of why this answer is correct",
    "difficulty": 0.5,
    "domain": "Domain Name"
  }
]

Set difficulty between 0.3 and 0.9 based on item complexity. Assign each item to one of the target domains listed above.
Return ONLY the JSON array, no other text.`;
}

function parseGeminiResponse(text: string): GeminiGeneratedItem[] {
  let cleaned = text.trim();
  const jsonMatch = cleaned.match(/\[[\s\S]*\]/);
  if (jsonMatch) {
    cleaned = jsonMatch[0];
  }
  try {
    const items = JSON.parse(cleaned);
    if (!Array.isArray(items)) return [];
    return items.filter((item: any) =>
      item.stem && item.options && Array.isArray(item.options) && item.options.length === 4 && item.correctAnswer
    ).map((item: any) => ({
      itemType: item.itemType || "MC",
      dokLevel: item.dokLevel || 2,
      stem: item.stem,
      options: item.options.map((o: any) => ({ key: o.key, text: o.text })),
      correctAnswer: item.correctAnswer,
      explanation: item.explanation || "",
      difficulty: typeof item.difficulty === "number" ? item.difficulty : 0.5,
      domain: item.domain || "",
      standardCode: item.standardCode || "",
    }));
  } catch (e) {
    console.error("Failed to parse Gemini response:", e);
    return [];
  }
}

export async function generateSchoolwideAssessment(params: BuilderParams): Promise<GeminiGeneratedItem[]> {
  if (!process.env.GOOGLE_GEMINI_API_KEY) {
    throw new Error("Gemini API key is not configured. Please add the GOOGLE_GEMINI_API_KEY secret.");
  }

  const totalPct = (params.dokMix.dok2 || 0) + (params.dokMix.dok3 || 0) + (params.dokMix.dok4 || 0);
  const normalizedDok = totalPct > 0 ? {
    dok2: params.dokMix.dok2 / totalPct,
    dok3: params.dokMix.dok3 / totalPct,
    dok4: params.dokMix.dok4 / totalPct,
  } : { dok2: 0.3, dok3: 0.5, dok4: 0.2 };

  const dok2Count = Math.round(normalizedDok.dok2 * params.itemCount);
  const dok3Count = Math.round(normalizedDok.dok3 * params.itemCount);
  const dok4Count = Math.max(0, params.itemCount - dok2Count - dok3Count);

  const activeDomains = Object.entries(params.domainWeights)
    .filter(([_, w]) => w > 0)
    .map(([d]) => d);
  const domains = activeDomains.length > 0 ? activeDomains : Object.keys(SUBJECT_DOMAINS[params.subject] || {});

  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
  const allItems: GeminiGeneratedItem[] = [];

  const batches: { dok: number; count: number }[] = [];
  if (dok2Count > 0) batches.push({ dok: 2, count: dok2Count });
  if (dok3Count > 0) batches.push({ dok: 3, count: dok3Count });
  if (dok4Count > 0) batches.push({ dok: 4, count: dok4Count });

  for (const batch of batches) {
    const prompt = buildPrompt(params, batch.dok, batch.count, domains);
    let retries = 3;
    let delay = 5000;
    while (retries > 0) {
      try {
        const result = await model.generateContent(prompt);
        const text = result.response.text();
        const items = parseGeminiResponse(text);
        allItems.push(...items);
        console.log(`Gemini generated ${items.length}/${batch.count} DOK ${batch.dok} items for ${params.subject}`);
        break;
      } catch (error: any) {
        retries--;
        const isRateLimit = error.message?.includes("429") || error.message?.includes("quota") || error.message?.includes("Too Many Requests");
        if (isRateLimit && retries > 0) {
          console.log(`Gemini rate limited for DOK ${batch.dok}, retrying in ${delay / 1000}s (${retries} retries left)`);
          await new Promise(resolve => setTimeout(resolve, delay));
          delay *= 2;
        } else {
          console.error(`Gemini generation error for DOK ${batch.dok}:`, error.message);
          if (!isRateLimit) break;
        }
      }
    }
  }

  if (allItems.length === 0) {
    throw new Error("Gemini AI could not generate items at this time. This may be due to API rate limits — please wait a minute and try again, or reduce the item count.");
  }

  return allItems;
}
