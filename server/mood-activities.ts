// Mood-based learning activities database
export interface LearningActivity {
  id: string;
  title: string;
  description: string;
  subject: string;
  activityType: 'interactive' | 'video' | 'game' | 'reflection' | 'reading' | 'creative';
  duration: number; // minutes
  difficulty: 'easy' | 'medium' | 'hard';
  moodMatch: string[]; // moods this activity is good for
  energyLevel: 'low' | 'medium' | 'high';
  instructions: string;
  content?: any;
  points: number;
}

export const moodBasedActivities: LearningActivity[] = [
  // Activities for when students are BORED
  {
    id: 'math-puzzle-challenge',
    title: 'Mystery Math Puzzle',
    description: 'Solve this brain-teasing math puzzle that will get your mind racing!',
    subject: 'math',
    activityType: 'interactive',
    duration: 10,
    difficulty: 'medium',
    moodMatch: ['bored', 'restless'],
    energyLevel: 'medium',
    instructions: 'Work through this step-by-step puzzle. Use scratch paper if needed!',
    content: {
      puzzle: 'A number when multiplied by 4, then 12 is subtracted, gives the same result as when the number is multiplied by 2 and then 8 is added. What is the number?',
      hint: 'Set up an equation: 4x - 12 = 2x + 8',
      answer: '10',
      explanation: '4(10) - 12 = 28, and 2(10) + 8 = 28'
    },
    points: 15
  },
  {
    id: 'science-experiment-virtual',
    title: 'Virtual Chemistry Lab',
    description: 'Mix chemicals safely in this virtual lab and see amazing reactions!',
    subject: 'science',
    activityType: 'interactive',
    duration: 15,
    difficulty: 'medium',
    moodMatch: ['bored', 'curious'],
    energyLevel: 'high',
    instructions: 'Follow the safety rules and experiment with different chemical combinations!',
    content: {
      experiments: [
        'Mix baking soda and vinegar - observe the reaction',
        'Test different pH levels with indicator solutions',
        'Create color-changing reactions'
      ]
    },
    points: 20
  },

  // Activities for when students are TIRED
  {
    id: 'relaxing-nature-documentary',
    title: 'Peaceful Nature Exploration',
    description: 'Take a calming virtual journey through beautiful natural environments.',
    subject: 'science',
    activityType: 'video',
    duration: 8,
    difficulty: 'easy',
    moodMatch: ['tired', 'stressed'],
    energyLevel: 'low',
    instructions: 'Relax and observe the natural world. Take notes on what you find interesting.',
    content: {
      topics: ['Ocean life', 'Forest ecosystems', 'Mountain wildlife'],
      reflection: 'What patterns do you notice in nature?'
    },
    points: 8
  },
  {
    id: 'gentle-reading-comprehension',
    title: 'Cozy Reading Corner',
    description: 'Enjoy a short, engaging story at your own pace.',
    subject: 'english',
    activityType: 'reading',
    duration: 12,
    difficulty: 'easy',
    moodMatch: ['tired', 'calm'],
    energyLevel: 'low',
    instructions: 'Read slowly and enjoy the story. Answer the questions when you feel ready.',
    content: {
      story: 'A short story about friendship and kindness...',
      questions: [
        'What was the main character feeling at the beginning?',
        'How did the character show kindness to others?'
      ]
    },
    points: 10
  },

  // Activities for when students are FRUSTRATED
  {
    id: 'mindfulness-breathing',
    title: 'Calm Mind, Clear Thinking',
    description: 'Practice mindfulness techniques to reset and refocus your energy.',
    subject: 'sel',
    activityType: 'reflection',
    duration: 5,
    difficulty: 'easy',
    moodMatch: ['frustrated', 'angry', 'stressed'],
    energyLevel: 'low',
    instructions: 'Find a comfortable position and follow the breathing guide.',
    content: {
      steps: [
        'Breathe in slowly for 4 counts',
        'Hold your breath for 4 counts', 
        'Breathe out slowly for 6 counts',
        'Repeat 5 times'
      ],
      reflection: 'How do you feel now compared to when you started?'
    },
    points: 5
  },
  {
    id: 'art-expression-activity',
    title: 'Express Yourself Through Art',
    description: 'Channel your emotions into creative expression with this art activity.',
    subject: 'art',
    activityType: 'creative',
    duration: 20,
    difficulty: 'easy',
    moodMatch: ['frustrated', 'sad', 'angry'],
    energyLevel: 'medium',
    instructions: 'Use colors, shapes, and lines to express how you are feeling. There are no wrong answers!',
    content: {
      prompts: [
        'Draw your emotions using only colors and shapes',
        'Create a pattern that represents your mood',
        'Design a peaceful place you would like to visit'
      ]
    },
    points: 15
  },
  {
    id: 'problem-solving-strategy',
    title: 'Strategy Toolbox',
    description: 'Learn new approaches to tackle challenging problems step by step.',
    subject: 'sel',
    activityType: 'reflection',
    duration: 10,
    difficulty: 'easy',
    moodMatch: ['frustrated', 'confused'],
    energyLevel: 'medium',
    instructions: 'Work through these problem-solving steps with a specific challenge in mind.',
    content: {
      strategies: [
        'Break the problem into smaller parts',
        'Ask: What do I already know about this?',
        'Try a different approach or method',
        'Ask for help or a different explanation',
        'Take a break and come back with fresh eyes'
      ],
      reflection: 'Which strategy might help you most right now?'
    },
    points: 10
  },

  // Activities for when students are CONFIDENT/ENERGETIC
  {
    id: 'advanced-coding-challenge',
    title: 'Code Master Challenge',
    description: 'Take on this advanced coding puzzle that will test your skills!',
    subject: 'technology',
    activityType: 'interactive',
    duration: 25,
    difficulty: 'hard',
    moodMatch: ['confident', 'energetic', 'excited'],
    energyLevel: 'high',
    instructions: 'Use your programming skills to solve this complex challenge!',
    content: {
      challenge: 'Create a function that finds patterns in number sequences',
      languages: ['Python', 'JavaScript', 'Scratch'],
      hints: ['Think about mathematical relationships', 'Consider using loops']
    },
    points: 30
  },
  {
    id: 'leadership-project',
    title: 'Lead a Mini-Project',
    description: 'Design and plan a project that could help your school or community.',
    subject: 'social_studies',
    activityType: 'creative',
    duration: 30,
    difficulty: 'hard',
    moodMatch: ['confident', 'motivated'],
    energyLevel: 'high',
    instructions: 'Think big! Plan a project that uses your skills to make a positive impact.',
    content: {
      steps: [
        'Identify a problem to solve',
        'Brainstorm creative solutions',
        'Plan the steps to make it happen',
        'Consider who could help you',
        'Present your idea clearly'
      ]
    },
    points: 25
  },

  // Activities for different subjects and moods
  {
    id: 'quick-math-game',
    title: 'Speed Math Lightning Round',
    description: 'Test your mental math skills in this fast-paced game!',
    subject: 'math',
    activityType: 'game',
    duration: 5,
    difficulty: 'medium',
    moodMatch: ['energetic', 'competitive'],
    energyLevel: 'high',
    instructions: 'Answer as many problems correctly as you can in 3 minutes!',
    content: {
      gameType: 'mental_math',
      topics: ['addition', 'subtraction', 'multiplication', 'division']
    },
    points: 12
  },
  {
    id: 'history-mystery',
    title: 'Historical Detective',
    description: 'Solve historical mysteries using clues from the past!',
    subject: 'social_studies',
    activityType: 'interactive',
    duration: 18,
    difficulty: 'medium',
    moodMatch: ['curious', 'analytical'],
    energyLevel: 'medium',
    instructions: 'Use the clues to solve the historical mystery. Think like a detective!',
    content: {
      mystery: 'The Lost Colony of Roanoke',
      clues: [
        'The word CROATOAN carved in a post',
        'No signs of struggle or violence',
        'Houses taken apart carefully',
        'Friendly relations with local Native Americans'
      ]
    },
    points: 18
  }
];

export function getActivitiesForMood(
  mood: string, 
  energyLevel: string, 
  subject?: string,
  maxDuration?: number
): LearningActivity[] {
  return moodBasedActivities.filter(activity => {
    const moodMatch = activity.moodMatch.includes(mood.toLowerCase());
    const energyMatch = activity.energyLevel === energyLevel.toLowerCase();
    const subjectMatch = !subject || activity.subject === subject.toLowerCase();
    const durationMatch = !maxDuration || activity.duration <= maxDuration;
    
    return moodMatch && energyMatch && subjectMatch && durationMatch;
  });
}

export function getActivityById(id: string): LearningActivity | undefined {
  return moodBasedActivities.find(activity => activity.id === id);
}