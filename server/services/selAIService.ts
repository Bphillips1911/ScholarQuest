import OpenAI from "openai";

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface BehaviorContext {
  behaviorType: string;
  specificBehavior: string;
  studentGrade: number;
  studentName: string;
  mustangTrait: string;
  previousOffenses: number;
  teacherName: string;
}

export interface GeneratedLesson {
  lessonTitle: string;
  lessonContent: string;
  learningObjectives: string[];
  difficulty: string;
  estimatedTime: number;
}

export interface GeneratedQuizQuestion {
  questionNumber: number;
  questionText: string;
  questionType: 'multiple_choice' | 'true_false' | 'short_answer';
  correctAnswer: string;
  choices?: string[];
  explanation: string;
}

export interface QuizGradingResult {
  isCorrect: boolean;
  aiGradingNotes: string;
  pointsEarned: number;
}

export interface OverallFeedback {
  aiOverallFeedback: string;
  bonusPbisPoints: number;
  improvementSuggestions: string[];
}

/**
 * Generate a personalized SEL lesson based on negative behavior incident
 */
export async function generateSELLesson(context: BehaviorContext): Promise<GeneratedLesson> {
  const interventionLevel = Math.min(context.previousOffenses + 1, 3);
  const gradeLevel = context.studentGrade === 6 ? "6th grade" : 
                    context.studentGrade === 7 ? "7th grade" : "8th grade";
  
  const prompt = `You are an expert Social Emotional Learning (SEL) educator creating a personalized lesson for a middle school student who exhibited negative behavior.

STUDENT CONTEXT:
- Name: ${context.studentName}
- Grade: ${gradeLevel}
- Behavior Issue: ${context.specificBehavior}
- Behavior Category: ${context.behaviorType}
- Related MUSTANG Trait Needed: ${context.mustangTrait}
- Teacher: ${context.teacherName}
- Intervention Level: ${interventionLevel}/3 (${interventionLevel === 1 ? 'First offense' : interventionLevel === 2 ? 'Repeat behavior' : 'Persistent pattern'})

LESSON REQUIREMENTS:
1. Age-appropriate for ${gradeLevel} students (ages 11-14)
2. Focus on the specific behavior: ${context.specificBehavior}
3. Connect to MUSTANG trait: ${context.mustangTrait}
4. Include practical strategies they can use immediately
5. Be engaging and non-punitive - focus on learning and growth
6. Length: 10-20 minutes for ${interventionLevel === 1 ? 'basic' : interventionLevel === 2 ? 'intermediate' : 'comprehensive'} intervention

Create a comprehensive SEL lesson. Respond with JSON in this exact format:
{
  "lessonTitle": "Engaging title that addresses the behavior positively",
  "lessonContent": "Full lesson content with clear sections, examples, and actionable strategies. Use engaging language appropriate for middle schoolers. Include real-life scenarios they can relate to.",
  "learningObjectives": ["Objective 1", "Objective 2", "Objective 3"],
  "difficulty": "${interventionLevel === 1 ? 'age_appropriate' : interventionLevel === 2 ? 'intermediate' : 'advanced'}",
  "estimatedTime": ${interventionLevel === 1 ? 15 : interventionLevel === 2 ? 20 : 25}
}`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 2000,
    });

    const lesson = JSON.parse(response.choices[0].message.content || '{}');
    
    return {
      lessonTitle: lesson.lessonTitle || `Learning from ${context.behaviorType} Behavior`,
      lessonContent: lesson.lessonContent || "Default lesson content about making better choices.",
      learningObjectives: lesson.learningObjectives || ["Understand the impact of behavior", "Develop self-awareness", "Practice better choices"],
      difficulty: lesson.difficulty || "age_appropriate",
      estimatedTime: lesson.estimatedTime || 15
    };
  } catch (openaiError: any) {
    console.log('SEL AI: OpenAI error, using fallback lesson generation:', openaiError.message);
    
    // Generate fallback lesson based on behavior context
    return generateFallbackSELLesson(context);
  }
}

/**
 * Generate fallback SEL lesson when OpenAI is unavailable
 */
function generateFallbackSELLesson(context: BehaviorContext): GeneratedLesson {
  const interventionLevel = Math.min(context.previousOffenses + 1, 3);
  const gradeLevel = context.studentGrade === 6 ? "6th grade" : 
                    context.studentGrade === 7 ? "7th grade" : "8th grade";

  // Create customized content based on behavior type and MUSTANG trait
  const lessonContent = createBehaviorSpecificContent(context.specificBehavior, context.mustangTrait, gradeLevel, interventionLevel);
  
  return {
    lessonTitle: `Building Better Choices: ${context.mustangTrait} Focus`,
    lessonContent,
    learningObjectives: [
      `Understand why ${context.specificBehavior} impacts the learning environment`,
      `Practice the ${context.mustangTrait} MUSTANG trait in daily situations`,
      `Develop strategies to make better choices in similar situations`
    ],
    difficulty: interventionLevel === 1 ? 'age_appropriate' : interventionLevel === 2 ? 'intermediate' : 'advanced',
    estimatedTime: interventionLevel === 1 ? 15 : interventionLevel === 2 ? 20 : 25
  };
}

/**
 * Create behavior-specific lesson content
 */
function createBehaviorSpecificContent(behavior: string, mustangTrait: string, gradeLevel: string, level: number): string {
  const baseContent = `
## Welcome, Scholar!

Today's lesson focuses on building stronger **${mustangTrait}** skills. Every MUSTANG scholar has the power to make positive choices that help themselves and their classmates succeed.

## Understanding the Situation

Let's talk about what happened: **${behavior}**. 

At Bush Hills STEAM Academy, we believe every mistake is a learning opportunity. This lesson will help you understand the impact of your choices and develop better strategies for the future.

## The ${mustangTrait} MUSTANG Trait

**${mustangTrait}** means:
${getMustangTraitDefinition(mustangTrait)}

## Reflection Questions

Think about these questions:
1. How did your actions affect others around you?
2. What were you feeling or thinking when this happened?
3. How can you use the ${mustangTrait} trait to handle similar situations differently?

## Building Better Strategies

Here are some practical strategies you can use:
${getBehaviorStrategies(behavior, mustangTrait, gradeLevel)}

## Your Action Plan

Moving forward, remember:
- Pause and think before acting
- Ask yourself: "Is this showing ${mustangTrait}?"
- Use the strategies you learned today
- Talk to a trusted adult if you need help

## Conclusion

You have the power to make positive choices that show your MUSTANG character. Every day is a new opportunity to demonstrate **${mustangTrait}** and help create a positive learning environment for everyone.

Remember: Mistakes help us grow, and you're growing stronger every day! 🌟
  `;

  return baseContent;
}

/**
 * Get MUSTANG trait definition
 */
function getMustangTraitDefinition(trait: string): string {
  const definitions: Record<string, string> = {
    'Motivated': '- Setting goals and working hard to achieve them\n- Showing enthusiasm for learning and growth\n- Encouraging others to do their best',
    'Understanding': '- Listening to others with respect\n- Considering different perspectives\n- Showing empathy and kindness',
    'Safe': '- Making choices that protect yourself and others\n- Following safety rules and procedures\n- Creating a secure environment for learning',
    'Teamwork': '- Working together respectfully with others\n- Contributing positively to group activities\n- Supporting classmates in their success',
    'Accountable': '- Taking responsibility for your actions and words\n- Being honest about mistakes and learning from them\n- Following through on commitments',
    'Noble': '- Acting with integrity and honor\n- Standing up for what is right\n- Treating everyone with dignity and respect',
    'Growth': '- Embracing challenges as opportunities to learn\n- Asking for help when needed\n- Celebrating progress and improvement'
  };
  
  return definitions[trait] || '- Making positive choices that help everyone succeed';
}

/**
 * Get behavior-specific strategies
 */
function getBehaviorStrategies(behavior: string, trait: string, gradeLevel: string): string {
  const strategies = [
    `**Take a Deep Breath**: When you feel frustrated or upset, take three deep breaths before responding.`,
    `**Use "I" Statements**: Express your feelings without blaming others. Example: "I feel frustrated when..."`,
    `**Ask for Help**: Talk to your teacher, counselor, or a trusted adult when you need support.`,
    `**Think Before You Act**: Ask yourself: "Will this help me show ${trait}?"`,
    `**Practice Self-Control**: Count to 10, take a walk, or use another calming strategy.`,
    `**Make Amends**: If your actions affected others, think about how you can make things right.`
  ];

  return strategies.join('\n\n');
}

/**
 * Generate 5 comprehension quiz questions for the SEL lesson
 */
export async function generateQuizQuestions(lessonTitle: string, lessonContent: string, studentGrade: number): Promise<GeneratedQuizQuestion[]> {
  const gradeLevel = studentGrade === 6 ? "6th grade" : 
                    studentGrade === 7 ? "7th grade" : "8th grade";
  
  const prompt = `You are creating a 5-question comprehension quiz for a ${gradeLevel} SEL lesson.

LESSON TITLE: ${lessonTitle}

LESSON CONTENT: ${lessonContent}

Create exactly 5 questions that test understanding of the lesson content. Questions should be:
1. Age-appropriate for ${gradeLevel} students
2. Test comprehension, not just recall
3. Include a mix of question types
4. Have clear, unambiguous correct answers
5. Include explanations that reinforce learning

Respond with JSON in this exact format:
{
  "questions": [
    {
      "questionNumber": 1,
      "questionText": "Question text here",
      "questionType": "multiple_choice",
      "correctAnswer": "The correct answer",
      "choices": ["Option A", "Option B", "Option C", "Option D"],
      "explanation": "Why this answer is correct and what it teaches"
    },
    {
      "questionNumber": 2,
      "questionText": "True or false question",
      "questionType": "true_false",
      "correctAnswer": "True",
      "choices": ["True", "False"],
      "explanation": "Explanation of the correct answer"
    },
    {
      "questionNumber": 3,
      "questionText": "Short answer question",
      "questionType": "short_answer",
      "correctAnswer": "Expected short answer",
      "explanation": "What makes this a good answer"
    }
  ]
}`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.6,
      max_tokens: 1500,
    });

    const quiz = JSON.parse(response.choices[0].message.content || '{}');
    
    return (quiz.questions || []).slice(0, 5).map((q: any, index: number) => ({
      questionNumber: index + 1,
      questionText: q.questionText || `Question ${index + 1}`,
      questionType: q.questionType || 'multiple_choice',
      correctAnswer: q.correctAnswer || 'Default answer',
      choices: q.choices || ['Yes', 'No'],
      explanation: q.explanation || 'This helps reinforce the lesson concept.'
    }));
  } catch (error) {
    console.error('SEL AI: Error generating quiz questions:', error);
    throw new Error('Failed to generate quiz questions: ' + (error as Error).message);
  }
}

/**
 * Grade a student's answer to a quiz question
 */
export async function gradeQuizAnswer(
  questionText: string,
  correctAnswer: string,
  studentAnswer: string,
  questionType: string
): Promise<QuizGradingResult> {
  const prompt = `You are grading a middle school student's SEL quiz answer. Be fair but thorough.

QUESTION: ${questionText}
QUESTION TYPE: ${questionType}
CORRECT ANSWER: ${correctAnswer}
STUDENT ANSWER: ${studentAnswer}

GRADING CRITERIA:
- For multiple choice/true-false: Exact match required (10 points)
- For short answer: Accept answers that demonstrate understanding, even if worded differently (0-10 points based on comprehension)
- Consider partial credit for short answers that show some understanding
- Be encouraging in feedback - focus on learning

Respond with JSON in this exact format:
{
  "isCorrect": true/false,
  "aiGradingNotes": "Specific feedback about their answer - be constructive and educational",
  "pointsEarned": 0-10
}`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.3,
      max_tokens: 300,
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    
    return {
      isCorrect: result.isCorrect || false,
      aiGradingNotes: result.aiGradingNotes || "Answer reviewed.",
      pointsEarned: Math.max(0, Math.min(10, result.pointsEarned || 0))
    };
  } catch (error) {
    console.error('SEL AI: Error grading answer:', error);
    throw new Error('Failed to grade answer: ' + (error as Error).message);
  }
}

/**
 * Generate overall feedback and bonus points for quiz completion
 */
export async function generateOverallFeedback(
  lessonTitle: string,
  totalQuestions: number,
  correctAnswers: number,
  scorePercentage: number,
  timeSpent: number,
  studentName: string,
  behaviorType: string
): Promise<OverallFeedback> {
  const performanceLevel = scorePercentage >= 90 ? 'excellent' : 
                          scorePercentage >= 80 ? 'good' : 
                          scorePercentage >= 70 ? 'satisfactory' : 'needs improvement';

  const prompt = `You are providing overall feedback for a middle school student who completed an SEL lesson quiz.

STUDENT: ${studentName}
LESSON: ${lessonTitle}
BEHAVIOR ADDRESSED: ${behaviorType}
PERFORMANCE: ${correctAnswers}/${totalQuestions} correct (${scorePercentage}%)
TIME SPENT: ${Math.round(timeSpent / 60)} minutes
PERFORMANCE LEVEL: ${performanceLevel}

FEEDBACK REQUIREMENTS:
1. Be encouraging and positive
2. Acknowledge their effort and completion
3. Connect back to the original behavior and growth opportunity
4. Provide specific suggestions for applying what they learned
5. Award bonus PBIS points for good effort (0-5 points based on performance and engagement)

Respond with JSON in this exact format:
{
  "aiOverallFeedback": "Comprehensive, encouraging feedback that celebrates their learning and provides actionable next steps",
  "bonusPbisPoints": 0-5,
  "improvementSuggestions": ["Suggestion 1", "Suggestion 2", "Suggestion 3"]
}`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 800,
    });

    const feedback = JSON.parse(response.choices[0].message.content || '{}');
    
    return {
      aiOverallFeedback: feedback.aiOverallFeedback || `Great job completing the ${lessonTitle} lesson!`,
      bonusPbisPoints: Math.max(0, Math.min(5, feedback.bonusPbisPoints || 1)),
      improvementSuggestions: feedback.improvementSuggestions || [
        "Practice the strategies you learned in daily situations",
        "Ask for help when you need support with behavior choices",
        "Reflect on your progress regularly"
      ]
    };
  } catch (error) {
    console.error('SEL AI: Error generating feedback:', error);
    throw new Error('Failed to generate feedback: ' + (error as Error).message);
  }
}

/**
 * Analyze behavioral patterns and suggest intervention strategies
 */
export async function analyzeBehavioralPattern(
  studentName: string,
  behaviorType: string,
  totalIncidents: number,
  consecutiveDaysWithoutIncident: number,
  averageQuizScore: number,
  lessonsCompleted: number,
  lessonsAssigned: number
): Promise<{
  improvementTrend: 'improving' | 'stable' | 'concerning';
  interventionRecommendations: string[];
  nextSteps: string[];
}> {
  const completionRate = lessonsAssigned > 0 ? (lessonsCompleted / lessonsAssigned) * 100 : 0;
  
  const prompt = `You are analyzing behavioral patterns for a middle school student to determine intervention strategies.

STUDENT: ${studentName}
BEHAVIOR PATTERN: ${behaviorType}
INCIDENTS THIS MONTH: ${totalIncidents}
CONSECUTIVE DAYS WITHOUT INCIDENT: ${consecutiveDaysWithoutIncident}
SEL LESSONS COMPLETED: ${lessonsCompleted}/${lessonsAssigned} (${completionRate.toFixed(1)}%)
AVERAGE QUIZ SCORE: ${averageQuizScore}%

ANALYSIS REQUIREMENTS:
1. Determine trend: improving, stable, or concerning
2. Provide specific intervention recommendations
3. Suggest concrete next steps for teachers and parents
4. Focus on positive behavioral supports

Respond with JSON in this exact format:
{
  "improvementTrend": "improving/stable/concerning",
  "interventionRecommendations": ["Recommendation 1", "Recommendation 2", "Recommendation 3"],
  "nextSteps": ["Next step 1", "Next step 2", "Next step 3"]
}`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.6,
      max_tokens: 600,
    });

    const analysis = JSON.parse(response.choices[0].message.content || '{}');
    
    return {
      improvementTrend: analysis.improvementTrend || 'stable',
      interventionRecommendations: analysis.interventionRecommendations || [
        "Continue current SEL lessons",
        "Monitor daily behavior patterns",
        "Provide positive reinforcement"
      ],
      nextSteps: analysis.nextSteps || [
        "Schedule follow-up meeting",
        "Review lesson completion",
        "Adjust intervention strategy if needed"
      ]
    };
  } catch (error) {
    console.error('SEL AI: Error analyzing behavioral pattern:', error);
    throw new Error('Failed to analyze behavioral pattern: ' + (error as Error).message);
  }
}