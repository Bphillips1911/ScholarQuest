import type { Express } from "express";
import { db } from "./db";
import { eq, desc, and, sql } from "drizzle-orm";
import { 
  selLessons, 
  selQuizQuestions, 
  selQuizResponses, 
  selQuizResults, 
  selNotifications,
  selProgressAnalytics,
  selBehaviorDefinitions,
  scholars,
  pbisEntries,
  type InsertSelLesson,
  type InsertSelQuizQuestion,
  type InsertSelQuizResponse,
  type InsertSelQuizResult,
  type InsertSelNotification
} from "@shared/schema";
import { 
  generateSELLesson, 
  generateQuizQuestions, 
  gradeQuizAnswer, 
  generateOverallFeedback,
  type BehaviorContext 
} from "./services/selAIService";

/**
 * Register SEL (Social Emotional Learning) routes
 */
export function registerSELRoutes(app: Express) {
  console.log("SEL: Registering SEL routes...");

  // === STUDENT SEL ROUTES ===
  
  // Get SEL lessons assigned to a student
  app.get('/api/student/sel/lessons', async (req: any, res: any) => {
    try {
      const studentId = req.user?.studentId || req.query.studentId;
      if (!studentId) {
        return res.status(401).json({ error: 'Student not authenticated' });
      }

      console.log(`SEL: Getting lessons for student ${studentId}`);

      const lessons = await db
        .select()
        .from(selLessons)
        .where(eq(selLessons.scholarId, studentId))
        .orderBy(desc(selLessons.assignedAt));

      console.log(`SEL: Found ${lessons.length} lessons for student`);
      res.json(lessons);
    } catch (error) {
      console.error('SEL: Error getting student lessons:', error);
      res.status(500).json({ error: 'Failed to get SEL lessons' });
    }
  });

  // Get specific SEL lesson with quiz questions
  app.get('/api/student/sel/lessons/:lessonId', async (req: any, res: any) => {
    try {
      const { lessonId } = req.params;
      const studentId = req.user?.studentId || req.query.studentId;

      console.log(`SEL: Getting lesson ${lessonId} for student ${studentId}`);

      // Get lesson details
      const lesson = await db
        .select()
        .from(selLessons)
        .where(and(
          eq(selLessons.id, lessonId),
          eq(selLessons.scholarId, studentId)
        ))
        .limit(1);

      if (lesson.length === 0) {
        return res.status(404).json({ error: 'Lesson not found' });
      }

      // Get quiz questions
      const questions = await db
        .select()
        .from(selQuizQuestions)
        .where(eq(selQuizQuestions.lessonId, lessonId))
        .orderBy(selQuizQuestions.questionNumber);

      // Mark lesson as started if not already
      if (lesson[0].status === 'assigned') {
        await db
          .update(selLessons)
          .set({ 
            status: 'in_progress',
            startedAt: new Date()
          })
          .where(eq(selLessons.id, lessonId));
      }

      res.json({
        lesson: lesson[0],
        questions
      });
    } catch (error) {
      console.error('SEL: Error getting lesson details:', error);
      res.status(500).json({ error: 'Failed to get lesson details' });
    }
  });

  // Submit quiz answers for a lesson
  app.post('/api/student/sel/lessons/:lessonId/quiz', async (req: any, res: any) => {
    try {
      const { lessonId } = req.params;
      const { answers, timeSpent } = req.body; // answers: Array<{questionId, answer}>
      const studentId = req.user?.studentId || req.query.studentId;

      console.log(`SEL: Submitting quiz for lesson ${lessonId}, student ${studentId}`);

      // Get lesson and questions
      const lesson = await db
        .select()
        .from(selLessons)
        .where(and(
          eq(selLessons.id, lessonId),
          eq(selLessons.scholarId, studentId)
        ))
        .limit(1);

      if (lesson.length === 0) {
        return res.status(404).json({ error: 'Lesson not found' });
      }

      const questions = await db
        .select()
        .from(selQuizQuestions)
        .where(eq(selQuizQuestions.lessonId, lessonId));

      if (questions.length === 0) {
        return res.status(400).json({ error: 'No quiz questions found' });
      }

      let correctAnswers = 0;
      let totalPoints = 0;
      const gradingResults: any[] = [];

      // Grade each answer using AI
      for (const answer of answers) {
        const question = questions.find(q => q.id === answer.questionId);
        if (!question) continue;

        const gradingResult = await gradeQuizAnswer(
          question.questionText,
          question.correctAnswer,
          answer.answer,
          question.questionType
        );

        // Store the response
        await db.insert(selQuizResponses).values({
          lessonId,
          scholarId: studentId,
          questionId: question.id,
          studentAnswer: answer.answer,
          isCorrect: gradingResult.isCorrect,
          aiGradingNotes: gradingResult.aiGradingNotes,
          pointsEarned: gradingResult.pointsEarned,
          timeSpent: answer.timeSpent
        });

        if (gradingResult.isCorrect) correctAnswers++;
        totalPoints += gradingResult.pointsEarned;
        gradingResults.push({
          questionId: question.id,
          ...gradingResult
        });
      }

      // Calculate score
      const scorePercentage = Math.round((correctAnswers / questions.length) * 100);
      const isPassed = scorePercentage >= 80;

      // Generate overall feedback using AI
      const feedback = await generateOverallFeedback(
        lesson[0].lessonTitle,
        questions.length,
        correctAnswers,
        scorePercentage,
        timeSpent || 0,
        'Student', // We could get the actual name if needed
        lesson[0].behaviorType
      );

      // Store quiz results
      const quizResult = await db.insert(selQuizResults).values({
        lessonId,
        scholarId: studentId,
        totalQuestions: questions.length,
        correctAnswers,
        scorePercentage,
        isPassed,
        timeSpent: timeSpent || 0,
        aiOverallFeedback: feedback.aiOverallFeedback,
        bonusPbisPoints: feedback.bonusPbisPoints
      }).returning();

      // Update lesson status
      await db
        .update(selLessons)
        .set({ 
          status: 'completed',
          completedAt: new Date()
        })
        .where(eq(selLessons.id, lessonId));

      // Create notifications for teacher, parent, and administrators
      const notifications = [
        {
          lessonId,
          recipientType: 'teacher' as const,
          recipientId: lesson[0].teacherName, // We'd need to map this to teacher ID
          notificationType: isPassed ? 'quiz_passed' as const : 'quiz_failed' as const,
          title: `SEL Quiz ${isPassed ? 'Passed' : 'Failed'}`,
          message: `Student completed "${lesson[0].lessonTitle}" with ${scorePercentage}% score`,
          sentVia: 'dashboard' as const
        }
      ];

      for (const notification of notifications) {
        await db.insert(selNotifications).values(notification);
      }

      console.log(`SEL: Quiz completed - Score: ${scorePercentage}%, Passed: ${isPassed}`);

      res.json({
        success: true,
        results: {
          correctAnswers,
          totalQuestions: questions.length,
          scorePercentage,
          isPassed,
          bonusPbisPoints: feedback.bonusPbisPoints,
          feedback: feedback.aiOverallFeedback,
          gradingResults
        }
      });

    } catch (error) {
      console.error('SEL: Error submitting quiz:', error);
      res.status(500).json({ error: 'Failed to submit quiz' });
    }
  });

  // === TEACHER SEL ROUTES ===

  // Get SEL lessons overview for teacher
  app.get('/api/teacher/sel/lessons', async (req: any, res: any) => {
    try {
      const teacherName = req.query.teacherName || req.user?.name;
      if (!teacherName) {
        return res.status(401).json({ error: 'Teacher not authenticated' });
      }

      console.log(`SEL: Getting lessons overview for teacher ${teacherName}`);

      const lessons = await db
        .select({
          lesson: selLessons,
          scholar: {
            id: scholars.id,
            name: scholars.name,
            grade: scholars.grade
          },
          quizResult: selQuizResults
        })
        .from(selLessons)
        .leftJoin(scholars, eq(selLessons.scholarId, scholars.id))
        .leftJoin(selQuizResults, eq(selLessons.id, selQuizResults.lessonId))
        .where(eq(selLessons.teacherName, teacherName))
        .orderBy(desc(selLessons.assignedAt));

      res.json(lessons);
    } catch (error) {
      console.error('SEL: Error getting teacher lessons:', error);
      res.status(500).json({ error: 'Failed to get teacher SEL lessons' });
    }
  });

  // === ADMIN SEL ROUTES ===
  
  // Get all SEL lessons for admin monitoring (no authentication required for admin)
  app.get('/api/admin/sel/lessons', async (req: any, res: any) => {
    try {
      console.log('ADMIN-SEL: Getting all SEL lessons for admin monitoring');

      // Query using Drizzle ORM for type safety
      const lessons = await db
        .select({
          lesson: selLessons,
          scholar: {
            id: scholars.id,
            name: scholars.name,
            grade: scholars.grade
          },
          quizResult: selQuizResults
        })
        .from(selLessons)
        .leftJoin(scholars, eq(selLessons.scholarId, scholars.id))
        .leftJoin(selQuizResults, eq(selLessons.id, selQuizResults.lessonId))
        .orderBy(desc(selLessons.assignedAt));

      console.log(`ADMIN-SEL: Found ${lessons.length} SEL lessons for admin monitoring`);
      res.json(lessons);
    } catch (error) {
      console.error('ADMIN-SEL: Error getting all SEL lessons:', error);
      res.status(500).json({ error: 'Failed to get SEL lessons for admin' });
    }
  });

  // === TRIGGER ROUTE: Auto-generate SEL lesson when negative PBIS is assigned ===
  
  // This will be called automatically when negative PBIS points are assigned
  app.post('/api/sel/trigger-lesson', async (req: any, res: any) => {
    try {
      const { pbisEntryId, scholarId, teacherName, behaviorType, specificBehavior, mustangTrait } = req.body;

      console.log(`SEL: Auto-triggering lesson for PBIS entry ${pbisEntryId}`);

      // Get student info
      const student = await db
        .select()
        .from(scholars)
        .where(eq(scholars.id, scholarId))
        .limit(1);

      if (student.length === 0) {
        return res.status(404).json({ error: 'Student not found' });
      }

      // Check for previous offenses to determine intervention level
      const previousOffenses = await db
        .select()
        .from(pbisEntries)
        .where(and(
          eq(pbisEntries.scholarId, scholarId),
          eq(pbisEntries.entryType, 'negative'),
          eq(pbisEntries.subcategory, specificBehavior)
        ));

      const context: BehaviorContext = {
        behaviorType,
        specificBehavior,
        studentGrade: student[0].grade,
        studentName: student[0].name,
        mustangTrait,
        previousOffenses: previousOffenses.length,
        teacherName
      };

      // Generate AI lesson
      console.log('SEL: Generating AI lesson...');
      const generatedLesson = await generateSELLesson(context);

      // Calculate due date (48-72 hours from now)
      const dueDate = new Date();
      dueDate.setHours(dueDate.getHours() + (context.previousOffenses === 0 ? 48 : 72));

      // Create lesson in database
      const lesson = await db.insert(selLessons).values({
        scholarId,
        pbisEntryId,
        teacherName,
        behaviorType,
        specificBehavior,
        lessonTitle: generatedLesson.lessonTitle,
        lessonContent: generatedLesson.lessonContent,
        learningObjectives: generatedLesson.learningObjectives,
        difficulty: generatedLesson.difficulty,
        estimatedTime: generatedLesson.estimatedTime,
        dueDate,
        interventionLevel: Math.min(context.previousOffenses + 1, 3)
      }).returning();

      const lessonId = lesson[0].id;

      // Generate quiz questions
      console.log('SEL: Generating quiz questions...');
      const quizQuestions = await generateQuizQuestions(
        generatedLesson.lessonTitle,
        generatedLesson.lessonContent,
        context.studentGrade
      );

      // Store quiz questions
      for (const question of quizQuestions) {
        await db.insert(selQuizQuestions).values({
          lessonId,
          ...question
        });
      }

      // Create notification for student
      await db.insert(selNotifications).values({
        lessonId,
        recipientType: 'student',
        recipientId: scholarId,
        notificationType: 'lesson_assigned',
        title: 'New SEL Lesson Assigned',
        message: `You have been assigned "${generatedLesson.lessonTitle}" to complete by ${dueDate.toLocaleDateString()}`,
        sentVia: 'dashboard'
      });

      console.log(`SEL: Successfully created lesson ${lessonId} for student ${student[0].name}`);

      res.json({
        success: true,
        lesson: lesson[0],
        message: `SEL lesson "${generatedLesson.lessonTitle}" has been automatically generated and assigned`
      });

    } catch (error) {
      console.error('SEL: Error auto-generating lesson:', error);
      res.status(500).json({ error: 'Failed to generate SEL lesson' });
    }
  });

  // === NOTIFICATION ROUTES ===

  // Get SEL notifications for a user
  app.get('/api/sel/notifications/:recipientType/:recipientId', async (req: any, res: any) => {
    try {
      const { recipientType, recipientId } = req.params;

      const notifications = await db
        .select()
        .from(selNotifications)
        .where(and(
          eq(selNotifications.recipientType, recipientType),
          eq(selNotifications.recipientId, recipientId)
        ))
        .orderBy(desc(selNotifications.sentAt));

      res.json(notifications);
    } catch (error) {
      console.error('SEL: Error getting notifications:', error);
      res.status(500).json({ error: 'Failed to get SEL notifications' });
    }
  });

  // Mark notification as read
  app.patch('/api/sel/notifications/:notificationId/read', async (req: any, res: any) => {
    try {
      const { notificationId } = req.params;

      await db
        .update(selNotifications)
        .set({ isRead: true })
        .where(eq(selNotifications.id, notificationId));

      res.json({ success: true });
    } catch (error) {
      console.error('SEL: Error marking notification as read:', error);
      res.status(500).json({ error: 'Failed to mark notification as read' });
    }
  });

  console.log("SEL: SEL routes registered successfully");
}