import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

export interface GeneratedItem {
  itemType: string;
  dokLevel: number;
  stem: string;
  options: { key: string; text: string }[];
  correctAnswer: any;
  rubric?: any;
  explanation: string;
  difficulty: number;
}

export interface GeneratedPassage {
  title: string;
  content: string;
  genre: string;
  lexileLevel: number;
}

export interface GradingResult {
  isCorrect: boolean;
  score: number;
  maxScore: number;
  feedback: string;
  rubricBreakdown?: Record<string, any>;
}

export interface TutoringResponse {
  message: string;
  practiceItem?: GeneratedItem;
  hint?: string;
  encouragement: string;
}

export async function generateItems(params: {
  standardCode: string;
  standardDescription: string;
  gradeLevel: number;
  dokLevel: number;
  itemType: string;
  count: number;
  subject: string;
  passageContext?: string;
}): Promise<GeneratedItem[]> {
  const prompt = `You are an expert assessment item writer for ACAP (Alabama Comprehensive Assessment Program) standardized testing. Generate ${params.count} high-quality assessment items.

REQUIREMENTS:
- Standard: ${params.standardCode} - ${params.standardDescription}
- Grade Level: ${params.gradeLevel}
- DOK Level: ${params.dokLevel} (Webb's Depth of Knowledge)
- Item Type: ${params.itemType}
- Subject: ${params.subject}
${params.passageContext ? `- Passage Context: ${params.passageContext}` : ""}

DOK LEVEL GUIDANCE:
- DOK 2: Skills/Concepts - requires comparison, classification, cause/effect
- DOK 3: Strategic Thinking - requires reasoning, planning, evidence-based justification
- DOK 4: Extended Thinking - requires synthesis, analysis across multiple sources, complex reasoning

ITEM TYPE FORMATS:
- "multiple_choice": 4 options (A, B, C, D), one correct answer
- "multi_select": 4-6 options, 2+ correct answers
- "constructed_response": Open-ended, requires rubric with point values
- "evidence_based": Two-part: select answer then justify with evidence
- "drag_drop": Items to match or order

You MUST return a JSON object with an "items" key containing an array of exactly ${params.count} items.

Each item must follow this exact structure:
{
  "itemType": "${params.itemType}",
  "dokLevel": ${params.dokLevel},
  "stem": "The question text",
  "options": ${params.itemType === "constructed_response" ? "[]" : '[{"key": "A", "text": "Option text"}, {"key": "B", "text": "..."}, {"key": "C", "text": "..."}, {"key": "D", "text": "..."}]'},
  "correctAnswer": ${params.itemType === "multiple_choice" ? '"A"' : params.itemType === "multi_select" ? '["A","C"]' : params.itemType === "constructed_response" ? '{"text": "A complete sample response that would earn full marks"}' : '{"part1": "A", "part2": "Text evidence from the passage supporting the answer"}'},
  "rubric": ${params.itemType === "constructed_response" ? '{"points": 4, "criteria": [{"level": 4, "description": "Exemplary response"}, {"level": 3, "description": "Proficient"}, {"level": 2, "description": "Developing"}, {"level": 1, "description": "Beginning"}]}' : "null"},
  "explanation": "Why the correct answer is correct and common misconceptions",
  "difficulty": 0.5
}

${params.itemType === "constructed_response" ? "IMPORTANT: For constructed_response items, options must be an empty array [], correctAnswer must be an object with a 'text' key, and rubric must include point criteria." : ""}
${params.itemType === "evidence_based" ? "IMPORTANT: For evidence_based items, create a two-part question. Part 1 selects an answer, Part 2 requires text evidence." : ""}

Return format: {"items": [item1, item2, ...]}`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.7,
    response_format: { type: "json_object" },
  });

  const content = response.choices[0]?.message?.content || "{}";
  const parsed = JSON.parse(content);
  return parsed.items || parsed.questions || (Array.isArray(parsed) ? parsed : [parsed]);
}

export async function generatePassage(params: {
  gradeLevel: number;
  genre: string;
  standardCode: string;
  standardDescription: string;
  lexileTarget: number;
  subject: string;
}): Promise<GeneratedPassage> {
  const prompt = `You are an expert educational content writer creating reading passages for ACAP assessments.

REQUIREMENTS:
- Grade Level: ${params.gradeLevel}
- Genre: ${params.genre}
- Target Lexile Level: ${params.lexileTarget}
- Aligned Standard: ${params.standardCode} - ${params.standardDescription}
- Subject: ${params.subject}

Generate a grade-appropriate reading passage that:
1. Is 300-600 words long
2. Aligns with the specified standard
3. Matches the target Lexile level for grade ${params.gradeLevel}
4. Uses age-appropriate vocabulary and themes
5. Contains enough detail to support DOK 2-4 questions
6. Is original content (not copied from any source)

Return as JSON:
{
  "title": "Passage title",
  "content": "Full passage text...",
  "genre": "${params.genre}",
  "lexileLevel": estimated_lexile_number
}

Return ONLY valid JSON.`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.8,
    response_format: { type: "json_object" },
  });

  const content = response.choices[0]?.message?.content || "{}";
  return JSON.parse(content);
}

export async function autoGradeResponse(params: {
  item: {
    itemType: string;
    stem: string;
    options: any[];
    correctAnswer: any;
    rubric: any;
    explanation: string;
  };
  studentResponse: any;
  gradeLevel: number;
}): Promise<GradingResult> {
  if (params.item.itemType === "multiple_choice") {
    const isCorrect = params.studentResponse === params.item.correctAnswer;
    return {
      isCorrect,
      score: isCorrect ? 1 : 0,
      maxScore: 1,
      feedback: isCorrect
        ? "Correct! " + (params.item.explanation || "")
        : `The correct answer is ${params.item.correctAnswer}. ${params.item.explanation || ""}`,
    };
  }

  if (params.item.itemType === "multi_select") {
    const correct = Array.isArray(params.item.correctAnswer) ? params.item.correctAnswer : [params.item.correctAnswer];
    const student = Array.isArray(params.studentResponse) ? params.studentResponse : [params.studentResponse];
    const correctSet = new Set(correct);
    const studentSet = new Set(student);
    const intersection = Array.from(studentSet).filter((x) => correctSet.has(x));
    const score = intersection.length / correct.length;
    return {
      isCorrect: score === 1,
      score: Math.round(score * 100) / 100,
      maxScore: 1,
      feedback: score === 1
        ? "All correct selections! " + (params.item.explanation || "")
        : `You selected ${intersection.length} of ${correct.length} correct answers. ${params.item.explanation || ""}`,
    };
  }

  const prompt = `You are an expert ACAP assessment grader for grade ${params.gradeLevel} students.

QUESTION: ${params.item.stem}
CORRECT ANSWER/RUBRIC: ${JSON.stringify(params.item.correctAnswer)}
${params.item.rubric ? `RUBRIC: ${JSON.stringify(params.item.rubric)}` : ""}
STUDENT RESPONSE: ${JSON.stringify(params.studentResponse)}

Grade this response. Consider:
1. Accuracy of content
2. Use of evidence (if applicable)
3. Quality of reasoning
4. Grade-appropriate expectations

Return as JSON:
{
  "isCorrect": true/false,
  "score": number (points earned),
  "maxScore": number (max possible points),
  "feedback": "Specific constructive feedback for the student",
  "rubricBreakdown": {"criterion": points_earned, ...}
}

Return ONLY valid JSON.`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.3,
    response_format: { type: "json_object" },
  });

  const content = response.choices[0]?.message?.content || "{}";
  return JSON.parse(content);
}

export async function bootcampTutor(params: {
  standardCode: string;
  standardDescription: string;
  gradeLevel: number;
  scholarName: string;
  currentMasteryLevel: string;
  conversationHistory: { role: string; content: string }[];
  userMessage: string;
}): Promise<TutoringResponse> {
  const systemPrompt = `You are a friendly, encouraging AI tutor helping a grade ${params.gradeLevel} student master the ACAP standard: ${params.standardCode} - ${params.standardDescription}.

The student's name is ${params.scholarName} and their current mastery level is: ${params.currentMasteryLevel}.

YOUR ROLE:
1. Break down concepts into simple, digestible parts
2. Use scaffolding and guided questioning (not just giving answers)
3. Provide practice problems when appropriate
4. Give positive encouragement and celebrate progress
5. Adapt your language to grade ${params.gradeLevel} level
6. If the student is struggling, try a different approach
7. Use real-world examples relevant to middle school students

Always respond in JSON format:
{
  "message": "Your tutoring response to the student",
  "practiceItem": null or {"itemType":"multiple_choice","dokLevel":2,"stem":"...","options":[...],"correctAnswer":"A","explanation":"...","difficulty":0.5},
  "hint": null or "A helpful hint if student is stuck",
  "encouragement": "A brief encouraging statement"
}

Return ONLY valid JSON.`;

  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: "system", content: systemPrompt },
    ...params.conversationHistory.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
    { role: "user", content: params.userMessage },
  ];

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages,
    temperature: 0.7,
    response_format: { type: "json_object" },
  });

  const content = response.choices[0]?.message?.content || "{}";
  return JSON.parse(content);
}
