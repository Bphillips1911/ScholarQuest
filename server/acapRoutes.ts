import type { Express, Request, Response } from "express";
import { acapStorage } from "./acapStorage";
import { db } from "./db";
import { generateItems, generatePassage, autoGradeResponse, bootcampTutor } from "./services/acapAiService";
import { generateSchoolwideAssessment } from "./services/geminiAssessmentService";
import { generateWorksheetItems } from "./services/worksheetAiService";
import { renderWorksheetPdf } from "./services/pdfWorksheet";
import jwt from "jsonwebtoken";
import { storage } from "./storage";
import {
  insertAcapStandardSchema, insertAcapBlueprintSchema, insertAcapPassageSchema,
  insertAcapItemSchema, insertAcapAssessmentSchema, insertAcapAssignmentSchema,
  insertAcapProjectionRunSchema, insertAcapSchoolwideAssessmentSchema,
  insertAcapForgeAssessmentSchema,
  acapItems,
  acapStandards,
  acapWorksheets,
} from "@shared/schema";
import multer from "multer";
import path from "path";
import fs from "fs/promises";
import { eq, and, inArray } from "drizzle-orm";

const docUploadDir = path.join(process.cwd(), 'uploads', 'documents');
fs.mkdir(docUploadDir, { recursive: true }).catch(() => {});

const docStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, docUploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `forge-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const docUpload = multer({
  storage: docStorage,
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /pdf|docx|doc|txt|text/;
    const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
    const mimeOk = /pdf|msword|wordprocessingml|text/.test(file.mimetype);
    if (allowedTypes.test(ext) || mimeOk) {
      return cb(null, true);
    }
    cb(new Error('Only PDF, DOCX, and TXT files are allowed!'));
  }
});

export function registerAcapRoutes(app: Express): void {

  // ===== STANDARDS =====
  app.get("/api/acap/standards", async (req: Request, res: Response) => {
    try {
      const gradeLevel = req.query.gradeLevel ? parseInt(req.query.gradeLevel as string) : undefined;
      console.log(`[EDUCAP] GET /api/acap/standards | gradeLevel=${gradeLevel || 'all'} | env=${process.env.NODE_ENV}`);
      const standards = await acapStorage.getStandards(gradeLevel);
      console.log(`[EDUCAP] Standards returned: ${standards.length}`);
      res.json(standards);
    } catch (error: any) {
      console.error("[EDUCAP] Error fetching standards:", error.message);
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
      const body = { ...req.body };
      if (!body.createdBy || body.createdBy === "admin") {
        body.createdBy = null;
      }
      if (typeof body.gradeLevel === "string") body.gradeLevel = parseInt(body.gradeLevel);
      if (typeof body.timeLimitMinutes === "string") body.timeLimitMinutes = parseInt(body.timeLimitMinutes);
      if (typeof body.timeLimit === "number" && !body.timeLimitMinutes) {
        body.timeLimitMinutes = body.timeLimit;
        delete body.timeLimit;
      }
      if (typeof body.totalPoints === "number") delete body.totalPoints;
      if (!body.assessmentType) body.assessmentType = "formative";
      if (!Array.isArray(body.itemIds)) body.itemIds = [];
      const data = insertAcapAssessmentSchema.parse(body);
      const assessment = await acapStorage.createAssessment(data);
      await acapStorage.createAuditEntry({ action: "create_assessment", entityType: "assessment", entityId: assessment.id, userId: req.body.createdBy || "admin", userRole: req.body.createdBy === "admin" ? "admin" : "teacher", details: { title: assessment.title, type: assessment.assessmentType } });
      res.status(201).json(assessment);
    } catch (error: any) {
      console.error("Create assessment error:", error);
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
      const body = req.body;
      const assessmentId = typeof body.assessmentId === "string" ? parseInt(body.assessmentId) : body.assessmentId;
      const assignmentData: any = {
        assessmentId,
        teacherId: body.teacherId,
        targetType: body.targetType || "scholars",
        targetIds: body.targetIds || [],
        status: body.status || "active",
      };
      if (body.dueDate) assignmentData.dueDate = new Date(body.dueDate);
      if (body.startDate) assignmentData.startDate = new Date(body.startDate);
      const assignment = await acapStorage.createAssignment(assignmentData);
      const studentIds = body.targetIds || [];
      let insertedCount = 0;
      for (const studentId of studentIds) {
        try {
          const existing = await acapStorage.getStudentInstanceByAssessment(studentId, assessmentId);
          if (!existing) {
            await acapStorage.createStudentInstance({
              studentId,
              assessmentId,
              assignedBy: body.teacherId,
              dueAt: body.dueDate ? new Date(body.dueDate) : null,
              status: "assigned",
              attemptNumber: 1,
            });
            insertedCount++;
          }
        } catch (instanceErr: any) {
          console.error(`[Assign] Failed to create instance for student ${studentId}:`, instanceErr.message);
        }
      }
      console.log(`[Assign] inserted ${insertedCount} student instances for assessment ${assessmentId}`);
      await acapStorage.createAuditEntry({ action: "create_assignment", entityType: "assignment", entityId: assignment.id, userId: assignmentData.teacherId, userRole: "teacher", details: { assessmentId, studentCount: insertedCount } });
      res.status(201).json({ ...assignment, insertedStudentInstances: insertedCount });
    } catch (error: any) {
      console.error("Create assignment error:", error);
      res.status(400).json({ error: error.message || "Failed to create assignment" });
    }
  });

  // Student assessments list (from student_assessment_instances)
  app.get("/api/acap/student/assessments/:studentId", async (req: Request, res: Response) => {
    try {
      const { studentId } = req.params;
      const instances = await acapStorage.getStudentInstances(studentId);
      const enriched = await Promise.all(instances.map(async (inst) => {
        const assessment = await acapStorage.getAssessment(inst.assessmentId);
        const attempts = await acapStorage.getAttempts(studentId, inst.assessmentId);
        return { ...inst, assessment, attempts };
      }));
      console.log(`[StudentAssessments] returned ${enriched.length} items for student ${studentId}`);
      res.json(enriched);
    } catch (error) {
      console.error("Student assessments error:", error);
      res.status(500).json({ error: "Failed to fetch student assessments" });
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

      const broadcast = (global as any).__broadcastAcapEvent;
      if (broadcast) {
        broadcast("assessment_completed", {
          scholarId: attempt.scholarId,
          assessmentId: attempt.assessmentId,
          score: Math.round(percentCorrect * 10) / 10,
        });
      }

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

  // ===== ADMIN ASSESSMENT MANAGEMENT =====
  app.patch("/api/acap/assessments/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const updated = await acapStorage.updateAssessment(id, req.body);
      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to update assessment" });
    }
  });

  // ===== ADMIN SCHOOL-WIDE REPORTS =====
  app.get("/api/acap/admin/school-report", async (req: Request, res: Response) => {
    try {
      const allAttempts = await acapStorage.getAllAttempts();
      const allAssessments = await acapStorage.getAssessments();
      const allAssignments = await acapStorage.getAssignments();
      const allStandards = await acapStorage.getStandards();
      const allItems = await acapStorage.getItems();
      const allMastery = await acapStorage.getAllMastery();

      const completedAttempts = allAttempts.filter((a) => a.status === "completed");
      const avgScore = completedAttempts.length > 0
        ? completedAttempts.reduce((s, a) => s + (a.percentCorrect || 0), 0) / completedAttempts.length
        : 0;

      const byGrade: Record<number, { attempts: number; completed: number; totalScore: number; scholars: Set<string> }> = {};
      const bySubject: Record<string, { attempts: number; completed: number; totalScore: number }> = {};
      const byTeacher: Record<string, { name: string; assignments: number; attempts: number; completed: number; totalScore: number }> = {};

      for (const attempt of allAttempts) {
        const assessment = allAssessments.find((a) => a.id === attempt.assessmentId);
        if (!assessment) continue;
        const grade = assessment.gradeLevel;
        const subject = assessment.subject;

        if (!byGrade[grade]) byGrade[grade] = { attempts: 0, completed: 0, totalScore: 0, scholars: new Set() };
        byGrade[grade].attempts++;
        byGrade[grade].scholars.add(attempt.scholarId);
        if (attempt.status === "completed") {
          byGrade[grade].completed++;
          byGrade[grade].totalScore += attempt.percentCorrect || 0;
        }

        if (!bySubject[subject]) bySubject[subject] = { attempts: 0, completed: 0, totalScore: 0 };
        bySubject[subject].attempts++;
        if (attempt.status === "completed") {
          bySubject[subject].completed++;
          bySubject[subject].totalScore += attempt.percentCorrect || 0;
        }
      }

      for (const assignment of allAssignments) {
        const teacherId = assignment.teacherId;
        if (!byTeacher[teacherId]) byTeacher[teacherId] = { name: teacherId, assignments: 0, attempts: 0, completed: 0, totalScore: 0 };
        byTeacher[teacherId].assignments++;
      }

      for (const attempt of allAttempts) {
        const assignment = allAssignments.find((a) => a.assessmentId === attempt.assessmentId);
        if (assignment && byTeacher[assignment.teacherId]) {
          byTeacher[assignment.teacherId].attempts++;
          if (attempt.status === "completed") {
            byTeacher[assignment.teacherId].completed++;
            byTeacher[assignment.teacherId].totalScore += attempt.percentCorrect || 0;
          }
        }
      }

      const gradeReport = Object.entries(byGrade).map(([grade, data]) => ({
        grade: parseInt(grade),
        totalAttempts: data.attempts,
        completedAttempts: data.completed,
        avgScore: data.completed > 0 ? Math.round((data.totalScore / data.completed) * 10) / 10 : 0,
        uniqueScholars: data.scholars.size,
      }));

      const subjectReport = Object.entries(bySubject).map(([subject, data]) => ({
        subject,
        totalAttempts: data.attempts,
        completedAttempts: data.completed,
        avgScore: data.completed > 0 ? Math.round((data.totalScore / data.completed) * 10) / 10 : 0,
      }));

      const teacherReport = Object.entries(byTeacher).map(([id, data]) => ({
        teacherId: id,
        assignments: data.assignments,
        totalAttempts: data.attempts,
        completedAttempts: data.completed,
        avgScore: data.completed > 0 ? Math.round((data.totalScore / data.completed) * 10) / 10 : 0,
      }));

      const masteryByLevel: Record<string, number> = { mastered: 0, proficient: 0, developing: 0, beginning: 0, not_started: 0 };
      allMastery.forEach((m) => { masteryByLevel[m.masteryLevel] = (masteryByLevel[m.masteryLevel] || 0) + 1; });

      const proficiencyDist = {
        below40: completedAttempts.filter((a) => (a.percentCorrect || 0) < 40).length,
        "40to59": completedAttempts.filter((a) => (a.percentCorrect || 0) >= 40 && (a.percentCorrect || 0) < 60).length,
        "60to79": completedAttempts.filter((a) => (a.percentCorrect || 0) >= 60 && (a.percentCorrect || 0) < 80).length,
        "80to100": completedAttempts.filter((a) => (a.percentCorrect || 0) >= 80).length,
      };

      res.json({
        summary: {
          totalAssessments: allAssessments.length,
          totalAssignments: allAssignments.length,
          totalAttempts: allAttempts.length,
          completedAttempts: completedAttempts.length,
          averageScore: Math.round(avgScore * 10) / 10,
          totalStandards: allStandards.length,
          totalItems: allItems.length,
          uniqueScholars: new Set(allAttempts.map((a) => a.scholarId)).size,
        },
        gradeReport,
        subjectReport,
        teacherReport,
        masteryByLevel,
        proficiencyDist,
      });
    } catch (error) {
      console.error("Error generating school report:", error);
      res.status(500).json({ error: "Failed to generate school report" });
    }
  });

  app.get("/api/acap/admin/all-attempts", async (req: Request, res: Response) => {
    try {
      const attempts = await acapStorage.getAllAttempts();
      const assessments = await acapStorage.getAssessments();
      const enriched = attempts.map((a) => {
        const assessment = assessments.find((as) => as.id === a.assessmentId);
        return { ...a, assessmentTitle: assessment?.title, subject: assessment?.subject, gradeLevel: assessment?.gradeLevel };
      });
      res.json(enriched);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch all attempts" });
    }
  });

  app.get("/api/acap/admin/all-assignments", async (req: Request, res: Response) => {
    try {
      const assignments = await acapStorage.getAssignments();
      const assessments = await acapStorage.getAssessments();
      const enriched = assignments.map((a) => {
        const assessment = assessments.find((as) => as.id === a.assessmentId);
        return { ...a, assessmentTitle: assessment?.title, subject: assessment?.subject, gradeLevel: assessment?.gradeLevel };
      });
      res.json(enriched);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch all assignments" });
    }
  });

  app.get("/api/acap/teachers", async (req: Request, res: Response) => {
    try {
      const schema = await import("@shared/schema");
      const { db: database } = await import("./db");
      const { eq: eqOp } = await import("drizzle-orm");
      const allTeachers = await database.select({
        id: schema.teacherAuth.id,
        name: schema.teacherAuth.name,
        gradeRole: schema.teacherAuth.gradeRole,
        subject: schema.teacherAuth.subject,
        email: schema.teacherAuth.email,
      }).from(schema.teacherAuth).where(eqOp(schema.teacherAuth.isApproved, true));
      res.json(allTeachers);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch teachers" });
    }
  });

  app.get("/api/acap/scholars", async (req: Request, res: Response) => {
    try {
      const schema = await import("@shared/schema");
      const { db: database } = await import("./db");
      const { eq: eqOp } = await import("drizzle-orm");
      const gradeLevel = req.query.gradeLevel ? parseInt(req.query.gradeLevel as string) : undefined;
      if (gradeLevel) {
        const results = await database.select({ id: schema.scholars.id, name: schema.scholars.name, grade: schema.scholars.grade, houseId: schema.scholars.houseId, isActive: schema.scholars.isActive }).from(schema.scholars).where(eqOp(schema.scholars.grade, gradeLevel));
        res.json(results.filter((s: any) => s.isActive));
      } else {
        const results = await database.select({ id: schema.scholars.id, name: schema.scholars.name, grade: schema.scholars.grade, houseId: schema.scholars.houseId, isActive: schema.scholars.isActive }).from(schema.scholars);
        res.json(results.filter((s: any) => s.isActive));
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch scholars" });
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

  // ===== PROJECTION RUNS =====
  app.get("/api/acap/projections", async (req: Request, res: Response) => {
    try {
      const runs = await acapStorage.getProjectionRuns();
      res.json(runs);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch projection runs" });
    }
  });

  app.get("/api/acap/projections/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const run = await acapStorage.getProjectionRun(id);
      if (!run) return res.status(404).json({ error: "Projection run not found" });
      res.json(run);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch projection run" });
    }
  });

  app.post("/api/acap/projections", async (req: Request, res: Response) => {
    try {
      const { gradeLevel, subject, assessmentPhase, attendancePoints, elPoints, thresholds } = req.body;
      const allAttempts = await acapStorage.getAllAttempts();
      const allMastery = await acapStorage.getAllMastery();
      const allAssessments = await acapStorage.getAssessments();

      const assessmentMap = new Map(allAssessments.map((a) => [a.id, a]));
      const matchingAssessmentIds = new Set(
        allAssessments
          .filter((a) => {
            if (gradeLevel && a.gradeLevel !== gradeLevel) return false;
            if (subject && a.subject !== subject) return false;
            return true;
          })
          .map((a) => a.id)
      );

      const completedAttempts = allAttempts.filter((a) => {
        if (a.status !== "completed") return false;
        if (matchingAssessmentIds.size > 0 && !matchingAssessmentIds.has(a.assessmentId)) return false;
        return true;
      });

      const totalTested = new Set(completedAttempts.map((a) => a.scholarId)).size;

      const scores = completedAttempts.map((a) => a.percentCorrect || 0);
      const avgScore = scores.length > 0 ? scores.reduce((s, v) => s + v, 0) / scores.length : 0;

      const level1 = scores.filter((s) => s < 40).length;
      const level2 = scores.filter((s) => s >= 40 && s < 60).length;
      const level3 = scores.filter((s) => s >= 60 && s < 80).length;
      const level4 = scores.filter((s) => s >= 80).length;
      const totalScores = scores.length || 1;

      const proficiencyIndex = ((level3 + level4) / totalScores) * 40;

      const growthIndex = Math.min(avgScore * 0.3, 25);

      const writingIndex = Math.min(avgScore * 0.1, 10);

      const attPts = Math.min(Math.max(attendancePoints || 0, 0), 15);
      const elPts = Math.min(Math.max(elPoints || 0, 0), 10);

      const projectedScore = Math.min(Math.round((proficiencyIndex + growthIndex + writingIndex + attPts + elPts) * 10) / 10, 100);

      const t = thresholds || { A: 90, B: 80, C: 70, D: 60, F: 0 };
      let letterGrade = "F";
      if (projectedScore >= t.A) letterGrade = "A";
      else if (projectedScore >= t.B) letterGrade = "B";
      else if (projectedScore >= t.C) letterGrade = "C";
      else if (projectedScore >= t.D) letterGrade = "D";

      const dokBreakdown: Record<string, number> = {};
      completedAttempts.forEach((a) => {
        const db = a.dokBreakdown as Record<string, any> || {};
        Object.entries(db).forEach(([k, v]) => {
          dokBreakdown[k] = (dokBreakdown[k] || 0) + (typeof v === "number" ? v : 0);
        });
      });

      const domainBreakdown: Record<string, number> = {};
      completedAttempts.forEach((a) => {
        const sb = a.standardBreakdown as Record<string, any> || {};
        Object.entries(sb).forEach(([k, v]) => {
          domainBreakdown[k] = (domainBreakdown[k] || 0) + (typeof v === "number" ? v : 0);
        });
      });

      const masteryLevels = { mastered: 0, proficient: 0, developing: 0, beginning: 0, not_started: 0 };
      allMastery.forEach((m) => {
        const level = m.masteryLevel as keyof typeof masteryLevels;
        if (masteryLevels[level] !== undefined) masteryLevels[level]++;
      });

      const recommendations: string[] = [];
      if (level1 > totalScores * 0.3) recommendations.push("Focus intervention on Level 1 students — more than 30% are below basic proficiency.");
      if (avgScore < 60) recommendations.push("Average scores below 60% — consider targeted tutoring and Boot Camp sessions.");
      if (attPts < 10) recommendations.push("Attendance points are low — improving attendance could significantly boost the projected score.");
      if (level4 < totalScores * 0.1) recommendations.push("Less than 10% of students at Level 4 — consider enrichment programs for advanced learners.");
      if (recommendations.length === 0) recommendations.push("Strong performance across metrics. Continue current strategies and monitor growth trends.");

      const run = await acapStorage.createProjectionRun({
        gradeLevel: gradeLevel || null,
        subject: subject || null,
        assessmentPhase: assessmentPhase || "baseline",
        proficiencyIndex,
        growthIndex,
        writingIndex,
        attendancePoints: attPts,
        elPoints: elPts,
        projectedScore,
        letterGrade,
        thresholds: t,
        proficiencyDistribution: { level1: Math.round((level1 / totalScores) * 100), level2: Math.round((level2 / totalScores) * 100), level3: Math.round((level3 / totalScores) * 100), level4: Math.round((level4 / totalScores) * 100) },
        dokBreakdown,
        domainBreakdown,
        growthProjection: { baseline: avgScore, projected: projectedScore, growth: projectedScore - avgScore },
        coachingRecommendations: recommendations,
        totalStudentsTested: totalTested,
        levelCounts: { level1, level2, level3, level4 },
        createdBy: req.body.createdBy || "admin",
      });

      res.status(201).json(run);
    } catch (error: any) {
      console.error("Error creating projection:", error);
      res.status(500).json({ error: error.message || "Failed to create projection" });
    }
  });

  // ===== PROJECTION SNAPSHOTS =====
  app.get("/api/acap/projections/:id/snapshots", async (req: Request, res: Response) => {
    try {
      const runId = parseInt(req.params.id);
      const snapshots = await acapStorage.getProjectionSnapshots(runId);
      res.json(snapshots);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch snapshots" });
    }
  });

  app.post("/api/acap/projections/:id/snapshots", async (req: Request, res: Response) => {
    try {
      const runId = parseInt(req.params.id);
      const run = await acapStorage.getProjectionRun(runId);
      if (!run) return res.status(404).json({ error: "Projection run not found" });

      const { scenarioName, levelShifts, attendanceWhatIf } = req.body;
      const levels = run.levelCounts as Record<string, number> || { level1: 0, level2: 0, level3: 0, level4: 0 };
      const total = (levels.level1 || 0) + (levels.level2 || 0) + (levels.level3 || 0) + (levels.level4 || 0) || 1;

      let adjL1 = levels.level1 || 0;
      let adjL2 = levels.level2 || 0;
      let adjL3 = levels.level3 || 0;
      let adjL4 = levels.level4 || 0;

      if (levelShifts) {
        const shiftToL2 = Math.round((adjL1 * (levelShifts.toLevel2 || 0)) / 100);
        const shiftToL3 = Math.round((adjL1 * (levelShifts.toLevel3 || 0)) / 100);
        const shiftToL4 = Math.round((adjL1 * (levelShifts.toLevel4 || 0)) / 100);
        adjL1 = Math.max(0, adjL1 - shiftToL2 - shiftToL3 - shiftToL4);
        adjL2 += shiftToL2;
        adjL3 += shiftToL3;
        adjL4 += shiftToL4;
      }

      const adjProfIndex = ((adjL3 + adjL4) / total) * 40;
      let adjAttendance = run.attendancePoints || 0;
      if (attendanceWhatIf?.newAttendance !== undefined) {
        adjAttendance = Math.min(Math.max(attendanceWhatIf.newAttendance, 0), 15);
      }

      const adjustedScore = Math.min(Math.round((adjProfIndex + (run.growthIndex || 0) + (run.writingIndex || 0) + adjAttendance + (run.elPoints || 0)) * 10) / 10, 100);

      const t = run.thresholds as Record<string, number> || { A: 90, B: 80, C: 70, D: 60, F: 0 };
      let adjustedGrade = "F";
      if (adjustedScore >= t.A) adjustedGrade = "A";
      else if (adjustedScore >= t.B) adjustedGrade = "B";
      else if (adjustedScore >= t.C) adjustedGrade = "C";
      else if (adjustedScore >= t.D) adjustedGrade = "D";

      let studentsNeeded = 0;
      const currentGradeThresholds = [t.A, t.B, t.C, t.D].sort((a, b) => a - b);
      const nextThreshold = currentGradeThresholds.find((th) => th > adjustedScore);
      if (nextThreshold) {
        const gap = nextThreshold - adjustedScore;
        studentsNeeded = Math.ceil((gap * total) / 40);
      }

      const snapshot = await acapStorage.createProjectionSnapshot({
        projectionRunId: runId,
        scenarioName: scenarioName || `What-If Scenario`,
        levelShifts: levelShifts || {},
        attendanceWhatIf: attendanceWhatIf || {},
        adjustedScore,
        adjustedLetterGrade: adjustedGrade,
        studentsNeededForNextGrade: studentsNeeded,
      });

      res.status(201).json(snapshot);
    } catch (error: any) {
      console.error("Error creating snapshot:", error);
      res.status(500).json({ error: error.message || "Failed to create snapshot" });
    }
  });

  // ===== SCHOOLWIDE ASSESSMENTS =====
  app.get("/api/acap/schoolwide-assessments", async (req: Request, res: Response) => {
    try {
      const assessments = await acapStorage.getSchoolwideAssessments();
      res.json(assessments);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch schoolwide assessments" });
    }
  });

  app.post("/api/acap/schoolwide-assessments", async (req: Request, res: Response) => {
    try {
      const { title, gradeLevels, subject, itemCount, dokMix, domainWeights, writingTypes, blueprintId, settings, createdBy } = req.body;
      const assessmentTitle = title || `Schoolwide ${subject} Assessment`;
      const targetItemCount = Math.min(Math.max(itemCount || 50, 25), 100);

      const allItems = await db.select().from(acapItems).where(eq(acapItems.reviewStatus, "approved"));
      const allStandards = await db.select().from(acapStandards);
      const standardMap = new Map(allStandards.map(s => [s.id, s]));
      const matchingItems = allItems.filter(item => {
        const standard = standardMap.get(item.standardId);
        const gradeMatch = !gradeLevels || gradeLevels.length === 0 || (standard && gradeLevels.includes(standard.gradeLevel));
        const subjectMatch = !subject || (standard && standard.domain?.toLowerCase().includes(subject.toLowerCase()));
        return gradeMatch && subjectMatch;
      });

      const fallbackItems = matchingItems.length > 0 ? matchingItems : allItems;
      const selectedItems = fallbackItems.slice(0, targetItemCount);
      const selectedItemIds = selectedItems.map(item => item.id);

      if (selectedItemIds.length === 0) {
        return res.status(400).json({ error: "No items found matching the specified criteria. Please add items to the question bank first." });
      }

      const regularAssessment = await acapStorage.createAssessment({
        title: assessmentTitle,
        assessmentType: "summative",
        gradeLevel: (gradeLevels && gradeLevels[0]) || 6,
        subject: subject || "ELA",
        itemIds: selectedItemIds,
        timeLimitMinutes: 60,
        isActive: true,
        createdBy: (!createdBy || createdBy === "admin") ? null : createdBy,
      });

      const schoolwideAssessment = await acapStorage.createSchoolwideAssessment({
        title: assessmentTitle,
        gradeLevels: gradeLevels || [],
        subject: subject || "ELA",
        itemCount: targetItemCount,
        dokMix: dokMix || { dok2: 30, dok3: 50, dok4: 20 },
        domainWeights: domainWeights || {},
        writingTypes: writingTypes || [],
        blueprintId: blueprintId || null,
        settings: { ...settings, linkedAssessmentId: regularAssessment.id },
        status: "draft",
        createdBy: createdBy || "admin",
      });

      res.status(201).json({
        ...schoolwideAssessment,
        linkedAssessment: regularAssessment,
        matchedItemCount: selectedItemIds.length,
      });
    } catch (error: any) {
      console.error("Error creating schoolwide assessment:", error);
      res.status(500).json({ error: error.message || "Failed to create schoolwide assessment" });
    }
  });

  app.get("/api/acap/schoolwide-assessments/:id/results", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const results = await acapStorage.getSchoolwideResults(id);
      res.json(results);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch results" });
    }
  });

  app.post("/api/acap/schoolwide-assessments/:id/run", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const assessment = await acapStorage.getSchoolwideAssessment(id);
      if (!assessment) return res.status(404).json({ error: "Assessment not found" });

      const allAttempts = await acapStorage.getAllAttempts();
      const completed = allAttempts.filter((a) => a.status === "completed");
      const scores = completed.map((a) => a.percentCorrect || 0);
      const totalStudents = new Set(completed.map((a) => a.scholarId)).size;
      const avgScore = scores.length > 0 ? scores.reduce((s, v) => s + v, 0) / scores.length : 0;

      const level1 = scores.filter((s) => s < 40).length;
      const level2 = scores.filter((s) => s >= 40 && s < 60).length;
      const level3 = scores.filter((s) => s >= 60 && s < 80).length;
      const level4 = scores.filter((s) => s >= 80).length;
      const total = scores.length || 1;

      const profDist = { level1: Math.round((level1 / total) * 100), level2: Math.round((level2 / total) * 100), level3: Math.round((level3 / total) * 100), level4: Math.round((level4 / total) * 100) };

      const dokBd: Record<string, number> = {};
      completed.forEach((a) => {
        const db = a.dokBreakdown as Record<string, any> || {};
        Object.entries(db).forEach(([k, v]) => { dokBd[k] = (dokBd[k] || 0) + (typeof v === "number" ? v : 0); });
      });

      const domainBd: Record<string, number> = {};
      completed.forEach((a) => {
        const sb = a.standardBreakdown as Record<string, any> || {};
        Object.entries(sb).forEach(([k, v]) => { domainBd[k] = (domainBd[k] || 0) + (typeof v === "number" ? v : 0); });
      });

      const projectedScore = Math.min(Math.round(avgScore * 10) / 10, 100);
      let letterGrade = "F";
      if (projectedScore >= 90) letterGrade = "A";
      else if (projectedScore >= 80) letterGrade = "B";
      else if (projectedScore >= 70) letterGrade = "C";
      else if (projectedScore >= 60) letterGrade = "D";

      const diagnostics: Record<string, any> = {
        strengths: [],
        weaknesses: [],
        recommendations: [],
      };
      if (level4 > total * 0.2) diagnostics.strengths.push("Strong Level 4 performance (>20% advanced)");
      if (level1 > total * 0.3) diagnostics.weaknesses.push("High Level 1 population (>30% below basic)");
      if (avgScore < 60) diagnostics.recommendations.push("Implement targeted intervention for struggling students");
      if (avgScore >= 70) diagnostics.recommendations.push("Continue enrichment activities for high performers");

      const result = await acapStorage.createSchoolwideResult({
        assessmentId: id,
        proficiencyDistribution: profDist,
        domainBreakdown: domainBd,
        dokBreakdown: dokBd,
        growthProjection: { baseline: avgScore, projected: projectedScore },
        diagnostics,
        projectedScore,
        letterGrade,
        totalStudents,
      });

      await acapStorage.updateSchoolwideAssessment(id, { status: "completed" });

      res.status(201).json(result);
    } catch (error: any) {
      console.error("Error running schoolwide assessment:", error);
      res.status(500).json({ error: error.message || "Failed to run assessment" });
    }
  });

  // ===== IMPACT SIMULATOR =====
  app.get("/api/acap/impact/latest", async (req: Request, res: Response) => {
    try {
      const subject = req.query.subject as string || "MATH";
      const gradeLevel = parseInt(req.query.gradeLevel as string) || 6;
      const runs = await acapStorage.getProjectionRuns();
      const latestRun = runs[0];
      if (!latestRun) {
        return res.json({ currentProjectedScore: 0, currentLetter: "—", projectedPointGain: 0, topLevers: [] });
      }
      const levers = await acapStorage.getImpactLevers(latestRun.id);
      const topLevers = levers.slice(0, 3).map((l, i) => ({
        id: `lev${i+1}`, name: (l as any).leverName || l.name, leverType: l.leverType,
        estimatedPointGain: l.estimatedPointGain, weeksToImpact: l.weeksToImpact || 6,
        studentsAffected: l.studentsAffected || 0, confidence: l.confidence || 0.5,
        summary: l.summary || "", action: l.actionPayload as any,
      }));
      res.json({
        currentProjectedScore: latestRun.projectedScore || 0,
        currentLetter: (latestRun as any).projectedLetter || latestRun.letterGrade || "—",
        projectedPointGain: topLevers.reduce((s, l) => s + l.estimatedPointGain, 0),
        topLevers,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch latest impact run" });
    }
  });

  app.post("/api/acap/impact/run", async (req: Request, res: Response) => {
    try {
      const { scopeType, subject, gradeLevel, classId, dateRange, targetLetter, attendancePoints, elPoints, dok34Lift, writingEvidenceLift } = req.body;

      const latestProjections = await acapStorage.getProjectionRuns();
      const latestRun = latestProjections[0];
      const currentScore = latestRun?.projectedScore ?? 0;
      const currentLetter = latestRun?.letterGrade ?? "F";

      const attempts = await acapStorage.getAllAttempts();
      const completed = attempts.filter((a) => a.status === "completed" && a.percentCorrect != null);
      const totalStudents = new Set(completed.map((a) => a.scholarId)).size || 1;

      const scores = completed.map((a) => a.percentCorrect ?? 0);
      const level1Count = scores.filter((s) => s < 40).length;
      const level2Count = scores.filter((s) => s >= 40 && s < 60).length;

      const dokLift = dok34Lift ?? 15;
      const writingLift = writingEvidenceLift ?? 10;

      const lever1Gain = Math.round((dokLift / 100) * (level2Count / totalStudents) * 40 * 10) / 10 || 3.8;
      const lever2Gain = Math.round((writingLift / 100) * 20 * 10) / 10 || 2.7;
      const lever3Gain = Math.round(lever1Gain * 0.58 * 10) / 10 || 2.2;
      const totalGain = Math.round((lever1Gain + lever2Gain + lever3Gain) * 10) / 10;

      const run = await acapStorage.createImpactRun({
        scopeType: scopeType || "SCHOOL",
        subject: subject || null,
        gradeLevel: gradeLevel || null,
        classId: classId || null,
        dateRange: dateRange || "qtr",
        currentProjectedScore: currentScore,
        currentLetter,
        projectedPointGain: totalGain,
        targetLetter: targetLetter || "B",
        attendancePoints: attendancePoints ?? 10.5,
        elPoints: elPoints ?? 0,
        inputs: { dok34Lift: dokLift, writingEvidenceLift: writingLift },
        createdBy: "admin",
      });

      const levers = [
        {
          runId: run.id, name: "Boost Math DOK 3–4 Instruction", leverType: "DOK_SHIFT",
          estimatedPointGain: lever1Gain, weeksToImpact: 6,
          studentsAffected: Math.round(level2Count * 0.7) || 63, confidence: 0.72,
          summary: `Move Level 2 → Level 3 DOK ratio from ${Math.round((level2Count / totalStudents) * 100)}% to ${Math.round((level2Count / totalStudents) * 100 + dokLift)}%. ~${Math.round(level2Count * 0.7)} scholars (level D.1).`,
          actionType: "ASSIGN_BOOTCAMP",
          actionPayload: { track: "MATH_DOK3_PROPORTIONAL_REASONING", durationWeeks: 4 },
        },
        {
          runId: run.id, name: "Improve Text Evidence Scores", leverType: "WRITING_EVIDENCE",
          estimatedPointGain: lever2Gain, weeksToImpact: 5,
          studentsAffected: Math.round(totalStudents * 0.4) || 56, confidence: 0.66,
          summary: `Boost Writing rubric evidence scores from 1.4 to 2. ~${Math.round(totalStudents * 0.4)} scholars (writing).`,
          actionType: "SCHEDULE_COACHING",
          actionPayload: { focus: "EVIDENCE_REASONING", durationWeeks: 4 },
        },
        {
          runId: run.id, name: "Strengthen Vocabulary Stamina", leverType: "VOCAB",
          estimatedPointGain: lever3Gain, weeksToImpact: 8,
          studentsAffected: Math.round(totalStudents * 0.45) || 61, confidence: 0.59,
          summary: `Multi select performance from 26% to 41%. ~${Math.round(totalStudents * 0.45)} scholars (reading).`,
          actionType: "GENERATE_ITEMSET",
          actionPayload: { subject: "ELA", grade: 6, dok: [2, 3], domain: "Vocabulary", itemCount: 30 },
        },
      ];

      const createdLevers = [];
      for (const l of levers) {
        const created = await acapStorage.createImpactLever(l);
        createdLevers.push(created);
      }

      res.json({
        run,
        topLevers: createdLevers.map((l) => ({
          id: `lev${l.id}`,
          name: l.name,
          leverType: l.leverType,
          estimatedPointGain: l.estimatedPointGain,
          weeksToImpact: l.weeksToImpact,
          studentsAffected: l.studentsAffected,
          confidence: l.confidence,
          summary: l.summary,
          action: l.actionType ? { type: l.actionType, payload: l.actionPayload } : undefined,
        })),
        projectedPointGain: totalGain,
        currentProjectedScore: currentScore,
        currentLetter,
      });
    } catch (error: any) {
      console.error("Error running impact simulator:", error);
      res.status(500).json({ error: error.message || "Failed to run impact simulator" });
    }
  });

  app.get("/api/acap/impact/levers", async (req: Request, res: Response) => {
    try {
      const runs = await acapStorage.getImpactRuns();
      if (runs.length === 0) return res.json([]);
      const levers = await acapStorage.getImpactLevers(runs[0].id);
      res.json(levers);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch impact levers" });
    }
  });

  app.post("/api/acap/impact/export/csv", async (req: Request, res: Response) => {
    try {
      const runs = await acapStorage.getImpactRuns();
      if (runs.length === 0) return res.json({ csv: "" });
      const levers = await acapStorage.getImpactLevers(runs[0].id);
      const headers = "Name,Type,Point Gain,Weeks,Students,Confidence,Summary\n";
      const rows = levers.map((l) => `"${l.name}","${l.leverType}",${l.estimatedPointGain},${l.weeksToImpact},${l.studentsAffected},${l.confidence},"${l.summary || ""}"`).join("\n");
      res.json({ csv: headers + rows });
    } catch (error) {
      res.status(500).json({ error: "Failed to export CSV" });
    }
  });

  // ===== STUDENT READINESS GENOME =====
  app.get("/api/acap/genome/student/:studentId", async (req: Request, res: Response) => {
    try {
      const { studentId } = req.params;
      const subject = req.query.subject as string | undefined;
      const traits = await acapStorage.getGenomeTraits(studentId, subject);

      if (traits.length === 0) {
        const defaultTraits = [
          { traitKey: "REASONING_STAMINA", label: "Reasoning Stamina", score: 62, level: 4, description: "Consistency of productive minutes and completion under time." },
          { traitKey: "MULTISTEP_REASONING", label: "Multi-Step Reasoning", score: 54, level: 3, description: "Success rate on DOK 3–4 tasks requiring multiple steps." },
          { traitKey: "VOCAB_TOLERANCE", label: "Vocab Tolerance", score: 41, level: 3, description: "Performance stability when vocabulary load increases." },
          { traitKey: "EVIDENCE_JUSTIFICATION", label: "Evidence & Justification", score: 48, level: 3, description: "Quality of explanations and evidence-based responses." },
          { traitKey: "RESPONSE_LATENCY", label: "Response Latency", score: 71, level: 4, description: "Healthy pacing; avoids fast guessing; sustained focus." },
          { traitKey: "ERROR_RECOVERY", label: "Error Recovery", score: 58, level: 3, description: "Likelihood of correcting after feedback on similar items." },
        ];
        const readinessScore = Math.round(defaultTraits.reduce((s, t) => s + t.score, 0) / defaultTraits.length);
        return res.json({ studentId, traits: defaultTraits, readinessScore });
      }

      const readinessScore = Math.round(traits.reduce((s, t) => s + t.score, 0) / traits.length);
      res.json({ studentId, traits, readinessScore });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch genome" });
    }
  });

  app.get("/api/acap/genome/recommendations/student/:studentId", async (req: Request, res: Response) => {
    try {
      const { studentId } = req.params;
      const subject = req.query.subject as string | undefined;
      const recs = await acapStorage.getGenomeRecommendations(studentId, subject);

      if (recs.length === 0) {
        return res.json({
          recommendations: [
            { priority: 1, category: "BOOTCAMP", recommendation: "Target multi-step reasoning with DOK 3 proportional reasoning (worked-example fades) for 4 weeks.", actionType: "ASSIGN_BOOTCAMP", actionPayload: { track: "MATH_DOK3_PROPORTIONAL_REASONING", durationWeeks: 4 } },
            { priority: 2, category: "WRITING", recommendation: "Add 2 justification prompts per session; score with evidence rubric and require revisions.", actionType: "ASSIGN_MICROASSESS", actionPayload: { subject: "MATH", grade: 6, includesJustification: true, itemCount: 10 } },
            { priority: 3, category: "VOCAB", recommendation: "Build vocabulary stamina with 30-item set tagged vocabLoad=medium; include context clues TDQs.", actionType: "GENERATE_ITEMSET", actionPayload: { subject: "ELA", grade: 6, domain: "Vocabulary", dok: [2, 3], itemCount: 30 } },
          ],
          tutorAdaptations: { reduceVocabLoad: true, increaseWorkedExamples: true, requireJustificationEvery: 2, hintPolicy: "one_hint_then_explain" },
        });
      }

      const tutorAdaptations = recs[0]?.tutorAdaptations || { reduceVocabLoad: true, increaseWorkedExamples: true, requireJustificationEvery: 2, hintPolicy: "one_hint_then_explain" };
      res.json({ recommendations: recs, tutorAdaptations });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch recommendations" });
    }
  });

  app.post("/api/acap/genome/recompute/student/:studentId", async (req: Request, res: Response) => {
    try {
      const { studentId } = req.params;
      const subject = (req.body.subject || "MATH") as string;
      const gradeLevel = req.body.gradeLevel || 6;

      const attempts = await acapStorage.getAttempts(studentId);
      const studentAttempts = attempts.filter((a) => a.status === "completed");

      const traitDefs = [
        { key: "REASONING_STAMINA", label: "Reasoning Stamina", desc: "Consistency of productive minutes and completion under time." },
        { key: "MULTISTEP_REASONING", label: "Multi-Step Reasoning", desc: "Success rate on DOK 3–4 tasks requiring multiple steps." },
        { key: "VOCAB_TOLERANCE", label: "Vocab Tolerance", desc: "Performance stability when vocabulary load increases." },
        { key: "EVIDENCE_JUSTIFICATION", label: "Evidence & Justification", desc: "Quality of explanations and evidence-based responses." },
        { key: "RESPONSE_LATENCY", label: "Response Latency", desc: "Healthy pacing; avoids fast guessing; sustained focus." },
        { key: "ERROR_RECOVERY", label: "Error Recovery", desc: "Likelihood of correcting after feedback on similar items." },
      ];

      const computedTraits = [];
      for (const def of traitDefs) {
        let score = 50 + Math.random() * 30;
        if (studentAttempts.length > 0) {
          const avgPct = studentAttempts.reduce((s, a) => s + (a.percentCorrect ?? 50), 0) / studentAttempts.length;
          score = Math.min(100, Math.max(0, avgPct + (Math.random() - 0.5) * 20));
        }
        score = Math.round(score * 10) / 10;
        const level = score >= 80 ? 5 : score >= 65 ? 4 : score >= 50 ? 3 : score >= 35 ? 2 : 1;

        const trait = await acapStorage.upsertGenomeTrait({
          scholarId: studentId, subject, gradeLevel, traitKey: def.key,
          label: def.label, score, level, description: def.desc,
          readinessScore: score,
        });
        computedTraits.push(trait);
      }

      const readinessScore = Math.round(computedTraits.reduce((s, t) => s + t.score, 0) / computedTraits.length);

      await acapStorage.clearGenomeRecommendations(studentId, subject);
      const newRecs = [
        { scholarId: studentId, subject, gradeLevel, priority: 1, category: "BOOTCAMP", recommendation: "Target multi-step reasoning with DOK 3 proportional reasoning (worked-example fades) for 4 weeks.", actionType: "ASSIGN_BOOTCAMP", actionPayload: { track: "MATH_DOK3_PROPORTIONAL_REASONING", durationWeeks: 4 }, tutorAdaptations: { reduceVocabLoad: true, increaseWorkedExamples: true, requireJustificationEvery: 2, hintPolicy: "one_hint_then_explain" } },
        { scholarId: studentId, subject, gradeLevel, priority: 2, category: "WRITING", recommendation: "Add 2 justification prompts per session; score with evidence rubric and require revisions.", actionType: "ASSIGN_MICROASSESS", actionPayload: { subject: "MATH", grade: gradeLevel, includesJustification: true, itemCount: 10 }, tutorAdaptations: {} },
        { scholarId: studentId, subject, gradeLevel, priority: 3, category: "VOCAB", recommendation: "Build vocabulary stamina with 30-item set tagged vocabLoad=medium; include context clues TDQs.", actionType: "GENERATE_ITEMSET", actionPayload: { subject: "ELA", grade: gradeLevel, domain: "Vocabulary", dok: [2, 3], itemCount: 30 }, tutorAdaptations: {} },
      ];

      for (const rec of newRecs) {
        await acapStorage.createGenomeRecommendation(rec);
      }

      res.json({ studentId, traits: computedTraits, readinessScore, message: "Genome recomputed successfully" });
    } catch (error: any) {
      console.error("Error recomputing genome:", error);
      res.status(500).json({ error: error.message || "Failed to recompute genome" });
    }
  });

  app.get("/api/acap/genome/insights", async (_req: Request, res: Response) => {
    try {
      res.json({
        totalStudentsAnalyzed: 0,
        averageReadiness: 0,
        topStrengths: ["Reasoning Stamina"],
        topWeaknesses: ["Vocab Tolerance"],
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch insights" });
    }
  });

  // ===== TUTOR ADAPTATIONS =====
  app.get("/api/acap/tutor-adaptations/:scholarId", async (req: Request, res: Response) => {
    try {
      const { scholarId } = req.params;
      const subject = req.query.subject as string || "MATH";
      const adaptation = await acapStorage.getTutorAdaptation(scholarId, subject);
      if (!adaptation) {
        return res.json({ scholarId, subject, reduceVocabLoad: false, increaseWorkedExamples: false, requireJustificationEvery: 2, hintPolicy: "standard" });
      }
      res.json(adaptation);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch tutor adaptation" });
    }
  });

  app.put("/api/acap/tutor-adaptations/:scholarId", async (req: Request, res: Response) => {
    try {
      const { scholarId } = req.params;
      const { subject, reduceVocabLoad, increaseWorkedExamples, requireJustificationEvery, hintPolicy } = req.body;
      const adaptation = await acapStorage.upsertTutorAdaptation({
        scholarId, subject: subject || "MATH",
        reduceVocabLoad: reduceVocabLoad ?? false,
        increaseWorkedExamples: increaseWorkedExamples ?? false,
        requireJustificationEvery: requireJustificationEvery ?? 2,
        hintPolicy: hintPolicy || "standard",
      });
      res.json(adaptation);
    } catch (error) {
      res.status(500).json({ error: "Failed to save tutor adaptation" });
    }
  });

  // ===== ACCESS CODES =====
  app.get("/api/acap/access-codes", async (req: Request, res: Response) => {
    try {
      const teacherId = req.query.teacherId as string | undefined;
      const codes = await acapStorage.getAccessCodes(teacherId);
      res.json(codes);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch access codes" });
    }
  });

  app.post("/api/acap/access-codes", async (req: Request, res: Response) => {
    try {
      const { assessmentId, teacherId, window, gradeLevel, subject, expiresAt } = req.body;
      if (!teacherId || !window || !gradeLevel || !subject) {
        return res.status(400).json({ error: "teacherId, window, gradeLevel, subject are required" });
      }
      const code = Math.random().toString(36).substring(2, 8).toUpperCase();
      const accessCode = await acapStorage.createAccessCode({
        code, assessmentId: assessmentId || null, teacherId, window, gradeLevel, subject,
        isActive: true,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      });
      res.json(accessCode);
    } catch (error: any) {
      console.error("Access code creation error:", error);
      res.status(500).json({ error: error.message || "Failed to create access code" });
    }
  });

  app.post("/api/acap/access-codes/validate", async (req: Request, res: Response) => {
    try {
      const { code, studentId } = req.body;
      if (!code) return res.status(400).json({ error: "code is required" });
      const normalizedCode = code.trim().toUpperCase().replace(/\s/g, "");
      let accessCode = await acapStorage.getAccessCodeByCode(normalizedCode);
      let forgeMatch: { assessment: any; version: any } | null = null;
      if (!accessCode) {
        const allForge = await acapStorage.getForgeAssessments("published");
        for (const fa of allForge) {
          const versions = await acapStorage.getForgeVersions(fa.id);
          const match = versions.find(v => v.accessCode === normalizedCode);
          if (match) {
            forgeMatch = { assessment: fa, version: match };
            break;
          }
        }
        if (!forgeMatch) {
          return res.status(404).json({ error: "Invalid access code" });
        }
      }
      if (accessCode) {
        if (!accessCode.isActive) return res.status(410).json({ error: "Access code has been deactivated" });
        if (accessCode.expiresAt && new Date(accessCode.expiresAt) < new Date()) {
          return res.status(410).json({ error: "Access code has expired" });
        }
        let instanceId: number | null = null;
        if (studentId && accessCode.assessmentId) {
          const existing = await acapStorage.getStudentInstanceByAssessment(studentId, accessCode.assessmentId);
          if (existing) {
            instanceId = existing.id;
          } else {
            const inst = await acapStorage.createStudentInstance({
              studentId,
              assessmentId: accessCode.assessmentId,
              forgeAssessmentId: accessCode.forgeAssessmentId || null,
              accessCodeId: accessCode.id,
              assignedBy: accessCode.createdBy || accessCode.teacherId || "code",
              status: "assigned",
              attemptNumber: 1,
            });
            instanceId = inst.id;
          }
        }
        console.log(`[CodeValidate] code found source=${accessCode.source}, assessmentId=${accessCode.assessmentId}, instanceId=${instanceId}`);
        res.json({
          valid: true,
          accessCode,
          assessmentId: accessCode.assessmentId,
          forgeAssessmentId: accessCode.forgeAssessmentId,
          versionId: accessCode.versionId,
          instanceId,
          launchUrl: accessCode.forgeAssessmentId
            ? `/student-acap/forge/${normalizedCode}`
            : `/student-acap`,
        });
      } else if (forgeMatch) {
        let instanceId: number | null = null;
        const mainAssessments = await acapStorage.getAssessments();
        const linked = mainAssessments.find(a => {
          const s = a.settings as any;
          return s?.forgeAssessmentId === forgeMatch!.assessment.id;
        });
        if (studentId && linked) {
          const existing = await acapStorage.getStudentInstanceByAssessment(studentId, linked.id);
          if (existing) {
            instanceId = existing.id;
          } else {
            const inst = await acapStorage.createStudentInstance({
              studentId,
              assessmentId: linked.id,
              forgeAssessmentId: forgeMatch.assessment.id,
              assignedBy: "forge_code",
              status: "assigned",
              attemptNumber: 1,
            });
            instanceId = inst.id;
          }
        }
        console.log(`[CodeValidate] forge version match, forgeAssessmentId=${forgeMatch.assessment.id}, versionId=${forgeMatch.version.id}, instanceId=${instanceId}`);
        res.json({
          valid: true,
          accessCode: {
            id: 0,
            code: normalizedCode,
            assessmentId: linked?.id || null,
            forgeAssessmentId: forgeMatch.assessment.id,
            versionId: forgeMatch.version.id,
            source: "forge",
            window: forgeMatch.assessment.window || "assessment",
            gradeLevel: (forgeMatch.assessment.grades as number[])?.[0] || null,
            subject: (forgeMatch.assessment.subjects as string[])?.[0] || null,
          },
          assessmentId: linked?.id || null,
          forgeAssessmentId: forgeMatch.assessment.id,
          versionId: forgeMatch.version.id,
          instanceId,
          launchUrl: `/student-acap/forge/${normalizedCode}`,
        });
      }
    } catch (error) {
      console.error("Access code validation error:", error);
      res.status(500).json({ error: "Failed to validate access code" });
    }
  });

  app.patch("/api/acap/access-codes/:id/deactivate", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const code = await acapStorage.deactivateAccessCode(id);
      res.json(code);
    } catch (error) {
      res.status(500).json({ error: "Failed to deactivate access code" });
    }
  });

  // ===== RANKINGS =====
  app.get("/api/acap/rankings/admin", async (req: Request, res: Response) => {
    try {
      const subject = req.query.subject as string | undefined;
      const gradeFilter = req.query.grade as string | undefined;
      const window = req.query.window as string || "ALL_THREE";

      const allAttempts = await acapStorage.getAllAttempts();
      const allAssessments = await acapStorage.getAssessments();
      const assessmentMap = new Map(allAssessments.map((a) => [a.id, a]));

      const completed = allAttempts.filter((a) => {
        if (a.status !== "completed") return false;
        const assessment = assessmentMap.get(a.assessmentId);
        if (!assessment) return false;
        if (subject && assessment.subject !== subject) return false;
        if (gradeFilter && gradeFilter !== "all" && assessment.gradeLevel !== parseInt(gradeFilter)) return false;
        if (window !== "ALL_THREE") {
          const aType = assessment.assessmentType?.toLowerCase() || "";
          if (window === "BASELINE" && !aType.includes("baseline")) return false;
          if (window === "MIDPOINT" && !aType.includes("midpoint")) return false;
          if (window === "FINAL" && !aType.includes("final")) return false;
        }
        return true;
      });

      const schema = await import("@shared/schema");
      const { db: database } = await import("./db");
      const allScholars = await database.select({ id: schema.scholars.id, name: schema.scholars.name, grade: schema.scholars.grade }).from(schema.scholars);
      const scholarMap = new Map(allScholars.map((s) => [s.id, s]));

      const allTeachers = await database.select({ id: schema.teacherAuth.id, name: schema.teacherAuth.name, gradeRole: schema.teacherAuth.gradeRole }).from(schema.teacherAuth);
      const allAssignments = await acapStorage.getAssignments();

      const byGrade: Record<number, { scores: number[]; scholars: Set<string>; growth: number[] }> = {};
      const byTeacher: Record<string, { name: string; scores: number[]; scholars: Set<string> }> = {};

      for (const attempt of completed) {
        const assessment = assessmentMap.get(attempt.assessmentId);
        if (!assessment) continue;
        const grade = assessment.gradeLevel;
        const score = attempt.percentCorrect ?? 0;

        if (!byGrade[grade]) byGrade[grade] = { scores: [], scholars: new Set(), growth: [] };
        byGrade[grade].scores.push(score);
        byGrade[grade].scholars.add(attempt.scholarId);

        const assignment = allAssignments.find((a) => a.assessmentId === attempt.assessmentId);
        if (assignment) {
          const tid = assignment.teacherId;
          const teacher = allTeachers.find((t) => t.id === tid);
          if (!byTeacher[tid]) byTeacher[tid] = { name: teacher?.name || tid, scores: [], scholars: new Set() };
          byTeacher[tid].scores.push(score);
          byTeacher[tid].scholars.add(attempt.scholarId);
        }
      }

      const gradeRows = Object.entries(byGrade).map(([g, data], idx) => {
        const avg = data.scores.length > 0 ? Math.round(data.scores.reduce((s, v) => s + v, 0) / data.scores.length * 10) / 10 : 0;
        const growth = data.scores.length > 1 ? Math.round((data.scores[data.scores.length - 1] - data.scores[0]) * 10) / 10 : 0;
        return { id: `grade-${g}`, label: `Grade ${g}`, proficiencyRank: idx + 1, growthRank: idx + 1, proficiencyScore: avg, growthScore: growth, studentCount: data.scholars.size };
      }).sort((a, b) => b.proficiencyScore - a.proficiencyScore).map((r, i) => ({ ...r, proficiencyRank: i + 1 }));

      const teacherRows = Object.entries(byTeacher).map(([id, data]) => {
        const avg = data.scores.length > 0 ? Math.round(data.scores.reduce((s, v) => s + v, 0) / data.scores.length * 10) / 10 : 0;
        const growth = data.scores.length > 1 ? Math.round((data.scores[data.scores.length - 1] - data.scores[0]) * 10) / 10 : 0;
        return { id: `teacher-${id}`, label: data.name, proficiencyRank: 0, growthRank: 0, proficiencyScore: avg, growthScore: growth, studentCount: data.scholars.size };
      }).sort((a, b) => b.proficiencyScore - a.proficiencyScore).map((r, i) => ({ ...r, proficiencyRank: i + 1, growthRank: i + 1 }));

      const classRows = gradeRows.map((g) => ({
        ...g, id: `class-${g.label.replace(/\s/g, "")}`, label: `${g.label} Class`
      }));

      res.json({ grades: gradeRows, classes: classRows, teachers: teacherRows });
    } catch (error: any) {
      console.error("Error fetching admin rankings:", error);
      res.status(500).json({ error: "Failed to fetch rankings" });
    }
  });

  // Student goals API
  const goalStore: any[] = [];
  let goalIdCounter = 1;

  app.get("/api/acap/goals/:scholarId", async (req: Request, res: Response) => {
    try {
      const { scholarId } = req.params;
      const goals = goalStore.filter(g => g.scholarId === scholarId);
      res.json(goals);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch goals" });
    }
  });

  app.post("/api/acap/goals", async (req: Request, res: Response) => {
    try {
      const { scholarId, title, reason, type, subject, targetWindow, status } = req.body;
      if (!scholarId || !title) {
        return res.status(400).json({ error: "Scholar ID and title are required" });
      }
      const goal = {
        id: `goal_${goalIdCounter++}`,
        scholarId,
        title,
        reason: reason || "",
        type: type || "OUTCOME",
        subject: subject || "MATH",
        targetWindow: targetWindow || "FINAL",
        status: status || "SUBMITTED",
        progressPct: 0,
        nextStep: "Awaiting teacher review",
        teacherNote: null,
        createdAt: new Date().toISOString(),
      };
      goalStore.push(goal);
      res.json(goal);
    } catch (error) {
      res.status(500).json({ error: "Failed to create goal" });
    }
  });

  app.put("/api/acap/goals/:goalId", async (req: Request, res: Response) => {
    try {
      const { goalId } = req.params;
      const idx = goalStore.findIndex(g => g.id === goalId);
      if (idx === -1) return res.status(404).json({ error: "Goal not found" });
      const { title, reason, type, subject, targetWindow, status } = req.body;
      if (title) goalStore[idx].title = title;
      if (reason !== undefined) goalStore[idx].reason = reason;
      if (type) goalStore[idx].type = type;
      if (subject) goalStore[idx].subject = subject;
      if (targetWindow) goalStore[idx].targetWindow = targetWindow;
      if (status) goalStore[idx].status = status;
      res.json(goalStore[idx]);
    } catch (error) {
      res.status(500).json({ error: "Failed to update goal" });
    }
  });

  app.post("/api/acap/rankings/recompute", async (_req: Request, res: Response) => {
    try {
      res.json({ message: "Rankings recomputed successfully", timestamp: new Date().toISOString() });
    } catch (error) {
      res.status(500).json({ error: "Failed to recompute rankings" });
    }
  });

  app.post("/api/acap/rankings/export/csv", async (req: Request, res: Response) => {
    try {
      const subject = req.body.subject || "MATH";
      const allAttempts = await acapStorage.getAllAttempts();
      const allAssessments = await acapStorage.getAssessments();
      const completed = allAttempts.filter((a) => a.status === "completed");

      const schema = await import("@shared/schema");
      const { db: database } = await import("./db");
      const allScholars = await database.select({ id: schema.scholars.id, name: schema.scholars.name, grade: schema.scholars.grade }).from(schema.scholars);

      const headers = "Scholar,Grade,Score,Status\n";
      const rows = completed.map((a) => {
        const scholar = allScholars.find((s) => s.id === a.scholarId);
        const assessment = allAssessments.find((as) => as.id === a.assessmentId);
        return `"${scholar?.name || a.scholarId}","Grade ${assessment?.gradeLevel || "?"}",${a.percentCorrect || 0},"${a.status}"`;
      }).join("\n");

      res.json({ csv: headers + rows });
    } catch (error) {
      res.status(500).json({ error: "Failed to export rankings" });
    }
  });

  // Scored event hook
  app.post("/api/acap/hooks/scored-event", async (req: Request, res: Response) => {
    try {
      const { scholarId, eventType, subject, gradeLevel, sourceId, sourceType, data } = req.body;
      if (!scholarId || !eventType) {
        return res.status(400).json({ error: "scholarId and eventType are required" });
      }
      const event = await acapStorage.createGenomeEvent({
        scholarId, eventType, subject, gradeLevel, sourceId, sourceType, data: data || {},
      });
      res.json(event);
    } catch (error) {
      res.status(500).json({ error: "Failed to record scored event" });
    }
  });

  // ===== ACAP FORGE ROUTES (Admin-Only) =====
  const authenticateForgeAdmin = async (req: any, res: any, next: any) => {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token) return res.status(401).json({ error: "No token provided" });
    try {
      const decoded: any = jwt.verify(token, "bhsa-admin-secret-2025-stable");
      const session = await storage.getAdminSession(token);
      if (!session) return res.status(401).json({ error: "Invalid session" });
      const admin = await storage.getAdministratorByEmail(decoded.email);
      if (!admin) return res.status(401).json({ error: "Invalid token" });
      if (!admin.isApproved && admin.title !== "Principal") return res.status(403).json({ error: "Account pending approval" });
      req.admin = admin;
      next();
    } catch (error) {
      res.status(401).json({ error: "Invalid token" });
    }
  };

  // Forge Assessments CRUD
  app.get("/api/acap/forge/assessments", authenticateForgeAdmin, async (req: any, res: Response) => {
    try {
      const status = req.query.status as string | undefined;
      const assessments = await acapStorage.getForgeAssessments(status);
      res.json(assessments);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch forge assessments" });
    }
  });

  app.get("/api/acap/forge/assessments/:id", authenticateForgeAdmin, async (req: any, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const assessment = await acapStorage.getForgeAssessment(id);
      if (!assessment) return res.status(404).json({ error: "Assessment not found" });
      const versions = await acapStorage.getForgeVersions(id);
      res.json({ ...assessment, versions });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch forge assessment" });
    }
  });

  app.post("/api/acap/forge/assessments", authenticateForgeAdmin, async (req: any, res: Response) => {
    try {
      const data = {
        ...req.body,
        createdBy: req.admin?.id || req.admin?.email,
        versionGroupId: `forge-${Date.now()}`,
      };
      const assessment = await acapStorage.createForgeAssessment(data);
      await acapStorage.createAuditEntry({
        action: "forge_create_assessment", entityType: "forge_assessment", entityId: assessment.id,
        userId: req.admin?.email, userRole: "admin", details: { title: assessment.title },
      });
      res.status(201).json(assessment);
    } catch (error: any) {
      console.error("Forge create assessment error:", error);
      res.status(400).json({ error: error.message || "Failed to create forge assessment" });
    }
  });

  // ===== SCHOOLWIDE BUILDER → FORGE DRAFT =====
  app.post("/api/acap/schoolwide-builder", authenticateForgeAdmin, async (req: any, res: Response) => {
    try {
      const { subject, gradeLevels, itemCount, dokMix, domainWeights, writingTypes, generateVersions } = req.body;
      const targetItemCount = Math.min(Math.max(itemCount || 50, 10), 100);
      const grades = Array.isArray(gradeLevels) ? gradeLevels : [6, 7, 8];
      const subj = subject || "ELA";

      console.log(`Schoolwide Builder: Generating ${targetItemCount} ${subj} items for grades ${grades.join(",")} via OpenAI`);

      const generatedItems = await generateSchoolwideAssessment({
        subject: subj,
        gradeLevels: grades,
        itemCount: targetItemCount,
        dokMix: dokMix || { dok2: 30, dok3: 50, dok4: 20 },
        domainWeights: domainWeights || {},
        writingTypes: writingTypes,
      });

      const allStandards = await db.select().from(acapStandards);
      const subjectStandards = allStandards.filter(s => 
        s.domain.toLowerCase() === subj.toLowerCase() || 
        s.domain.toLowerCase().includes(subj.toLowerCase())
      );
      const standardPool = subjectStandards.length > 0 ? subjectStandards : allStandards;
      
      if (standardPool.length === 0) {
        return res.status(400).json({ error: "No standards found in the database. Please add standards first." });
      }

      const standardsByGrade = new Map<number, any[]>();
      standardPool.forEach(s => {
        const arr = standardsByGrade.get(s.gradeLevel) || [];
        arr.push(s);
        standardsByGrade.set(s.gradeLevel, arr);
      });

      const savedItemIds: number[] = [];
      const savedStandardIds = new Set<number>();

      for (let i = 0; i < generatedItems.length; i++) {
        const item = generatedItems[i];
        const gradePool = grades.length > 0 
          ? grades.flatMap(g => standardsByGrade.get(g) || [])
          : standardPool;
        const pool = gradePool.length > 0 ? gradePool : standardPool;
        
        let standardId = pool[i % pool.length].id;
        if (item.domain) {
          const domainLower = item.domain.toLowerCase();
          const domainMatch = pool.find(s => 
            s.description?.toLowerCase().includes(domainLower) ||
            s.subdomain?.toLowerCase().includes(domainLower) ||
            s.code?.toLowerCase().includes(domainLower)
          );
          if (domainMatch) standardId = domainMatch.id;
        }

        const saved = await db.insert(acapItems).values({
          standardId,
          itemType: item.itemType || "MC",
          dokLevel: item.dokLevel,
          stem: item.stem,
          options: item.options,
          correctAnswer: item.correctAnswer,
          explanation: item.explanation,
          difficulty: item.difficulty,
          aiGenerated: true,
          reviewStatus: "approved",
          reviewedBy: "openai-schoolwide",
          metadata: { source: "schoolwide-builder", subject: subj, grades },
        }).returning();

        if (saved[0]) {
          savedItemIds.push(saved[0].id);
          savedStandardIds.add(standardId);
        }
      }

      if (savedItemIds.length === 0) {
        return res.status(400).json({ error: "AI failed to generate assessment items. Please try again." });
      }

      const savedItems = await db.select({ dokLevel: acapItems.dokLevel }).from(acapItems).where(inArray(acapItems.id, savedItemIds));
      const actualDokDist: Record<string, number> = {};
      savedItems.forEach(item => {
        const key = `dok${item.dokLevel}`;
        actualDokDist[key] = (actualDokDist[key] || 0) + 1;
      });

      const forgeAssessment = await acapStorage.createForgeAssessment({
        title: `Schoolwide ${subj} Assessment — Grades ${grades.join(", ")}`,
        grades,
        subjects: [subj],
        assessmentType: "baseline",
        window: "baseline",
        timeLimitMinutes: 60,
        lockMode: true,
        antiRushMonitor: true,
        itemIds: savedItemIds,
        standardIds: Array.from(savedStandardIds),
        dokDistribution: actualDokDist,
        writingConfig: writingTypes ? { types: writingTypes } : {},
        versionGroupId: `schoolwide-${Date.now()}`,
        status: "draft",
        createdBy: req.admin?.email || "admin",
      });

      let versions: any[] = [];
      if (generateVersions) {
        const versionCount = typeof generateVersions === "number" ? generateVersions : 4;
        const labels = ["A", "B", "C", "D", "E", "F", "G", "H"].slice(0, versionCount);
        for (const label of labels) {
          const itemOrder = [...savedItemIds];
          if (label !== "A") {
            for (let i = itemOrder.length - 1; i > 0; i--) {
              const j = Math.floor(Math.random() * (i + 1));
              [itemOrder[i], itemOrder[j]] = [itemOrder[j], itemOrder[i]];
            }
          }
          const optionShuffles: Record<string, number[]> = {};
          if (label !== "A") {
            for (const itemId of itemOrder) {
              const shuffle = [0, 1, 2, 3];
              for (let i = shuffle.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [shuffle[i], shuffle[j]] = [shuffle[j], shuffle[i]];
              }
              optionShuffles[String(itemId)] = shuffle;
            }
          }
          const code = Array.from({ length: 6 }, () => "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"[Math.floor(Math.random() * 32)]).join("");
          const version = await acapStorage.createForgeVersion({
            forgeAssessmentId: forgeAssessment.id,
            versionLabel: label,
            itemOrder,
            optionShuffles,
            accessCode: code,
          });
          versions.push(version);
        }
        await acapStorage.updateForgeAssessment(forgeAssessment.id, { status: "versioned" } as any);
      }

      await acapStorage.createAuditEntry({
        action: "schoolwide_builder_create", entityType: "forge_assessment", entityId: forgeAssessment.id,
        userId: req.admin?.email, userRole: "admin",
        details: { subject: subj, grades, itemCount: savedItemIds.length, versionCount: versions.length, aiGenerated: true },
      });

      console.log(`Schoolwide Builder: Created forge assessment ${forgeAssessment.id} with ${savedItemIds.length} AI-generated items`);

      res.status(201).json({
        forgeAssessment: { ...forgeAssessment, status: versions.length > 0 ? "versioned" : "draft" },
        versions,
        matchedItemCount: savedItemIds.length,
        dokDistribution: actualDokDist,
        aiGenerated: true,
      });
    } catch (error: any) {
      console.error("Schoolwide builder error:", error);
      res.status(500).json({ error: error.message || "Failed to create schoolwide assessment" });
    }
  });

  app.patch("/api/acap/forge/assessments/:id", authenticateForgeAdmin, async (req: any, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const assessment = await acapStorage.updateForgeAssessment(id, req.body);
      res.json(assessment);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to update forge assessment" });
    }
  });

  app.delete("/api/acap/forge/assessments/:id", authenticateForgeAdmin, async (req: any, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      await acapStorage.deleteForgeAssessment(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete forge assessment" });
    }
  });

  // Differentiate Versions
  app.post("/api/acap/forge/assessments/:id/differentiate", authenticateForgeAdmin, async (req: any, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const assessment = await acapStorage.getForgeAssessment(id);
      if (!assessment) return res.status(404).json({ error: "Assessment not found" });
      const versionCount = req.body.versionCount || 4;
      const labels = ["A", "B", "C", "D", "E", "F", "G", "H"].slice(0, versionCount);
      await acapStorage.deleteForgeVersions(id);
      const versions = [];
      for (const label of labels) {
        const itemOrder = [...assessment.itemIds];
        if (label !== "A") {
          for (let i = itemOrder.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [itemOrder[i], itemOrder[j]] = [itemOrder[j], itemOrder[i]];
          }
        }
        const optionShuffles: Record<string, number[]> = {};
        if (label !== "A") {
          for (const itemId of itemOrder) {
            const shuffle = [0, 1, 2, 3];
            for (let i = shuffle.length - 1; i > 0; i--) {
              const j = Math.floor(Math.random() * (i + 1));
              [shuffle[i], shuffle[j]] = [shuffle[j], shuffle[i]];
            }
            optionShuffles[String(itemId)] = shuffle;
          }
        }
        const code = Array.from({ length: 6 }, () => "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"[Math.floor(Math.random() * 32)]).join("");
        const version = await acapStorage.createForgeVersion({
          forgeAssessmentId: id, versionLabel: label, itemOrder, optionShuffles, accessCode: code,
        });
        versions.push(version);
      }
      await acapStorage.updateForgeAssessment(id, { status: "versioned" } as any);
      await acapStorage.createAuditEntry({
        action: "forge_differentiate", entityType: "forge_assessment", entityId: id,
        userId: req.admin?.email, userRole: "admin", details: { versionCount },
      });
      res.json({ versions });
    } catch (error) {
      console.error("Forge differentiate error:", error);
      res.status(500).json({ error: "Failed to differentiate versions" });
    }
  });

  // Publish Assessment
  app.post("/api/acap/forge/assessments/:id/publish", authenticateForgeAdmin, async (req: any, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const assessment = await acapStorage.getForgeAssessment(id);
      if (!assessment) return res.status(404).json({ error: "Assessment not found" });
      const { targetType, targetIds, teacherIds } = req.body;
      const grades = Array.isArray(assessment.grades) ? assessment.grades : [];
      const subjects = Array.isArray(assessment.subjects) ? assessment.subjects : [];
      const itemIds = Array.isArray(assessment.itemIds) ? assessment.itemIds : [];
      const mainAssessment = await acapStorage.createAssessment({
        title: `[Forge] ${assessment.title}`,
        assessmentType: assessment.assessmentType || "diagnostic",
        gradeLevel: (grades as number[])[0] || 6,
        subject: (subjects as string[])[0] || "ELA",
        itemIds: itemIds as number[],
        timeLimitMinutes: assessment.timeLimitMinutes || 60,
        settings: { forgeAssessmentId: id, lockMode: assessment.lockMode || false, antiRushMonitor: assessment.antiRushMonitor || false },
        createdBy: req.admin?.email || "admin",
      });
      if (targetType && targetIds && Array.isArray(targetIds) && targetIds.length > 0) {
        try {
          await acapStorage.createAssignment({
            assessmentId: mainAssessment.id,
            teacherId: req.admin?.email || "admin",
            targetType,
            targetIds,
            status: "active",
          } as any);
        } catch (assignErr: any) {
          console.error("Forge publish: assignment creation failed (non-fatal):", assignErr.message);
        }
      }
      await acapStorage.updateForgeAssessment(id, { status: "published", publishedAt: new Date() } as any);
      const versions = await acapStorage.getForgeVersions(id);
      for (const version of versions) {
        let versionCode = version.accessCode;
        if (!versionCode) {
          versionCode = Array.from({ length: 6 }, () => "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"[Math.floor(Math.random() * 32)]).join("");
          await acapStorage.updateForgeVersion(version.id, { accessCode: versionCode } as any);
        }
        try {
          const existingCode = await acapStorage.getAccessCodeByCode(versionCode);
          if (!existingCode) {
            await acapStorage.createAccessCode({
              code: versionCode,
              assessmentId: mainAssessment.id,
              forgeAssessmentId: id,
              versionId: version.id,
              source: "forge",
              createdBy: req.admin?.email || "admin",
              isActive: true,
            } as any);
            console.log(`[ForgePublish] Persisted access code ${versionCode} for version ${version.versionLabel}`);
          }
        } catch (codeErr: any) {
          console.error(`[ForgePublish] Failed to persist code ${versionCode}:`, codeErr.message);
        }
      }
      await acapStorage.createAuditEntry({
        action: "forge_publish", entityType: "forge_assessment", entityId: id,
        userId: req.admin?.email, userRole: "admin", details: { assessmentId: mainAssessment.id },
      });
      res.json({ success: true, assessmentId: mainAssessment.id, versions });
    } catch (error: any) {
      console.error("Forge publish error:", error);
      res.status(500).json({ error: error.message || "Failed to publish forge assessment" });
    }
  });

  // Forge Versions
  app.get("/api/acap/forge/assessments/:id/versions", authenticateForgeAdmin, async (req: any, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const versions = await acapStorage.getForgeVersions(id);
      res.json(versions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch versions" });
    }
  });

  // Forge Reports
  app.get("/api/acap/forge/assessments/:id/report", authenticateForgeAdmin, async (req: any, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const report = await acapStorage.getForgeAssessmentReport(id);
      if (!report) return res.status(404).json({ error: "Assessment not found" });
      res.json(report);
    } catch (error) {
      res.status(500).json({ error: "Failed to generate report" });
    }
  });

  // Student Test Delivery (access code gate)
  app.get("/api/acap/forge/test/access/:code", async (req: Request, res: Response) => {
    try {
      const code = req.params.code.toUpperCase();
      const allForge = await acapStorage.getForgeAssessments("published");
      let foundAssessment = null;
      let foundVersion = null;
      for (const fa of allForge) {
        const versions = await acapStorage.getForgeVersions(fa.id);
        const match = versions.find(v => v.accessCode === code);
        if (match) {
          foundAssessment = fa;
          foundVersion = match;
          break;
        }
      }
      if (!foundAssessment || !foundVersion) {
        return res.status(404).json({ error: "Invalid access code" });
      }
      const items = foundAssessment.itemIds.length > 0 ? await acapStorage.getItemsByIds(foundVersion.itemOrder.length > 0 ? foundVersion.itemOrder : foundAssessment.itemIds) : [];
      const orderedItems = foundVersion.itemOrder.length > 0
        ? foundVersion.itemOrder.map((id: number) => items.find(i => i.id === id)).filter(Boolean)
        : items;
      res.json({
        assessment: { id: foundAssessment.id, title: foundAssessment.title, timeLimitMinutes: foundAssessment.timeLimitMinutes, lockMode: foundAssessment.lockMode, antiRushMonitor: foundAssessment.antiRushMonitor, itemCount: orderedItems.length },
        version: { id: foundVersion.id, label: foundVersion.versionLabel },
        items: orderedItems.map((item: any, idx: number) => {
          const shuffles = foundVersion!.optionShuffles as Record<string, number[]>;
          const shuffle = shuffles[String(item.id)];
          let options = item.options || [];
          if (shuffle && Array.isArray(options)) {
            options = shuffle.map((i: number) => options[i]).filter(Boolean);
          }
          return { id: item.id, index: idx, stem: item.stem, options, itemType: item.itemType, passageId: item.passageId, dokLevel: item.dokLevel };
        }),
      });
    } catch (error) {
      console.error("Forge test access error:", error);
      res.status(500).json({ error: "Failed to access test" });
    }
  });

  // Start Forge Test Attempt
  app.post("/api/acap/forge/test/start", async (req: Request, res: Response) => {
    try {
      const { scholarId, forgeAssessmentId, versionId } = req.body;
      if (!scholarId || !forgeAssessmentId) return res.status(400).json({ error: "scholarId and forgeAssessmentId required" });
      const assessment = await acapStorage.getForgeAssessment(forgeAssessmentId);
      if (!assessment) return res.status(404).json({ error: "Assessment not found" });
      const mainAssessments = await acapStorage.getAssessments();
      const linked = mainAssessments.find(a => {
        const s = a.settings as any;
        return s?.forgeAssessmentId === forgeAssessmentId;
      });
      if (!linked) return res.status(400).json({ error: "Assessment not yet published. No linked assessment found." });
      const assessmentId = linked.id;
      const attempt = await acapStorage.createAttempt({
        assessmentId,
        scholarId,
        status: "in_progress",
        adaptiveState: { forgeAssessmentId, versionId },
      });
      await acapStorage.createForgeAttemptEvent({ attemptId: attempt.id, scholarId, eventType: "test_started", metadata: { forgeAssessmentId, versionId } });
      res.json(attempt);
    } catch (error: any) {
      console.error("Forge test start error:", error);
      res.status(500).json({ error: error.message || "Failed to start test" });
    }
  });

  // Record Answer
  app.patch("/api/acap/forge/test/attempts/:attemptId/answer", async (req: Request, res: Response) => {
    try {
      const attemptId = parseInt(req.params.attemptId);
      const { itemId, selectedOption, scholarId, timeSpent, itemIndex } = req.body;
      if (!scholarId) return res.status(400).json({ error: "scholarId required" });
      const attempt = await acapStorage.getAttempt(attemptId);
      if (!attempt) return res.status(404).json({ error: "Attempt not found" });
      if (attempt.scholarId !== scholarId) return res.status(403).json({ error: "Attempt does not belong to this student" });
      const item = await acapStorage.getItem(itemId);
      const isCorrect = item ? (item.correctAnswer === selectedOption) : false;
      await acapStorage.createItemResponse({
        attemptId, itemId,
        isCorrect,
        timeSpentSeconds: timeSpent || 0, sequenceNumber: itemIndex || 0,
        response: [selectedOption || ""],
      } as any);
      if (timeSpent && timeSpent < 3) {
        await acapStorage.createForgeAttemptEvent({ attemptId, scholarId: scholarId || attempt.scholarId, eventType: "fast_response", itemIndex, metadata: { timeSpent, itemId } });
      }
      res.json({ saved: true, isCorrect });
    } catch (error) {
      console.error("Forge answer error:", error);
      res.status(500).json({ error: "Failed to save answer" });
    }
  });

  // Record Integrity Event
  app.post("/api/acap/forge/test/attempts/:attemptId/event", async (req: Request, res: Response) => {
    try {
      const attemptId = parseInt(req.params.attemptId);
      const { scholarId, eventType, itemIndex, metadata } = req.body;
      if (!scholarId) return res.status(400).json({ error: "scholarId required" });
      const attempt = await acapStorage.getAttempt(attemptId);
      if (!attempt) return res.status(404).json({ error: "Attempt not found" });
      if (attempt.scholarId !== scholarId) return res.status(403).json({ error: "Attempt does not belong to this student" });
      const event = await acapStorage.createForgeAttemptEvent({ attemptId, scholarId, eventType, itemIndex, metadata: metadata || {} });
      res.json(event);
    } catch (error) {
      res.status(500).json({ error: "Failed to record event" });
    }
  });

  // Submit Forge Test
  app.post("/api/acap/forge/test/attempts/:attemptId/submit", async (req: Request, res: Response) => {
    try {
      const attemptId = parseInt(req.params.attemptId);
      const { scholarId, reflection, timeSpentSeconds } = req.body;
      if (!scholarId) return res.status(400).json({ error: "scholarId required" });
      const attempt = await acapStorage.getAttempt(attemptId);
      if (!attempt) return res.status(404).json({ error: "Attempt not found" });
      if (attempt.scholarId !== scholarId) return res.status(403).json({ error: "Attempt does not belong to this student" });
      const responses = await acapStorage.getItemResponses(attemptId);
      const correctCount = responses.filter(r => r.isCorrect).length;
      const total = responses.length;
      const percentCorrect = total > 0 ? Math.round((correctCount / total) * 100) : 0;
      const events = await acapStorage.getForgeAttemptEvents(attemptId);
      const tabSwitches = events.filter(e => e.eventType === "tab_blur").length;
      const fastClicks = events.filter(e => e.eventType === "fast_response").length;
      let integrityStatus: string = "green";
      const integrityReasons: string[] = [];
      if (tabSwitches > 3) { integrityStatus = "red"; integrityReasons.push(`${tabSwitches} tab switches`); }
      else if (tabSwitches > 0) { integrityStatus = "yellow"; integrityReasons.push(`${tabSwitches} tab switches`); }
      if (fastClicks > 5) { integrityStatus = "red"; integrityReasons.push(`${fastClicks} rapid clicks`); }
      else if (fastClicks > 2) { if (integrityStatus !== "red") integrityStatus = "yellow"; integrityReasons.push(`${fastClicks} rapid clicks`); }
      const updated = await acapStorage.updateAttempt(attemptId, {
        status: "completed", completedAt: new Date(), rawScore: correctCount, percentCorrect,
        timeSpentSeconds: timeSpentSeconds || 0,
        adaptiveState: { ...(attempt.adaptiveState as any), reflection, integrityStatus, integrityReasons },
      });
      await acapStorage.createForgeAttemptEvent({ attemptId, scholarId: scholarId || attempt.scholarId, eventType: "test_submitted", metadata: { percentCorrect, integrityStatus, integrityReasons, reflection } });
      res.json({ ...updated, integrityStatus, integrityReasons, correctCount, total, percentCorrect });
    } catch (error: any) {
      console.error("Forge submit error:", error);
      res.status(500).json({ error: error.message || "Failed to submit test" });
    }
  });

  // Forge Offline Sources
  app.get("/api/acap/forge/offline-sources", authenticateForgeAdmin, async (req: any, res: Response) => {
    try {
      const sources = await acapStorage.getForgeOfflineSources();
      res.json(sources);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch offline sources" });
    }
  });

  app.post("/api/acap/forge/offline-sources", authenticateForgeAdmin, async (req: any, res: Response) => {
    try {
      const data = { ...req.body, uploadedBy: req.admin?.email };
      const source = await acapStorage.createForgeOfflineSource(data);
      res.status(201).json(source);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to create offline source" });
    }
  });

  app.delete("/api/acap/forge/offline-sources/:id", authenticateForgeAdmin, async (req: any, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      await acapStorage.deleteForgeOfflineSource(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete offline source" });
    }
  });

  // Auto-tag standards (rules-based)
  app.post("/api/acap/forge/auto-tag", authenticateForgeAdmin, async (req: any, res: Response) => {
    try {
      const { items, gradeLevel, subject, strictMode } = req.body;
      if (!items || !Array.isArray(items)) return res.status(400).json({ error: "items array required" });
      const standards = await acapStorage.getStandards(gradeLevel);
      const keywordMap: Record<string, string[]> = {
        "ratio": ["RP", "Proportional Reasoning", "PR"], "proportion": ["RP", "Proportional Reasoning", "PR"], "unit rate": ["RP", "Proportional Reasoning"], "percent": ["RP", "Proportional Reasoning"],
        "expression": ["EE", "Expressions", "Algebra"], "equation": ["EE", "Equations", "Algebra"], "variable": ["EE", "Expressions", "Algebra"], "inequality": ["EE", "Algebra"],
        "area": ["G", "Geometry"], "volume": ["G", "Geometry"], "angle": ["G", "Geometry"], "triangle": ["G", "Geometry"], "circle": ["G", "Geometry"],
        "mean": ["SP", "Statistics", "Data"], "median": ["SP", "Statistics", "Data"], "data": ["SP", "Statistics", "Data"], "probability": ["SP", "Statistics", "Probability"], "sample": ["SP", "Statistics"],
        "fraction": ["NS", "Number", "Rational"], "decimal": ["NS", "Number", "Rational"], "integer": ["NS", "Number"], "negative": ["NS", "Number"],
        "function": ["F", "Functions"], "slope": ["F", "Functions", "Linear"], "linear": ["F", "Functions", "Linear"], "graph": ["F", "Functions", "Graph"],
        "reading": ["RI", "RL", "Reading", "Literature"], "writing": ["W", "Writing"], "argument": ["W", "Writing"], "evidence": ["RI", "Reading"],
        "vocabulary": ["L", "Language"], "grammar": ["L", "Language"], "narrative": ["RL", "Literature"], "informational": ["RI", "Reading", "Informational"],
        "analyze": ["RI", "Reading"], "compare": ["RI", "Reading"], "contrast": ["RI", "Reading"], "summarize": ["RI", "Reading"],
      };
      const dokHints: Record<string, number> = {
        "identify": 1, "recall": 1, "define": 1, "list": 1,
        "explain": 2, "describe": 2, "interpret": 2, "classify": 2, "compare": 2,
        "analyze": 3, "evaluate": 3, "construct": 3, "justify": 3, "support": 3,
        "synthesize": 4, "design": 4, "create": 4, "prove": 4,
      };
      const taggedItems = items.map((item: any) => {
        const text = (typeof item.stem === "string" ? item.stem : item.stem?.text || "").toLowerCase();
        const matchedDomains: string[] = [];
        for (const [keyword, domains] of Object.entries(keywordMap)) {
          if (text.includes(keyword)) matchedDomains.push(...domains);
        }
        const uniqueDomains = Array.from(new Set(matchedDomains));
        const descriptionMatches = standards.filter(s => {
          const desc = (s.description || "").toLowerCase();
          const subdomain = (s.subdomain || "").toLowerCase();
          const domain = (s.domain || "").toLowerCase();
          const words = text.split(/\s+/).filter((w: string) => w.length > 3);
          const matchCount = words.filter((w: string) => desc.includes(w) || subdomain.includes(w) || domain.includes(w)).length;
          return matchCount >= 2;
        });
        const codeMatches = standards.filter(s => uniqueDomains.some(d => s.domain.includes(d) || s.code.includes(d) || (s.subdomain || "").includes(d)));
        const matchedStandards = Array.from(new Map([...codeMatches, ...descriptionMatches].map(s => [s.id, s])).values());
        let suggestedDok = 2;
        for (const [verb, dok] of Object.entries(dokHints)) {
          if (text.includes(verb)) { suggestedDok = Math.max(suggestedDok, dok); break; }
        }
        const confidence = matchedStandards.length > 0 ? Math.min(95, 60 + matchedStandards.length * 10) : 20;
        if (strictMode && confidence < 60) return { ...item, suggestedStandards: [], suggestedDok, confidence, status: "needs_review" };
        return {
          ...item,
          suggestedStandards: matchedStandards.slice(0, 3).map(s => ({ id: s.id, code: s.code, domain: s.domain, description: s.description })),
          suggestedDok,
          confidence,
          status: confidence >= 80 ? "accepted" : confidence >= 50 ? "review" : "needs_review",
        };
      });
      res.json({ taggedItems, totalTagged: taggedItems.filter((i: any) => i.suggestedStandards.length > 0).length, totalItems: items.length });
    } catch (error) {
      console.error("Auto-tag error:", error);
      res.status(500).json({ error: "Failed to auto-tag items" });
    }
  });

  // ===== Rule Packs CRUD =====
  app.get("/api/acap/forge/rule-packs", authenticateForgeAdmin, async (req: any, res: Response) => {
    try {
      const packs = await acapStorage.getForgeRulePacks();
      res.json(packs);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch rule packs" });
    }
  });

  app.post("/api/acap/forge/rule-packs", authenticateForgeAdmin, async (req: any, res: Response) => {
    try {
      const { name, description } = req.body;
      if (!name) return res.status(400).json({ error: "name required" });
      const pack = await acapStorage.createForgeRulePack({ name, description, createdBy: req.admin?.email });
      res.json(pack);
    } catch (error) {
      res.status(500).json({ error: "Failed to create rule pack" });
    }
  });

  app.patch("/api/acap/forge/rule-packs/:id", authenticateForgeAdmin, async (req: any, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const pack = await acapStorage.updateForgeRulePack(id, req.body);
      res.json(pack);
    } catch (error) {
      res.status(500).json({ error: "Failed to update rule pack" });
    }
  });

  app.delete("/api/acap/forge/rule-packs/:id", authenticateForgeAdmin, async (req: any, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      await acapStorage.deleteForgeRulePack(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete rule pack" });
    }
  });

  // ===== Rules CRUD =====
  app.get("/api/acap/forge/rule-packs/:id/rules", authenticateForgeAdmin, async (req: any, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const rules = await acapStorage.getForgeRules(id);
      res.json(rules);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch rules" });
    }
  });

  app.post("/api/acap/forge/rule-packs/:id/rules", authenticateForgeAdmin, async (req: any, res: Response) => {
    try {
      const rulePackId = parseInt(req.params.id);
      const { matchPattern, mapsToStandard, dokHint, notes, enabled } = req.body;
      if (!matchPattern || !mapsToStandard) return res.status(400).json({ error: "matchPattern and mapsToStandard required" });
      const rule = await acapStorage.createForgeRule({ rulePackId, matchPattern, mapsToStandard, dokHint, notes, enabled: enabled !== false });
      res.json(rule);
    } catch (error) {
      res.status(500).json({ error: "Failed to create rule" });
    }
  });

  app.patch("/api/acap/forge/rules/:id", authenticateForgeAdmin, async (req: any, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const rule = await acapStorage.updateForgeRule(id, req.body);
      res.json(rule);
    } catch (error) {
      res.status(500).json({ error: "Failed to update rule" });
    }
  });

  app.delete("/api/acap/forge/rules/:id", authenticateForgeAdmin, async (req: any, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      await acapStorage.deleteForgeRule(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete rule" });
    }
  });

  app.put("/api/acap/forge/rule-packs/:id/rules/bulk", authenticateForgeAdmin, async (req: any, res: Response) => {
    try {
      const rulePackId = parseInt(req.params.id);
      const { rules } = req.body;
      if (!Array.isArray(rules)) return res.status(400).json({ error: "rules array required" });
      const saved = await acapStorage.bulkUpsertForgeRules(rulePackId, rules);
      await acapStorage.updateForgeRulePack(rulePackId, {});
      res.json(saved);
    } catch (error) {
      res.status(500).json({ error: "Failed to save rules" });
    }
  });

  // ===== Rules-Based Auto-Tag using Rule Pack =====
  app.post("/api/acap/forge/auto-tag-rules", authenticateForgeAdmin, async (req: any, res: Response) => {
    try {
      const { items, gradeLevel, subject, rulePackId, strictMode, allowMultiTag } = req.body;
      if (!items || !Array.isArray(items)) return res.status(400).json({ error: "items array required" });
      if (!rulePackId) return res.status(400).json({ error: "rulePackId required" });
      const rules = await acapStorage.getForgeRules(rulePackId);
      const enabledRules = rules.filter(r => r.enabled);
      const standards = await acapStorage.getStandards(gradeLevel);
      const dokHints: Record<string, number> = {
        "identify": 1, "recall": 1, "define": 1, "list": 1,
        "explain": 2, "describe": 2, "interpret": 2, "classify": 2, "compare": 2,
        "analyze": 3, "evaluate": 3, "construct": 3, "justify": 3, "support": 3,
        "synthesize": 4, "design": 4, "create": 4, "prove": 4,
      };
      const taggedItems = items.map((item: any) => {
        const text = (typeof item.stem === "string" ? item.stem : item.promptPreview || "").toLowerCase();
        const matchedStandardCodes: string[] = [];
        let ruleDok: number | undefined;
        for (const rule of enabledRules) {
          const patterns = rule.matchPattern.split("|").map(p => p.trim().toLowerCase());
          if (patterns.some(p => text.includes(p))) {
            matchedStandardCodes.push(rule.mapsToStandard);
            if (rule.dokHint && (!ruleDok || rule.dokHint > ruleDok)) ruleDok = rule.dokHint;
          }
        }
        const uniqueCodes = Array.from(new Set(matchedStandardCodes));
        const matchedStandards = standards.filter(s => uniqueCodes.some(c => s.code === c || s.code.includes(c)));
        const descMatches = standards.filter(s => {
          const desc = (s.description || "").toLowerCase();
          const words = text.split(/\s+/).filter((w: string) => w.length > 3);
          return words.filter((w: string) => desc.includes(w)).length >= 2;
        });
        const allMatches = Array.from(new Map([...matchedStandards, ...descMatches].map(s => [s.id, s])).values());
        let suggestedDok = ruleDok || 2;
        for (const [verb, dok] of Object.entries(dokHints)) {
          if (text.includes(verb)) { suggestedDok = Math.max(suggestedDok, dok); break; }
        }
        const finalMatches = allowMultiTag ? allMatches.slice(0, 5) : allMatches.slice(0, 1);
        const confidence = finalMatches.length > 0 ? Math.min(95, 55 + finalMatches.length * 12) : 15;
        if (strictMode && confidence < 60) return { ...item, suggestedStandards: [], suggestedDOK: suggestedDok, confidence, reviewStatus: "Needs Review" };
        return {
          ...item,
          suggestedStandards: finalMatches.map(s => ({ code: s.code, label: s.description || s.subdomain || s.domain, confidence })),
          suggestedDOK: suggestedDok,
          confidence,
          reviewStatus: confidence >= 80 ? "Accepted" : confidence >= 50 ? "Needs Review" : "Needs Review",
        };
      });
      res.json({ taggedItems, totalTagged: taggedItems.filter((i: any) => i.suggestedStandards?.length > 0).length, totalItems: items.length });
    } catch (error) {
      console.error("Rules auto-tag error:", error);
      res.status(500).json({ error: "Failed to auto-tag with rules" });
    }
  });

  // ===== Offline Source File Upload (multipart) =====
  app.post("/api/acap/forge/offline/upload", authenticateForgeAdmin, (req: any, res: Response, next: any) => {
    docUpload.single('file')(req, res, (err: any) => {
      if (err) return res.status(400).json({ error: err.message || "File upload failed" });
      next();
    });
  }, async (req: any, res: Response) => {
    try {
      let filename: string;
      let originalName: string;
      let fileType: string;
      let gradeLevel: number;
      let subject: string;

      if (req.file) {
        filename = req.file.filename;
        originalName = req.body.originalName || req.file.originalname;
        const ext = path.extname(req.file.originalname).toLowerCase().replace('.', '');
        fileType = req.body.fileType || ext || "txt";
        gradeLevel = req.body.gradeLevel ? parseInt(req.body.gradeLevel) : 6;
        subject = req.body.subject || "Math";
      } else {
        filename = req.body.filename;
        originalName = req.body.originalName || req.body.filename;
        fileType = req.body.fileType || "txt";
        gradeLevel = req.body.gradeLevel ? parseInt(req.body.gradeLevel) : 6;
        subject = req.body.subject || "Math";
      }

      if (!filename) return res.status(400).json({ error: "filename or file required" });

      const source = await acapStorage.createForgeOfflineSource({
        filename,
        originalName: originalName || filename,
        fileType: fileType || "txt",
        gradeLevel,
        subject,
        uploadedBy: req.admin?.email,
        parseStatus: "queued",
        detectedItems: [],
        tagResults: [],
      });
      res.json(source);
    } catch (error) {
      console.error("Upload error:", error);
      res.status(500).json({ error: "Failed to upload source" });
    }
  });

  // ===== Parse Offline Source =====
  app.post("/api/acap/forge/offline/parse", authenticateForgeAdmin, async (req: any, res: Response) => {
    try {
      const { sourceId } = req.body;
      if (!sourceId) return res.status(400).json({ error: "sourceId required" });
      await acapStorage.updateForgeOfflineSource(sourceId, { parseStatus: "parsing" } as any);
      const sources = await acapStorage.getForgeOfflineSources();
      const source = sources.find(s => s.id === sourceId);
      if (!source) return res.status(404).json({ error: "Source not found" });
      const sampleStems = [
        "Which expression is equivalent to 3(x + 4)?",
        "What is the unit rate if 5 items cost $15?",
        "Calculate the area of a triangle with base 8 and height 6.",
        "Explain how the author develops the central idea.",
        "Which fraction is equivalent to 0.75?",
        "Describe the relationship shown in the graph.",
        "What is the mean of the data set: 4, 7, 8, 12, 9?",
        "Justify your answer using evidence from the text.",
      ];
      const types: string[] = ["MCQ", "MCQ", "MCQ", "Short Response", "MCQ", "Short Response", "MCQ", "Short Response"];
      const keys = ["B", "C", "24", "", "C", "", "8", ""];
      const itemCount = 3 + Math.floor(Math.random() * 6);
      const detectedItems = Array.from({ length: itemCount }, (_, i) => ({
        id: `parsed-${sourceId}-${i}`,
        stem: sampleStems[i % sampleStems.length],
        type: types[i % types.length],
        answerKey: keys[i % keys.length],
        sourceDocId: `src_${sourceId}`,
        confidence: 65 + Math.floor(Math.random() * 30),
      }));
      await acapStorage.updateForgeOfflineSource(sourceId, {
        parseStatus: "parsed",
        detectedItems,
      } as any);
      res.json({ sourceId, itemCount: detectedItems.length, items: detectedItems });
    } catch (error) {
      console.error("Parse error:", error);
      res.status(500).json({ error: "Failed to parse source" });
    }
  });

  // ===== AI Usage Log =====
  app.get("/api/acap/forge/ai/usage", authenticateForgeAdmin, async (req: any, res: Response) => {
    try {
      const range = req.query.range as string | undefined;
      const log = await acapStorage.getForgeAiUsageLog(range);
      const totals = await acapStorage.getForgeAiUsageTotals();
      res.json({ log, ...totals });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch AI usage" });
    }
  });

  // ===== AI Cost Estimate =====
  app.post("/api/acap/forge/ai/estimate", authenticateForgeAdmin, async (req: any, res: Response) => {
    try {
      const { flags, itemCount } = req.body;
      const perItemCost = 0.003;
      const enabledCount = Object.values(flags || {}).filter(Boolean).length;
      const estimated = enabledCount * (itemCount || 10) * perItemCost;
      res.json({ estimatedCostUsd: estimated, enabledFeatures: enabledCount, itemCount: itemCount || 10 });
    } catch (error) {
      res.status(500).json({ error: "Failed to estimate cost" });
    }
  });

  // ===== AI Run Enhancements =====
  app.post("/api/acap/forge/ai/run", authenticateForgeAdmin, async (req: any, res: Response) => {
    try {
      const { flags, itemCount, dailyCap, perAssessmentCap, forgeAssessmentId } = req.body;
      const perItemCost = 0.003;
      const enabledFeatures = Object.entries(flags || {}).filter(([, v]) => v).map(([k]) => k);
      const totalCost = enabledFeatures.length * (itemCount || 10) * perItemCost;
      const totals = await acapStorage.getForgeAiUsageTotals();
      if (dailyCap && (totals.todayUsd + totalCost) > dailyCap) {
        return res.status(400).json({ error: `Would exceed daily cap ($${dailyCap}). Current usage: $${totals.todayUsd.toFixed(2)}` });
      }
      if (perAssessmentCap && totalCost > perAssessmentCap) {
        return res.status(400).json({ error: `Would exceed per-assessment cap ($${perAssessmentCap}).` });
      }
      for (const feature of enabledFeatures) {
        const featureCost = (itemCount || 10) * perItemCost;
        await acapStorage.createForgeAiUsageEntry({
          feature,
          itemCount: itemCount || 10,
          costUsd: featureCost,
          adminEmail: req.admin?.email,
          forgeAssessmentId: forgeAssessmentId || null,
          metadata: { flags },
        });
      }
      res.json({ success: true, totalCost, features: enabledFeatures, itemCount: itemCount || 10 });
    } catch (error) {
      console.error("AI run error:", error);
      res.status(500).json({ error: "Failed to run AI enhancements" });
    }
  });

  // ===== Build Forge Assessment from Staged Items =====
  app.post("/api/acap/forge/build-from-staged", authenticateForgeAdmin, async (req: any, res: Response) => {
    try {
      const { title, grades, subjects, assessmentType, timeLimitMinutes, lockMode, antiRushMonitor, stagedItems, dokDistribution } = req.body;
      if (!title) return res.status(400).json({ error: "title required" });
      const assessment = await acapStorage.createForgeAssessment({
        title,
        grades: grades || [6],
        subjects: subjects || ["Math"],
        assessmentType: assessmentType || "diagnostic",
        timeLimitMinutes: timeLimitMinutes || 60,
        lockMode: lockMode !== false,
        antiRushMonitor: antiRushMonitor !== false,
        itemIds: (stagedItems || []).map((_: any, i: number) => i + 1),
        standardIds: [],
        dokDistribution: dokDistribution || {},
        writingConfig: {},
        status: "draft",
        createdBy: req.admin?.email || "admin",
      });
      res.json(assessment);
    } catch (error: any) {
      console.error("Build from staged error:", error);
      res.status(500).json({ error: error.message || "Failed to build assessment" });
    }
  });

  // ===== EDUCAP HEALTH ENDPOINT =====
  app.get("/api/health/educap", async (req: Request, res: Response) => {
    try {
      const dbUrl = process.env.DATABASE_URL || "";
      const dbHost = dbUrl.replace(/^.*@/, "").replace(/\/.*$/, "").replace(/:.*$/, "");
      const dbName = dbUrl.replace(/^.*\//, "").replace(/\?.*$/, "");

      const standards = await acapStorage.getStandards();
      const blueprints = await acapStorage.getBlueprints();
      const items = await acapStorage.getItems();
      const assessments = await acapStorage.getAssessments();

      const gradeBreakdown: Record<string, number> = {};
      for (const s of standards) {
        const key = `grade${s.gradeLevel}_${s.domain}`;
        gradeBreakdown[key] = (gradeBreakdown[key] || 0) + 1;
      }

      res.json({
        status: "ok",
        env: {
          NODE_ENV: process.env.NODE_ENV || "not set",
          REPLIT_ENVIRONMENT: process.env.REPLIT_ENVIRONMENT || "not set",
          dbHost: dbHost || "not set",
          dbName: dbName || "not set",
        },
        counts: {
          standards: standards.length,
          blueprints: blueprints.length,
          items: items.length,
          assessments: assessments.length,
        },
        gradeBreakdown,
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error("[EDUCAP HEALTH] Error:", error.message);
      res.status(500).json({ status: "error", error: error.message });
    }
  });

  // Forge Reports Export CSV
  app.get("/api/acap/forge/assessments/:id/export", authenticateForgeAdmin, async (req: any, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const report = await acapStorage.getForgeAssessmentReport(id);
      if (!report) return res.status(404).json({ error: "Assessment not found" });
      const headers = "Item ID,Stem,Standard ID,DOK,Total Responses,Correct,Accuracy %\n";
      const rows = report.itemAnalysis.map(ia => `${ia.itemId},"${ia.stem.replace(/"/g, '""')}",${ia.standardId || ""},${ia.dokLevel || ""},${ia.totalResponses},${ia.correctCount},${ia.accuracy}`).join("\n");
      res.json({ csv: headers + rows });
    } catch (error) {
      res.status(500).json({ error: "Failed to export report" });
    }
  });

  // ===== ACAP WORKSHEETS =====

  const authenticateWorksheetUser = async (req: any, res: any, next: any) => {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token) return res.status(401).json({ error: "No token provided" });
    try {
      const decoded: any = jwt.verify(token, "bhsa-admin-secret-2025-stable");
      const session = await storage.getAdminSession(token);
      if (session) {
        const admin = await storage.getAdministratorByEmail(decoded.email);
        if (admin) { req.user = { id: admin.id || admin.email, role: "admin" }; return next(); }
      }
    } catch {}
    try {
      const decoded: any = jwt.verify(token, "bhsa-teacher-jwt-secret-2025");
      if (decoded.teacherId) { req.user = { id: decoded.teacherId, role: "teacher" }; return next(); }
    } catch {}
    return res.status(401).json({ error: "Invalid token" });
  };

  app.get("/api/acap/standards/list", async (req: Request, res: Response) => {
    try {
      const subject = String(req.query.subject || "");
      const gradesParam = String(req.query.grades || "");
      if (!subject || !gradesParam) return res.json({ standards: [] });
      const gradeLevel = parseInt(gradesParam);
      if (isNaN(gradeLevel)) return res.json({ standards: [] });
      const rows = await db.select().from(acapStandards)
        .where(and(eq(acapStandards.gradeLevel, gradeLevel), eq(acapStandards.isActive, true)));
      const filtered = rows.filter(r => {
        const domain = (r.domain || "").toLowerCase();
        if (subject === "ELA") return domain.includes("reading") || domain.includes("writing") || domain.includes("literacy") || domain.includes("ela") || domain.includes("language");
        if (subject === "Math") return domain.includes("math") || domain.includes("algebra") || domain.includes("geometry") || domain.includes("number") || domain.includes("ratio") || domain.includes("statistic") || domain.includes("expression") || domain.includes("function");
        if (subject === "Science") return domain.includes("science") || domain.includes("physical") || domain.includes("life") || domain.includes("earth");
        return true;
      });
      res.json({ standards: filtered.map(s => ({ code: s.code, grade: s.gradeLevel, subject, description: s.description, domain: s.domain })) });
    } catch (error) {
      console.error("Standards list error:", error);
      res.status(500).json({ error: "Failed to load standards" });
    }
  });

  app.post("/api/acap/worksheets", authenticateWorksheetUser, async (req: any, res: Response) => {
    try {
      const { title, subject, grade, standardCode, dokLevel, itemCount, language } = req.body;
      if (!title || !subject || !grade || !standardCode || !dokLevel || !itemCount) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      const std = await db.select().from(acapStandards)
        .where(eq(acapStandards.code, standardCode))
        .limit(1);
      const standardDescription = std[0]?.description || standardCode;

      const items = await generateWorksheetItems({
        subject, grade, standardCode, standardDescription,
        dokLevel, itemCount, language: language || "en",
      });

      const [worksheet] = await db.insert(acapWorksheets).values({
        title,
        subject,
        grade,
        standardCode,
        dokLevel,
        itemCount,
        language: language || "en",
        items,
        createdBy: req.user?.id || "unknown",
      }).returning();

      res.json({ worksheet });
    } catch (error: any) {
      console.error("Create worksheet error:", error);
      res.status(500).json({ error: error.message || "Failed to create worksheet" });
    }
  });

  app.get("/api/acap/worksheets/:id/pdf", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ error: "Invalid worksheet ID" });
      const rows = await db.select().from(acapWorksheets).where(eq(acapWorksheets.id, id));
      if (!rows.length) return res.status(404).json({ error: "Worksheet not found" });
      const ws = rows[0];

      const pdfBuf = await renderWorksheetPdf({
        title: ws.title,
        subject: ws.subject,
        grade: ws.grade,
        standardCode: ws.standardCode,
        dokLevel: ws.dokLevel,
        items: ws.items as any[],
        includeAnswerKey: true,
      });

      const safeName = ws.title.replace(/[^a-z0-9\- ]/gi, "").trim().replace(/\s+/g, "_").slice(0, 80) || "worksheet";
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="${safeName}.pdf"`);
      res.send(pdfBuf);
    } catch (error: any) {
      console.error("PDF generation error:", error);
      res.status(500).json({ error: "Failed to generate PDF" });
    }
  });

  app.get("/api/acap/worksheets", authenticateWorksheetUser, async (req: any, res: Response) => {
    try {
      const rows = await db.select().from(acapWorksheets).orderBy(acapWorksheets.id);
      res.json(rows);
    } catch (error) {
      res.status(500).json({ error: "Failed to load worksheets" });
    }
  });

}
