import { db } from "./db";
import { 
  stickerCollections,
  stickers,
  dailyChallenges,
  moodRecommendations
} from "@shared/schema";

export async function seedGamifiedLearning() {
  console.log("🎯 Starting gamified learning seed data...");

  try {
    // STICKER COLLECTIONS
    console.log("📋 Creating sticker collections...");
    
    const stickerCollectionData = [
      {
        id: '1',
        name: 'House Pride',
        description: 'Show your house spirit and earn house-themed stickers!',
        theme: 'house',
        totalStickers: 10,
        difficulty: 'beginner',
        isActive: true,
      },
      {
        id: '2',
        name: 'Academic Excellence',
        description: 'Celebrate your learning achievements with academic stickers!',
        theme: 'academic',
        totalStickers: 15,
        difficulty: 'intermediate',
        isActive: true,
      },
      {
        id: '3',
        name: 'Character Champions',
        description: 'Earn stickers by demonstrating MUSTANG traits!',
        theme: 'behavior',
        totalStickers: 12,
        difficulty: 'intermediate',
        isActive: true,
      },
      {
        id: '4',
        name: 'Seasonal Celebrations',
        description: 'Collect special seasonal and holiday stickers!',
        theme: 'seasonal',
        totalStickers: 8,
        difficulty: 'easy',
        seasonalStart: new Date('2025-09-01'),
        seasonalEnd: new Date('2025-12-31'),
        isActive: true,
      }
    ];

    for (const collection of stickerCollectionData) {
      await db.insert(stickerCollections).values(collection).onConflictDoNothing();
    }

    // STICKERS
    console.log("🎁 Creating stickers...");
    
    const stickerData = [
      // House Pride Collection
      {
        id: 's1',
        collectionId: '1',
        name: 'Franklin Explorer',
        description: 'Discover new knowledge like Benjamin Franklin!',
        emoji: '🔬',
        rarity: 'common',
        triggerType: 'points',
        triggerCondition: { type: 'academic_points', value: 50 },
        points: 10,
        isAnimated: false,
        unlockMessage: 'You earned your first Franklin house sticker!'
      },
      {
        id: 's2',
        collectionId: '1',
        name: 'Tesla Innovator',
        description: 'Spark brilliance like Nikola Tesla!',
        emoji: '⚡',
        rarity: 'common',
        triggerType: 'points',
        triggerCondition: { type: 'academic_points', value: 50 },
        points: 10,
        isAnimated: true
      },
      {
        id: 's3',
        collectionId: '1',
        name: 'Curie Researcher',
        description: 'Research with dedication like Marie Curie!',
        emoji: '🧪',
        rarity: 'common',
        triggerType: 'points',
        triggerCondition: { type: 'academic_points', value: 50 },
        points: 10,
        isAnimated: false
      },
      {
        id: 's4',
        collectionId: '1',
        name: 'Nobel Champion',
        description: 'Achieve excellence worthy of Alfred Nobel!',
        emoji: '🏆',
        rarity: 'rare',
        triggerType: 'points',
        triggerCondition: { type: 'total_points', value: 200 },
        points: 25,
        isAnimated: true
      },
      {
        id: 's5',
        collectionId: '1',
        name: 'Lovelace Coder',
        description: 'Think logically like Ada Lovelace!',
        emoji: '💻',
        rarity: 'common',
        triggerType: 'points',
        triggerCondition: { type: 'academic_points', value: 50 },
        points: 10,
        isAnimated: false
      },

      // Academic Excellence Collection
      {
        id: 's6',
        collectionId: '2',
        name: 'Math Wizard',
        description: 'Master mathematical concepts!',
        emoji: '🧮',
        rarity: 'common',
        triggerType: 'daily_challenge',
        triggerCondition: { type: 'subject_completion', subject: 'math', count: 3 },
        points: 15,
        isAnimated: false
      },
      {
        id: 's7',
        collectionId: '2',
        name: 'Science Star',
        description: 'Excel in scientific thinking!',
        emoji: '🔬',
        rarity: 'common',
        triggerType: 'daily_challenge',
        triggerCondition: { type: 'subject_completion', subject: 'science', count: 3 },
        points: 15,
        isAnimated: false
      },
      {
        id: 's8',
        collectionId: '2',
        name: 'Reading Champion',
        description: 'Show excellence in language arts!',
        emoji: '📚',
        rarity: 'common',
        triggerType: 'daily_challenge',
        triggerCondition: { type: 'subject_completion', subject: 'english', count: 3 },
        points: 15,
        isAnimated: false
      },
      {
        id: 's9',
        collectionId: '2',
        name: 'History Expert',
        description: 'Understand the lessons of the past!',
        emoji: '🏛️',
        rarity: 'common',
        triggerType: 'daily_challenge',
        triggerCondition: { type: 'subject_completion', subject: 'history', count: 3 },
        points: 15,
        isAnimated: false
      },
      {
        id: 's10',
        collectionId: '2',
        name: 'Perfect Scholar',
        description: 'Achieve perfection in all subjects!',
        emoji: '💯',
        rarity: 'legendary',
        triggerType: 'daily_challenge',
        triggerCondition: { type: 'perfect_week', subjects: ['math', 'science', 'english', 'history'] },
        points: 100,
        isAnimated: true,
        unlockMessage: 'Incredible! You are a true scholar!'
      },

      // Character Champions Collection
      {
        id: 's11',
        collectionId: '3',
        name: 'Motivated Mustang',
        description: 'Show incredible motivation!',
        emoji: '🔥',
        rarity: 'common',
        triggerType: 'behavior',
        triggerCondition: { type: 'trait', trait: 'motivated', count: 5 },
        points: 20,
        isAnimated: false
      },
      {
        id: 's12',
        collectionId: '3',
        name: 'Understanding Heart',
        description: 'Demonstrate empathy and understanding!',
        emoji: '❤️',
        rarity: 'common',
        triggerType: 'behavior',
        triggerCondition: { type: 'trait', trait: 'understanding', count: 5 },
        points: 20,
        isAnimated: false
      },
      {
        id: 's13',
        collectionId: '3',
        name: 'Safety Guardian',
        description: 'Keep everyone safe and secure!',
        emoji: '🛡️',
        rarity: 'uncommon',
        triggerType: 'behavior',
        triggerCondition: { type: 'trait', trait: 'safe', count: 5 },
        points: 30,
        isAnimated: false
      },
      {
        id: 's14',
        collectionId: '3',
        name: 'Team Player',
        description: 'Excel at working with others!',
        emoji: '🤝',
        rarity: 'common',
        triggerType: 'behavior',
        triggerCondition: { type: 'trait', trait: 'teamwork', count: 5 },
        points: 20,
        isAnimated: false
      },
      {
        id: 's15',
        collectionId: '3',
        name: 'MUSTANG Master',
        description: 'Embody all MUSTANG traits!',
        emoji: '🏆',
        rarity: 'epic',
        triggerType: 'behavior',
        triggerCondition: { type: 'all_traits', count: 3 },
        points: 75,
        isAnimated: true,
        unlockMessage: 'You are a true MUSTANG champion!'
      },

      // Seasonal Celebrations Collection
      {
        id: 's16',
        collectionId: '4',
        name: 'Fall Achiever',
        description: 'Celebrate autumn learning!',
        emoji: '🍂',
        rarity: 'common',
        triggerType: 'special',
        triggerCondition: { type: 'season', season: 'fall' },
        points: 15,
        isAnimated: false
      },
      {
        id: 's17',
        collectionId: '4',
        name: 'Halloween Hero',
        description: 'Spooktacular learning achievements!',
        emoji: '🎃',
        rarity: 'rare',
        triggerType: 'special',
        triggerCondition: { type: 'holiday', date: '2025-10-31' },
        points: 30,
        isAnimated: true
      }
    ];

    for (const sticker of stickerData) {
      await db.insert(stickers).values(sticker).onConflictDoNothing();
    }

    // DAILY CHALLENGES
    console.log("📝 Creating daily challenges...");
    
    const challengeData = [
      // Math Challenges
      {
        id: 'c1',
        date: new Date(),
        subject: 'math',
        gradeLevel: 6,
        title: 'Fraction Fun',
        description: 'Solve this fraction problem and explain your thinking!',
        challengeType: 'question',
        content: {
          question: 'What is 3/4 + 1/8?',
          options: ['7/8', '4/12', '7/12', '1/2'],
          correctAnswer: '7/8',
          tips: ['Find a common denominator', 'Convert fractions to equivalent forms']
        },
        difficulty: 'medium',
        points: 10,
        timeEstimate: 3,
        isActive: true
      },
      {
        id: 'c2',
        date: new Date(),
        subject: 'math',
        gradeLevel: 7,
        title: 'Algebra Adventure',
        description: 'Solve for the unknown variable!',
        challengeType: 'question',
        content: {
          question: 'If 2x + 5 = 13, what is the value of x?',
          options: ['3', '4', '6', '9'],
          correctAnswer: '4',
          tips: ['Isolate the variable', 'Use inverse operations']
        },
        difficulty: 'medium',
        points: 10,
        timeEstimate: 3,
        isActive: true
      },
      {
        id: 'c3',
        date: new Date(),
        subject: 'math',
        gradeLevel: 8,
        title: 'Geometry Challenge',
        description: 'Calculate the area of a complex shape!',
        challengeType: 'question',
        content: {
          question: 'What is the area of a triangle with base 8 cm and height 6 cm?',
          options: ['24 cm²', '48 cm²', '14 cm²', '42 cm²'],
          correctAnswer: '24 cm²',
          tips: ['Use the triangle area formula: A = (1/2) × base × height']
        },
        difficulty: 'easy',
        points: 10,
        timeEstimate: 2,
        isActive: true
      },

      // Science Challenges
      {
        id: 'c4',
        date: new Date(),
        subject: 'science',
        gradeLevel: 6,
        title: 'Matter Mystery',
        description: 'Explore the states of matter!',
        challengeType: 'question',
        content: {
          question: 'When water changes from liquid to gas, this process is called:',
          options: ['Melting', 'Freezing', 'Evaporation', 'Condensation'],
          correctAnswer: 'Evaporation',
          tips: ['Think about what happens when water heats up']
        },
        difficulty: 'easy',
        points: 8,
        timeEstimate: 2,
        isActive: true
      },

      // English Challenges
      {
        id: 'c5',
        date: new Date(),
        subject: 'english',
        gradeLevel: 7,
        title: 'Creative Writing Sprint',
        description: 'Write a short story opening that hooks the reader!',
        challengeType: 'creative',
        content: {
          prompt: 'Write the opening paragraph of a story that begins with: "The last person on Earth sat alone in a room. There was a knock at the door..."',
          instructions: 'Continue the story for at least 50 words. Focus on creating suspense and intrigue.',
          tips: ['Use descriptive language', 'Create atmosphere', 'Make the reader want to know more']
        },
        difficulty: 'medium',
        points: 15,
        timeEstimate: 5,
        isActive: true
      },

      // History Challenges
      {
        id: 'c6',
        date: new Date(),
        subject: 'history',
        gradeLevel: 8,
        title: 'Historical Reflection',
        description: 'Think about the lessons of history!',
        challengeType: 'reflection',
        content: {
          prompt: 'Why is it important to learn from historical events?',
          instructions: 'Write a thoughtful response explaining how understanding history helps us today.',
          tips: ['Think about patterns in history', 'Consider how past events affect present decisions']
        },
        difficulty: 'medium',
        points: 12,
        timeEstimate: 4,
        isActive: true
      }
    ];

    for (const challenge of challengeData) {
      await db.insert(dailyChallenges).values(challenge).onConflictDoNothing();
    }

    // MOOD RECOMMENDATIONS
    console.log("🎯 Creating mood-based learning recommendations...");
    
    const moodRecommendationData = [
      // Energetic mood recommendations
      {
        id: 'mr1',
        mood: 'energetic',
        energyLevel: 'high',
        subject: 'math',
        gradeLevel: 6,
        activityType: 'game',
        title: 'Math Racing Challenge',
        description: 'Race against the clock solving math problems!',
        content: {
          instructions: 'Solve as many problems as you can in 5 minutes!',
          gameUrl: '/games/math-race',
          tips: ['Focus on accuracy first', 'Speed will come with practice']
        },
        duration: 10,
        difficulty: 'medium',
        tags: ['interactive', 'timed', 'competitive'],
        isActive: true
      },
      {
        id: 'mr2',
        mood: 'energetic',
        energyLevel: 'high',
        subject: 'science',
        gradeLevel: 7,
        activityType: 'video',
        title: 'Explosive Science Experiments',
        description: 'Watch amazing chemical reactions!',
        content: {
          videoUrl: 'https://example.com/science-experiments',
          instructions: 'Watch and identify the scientific principles involved',
          tips: ['Take notes on what you observe', 'Think about the chemistry behind each reaction']
        },
        duration: 8,
        difficulty: 'easy',
        tags: ['visual', 'exciting', 'chemistry'],
        isActive: true
      },

      // Tired mood recommendations
      {
        id: 'mr3',
        mood: 'tired',
        energyLevel: 'low',
        subject: 'english',
        gradeLevel: 6,
        activityType: 'video',
        title: 'Poetry Reading Session',
        description: 'Listen to beautiful poetry being read aloud',
        content: {
          videoUrl: 'https://example.com/poetry-reading',
          instructions: 'Relax and listen to the rhythm and meaning of the poems',
          tips: ['Focus on the emotions the poems convey', 'Notice the sound patterns']
        },
        duration: 5,
        difficulty: 'easy',
        tags: ['relaxing', 'audio', 'literature'],
        isActive: true
      },

      // Frustrated mood recommendations
      {
        id: 'mr4',
        mood: 'frustrated',
        energyLevel: 'medium',
        subject: 'mixed',
        gradeLevel: 7,
        activityType: 'reflection',
        title: 'Learning Breakthrough',
        description: 'Reflect on your learning journey and find new strategies',
        content: {
          questions: [
            {
              question: 'What specific topic or concept is challenging you right now?',
              type: 'text'
            },
            {
              question: 'What learning strategy could you try next?',
              type: 'choice',
              options: ['Ask for help', 'Break it into smaller steps', 'Practice with examples', 'Find a different explanation']
            }
          ],
          tips: ['It\'s normal to feel frustrated when learning', 'Every challenge is a growth opportunity']
        },
        duration: 7,
        difficulty: 'easy',
        tags: ['supportive', 'strategy', 'mindset'],
        isActive: true
      },

      // Confident mood recommendations
      {
        id: 'mr5',
        mood: 'confident',
        energyLevel: 'high',
        subject: 'math',
        gradeLevel: 8,
        activityType: 'practice',
        title: 'Advanced Problem Solving',
        description: 'Challenge yourself with complex math problems!',
        content: {
          instructions: 'Solve these advanced problems that require multiple steps',
          questions: [
            {
              question: 'A rectangle has a perimeter of 24 cm and an area of 32 cm². What are its dimensions?',
              type: 'text'
            }
          ],
          tips: ['Set up equations carefully', 'Use algebraic methods', 'Check your work']
        },
        duration: 15,
        difficulty: 'hard',
        tags: ['challenging', 'advanced', 'problem-solving'],
        isActive: true
      },

      // Bored mood recommendations
      {
        id: 'mr6',
        mood: 'bored',
        energyLevel: 'medium',
        subject: 'science',
        gradeLevel: 6,
        activityType: 'creative',
        title: 'Design Your Own Experiment',
        description: 'Create a fun science experiment you could do at home!',
        content: {
          prompt: 'Design an experiment to test something you\'re curious about',
          instructions: 'Describe your hypothesis, materials needed, and procedure',
          tips: ['Think about something you wonder about', 'Make sure it\'s safe to do at home']
        },
        duration: 12,
        difficulty: 'medium',
        tags: ['creative', 'hands-on', 'inquiry'],
        isActive: true
      },

      // Focused mood recommendations
      {
        id: 'mr7',
        mood: 'focused',
        energyLevel: 'medium',
        subject: 'history',
        gradeLevel: 8,
        activityType: 'practice',
        title: 'Historical Analysis Deep Dive',
        description: 'Analyze primary sources from American history',
        content: {
          instructions: 'Read these historical documents and answer analysis questions',
          questions: [
            {
              question: 'What can you infer about daily life from this source?',
              type: 'text'
            },
            {
              question: 'What perspective does this source represent?',
              type: 'text'
            }
          ],
          tips: ['Consider the author\'s point of view', 'Look for bias or limitations', 'Connect to larger historical themes']
        },
        duration: 20,
        difficulty: 'hard',
        tags: ['analytical', 'deep-thinking', 'primary-sources'],
        isActive: true
      }
    ];

    for (const recommendation of moodRecommendationData) {
      await db.insert(moodRecommendations).values(recommendation).onConflictDoNothing();
    }

    console.log("✅ Gamified learning seed data created successfully!");
    
  } catch (error) {
    console.error("❌ Error seeding gamified learning data:", error);
    throw error;
  }
}