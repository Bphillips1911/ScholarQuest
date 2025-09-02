import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

interface StoryFeedback {
  overallScore: number;
  strengths: string[];
  improvementAreas: string[];
  specificSuggestions: string[];
  encouragement: string;
  nextSteps: string[];
}

export async function generateStoryFeedback(
  title: string,
  content: string,
  prompt?: string,
  gradeLevel: number = 7
): Promise<StoryFeedback> {
  try {
    const systemPrompt = `You are an encouraging middle school English teacher providing constructive feedback on student creative writing. 

Guidelines:
- Be positive and supportive while offering specific, actionable feedback
- Focus on both strengths and growth areas
- Use age-appropriate language for grade ${gradeLevel} students
- Encourage creativity and personal expression
- Provide 3-4 specific strengths, 2-3 improvement areas, and 3-4 concrete suggestions
- Keep feedback constructive and motivating
- Score on creativity, plot development, character development, and writing mechanics
- Always end with encouragement and next steps`;

    const userPrompt = `Please provide comprehensive feedback on this student story:

Title: "${title}"
${prompt ? `Writing Prompt: "${prompt}"` : ''}

Story Content:
${content}

Word Count: ${content.split(' ').length} words

Provide feedback in this exact JSON format:
{
  "overallScore": [number from 1-100],
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "improvementAreas": ["area 1", "area 2"],
  "specificSuggestions": ["suggestion 1", "suggestion 2", "suggestion 3"],
  "encouragement": "encouraging message about their writing journey",
  "nextSteps": ["next step 1", "next step 2", "next step 3"]
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o", // using GPT-4o as the stable model for educational feedback
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 1000
    });

    const feedback = JSON.parse(response.choices[0].message.content || '{}');
    
    // Validate and ensure all required fields
    return {
      overallScore: Math.max(1, Math.min(100, feedback.overallScore || 75)),
      strengths: Array.isArray(feedback.strengths) ? feedback.strengths : ['Great effort on your story!'],
      improvementAreas: Array.isArray(feedback.improvementAreas) ? feedback.improvementAreas : [],
      specificSuggestions: Array.isArray(feedback.specificSuggestions) ? feedback.specificSuggestions : [],
      encouragement: feedback.encouragement || 'Keep up the excellent work! Your creativity is wonderful.',
      nextSteps: Array.isArray(feedback.nextSteps) ? feedback.nextSteps : ['Keep writing and practicing!']
    };

  } catch (error) {
    console.error('Error generating AI feedback:', error);
    // Fallback feedback if AI fails
    return {
      overallScore: 85,
      strengths: [
        'You completed the creative writing challenge!',
        'Your story shows imagination and effort',
        'You followed the prompt effectively'
      ],
      improvementAreas: [
        'Consider adding more descriptive details',
        'Work on developing your characters further'
      ],
      specificSuggestions: [
        'Try using more vivid adjectives to paint pictures with words',
        'Show character emotions through actions and dialogue',
        'Consider adding dialogue to make scenes more engaging'
      ],
      encouragement: 'Every story you write helps you grow as a writer. Keep expressing your creativity!',
      nextSteps: [
        'Try writing a short story from a different character\'s perspective',
        'Practice writing descriptive paragraphs about places you know',
        'Read stories by authors you enjoy and notice their techniques'
      ]
    };
  }
}

export async function generateQuickFeedback(content: string): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system", 
          content: "You are an encouraging middle school teacher. Provide brief, positive feedback (2-3 sentences) on student work."
        },
        {
          role: "user", 
          content: `Please provide brief encouraging feedback on this student work: ${content.substring(0, 500)}`
        }
      ],
      temperature: 0.7,
      max_tokens: 150
    });

    return response.choices[0].message.content || 'Great work! Keep up the excellent effort!';
  } catch (error) {
    console.error('Error generating quick feedback:', error);
    return 'Excellent effort! Your hard work and creativity really show in your submission.';
  }
}