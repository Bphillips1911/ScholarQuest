import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

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

function buildPrompt(params: BuilderParams, dokDistribution: { dok: number; count: number }[], domains: string[]): string {
  const domainDescriptions = domains.map(d => {
    const standards = SUBJECT_DOMAINS[params.subject]?.[d] || [];
    return `- ${d}: ${standards.join("; ")}`;
  }).join("\n");

  const gradeText = params.gradeLevels.join(", ");
  const totalCount = dokDistribution.reduce((sum, d) => sum + d.count, 0);
  const dokBreakdown = dokDistribution.map(d => `${d.count} items at DOK ${d.dok}`).join(", ");

  let writingInstruction = "";
  if (params.subject === "ELA" && params.writingTypes && params.writingTypes.length > 0) {
    writingInstruction = `\nInclude writing-related items covering these types: ${params.writingTypes.join(", ")}. These may be grammar, revision, or editing items aligned to writing standards.`;
  }

  return `Generate exactly ${totalCount} multiple-choice assessment items for grades ${gradeText} ${params.subject} (ACAP-aligned).

DOK distribution: ${dokBreakdown}.
DOK 2=Skill/Concept, DOK 3=Strategic Thinking, DOK 4=Extended Thinking.

Domains: ${domainDescriptions}
${writingInstruction}

Rules: 4 options (A-D), 1 correct, plausible distractors, grade-appropriate, no "all/none of the above".

JSON array only. Each object: {"itemType":"MC","dokLevel":N,"stem":"...","options":[{"key":"A","text":"..."},{"key":"B","text":"..."},{"key":"C","text":"..."},{"key":"D","text":"..."}],"correctAnswer":"A","explanation":"...","difficulty":0.5,"domain":"..."}`;
}

function parseAIResponse(text: string): GeminiGeneratedItem[] {
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
    console.error("Failed to parse AI response:", e);
    return [];
  }
}

export async function generateSchoolwideAssessment(params: BuilderParams): Promise<GeminiGeneratedItem[]> {
  if (!process.env.AI_INTEGRATIONS_OPENAI_API_KEY || !process.env.AI_INTEGRATIONS_OPENAI_BASE_URL) {
    throw new Error("OpenAI API is not configured. Please ensure the AI integration is set up.");
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

  const dokDistribution: { dok: number; count: number }[] = [];
  if (dok2Count > 0) dokDistribution.push({ dok: 2, count: dok2Count });
  if (dok3Count > 0) dokDistribution.push({ dok: 3, count: dok3Count });
  if (dok4Count > 0) dokDistribution.push({ dok: 4, count: dok4Count });

  const prompt = buildPrompt(params, dokDistribution, domains);
  let allItems: GeminiGeneratedItem[] = [];
  let retries = 3;
  let delay = 3000;

  while (retries > 0) {
    try {
      console.log(`OpenAI: Generating ${params.itemCount} items for ${params.subject} (single call)...`);
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "You are an expert educational assessment item writer. Always respond with valid JSON arrays only. No markdown, no explanation." },
          { role: "user", content: prompt }
        ],
        max_completion_tokens: 8192,
      });
      const text = response.choices[0]?.message?.content || "";
      allItems = parseAIResponse(text);
      console.log(`OpenAI generated ${allItems.length}/${params.itemCount} items for ${params.subject}`);
      break;
    } catch (error: any) {
      retries--;
      const isRateLimit = error.status === 429 || error.message?.includes("429") || error.message?.includes("rate");
      if (isRateLimit && retries > 0) {
        console.log(`OpenAI rate limited, retrying in ${delay / 1000}s (${retries} retries left)`);
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2;
      } else {
        console.error(`OpenAI generation error:`, error.message || error);
        if (!isRateLimit) break;
      }
    }
  }

  if (allItems.length === 0) {
    throw new Error("OpenAI could not generate assessment items at this time. Please try again in a moment.");
  }

  return allItems;
}
