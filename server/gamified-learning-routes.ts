import { Request, Response } from "express";
import { db } from "./db";
import { 
  stickerCollections,
  stickers,
  studentStickers,
  dailyChallenges,
  studentChallenges,
  moodRecommendations,
  studentMoodCheckins,
  studentStreaks,
  scholars,
  storySubmissions
} from "@shared/schema";
import { eq, and, desc, sql, gte } from "drizzle-orm";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Helper function to get current date string
const getCurrentDateString = () => new Date().toISOString().split('T')[0];

// Helper function to check if dates are the same day
const isSameDay = (date1: Date, date2: Date) => {
  return date1.toDateString() === date2.toDateString();
};

// STICKER COLLECTION ROUTES

export async function getStudentStickerCollections(req: Request, res: Response) {
  try {
    const { studentId } = req.params;

    // Get all active collections
    const allCollections = await db
      .select()
      .from(stickerCollections)
      .where(eq(stickerCollections.isActive, true));

    // Get student's collected stickers
    const studentCollectedStickers = await db
      .select()
      .from(studentStickers)
      .where(eq(studentStickers.studentId, studentId));

    // Get all stickers for the collections
    const collectionsWithStickers = await Promise.all(
      allCollections.map(async (collection) => {
        const collectionStickers = await db
          .select()
          .from(stickers)
          .where(eq(stickers.collectionId, collection.id));

        const stickersWithStatus = collectionStickers.map((sticker) => {
          const studentSticker = studentCollectedStickers.find(
            s => s.stickerId === sticker.id
          );
          
          return {
            ...sticker,
            isCollected: !!studentSticker,
            collectedAt: studentSticker?.collectedAt || null,
            isNew: studentSticker?.isNew || false,
          };
        });

        const collectedCount = stickersWithStatus.filter(s => s.isCollected).length;
        const completionPercentage = (collectedCount / collection.totalStickers) * 100;

        return {
          ...collection,
          stickers: stickersWithStatus,
          collectedCount,
          completionPercentage,
        };
      })
    );

    res.json(collectionsWithStickers);
  } catch (error) {
    console.error('Error fetching student sticker collections:', error);
    res.status(500).json({ error: 'Failed to fetch sticker collections' });
  }
}

export async function getStudentRecentStickers(req: Request, res: Response) {
  try {
    const { studentId } = req.params;

    const recentStickers = await db
      .select({
        id: stickers.id,
        name: stickers.name,
        emoji: stickers.emoji,
        rarity: stickers.rarity,
        isNew: studentStickers.isNew,
        collectedAt: studentStickers.collectedAt,
      })
      .from(studentStickers)
      .innerJoin(stickers, eq(studentStickers.stickerId, stickers.id))
      .where(eq(studentStickers.studentId, studentId))
      .orderBy(desc(studentStickers.collectedAt))
      .limit(10);

    res.json(recentStickers);
  } catch (error) {
    console.error('Error fetching recent stickers:', error);
    res.status(500).json({ error: 'Failed to fetch recent stickers' });
  }
}

// DAILY CHALLENGES ROUTES

export async function getTodaysChallenges(req: Request, res: Response) {
  try {
    const { studentId, grade } = req.params;
    const today = getCurrentDateString();

    // Get all active challenges for the grade level (no date filtering)
    const todaysChals = await db
      .select()
      .from(dailyChallenges)
      .where(
        and(
          eq(dailyChallenges.gradeLevel, parseInt(grade)),
          eq(dailyChallenges.isActive, true)
        )
      );

    // Check which challenges the student has completed
    const completedChallenges = await db
      .select()
      .from(studentChallenges)
      .where(eq(studentChallenges.studentId, studentId));

    const challengesWithStatus = todaysChals.map((challenge) => {
      const completion = completedChallenges.find(c => c.challengeId === challenge.id);
      
      return {
        ...challenge,
        isCompleted: !!completion,
        userResponse: completion?.response || null,
        isCorrect: completion?.isCorrect || null,
        pointsEarned: completion?.pointsEarned || null,
      };
    });

    res.json(challengesWithStatus);
  } catch (error) {
    console.error('Error fetching today\'s challenges:', error);
    res.status(500).json({ error: 'Failed to fetch challenges' });
  }
}

export async function getWeeklyChallenges(req: Request, res: Response) {
  try {
    const { studentId } = req.params;
    
    // Get the student's grade
    const student = await db
      .select({ grade: scholars.grade })
      .from(scholars)
      .where(eq(scholars.id, studentId))
      .limit(1);
    
    if (student.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }

    // Get challenges from the past week
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const weekChallenges = await db
      .select()
      .from(dailyChallenges)
      .where(
        and(
          eq(dailyChallenges.gradeLevel, student[0].grade),
          gte(dailyChallenges.date, weekAgo),
          eq(dailyChallenges.isActive, true)
        )
      );

    // Check completion status
    const completedChallenges = await db
      .select()
      .from(studentChallenges)
      .where(eq(studentChallenges.studentId, studentId));

    const challengesWithStatus = weekChallenges.map((challenge) => {
      const completion = completedChallenges.find(c => c.challengeId === challenge.id);
      return {
        ...challenge,
        isCompleted: !!completion,
      };
    });

    res.json(challengesWithStatus);
  } catch (error) {
    console.error('Error fetching weekly challenges:', error);
    res.status(500).json({ error: 'Failed to fetch weekly challenges' });
  }
}

export async function getChallengeStreak(req: Request, res: Response) {
  try {
    const { studentId } = req.params;

    const streak = await db
      .select()
      .from(studentStreaks)
      .where(
        and(
          eq(studentStreaks.studentId, studentId),
          eq(studentStreaks.streakType, 'daily_challenge'),
          eq(studentStreaks.isActive, true)
        )
      )
      .limit(1);

    if (streak.length === 0) {
      // Create initial streak record
      const newStreak = await db
        .insert(studentStreaks)
        .values({
          studentId,
          streakType: 'daily_challenge',
          currentStreak: 0,
          longestStreak: 0,
          lastActivity: new Date(),
        })
        .returning();

      res.json(newStreak[0]);
    } else {
      res.json(streak[0]);
    }
  } catch (error) {
    console.error('Error fetching challenge streak:', error);
    res.status(500).json({ error: 'Failed to fetch streak' });
  }
}

export async function completeChallenge(req: Request, res: Response) {
  try {
    const { studentId, challengeId, response } = req.body;

    // Get the challenge details
    const challenge = await db
      .select()
      .from(dailyChallenges)
      .where(eq(dailyChallenges.id, challengeId))
      .limit(1);

    if (challenge.length === 0) {
      return res.status(404).json({ error: 'Challenge not found' });
    }

    // Determine if the response is correct
    let isCorrect = false;
    let pointsEarned = 0;

    if (challenge[0].challengeType === 'question' && challenge[0].content) {
      const content = challenge[0].content as any;
      isCorrect = response.selectedAnswer === content.correctAnswer;
    } else {
      // For creative/reflection challenges, award points for participation
      isCorrect = !!response.textResponse && response.textResponse.trim().length > 10;
    }

    pointsEarned = isCorrect ? challenge[0].points : Math.floor(challenge[0].points * 0.3);

    // Save the student's completion
    const completion = await db
      .insert(studentChallenges)
      .values({
        studentId,
        challengeId,
        response,
        isCorrect,
        pointsEarned,
      })
      .returning();

    // Update student's streak
    await updateChallengeStreak(studentId);

    // Award sticker if appropriate
    await checkAndAwardStickers(studentId, 'daily_challenge', { 
      completed: true, 
      isCorrect,
      points: pointsEarned 
    });

    res.json({
      ...completion[0],
      isCorrect,
      pointsEarned,
    });
  } catch (error) {
    console.error('Error completing challenge:', error);
    res.status(500).json({ error: 'Failed to complete challenge' });
  }
}

// MOOD-BASED LEARNING ROUTES

export async function getTodaysMoodCheckin(req: Request, res: Response) {
  try {
    const { studentId } = req.params;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const checkin = await db
      .select()
      .from(studentMoodCheckins)
      .where(
        and(
          eq(studentMoodCheckins.studentId, studentId),
          gte(studentMoodCheckins.checkinAt, today)
        )
      )
      .orderBy(desc(studentMoodCheckins.checkinAt))
      .limit(1);

    if (checkin.length > 0) {
      res.json(checkin[0]);
    } else {
      res.json(null);
    }
  } catch (error) {
    console.error('Error fetching mood check-in:', error);
    res.status(500).json({ error: 'Failed to fetch mood check-in' });
  }
}

export async function createMoodCheckin(req: Request, res: Response) {
  try {
    const { studentId, mood, energyLevel, timeOfDay, context } = req.body;

    const checkin = await db
      .insert(studentMoodCheckins)
      .values({
        studentId,
        mood,
        energyLevel,
        timeOfDay,
        context,
      })
      .returning();

    res.json({ checkin: checkin[0] });
  } catch (error) {
    console.error('Error creating mood check-in:', error);
    res.status(500).json({ error: 'Failed to create mood check-in' });
  }
}

export async function getMoodRecommendations(req: Request, res: Response) {
  try {
    const { studentId, mood, energyLevel } = req.params;

    // Get student's grade
    const student = await db
      .select({ grade: scholars.grade })
      .from(scholars)
      .where(eq(scholars.id, studentId))
      .limit(1);

    if (student.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }

    const recommendations = await db
      .select()
      .from(moodRecommendations)
      .where(
        and(
          eq(moodRecommendations.mood, mood),
          eq(moodRecommendations.energyLevel, energyLevel),
          eq(moodRecommendations.gradeLevel, student[0].grade),
          eq(moodRecommendations.isActive, true)
        )
      )
      .limit(6);

    res.json(recommendations);
  } catch (error) {
    console.error('Error fetching mood recommendations:', error);
    res.status(500).json({ error: 'Failed to fetch recommendations' });
  }
}

export async function getMoodBasedActivities(req: Request, res: Response) {
  try {
    const { mood, energyLevel, maxDuration } = req.query;
    
    console.log('Mood activities request:', { mood, energyLevel, maxDuration });
    
    // Import the mood activities module
    const { moodBasedActivities } = await import('./mood-activities');
    
    console.log('Total activities available:', moodBasedActivities.length);
    
    // Filter activities based on mood and energy level (more flexible matching)
    const filteredActivities = moodBasedActivities.filter(activity => {
      const moodMatch = activity.moodMatch.includes(mood as string);
      // More flexible energy matching - allow any energy level if not specified
      const energyMatch = !energyLevel || activity.energyLevel === energyLevel || 
                         (energyLevel === 'high' && activity.energyLevel === 'medium') ||
                         (energyLevel === 'medium' && (activity.energyLevel === 'low' || activity.energyLevel === 'high'));
      const durationMatch = !maxDuration || activity.duration <= parseInt(maxDuration as string);
      
      console.log(`Activity ${activity.title}: mood=${moodMatch}, energy=${energyMatch}, duration=${durationMatch}`);
      
      return moodMatch && (energyMatch || !energyLevel) && durationMatch;
    });
    
    console.log('Filtered activities count:', filteredActivities.length);
    
    res.json(filteredActivities);
  } catch (error) {
    console.error('Error fetching mood-based activities:', error);
    res.status(500).json({ error: 'Failed to fetch activities' });
  }
}

export async function completeActivity(req: Request, res: Response) {
  try {
    const { studentId, recommendationId } = req.body;

    // Update mood check-in to record the activity
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await db
      .update(studentMoodCheckins)
      .set({ recommendationUsed: recommendationId })
      .where(
        and(
          eq(studentMoodCheckins.studentId, studentId),
          gte(studentMoodCheckins.checkinAt, today)
        )
      );

    // Award sticker for using mood-based learning
    await checkAndAwardStickers(studentId, 'mood_learning', { completed: true });

    res.json({ recommendationId, completed: true });
  } catch (error) {
    console.error('Error completing activity:', error);
    res.status(500).json({ error: 'Failed to complete activity' });
  }
}

// STORY FEEDBACK ROUTES

export async function submitStoryForFeedback(req: Request, res: Response) {
  try {
    const { studentId, title, content, prompt, gradeLevel } = req.body;

    if (!studentId || !title || !content) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Generate AI feedback using OpenAI GPT-5
    const feedbackPrompt = `You are an experienced middle school teacher reviewing a student's creative writing. Please provide detailed, encouraging feedback on this story.

Title: ${title}
${prompt ? `Writing Prompt: ${prompt}` : ''}
Grade Level: ${gradeLevel}

Story:
${content}

Please analyze this story and provide feedback in the following JSON format:
{
  "strengths": ["List 3-4 specific strengths"],
  "improvementAreas": ["List 2-3 areas for improvement"],
  "specificSuggestions": ["List 3-4 actionable suggestions"],
  "encouragement": "Write an encouraging, personalized message",
  "nextSteps": ["List 3 specific next steps for improvement"],
  "overallScore": "Score from 1-100",
  "wordAnalysis": {
    "vocabulary": "assessment of word choice",
    "sentence_structure": "assessment of sentence variety and structure", 
    "creativity": "assessment of creative elements"
  }
}

Make sure feedback is appropriate for grade ${gradeLevel}, encouraging but honest, and provides specific examples from their writing.`;

    const aiResponse = await openai.chat.completions.create({
      model: "gpt-5", // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system", 
          content: "You are a supportive middle school teacher providing writing feedback. Always be encouraging while providing constructive suggestions for improvement."
        },
        {
          role: "user",
          content: feedbackPrompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 1500
    });

    const feedbackData = JSON.parse(aiResponse.choices[0].message.content || '{}');
    
    // Store submission in database
    const submission = await db
      .insert(storySubmissions)
      .values({
        studentId,
        title,
        content,
        prompt: prompt || '',
        gradeLevel: gradeLevel || 7,
        wordCount: content.trim().split(' ').length,
        aiFeedback: feedbackData,
        submittedAt: new Date()
      })
      .returning();

    res.json({
      submissionId: submission[0].id,
      feedback: feedbackData
    });

  } catch (error) {
    console.error('Error generating story feedback:', error);
    res.status(500).json({ error: 'Failed to generate feedback' });
  }
}

export async function getTeacherStorySubmissions(req: Request, res: Response) {
  try {
    const submissions = await db
      .select({
        id: storySubmissions.id,
        studentId: storySubmissions.studentId,
        studentName: scholars.name,
        title: storySubmissions.title,
        content: storySubmissions.content,
        prompt: storySubmissions.prompt,
        gradeLevel: storySubmissions.gradeLevel,
        wordCount: storySubmissions.wordCount,
        aiFeedback: storySubmissions.aiFeedback,
        teacherReviewed: storySubmissions.teacherReviewed,
        teacherNotes: storySubmissions.teacherNotes,
        reviewedBy: storySubmissions.reviewedBy,
        reviewedAt: storySubmissions.reviewedAt,
        submittedAt: storySubmissions.submittedAt
      })
      .from(storySubmissions)
      .leftJoin(scholars, eq(storySubmissions.studentId, scholars.id))
      .orderBy(desc(storySubmissions.submittedAt));

    res.json(submissions);
  } catch (error) {
    console.error('Error fetching story submissions:', error);
    res.status(500).json({ error: 'Failed to fetch submissions' });
  }
}

export async function reviewStorySubmission(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { teacherNotes } = req.body;

    // TODO: Get teacher ID from auth session
    const teacherId = "teacher-auth-id"; // Replace with actual auth

    await db
      .update(storySubmissions)
      .set({
        teacherReviewed: true,
        teacherNotes,
        reviewedBy: teacherId,
        reviewedAt: new Date()
      })
      .where(eq(storySubmissions.id, id));

    res.json({ success: true });
  } catch (error) {
    console.error('Error reviewing story submission:', error);
    res.status(500).json({ error: 'Failed to review submission' });
  }
}

// HELPER FUNCTIONS

async function updateChallengeStreak(studentId: string) {
  try {
    const streak = await db
      .select()
      .from(studentStreaks)
      .where(
        and(
          eq(studentStreaks.studentId, studentId),
          eq(studentStreaks.streakType, 'daily_challenge')
        )
      )
      .limit(1);

    if (streak.length === 0) return;

    const lastActivity = new Date(streak[0].lastActivity);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    let newCurrentStreak = streak[0].currentStreak;

    if (isSameDay(lastActivity, yesterday)) {
      // Continuing streak
      newCurrentStreak += 1;
    } else if (isSameDay(lastActivity, today)) {
      // Already completed today, no change
      return;
    } else {
      // Streak broken, restart
      newCurrentStreak = 1;
    }

    const newLongestStreak = Math.max(streak[0].longestStreak, newCurrentStreak);

    await db
      .update(studentStreaks)
      .set({
        currentStreak: newCurrentStreak,
        longestStreak: newLongestStreak,
        lastActivity: today,
      })
      .where(eq(studentStreaks.id, streak[0].id));

  } catch (error) {
    console.error('Error updating challenge streak:', error);
  }
}

async function checkAndAwardStickers(
  studentId: string, 
  triggerType: string, 
  conditions: any
) {
  try {
    // Find eligible stickers based on trigger type and conditions
    const eligibleStickers = await db
      .select()
      .from(stickers)
      .where(eq(stickers.triggerType, triggerType));

    for (const sticker of eligibleStickers) {
      // Check if student already has this sticker
      const existingSticker = await db
        .select()
        .from(studentStickers)
        .where(
          and(
            eq(studentStickers.studentId, studentId),
            eq(studentStickers.stickerId, sticker.id)
          )
        )
        .limit(1);

      if (existingSticker.length > 0) continue;

      // Check trigger conditions
      let shouldAward = false;
      const triggerCondition = sticker.triggerCondition as any;

      if (triggerType === 'daily_challenge') {
        if (triggerCondition.type === 'completion' && conditions.completed) {
          shouldAward = true;
        } else if (triggerCondition.type === 'streak' && conditions.streak >= triggerCondition.value) {
          shouldAward = true;
        }
      } else if (triggerType === 'mood_learning') {
        if (triggerCondition.type === 'usage' && conditions.completed) {
          shouldAward = true;
        }
      }

      if (shouldAward) {
        await db.insert(studentStickers).values({
          studentId,
          stickerId: sticker.id,
          isNew: true,
        });
      }
    }
  } catch (error) {
    console.error('Error checking and awarding stickers:', error);
  }
}