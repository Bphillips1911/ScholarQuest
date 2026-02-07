import type { Express, Request, Response } from "express";
import { acapStorage } from "./acapStorage";
import { generateItems, generatePassage, autoGradeResponse, bootcampTutor } from "./services/acapAiService";
import {
  insertAcapStandardSchema, insertAcapBlueprintSchema, insertAcapPassageSchema,
  insertAcapItemSchema, insertAcapAssessmentSchema, insertAcapAssignmentSchema,
} from "@shared/schema";

export function registerAcapRoutes(app: Express): void {

  // ===== STANDARDS =====
  app.get("/api/acap/standards", async (req: Request, res: Response) => {
    try {
      const gradeLevel = req.query.gradeLevel ? parseInt(req.query.gradeLevel as string) : undefined;
      const standards = await acapStorage.getStandards(gradeLevel);
      res.json(standards);
    } catch (error) {
      console.error("Error fetching standards:", error);
      res.status(500).json({ error: "Failed to fetch standards" });
    }
  });

  app.post("/api/acap/standards", async (req: Request, res: Response) => {
    try {
      const data = insertAcapStandardSchema.parse(req.body);
      const standard = await acapStorage.createStandard(data);
      await acapStorage.createAuditEntry({ action: "create_standard", entityType: "standard", entityId: standard.id, userId: req.body.userId, userRole: req.body.userRole, details: { code: standard.code } });
      res.status(201).json(standard);
    } catch (error: any) {
      console.error("Error creating standard:", error);
      res.status(400).json({ error: error.message || "Failed to create standard" });
    }
  });

  app.patch("/api/acap/standards/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const standard = await acapStorage.updateStandard(id, req.body);
      res.json(standard);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to update standard" });
    }
  });

  // ===== BLUEPRINTS =====
  app.get("/api/acap/blueprints", async (req: Request, res: Response) => {
    try {
      const gradeLevel = req.query.gradeLevel ? parseInt(req.query.gradeLevel as string) : undefined;
      const blueprints = await acapStorage.getBlueprints(gradeLevel);
      res.json(blueprints);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch blueprints" });
    }
  });

  app.post("/api/acap/blueprints", async (req: Request, res: Response) => {
    try {
      const data = insertAcapBlueprintSchema.parse(req.body);
      const blueprint = await acapStorage.createBlueprint(data);
      await acapStorage.createAuditEntry({ action: "create_blueprint", entityType: "blueprint", entityId: blueprint.id, userId: req.body.userId, userRole: req.body.userRole, details: { name: blueprint.name } });
      res.status(201).json(blueprint);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to create blueprint" });
    }
  });

  app.patch("/api/acap/blueprints/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const blueprint = await acapStorage.updateBlueprint(id, req.body);
      res.json(blueprint);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to update blueprint" });
    }
  });

  // ===== PASSAGES =====
  app.get("/api/acap/passages", async (req: Request, res: Response) => {
    try {
      const gradeLevel = req.query.gradeLevel ? parseInt(req.query.gradeLevel as string) : undefined;
      const passages = await acapStorage.getPassages(gradeLevel);
      res.json(passages);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch passages" });
    }
  });

  app.post("/api/acap/passages/generate", async (req: Request, res: Response) => {
    try {
      const { gradeLevel, genre, standardId, lexileTarget, subject } = req.body;
      const standard = await acapStorage.getStandard(standardId);
      if (!standard) return res.status(404).json({ error: "Standard not found" });

      const generated = await generatePassage({
        gradeLevel, genre, standardCode: standard.code,
        standardDescription: standard.description, lexileTarget: lexileTarget || 900, subject,
      });

      const passage = await acapStorage.createPassage({
        title: generated.title, content: generated.content, genre: generated.genre,
        lexileLevel: generated.lexileLevel, gradeLevel, standardId, aiGenerated: true, metadata: {},
      });

      await acapStorage.createAuditEntry({ action: "generate_passage", entityType: "passage", entityId: passage.id, userId: req.body.userId, userRole: "teacher", details: { genre, standardCode: standard.code } });
      res.status(201).json(passage);
    } catch (error: any) {
      console.error("Error generating passage:", error);
      res.status(500).json({ error: error.message || "Failed to generate passage" });
    }
  });

  // ===== ITEMS (Question Bank) =====
  app.get("/api/acap/items", async (req: Request, res: Response) => {
    try {
      const filters: any = {};
      if (req.query.standardId) filters.standardId = parseInt(req.query.standardId as string);
      if (req.query.blueprintId) filters.blueprintId = parseInt(req.query.blueprintId as string);
      if (req.query.reviewStatus) filters.reviewStatus = req.query.reviewStatus as string;
      if (req.query.dokLevel) filters.dokLevel = parseInt(req.query.dokLevel as string);
      const items = await acapStorage.getItems(filters);
      res.json(items);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch items" });
    }
  });

  app.post("/api/acap/items", async (req: Request, res: Response) => {
    try {
      const data = insertAcapItemSchema.parse(req.body);
      const item = await acapStorage.createItem(data);
      res.status(201).json(item);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to create item" });
    }
  });

  app.post("/api/acap/items/generate", async (req: Request, res: Response) => {
    try {
      const { standardId, dokLevel, itemType, count, subject, passageId } = req.body;
      const standard = await acapStorage.getStandard(standardId);
      if (!standard) return res.status(404).json({ error: "Standard not found" });

      let passageContext: string | undefined;
      if (passageId) {
        const passage = await acapStorage.getPassage(passageId);
        if (passage) passageContext = passage.content.substring(0, 1000);
      }

      const generated = await generateItems({
        standardCode: standard.code, standardDescription: standard.description,
        gradeLevel: standard.gradeLevel, dokLevel: dokLevel || 2, itemType: itemType || "multiple_choice",
        count: count || 5, subject: subject || "ELA", passageContext,
      });

      const items = await acapStorage.createItems(
        generated.map((g) => ({
          standardId, blueprintId: req.body.blueprintId || null, passageId: passageId || null,
          itemType: g.itemType, dokLevel: g.dokLevel, stem: g.stem, options: g.options,
          correctAnswer: g.correctAnswer, rubric: g.rubric || null, explanation: g.explanation,
          difficulty: g.difficulty, discrimination: 1.0, aiGenerated: true, reviewStatus: "pending" as const,
          reviewedBy: null, metadata: {},
        }))
      );

      await acapStorage.createAuditEntry({ action: "generate_items", entityType: "item", entityId: items[0]?.id, userId: req.body.userId, userRole: "teacher", details: { count: items.length, standardCode: standard.code, dokLevel } });
      res.status(201).json(items);
    } catch (error: any) {
      console.error("Error generating items:", error);
      res.status(500).json({ error: error.message || "Failed to generate items" });
    }
  });

  app.patch("/api/acap/items/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const item = await acapStorage.updateItem(id, req.body);
      if (req.body.reviewStatus) {
        await acapStorage.createAuditEntry({ action: "review_item", entityType: "item", entityId: id, userId: req.body.reviewedBy, userRole: "admin", details: { status: req.body.reviewStatus } });
      }
      res.json(item);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to update item" });
    }
  });

  // ===== ASSESSMENTS =====
  app.get("/api/acap/assessments", async (req: Request, res: Response) => {
    try {
      const filters: any = {};
      if (req.query.gradeLevel) filters.gradeLevel = parseInt(req.query.gradeLevel as string);
      if (req.query.subject) filters.subject = req.query.subject as string;
      if (req.query.type) filters.type = req.query.type as string;
      const assessments = await acapStorage.getAssessments(filters);
      res.json(assessments);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch assessments" });
    }
  });

  app.get("/api/acap/assessments/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const assessment = await acapStorage.getAssessment(id);
      if (!assessment) return res.status(404).json({ error: "Assessment not found" });
      const items = await acapStorage.getItemsByIds(assessment.itemIds as number[]);
      res.json({ ...assessment, items });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch assessment" });
    }
  });

  app.post("/api/acap/assessments", async (req: Request, res: Response) => {
    try {
      const data = insertAcapAssessmentSchema.parse(req.body);
      const assessment = await acapStorage.createAssessment(data);
      await acapStorage.createAuditEntry({ action: "create_assessment", entityType: "assessment", entityId: assessment.id, userId: req.body.createdBy, userRole: "teacher", details: { title: assessment.title, type: assessment.assessmentType } });
      res.status(201).json(assessment);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to create assessment" });
    }
  });

  // ===== ASSIGNMENTS =====
  app.get("/api/acap/assignments", async (req: Request, res: Response) => {
    try {
      const teacherId = req.query.teacherId as string | undefined;
      const assignments = await acapStorage.getAssignments(teacherId);
      res.json(assignments);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch assignments" });
    }
  });

  app.get("/api/acap/assignments/scholar/:scholarId", async (req: Request, res: Response) => {
    try {
      const assignments = await acapStorage.getAssignmentsForScholar(req.params.scholarId);
      const enriched = await Promise.all(assignments.map(async (a) => {
        const assessment = await acapStorage.getAssessment(a.assessmentId);
        const attempts = await acapStorage.getAttempts(req.params.scholarId, a.assessmentId);
        return { ...a, assessment, attempts };
      }));
      res.json(enriched);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch assignments" });
    }
  });

  app.post("/api/acap/assignments", async (req: Request, res: Response) => {
    try {
      const data = insertAcapAssignmentSchema.parse(req.body);
      const assignment = await acapStorage.createAssignment(data);
      await acapStorage.createAuditEntry({ action: "create_assignment", entityType: "assignment", entityId: assignment.id, userId: data.teacherId, userRole: "teacher", details: { assessmentId: data.assessmentId } });
      res.status(201).json(assignment);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to create assignment" });
    }
  });

  // ===== ATTEMPTS & RESPONSES =====
  app.post("/api/acap/attempts", async (req: Request, res: Response) => {
    try {
      const { assessmentId, scholarId, assignmentId } = req.body;
      const attempt = await acapStorage.createAttempt({
        assessmentId, scholarId, assignmentId: assignmentId || null,
        status: "in_progress", startedAt: new Date(),
        rawScore: null, scaledScore: null, percentCorrect: null,
        dokBreakdown: {}, standardBreakdown: {}, adaptiveState: {}, timeSpentSeconds: null,
      });
      res.status(201).json(attempt);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to create attempt" });
    }
  });

  app.get("/api/acap/attempts/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const attempt = await acapStorage.getAttempt(id);
      if (!attempt) return res.status(404).json({ error: "Attempt not found" });
      const responses = await acapStorage.getItemResponses(id);
      res.json({ ...attempt, responses });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch attempt" });
    }
  });

  app.post("/api/acap/attempts/:id/respond", async (req: Request, res: Response) => {
    try {
      const attemptId = parseInt(req.params.id);
      const { itemId, response, sequenceNumber, timeSpentSeconds } = req.body;

      const item = await acapStorage.getItem(itemId);
      if (!item) return res.status(404).json({ error: "Item not found" });

      const attempt = await acapStorage.getAttempt(attemptId);
      if (!attempt) return res.status(404).json({ error: "Attempt not found" });

      const gradingResult = await autoGradeResponse({
        item: { itemType: item.itemType, stem: item.stem, options: item.options as any, correctAnswer: item.correctAnswer, rubric: item.rubric, explanation: item.explanation || "" },
        studentResponse: response,
        gradeLevel: 7,
      });

      const itemResponse = await acapStorage.createItemResponse({
        attemptId, itemId, response, isCorrect: gradingResult.isCorrect,
        score: gradingResult.score, maxScore: gradingResult.maxScore,
        aiGradingResult: { feedback: gradingResult.feedback, rubricBreakdown: gradingResult.rubricBreakdown },
        timeSpentSeconds: timeSpentSeconds || null, sequenceNumber,
      });

      res.status(201).json({ ...itemResponse, feedback: gradingResult.feedback });
    } catch (error: any) {
      console.error("Error submitting response:", error);
      res.status(500).json({ error: error.message || "Failed to submit response" });
    }
  });

  app.post("/api/acap/attempts/:id/complete", async (req: Request, res: Response) => {
    try {
      const attemptId = parseInt(req.params.id);
      const attempt = await acapStorage.getAttempt(attemptId);
      if (!attempt) return res.status(404).json({ error: "Attempt not found" });

      const responses = await acapStorage.getItemResponses(attemptId);
      const totalScore = responses.reduce((s, r) => s + (r.score || 0), 0);
      const maxScore = responses.reduce((s, r) => s + (r.maxScore || 1), 0);
      const percentCorrect = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;

      const dokBreakdown: Record<string, any> = {};
      const standardBreakdown: Record<string, any> = {};

      for (const resp of responses) {
        const item = await acapStorage.getItem(resp.itemId);
        if (!item) continue;
        const dokKey = `dok${item.dokLevel}`;
        if (!dokBreakdown[dokKey]) dokBreakdown[dokKey] = { correct: 0, total: 0 };
        dokBreakdown[dokKey].total++;
        if (resp.isCorrect) dokBreakdown[dokKey].correct++;

        const stdKey = `std${item.standardId}`;
        if (!standardBreakdown[stdKey]) standardBreakdown[stdKey] = { correct: 0, total: 0 };
        standardBreakdown[stdKey].total++;
        if (resp.isCorrect) standardBreakdown[stdKey].correct++;
      }

      const updated = await acapStorage.updateAttempt(attemptId, {
        status: "completed", completedAt: new Date(),
        rawScore: totalScore, scaledScore: percentCorrect,
        percentCorrect: Math.round(percentCorrect * 10) / 10,
        dokBreakdown, standardBreakdown,
        timeSpentSeconds: req.body.timeSpentSeconds || null,
      });

      // Update mastery tracking per standard
      for (const [stdKey, breakdown] of Object.entries(standardBreakdown)) {
        const standardId = parseInt(stdKey.replace("std", ""));
        const b = breakdown as any;
        const pct = b.total > 0 ? (b.correct / b.total) * 100 : 0;
        const level = pct >= 90 ? "mastered" : pct >= 70 ? "proficient" : pct >= 50 ? "developing" : "beginning";

        await acapStorage.upsertMastery({
          scholarId: attempt.scholarId, standardId, masteryLevel: level,
          currentScore: Math.round(pct * 10) / 10, lastAttemptDate: new Date(),
          history: [{ date: new Date().toISOString(), score: pct, attemptId }],
        });
      }

      // Create growth snapshot
      const assessment = await acapStorage.getAssessment(attempt.assessmentId);
      await acapStorage.createGrowthSnapshot({
        scholarId: attempt.scholarId,
        snapshotType: assessment?.assessmentType || "daily",
        assessmentId: attempt.assessmentId,
        overallScore: Math.round(percentCorrect * 10) / 10,
        domainScores: {},
        standardScores: Object.fromEntries(
          Object.entries(standardBreakdown).map(([k, v]: [string, any]) => [k, Math.round((v.correct / v.total) * 100)])
        ),
        growthFromBaseline: null,
        riskLevel: percentCorrect < 40 ? "high" : percentCorrect < 60 ? "moderate" : percentCorrect < 80 ? "low" : "none",
      });

      res.json(updated);
    } catch (error: any) {
      console.error("Error completing attempt:", error);
      res.status(500).json({ error: error.message || "Failed to complete attempt" });
    }
  });

  // ===== MASTERY & GROWTH =====
  app.get("/api/acap/mastery/:scholarId", async (req: Request, res: Response) => {
    try {
      const mastery = await acapStorage.getMastery(req.params.scholarId);
      res.json(mastery);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch mastery data" });
    }
  });

  app.get("/api/acap/growth/:scholarId", async (req: Request, res: Response) => {
    try {
      const snapshots = await acapStorage.getGrowthSnapshots(req.params.scholarId);
      res.json(snapshots);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch growth data" });
    }
  });

  // ===== BOOTCAMP =====
  app.get("/api/acap/bootcamp/:scholarId", async (req: Request, res: Response) => {
    try {
      const sessions = await acapStorage.getBootcampSessions(req.params.scholarId);
      res.json(sessions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch bootcamp sessions" });
    }
  });

  app.post("/api/acap/bootcamp/start", async (req: Request, res: Response) => {
    try {
      const { scholarId, standardId } = req.body;
      const existing = await acapStorage.getActiveBootcampSession(scholarId, standardId);
      if (existing) return res.json(existing);

      const session = await acapStorage.createBootcampSession({
        scholarId, standardId, sessionType: "tutoring",
        messages: [], practiceItems: [], performanceSummary: null, status: "active", endedAt: null,
      });
      res.status(201).json(session);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to start bootcamp session" });
    }
  });

  app.post("/api/acap/bootcamp/:sessionId/message", async (req: Request, res: Response) => {
    try {
      const sessionId = parseInt(req.params.sessionId);
      const { message, scholarName } = req.body;
      const session = await acapStorage.getBootcampSession(sessionId);
      if (!session) return res.status(404).json({ error: "Session not found" });

      const standard = await acapStorage.getStandard(session.standardId);
      if (!standard) return res.status(404).json({ error: "Standard not found" });

      const mastery = await acapStorage.getMasteryForStandard(session.scholarId, session.standardId);
      const history = (session.messages as any[]) || [];

      const tutorResponse = await bootcampTutor({
        standardCode: standard.code, standardDescription: standard.description,
        gradeLevel: standard.gradeLevel, scholarName: scholarName || "Scholar",
        currentMasteryLevel: mastery?.masteryLevel || "not_started",
        conversationHistory: history, userMessage: message,
      });

      const updatedMessages = [
        ...history,
        { role: "user", content: message, timestamp: new Date().toISOString() },
        { role: "assistant", content: tutorResponse.message, timestamp: new Date().toISOString() },
      ];

      await acapStorage.updateBootcampSession(sessionId, { messages: updatedMessages });
      res.json(tutorResponse);
    } catch (error: any) {
      console.error("Error in bootcamp tutoring:", error);
      res.status(500).json({ error: error.message || "Failed to process message" });
    }
  });

  app.post("/api/acap/bootcamp/:sessionId/end", async (req: Request, res: Response) => {
    try {
      const sessionId = parseInt(req.params.sessionId);
      const session = await acapStorage.updateBootcampSession(sessionId, { status: "completed", endedAt: new Date() });
      res.json(session);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to end session" });
    }
  });

  // ===== DASHBOARD STATS =====
  app.get("/api/acap/dashboard/teacher/:teacherId", async (req: Request, res: Response) => {
    try {
      const stats = await acapStorage.getTeacherDashboardStats(req.params.teacherId);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch dashboard stats" });
    }
  });

  app.get("/api/acap/dashboard/scholar/:scholarId", async (req: Request, res: Response) => {
    try {
      const stats = await acapStorage.getScholarDashboardStats(req.params.scholarId);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch dashboard stats" });
    }
  });

  // ===== REPORTS =====
  app.get("/api/acap/reports/assessment/:assessmentId", async (req: Request, res: Response) => {
    try {
      const assessmentId = parseInt(req.params.assessmentId);
      const assessment = await acapStorage.getAssessment(assessmentId);
      if (!assessment) return res.status(404).json({ error: "Assessment not found" });

      const attempts = await acapStorage.getAttemptsByAssessment(assessmentId);
      const completedAttempts = attempts.filter((a) => a.status === "completed");
      const avgScore = completedAttempts.length > 0
        ? completedAttempts.reduce((s, a) => s + (a.percentCorrect || 0), 0) / completedAttempts.length
        : 0;

      res.json({
        assessment,
        totalAttempts: attempts.length,
        completedAttempts: completedAttempts.length,
        averageScore: Math.round(avgScore * 10) / 10,
        scoreDistribution: {
          below40: completedAttempts.filter((a) => (a.percentCorrect || 0) < 40).length,
          "40to59": completedAttempts.filter((a) => (a.percentCorrect || 0) >= 40 && (a.percentCorrect || 0) < 60).length,
          "60to79": completedAttempts.filter((a) => (a.percentCorrect || 0) >= 60 && (a.percentCorrect || 0) < 80).length,
          "80to100": completedAttempts.filter((a) => (a.percentCorrect || 0) >= 80).length,
        },
        attempts: completedAttempts,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to generate report" });
    }
  });

  // ===== AUDIT LOG =====
  app.get("/api/acap/audit-log", async (req: Request, res: Response) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
      const log = await acapStorage.getAuditLog(limit);
      res.json(log);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch audit log" });
    }
  });
}
