import { Express, Request, Response } from "express";
import { db } from "./db";
import {
  scholars, teacherAuth,
  insightAssessmentWindows, insightStudentResults, insightStandardMastery,
  insightProjections, insightEvents, acapStandards
} from "@shared/schema";
import { eq, and, inArray, desc, sql } from "drizzle-orm";

function computeBand(scaledPercent: number | null | undefined): string {
  if (scaledPercent === null || scaledPercent === undefined) return "ND";
  if (scaledPercent >= 70) return "PRO";
  if (scaledPercent >= 50) return "ON";
  if (scaledPercent >= 30) return "DEV";
  return "HR";
}

function bandIndex(band: string): number | null {
  const map: Record<string, number> = { HR: 0, DEV: 1, ON: 2, PRO: 3 };
  return map[band] ?? null;
}

function median(arr: number[]): number {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

async function getScopedStudentIds(scope: any, gradeFilter?: number): Promise<string[]> {
  let conditions: any[] = [];

  if (scope.grades && scope.grades.length > 0) {
    conditions.push(inArray(scholars.grade, scope.grades));
  }
  if (gradeFilter) {
    conditions.push(eq(scholars.grade, gradeFilter));
  }

  const students = await db.select({ id: scholars.id }).from(scholars)
    .where(conditions.length > 0 ? and(...conditions) : undefined);
  return students.map(s => s.id);
}

async function logInsightEvent(userId: string | null, role: string, eventType: string, payload: Record<string, any>) {
  try {
    await db.insert(insightEvents).values({
      userId: userId || "system",
      role,
      eventType,
      payloadJSON: payload,
    });
  } catch (_e) {
    console.error("[InsightStack] Failed to log event:", _e);
  }
}

export function registerInsightRoutes(app: Express) {

  const authenticateInsightUser = async (req: any, res: Response, next: any) => {
    const token = req.headers.authorization?.replace("Bearer ", "");
    const adminToken = req.headers["x-admin-token"] as string;

    if (adminToken) {
      req.userRole = "admin";
      req.userScope = { grades: [6, 7, 8], studentIds: null };
      return next();
    }

    if (token) {
      try {
        const jwt = await import("jsonwebtoken");
        const decoded: any = jwt.default.verify(token, "bhsa-teacher-secret-2025-stable");
        const [teacher] = await db.select().from(teacherAuth).where(eq(teacherAuth.id, decoded.teacherId));
        if (!teacher) return res.status(401).json({ error: "Invalid token" });

        const getGrades = (role: string) => {
          switch (role) {
            case '6th Grade': return [6];
            case '7th Grade': return [7];
            case '8th Grade': return [8];
            default: return [6, 7, 8];
          }
        };

        req.userRole = "teacher";
        req.teacherId = teacher.id;
        req.userScope = { grades: getGrades(teacher.gradeRole), teacherId: teacher.id };
        return next();
      } catch (e) {
        return res.status(401).json({ error: "Invalid token" });
      }
    }

    res.status(401).json({ error: "Authentication required" });
  };

  // 1. GET /api/educap/analytics/windows
  app.get("/api/educap/analytics/windows", authenticateInsightUser, async (req: any, res: Response) => {
    try {
      const windows = await db.select().from(insightAssessmentWindows)
        .orderBy(insightAssessmentWindows.orderIndex);
      res.json(windows);
    } catch (error: any) {
      await logInsightEvent(req.teacherId || null, req.userRole || "unknown", "error", { endpoint: "windows", error: error.message });
      res.status(500).json({ error: "Failed to fetch windows" });
    }
  });

  // 2. GET /api/educap/analytics/overview
  app.get("/api/educap/analytics/overview", authenticateInsightUser, async (req: any, res: Response) => {
    try {
      const subject = req.query.subject as string;
      const fromWindowId = parseInt(req.query.fromWindow as string);
      const toWindowId = parseInt(req.query.toWindow as string);
      const gradeFilter = req.query.grade ? parseInt(req.query.grade as string) : undefined;

      if (!subject || isNaN(fromWindowId) || isNaN(toWindowId)) {
        return res.json({
          proficiencyNow: 0, growth: 0, offTrack: 0, leverageStandards: [],
          totalStudents: 0, completionRate: 0,
        });
      }

      const effectiveGrade = req.userRole === "admin" ? gradeFilter : undefined;
      const studentIds = await getScopedStudentIds(req.userScope, effectiveGrade);

      if (studentIds.length === 0) {
        return res.json({
          proficiencyNow: 0, growth: 0, offTrack: 0, leverageStandards: [],
          totalStudents: 0, completionRate: 0,
        });
      }

      const toResults = await db.select().from(insightStudentResults)
        .where(and(
          inArray(insightStudentResults.scholarId, studentIds),
          eq(insightStudentResults.windowId, toWindowId),
          eq(insightStudentResults.subject, subject)
        ));

      const fromResults = await db.select().from(insightStudentResults)
        .where(and(
          inArray(insightStudentResults.scholarId, studentIds),
          eq(insightStudentResults.windowId, fromWindowId),
          eq(insightStudentResults.subject, subject)
        ));

      const totalStudents = studentIds.length;
      const completedTo = toResults.length;
      const completionRate = totalStudents > 0 ? Math.round((completedTo / totalStudents) * 100) : 0;

      const proBandCount = toResults.filter(r => computeBand(r.scaledPercent) === "PRO").length;
      const proficiencyNow = completedTo > 0 ? Math.round((proBandCount / completedTo) * 100) : 0;

      const offTrack = toResults.filter(r => {
        const b = computeBand(r.scaledPercent);
        return b === "HR" || b === "DEV";
      }).length;

      const fromMap = new Map(fromResults.map(r => [r.scholarId, r.scaledPercent]));
      const deltas: number[] = [];
      for (const toR of toResults) {
        const fromScore = fromMap.get(toR.scholarId);
        if (fromScore !== undefined && fromScore !== null && toR.scaledPercent !== null) {
          deltas.push(toR.scaledPercent - fromScore);
        }
      }
      const growth = median(deltas);

      const masteryRows = await db.select().from(insightStandardMastery)
        .where(and(
          inArray(insightStandardMastery.scholarId, studentIds),
          eq(insightStandardMastery.windowId, toWindowId),
          eq(insightStandardMastery.subject, subject)
        ));

      const standardAgg: Record<number, { total: number; count: number }> = {};
      for (const row of masteryRows) {
        if (!standardAgg[row.standardId]) standardAgg[row.standardId] = { total: 0, count: 0 };
        standardAgg[row.standardId].total += (row.masteryScore || 0);
        standardAgg[row.standardId].count += 1;
      }

      const standardScores = Object.entries(standardAgg).map(([sid, agg]) => ({
        standardId: parseInt(sid),
        avgMastery: agg.count > 0 ? agg.total / agg.count : 0,
        studentCount: agg.count,
      }));
      standardScores.sort((a, b) => a.avgMastery - b.avgMastery);
      const leverageStandards = standardScores.slice(0, 3).map(s => ({
        standardId: s.standardId,
        avgMastery: Math.round(s.avgMastery * 100) / 100,
        studentCount: s.studentCount,
        leverageScore: Math.round((1 - s.avgMastery / 100) * s.studentCount * 100) / 100,
      }));

      res.json({
        proficiencyNow, growth: Math.round(growth * 100) / 100, offTrack,
        leverageStandards, totalStudents, completionRate,
      });
    } catch (error: any) {
      await logInsightEvent(req.teacherId || null, req.userRole || "unknown", "error", { endpoint: "overview", error: error.message });
      res.status(500).json({ error: "Failed to fetch overview" });
    }
  });

  // 3. GET /api/educap/analytics/movement
  app.get("/api/educap/analytics/movement", authenticateInsightUser, async (req: any, res: Response) => {
    try {
      const subject = req.query.subject as string;
      const fromWindowId = parseInt(req.query.fromWindow as string);
      const toWindowId = parseInt(req.query.toWindow as string);
      const gradeFilter = req.query.grade ? parseInt(req.query.grade as string) : undefined;

      if (!subject || isNaN(fromWindowId) || isNaN(toWindowId)) {
        return res.json({ grid: {}, movementSummary: { accelerated: 0, typical: 0, flat: 0, decline: 0 } });
      }

      const effectiveGrade = req.userRole === "admin" ? gradeFilter : undefined;
      const studentIds = await getScopedStudentIds(req.userScope, effectiveGrade);

      if (studentIds.length === 0) {
        return res.json({ grid: {}, movementSummary: { accelerated: 0, typical: 0, flat: 0, decline: 0 } });
      }

      const [fromResults, toResults] = await Promise.all([
        db.select().from(insightStudentResults).where(and(
          inArray(insightStudentResults.scholarId, studentIds),
          eq(insightStudentResults.windowId, fromWindowId),
          eq(insightStudentResults.subject, subject)
        )),
        db.select().from(insightStudentResults).where(and(
          inArray(insightStudentResults.scholarId, studentIds),
          eq(insightStudentResults.windowId, toWindowId),
          eq(insightStudentResults.subject, subject)
        )),
      ]);

      const fromMap = new Map(fromResults.map(r => [r.scholarId, r.scaledPercent]));
      const toMap = new Map(toResults.map(r => [r.scholarId, r.scaledPercent]));

      const bands = ["ND", "HR", "DEV", "ON", "PRO"];
      const grid: Record<string, Record<string, { count: number; studentIds: string[] }>> = {};
      for (const fb of bands) {
        grid[fb] = {};
        for (const tb of bands) {
          grid[fb][tb] = { count: 0, studentIds: [] };
        }
      }

      let accelerated = 0, typical = 0, flat = 0, decline = 0;

      const allIdArr = Array.from(new Set([...Array.from(fromMap.keys()), ...Array.from(toMap.keys()), ...studentIds]));
      for (const sid of allIdArr) {
        if (!studentIds.includes(sid)) continue;
        const fromBand = computeBand(fromMap.get(sid) ?? null);
        const toBand = computeBand(toMap.get(sid) ?? null);

        grid[fromBand][toBand].count++;
        grid[fromBand][toBand].studentIds.push(sid);

        const fi = bandIndex(fromBand);
        const ti = bandIndex(toBand);
        if (fi !== null && ti !== null) {
          const diff = ti - fi;
          if (diff >= 2) accelerated++;
          else if (diff === 1) typical++;
          else if (diff === 0) flat++;
          else decline++;
        }
      }

      res.json({ grid, movementSummary: { accelerated, typical, flat, decline } });
    } catch (error: any) {
      await logInsightEvent(req.teacherId || null, req.userRole || "unknown", "error", { endpoint: "movement", error: error.message });
      res.status(500).json({ error: "Failed to fetch movement data" });
    }
  });

  // 4. GET /api/educap/analytics/movement/cell
  app.get("/api/educap/analytics/movement/cell", authenticateInsightUser, async (req: any, res: Response) => {
    try {
      const subject = req.query.subject as string;
      const fromWindowId = parseInt(req.query.fromWindow as string);
      const toWindowId = parseInt(req.query.toWindow as string);
      const fromBandParam = req.query.fromBand as string;
      const toBandParam = req.query.toBand as string;
      const gradeFilter = req.query.grade ? parseInt(req.query.grade as string) : undefined;

      if (!subject || isNaN(fromWindowId) || isNaN(toWindowId) || !fromBandParam || !toBandParam) {
        return res.json({ students: [] });
      }

      const effectiveGrade = req.userRole === "admin" ? gradeFilter : undefined;
      const studentIds = await getScopedStudentIds(req.userScope, effectiveGrade);

      if (studentIds.length === 0) return res.json({ students: [] });

      const [fromResults, toResults, scholarRows] = await Promise.all([
        db.select().from(insightStudentResults).where(and(
          inArray(insightStudentResults.scholarId, studentIds),
          eq(insightStudentResults.windowId, fromWindowId),
          eq(insightStudentResults.subject, subject)
        )),
        db.select().from(insightStudentResults).where(and(
          inArray(insightStudentResults.scholarId, studentIds),
          eq(insightStudentResults.windowId, toWindowId),
          eq(insightStudentResults.subject, subject)
        )),
        db.select({ id: scholars.id, name: scholars.name, grade: scholars.grade })
          .from(scholars).where(inArray(scholars.id, studentIds)),
      ]);

      const fromMap = new Map(fromResults.map(r => [r.scholarId, r]));
      const toMap = new Map(toResults.map(r => [r.scholarId, r]));
      const scholarMap = new Map(scholarRows.map(s => [s.id, s]));

      const matchingStudents: any[] = [];
      for (const sid of studentIds) {
        const fromScore = fromMap.get(sid)?.scaledPercent ?? null;
        const toScore = toMap.get(sid)?.scaledPercent ?? null;
        const fb = computeBand(fromScore);
        const tb = computeBand(toScore);
        if (fb === fromBandParam && tb === toBandParam) {
          const scholar = scholarMap.get(sid);
          matchingStudents.push({
            id: sid,
            name: scholar?.name || "Unknown",
            grade: scholar?.grade || 0,
            fromScore: fromScore !== null ? Math.round(fromScore * 100) / 100 : null,
            toScore: toScore !== null ? Math.round(toScore * 100) / 100 : null,
            growth: fromScore !== null && toScore !== null ? Math.round((toScore - fromScore) * 100) / 100 : null,
          });
        }
      }

      res.json({ students: matchingStudents });
    } catch (error: any) {
      await logInsightEvent(req.teacherId || null, req.userRole || "unknown", "error", { endpoint: "movement/cell", error: error.message });
      res.status(500).json({ error: "Failed to fetch cell data" });
    }
  });

  // 5. GET /api/educap/analytics/standards
  app.get("/api/educap/analytics/standards", authenticateInsightUser, async (req: any, res: Response) => {
    try {
      const subject = req.query.subject as string;
      const fromWindowId = parseInt(req.query.fromWindow as string);
      const toWindowId = parseInt(req.query.toWindow as string);
      const gradeFilter = req.query.grade ? parseInt(req.query.grade as string) : undefined;

      if (!subject || isNaN(fromWindowId) || isNaN(toWindowId)) {
        return res.json({ standards: [] });
      }

      const effectiveGrade = req.userRole === "admin" ? gradeFilter : undefined;
      const studentIds = await getScopedStudentIds(req.userScope, effectiveGrade);

      if (studentIds.length === 0) return res.json({ standards: [] });

      const [fromMastery, toMastery, standardRows] = await Promise.all([
        db.select().from(insightStandardMastery).where(and(
          inArray(insightStandardMastery.scholarId, studentIds),
          eq(insightStandardMastery.windowId, fromWindowId),
          eq(insightStandardMastery.subject, subject)
        )),
        db.select().from(insightStandardMastery).where(and(
          inArray(insightStandardMastery.scholarId, studentIds),
          eq(insightStandardMastery.windowId, toWindowId),
          eq(insightStandardMastery.subject, subject)
        )),
        db.select().from(acapStandards).where(eq(acapStandards.isActive, true)),
      ]);

      const fromAgg: Record<number, { total: number; count: number }> = {};
      for (const r of fromMastery) {
        if (!fromAgg[r.standardId]) fromAgg[r.standardId] = { total: 0, count: 0 };
        fromAgg[r.standardId].total += (r.masteryScore || 0);
        fromAgg[r.standardId].count += 1;
      }

      const toAgg: Record<number, { total: number; count: number }> = {};
      for (const r of toMastery) {
        if (!toAgg[r.standardId]) toAgg[r.standardId] = { total: 0, count: 0 };
        toAgg[r.standardId].total += (r.masteryScore || 0);
        toAgg[r.standardId].count += 1;
      }

      const standardMap = new Map(standardRows.map(s => [s.id, s]));
      const allStandardIds = new Set([...Object.keys(fromAgg), ...Object.keys(toAgg)].map(Number));

      const standards = Array.from(allStandardIds).map(sid => {
        const fromData = fromAgg[sid] || { total: 0, count: 0 };
        const toData = toAgg[sid] || { total: 0, count: 0 };
        const fromMasteryPct = fromData.count > 0 ? fromData.total / fromData.count : 0;
        const toMasteryPct = toData.count > 0 ? toData.total / toData.count : 0;
        const growthPct = toMasteryPct - fromMasteryPct;
        const studentCount = Math.max(fromData.count, toData.count);
        const leverageScore = Math.round((1 - toMasteryPct / 100) * studentCount * 100) / 100;
        const std = standardMap.get(sid);
        return {
          standardId: sid,
          code: std?.code || `STD-${sid}`,
          description: std?.description || "",
          domain: std?.domain || "",
          fromMastery: Math.round(fromMasteryPct * 100) / 100,
          toMastery: Math.round(toMasteryPct * 100) / 100,
          growth: Math.round(growthPct * 100) / 100,
          studentCount,
          leverageScore,
        };
      });

      standards.sort((a, b) => a.leverageScore - b.leverageScore);

      res.json({ standards });
    } catch (error: any) {
      await logInsightEvent(req.teacherId || null, req.userRole || "unknown", "error", { endpoint: "standards", error: error.message });
      res.status(500).json({ error: "Failed to fetch standards data" });
    }
  });

  // 6. GET /api/educap/analytics/students
  app.get("/api/educap/analytics/students", authenticateInsightUser, async (req: any, res: Response) => {
    try {
      const subject = req.query.subject as string;
      const fromWindowId = parseInt(req.query.fromWindow as string);
      const toWindowId = parseInt(req.query.toWindow as string);
      const gradeFilter = req.query.grade ? parseInt(req.query.grade as string) : undefined;

      if (!subject || isNaN(fromWindowId) || isNaN(toWindowId)) {
        return res.json({ students: [] });
      }

      const effectiveGrade = req.userRole === "admin" ? gradeFilter : undefined;
      const studentIds = await getScopedStudentIds(req.userScope, effectiveGrade);

      if (studentIds.length === 0) return res.json({ students: [] });

      const [fromResults, toResults, scholarRows, projections] = await Promise.all([
        db.select().from(insightStudentResults).where(and(
          inArray(insightStudentResults.scholarId, studentIds),
          eq(insightStudentResults.windowId, fromWindowId),
          eq(insightStudentResults.subject, subject)
        )),
        db.select().from(insightStudentResults).where(and(
          inArray(insightStudentResults.scholarId, studentIds),
          eq(insightStudentResults.windowId, toWindowId),
          eq(insightStudentResults.subject, subject)
        )),
        db.select({ id: scholars.id, name: scholars.name, grade: scholars.grade })
          .from(scholars).where(inArray(scholars.id, studentIds)),
        db.select().from(insightProjections).where(and(
          inArray(insightProjections.scholarId, studentIds),
          eq(insightProjections.subject, subject)
        )),
      ]);

      const fromMap = new Map(fromResults.map(r => [r.scholarId, r]));
      const toMap = new Map(toResults.map(r => [r.scholarId, r]));
      const projMap = new Map(projections.map(p => [p.scholarId, p]));

      const students = scholarRows.map(s => {
        const fromR = fromMap.get(s.id);
        const toR = toMap.get(s.id);
        const proj = projMap.get(s.id);
        const fromScore = fromR?.scaledPercent ?? null;
        const toScore = toR?.scaledPercent ?? null;
        const fromBand = computeBand(fromScore);
        const toBand = computeBand(toScore);
        const growth = fromScore !== null && toScore !== null ? Math.round((toScore - fromScore) * 100) / 100 : null;
        const riskFlag = toBand === "HR" || toBand === "DEV" || (growth !== null && growth < -5);

        return {
          id: s.id,
          name: s.name,
          grade: s.grade,
          fromBand,
          toBand,
          fromScore: fromScore !== null ? Math.round(fromScore * 100) / 100 : null,
          toScore: toScore !== null ? Math.round(toScore * 100) / 100 : null,
          growth,
          projectionBand: proj?.projectionBand || null,
          riskFlag,
        };
      });

      students.sort((a, b) => (a.toScore ?? 0) - (b.toScore ?? 0));

      res.json({ students });
    } catch (error: any) {
      await logInsightEvent(req.teacherId || null, req.userRole || "unknown", "error", { endpoint: "students", error: error.message });
      res.status(500).json({ error: "Failed to fetch student roster" });
    }
  });

  // 7. GET /api/educap/analytics/student/:studentId
  app.get("/api/educap/analytics/student/:studentId", authenticateInsightUser, async (req: any, res: Response) => {
    try {
      const studentId = req.params.studentId;
      const subject = req.query.subject as string;

      const studentIds = await getScopedStudentIds(req.userScope);
      if (!studentIds.includes(studentId)) {
        return res.status(403).json({ error: "Student not in your scope" });
      }

      const [scholarRow] = await db.select().from(scholars).where(eq(scholars.id, studentId));
      if (!scholarRow) return res.status(404).json({ error: "Student not found" });

      const conditions: any[] = [eq(insightStudentResults.scholarId, studentId)];
      if (subject) conditions.push(eq(insightStudentResults.subject, subject));

      const [allResults, masteryRows, projRows, windows] = await Promise.all([
        db.select().from(insightStudentResults).where(and(...conditions)),
        db.select().from(insightStandardMastery).where(
          subject
            ? and(eq(insightStandardMastery.scholarId, studentId), eq(insightStandardMastery.subject, subject))
            : eq(insightStandardMastery.scholarId, studentId)
        ),
        db.select().from(insightProjections).where(
          subject
            ? and(eq(insightProjections.scholarId, studentId), eq(insightProjections.subject, subject))
            : eq(insightProjections.scholarId, studentId)
        ),
        db.select().from(insightAssessmentWindows).orderBy(insightAssessmentWindows.orderIndex),
      ]);

      const windowMap = new Map(windows.map(w => [w.id, w]));

      const windowScores = allResults.map(r => ({
        windowId: r.windowId,
        windowName: windowMap.get(r.windowId)?.name || `Window ${r.windowId}`,
        subject: r.subject,
        score: r.score,
        maxScore: r.maxScore,
        scaledPercent: r.scaledPercent !== null ? Math.round(r.scaledPercent * 100) / 100 : null,
        band: computeBand(r.scaledPercent),
        timeOnTaskMinutes: r.timeOnTaskMinutes,
        completedAt: r.completedAt,
      })).sort((a, b) => {
        const wA = windowMap.get(a.windowId);
        const wB = windowMap.get(b.windowId);
        return (wA?.orderIndex || 0) - (wB?.orderIndex || 0);
      });

      const standardInfo = await db.select().from(acapStandards).where(eq(acapStandards.isActive, true));
      const standardMap = new Map(standardInfo.map(s => [s.id, s]));

      const masteryMap = masteryRows.map(m => ({
        standardId: m.standardId,
        code: standardMap.get(m.standardId)?.code || `STD-${m.standardId}`,
        description: standardMap.get(m.standardId)?.description || "",
        windowId: m.windowId,
        masteryLevel: m.masteryLevel,
        masteryScore: m.masteryScore,
      }));

      const projection = projRows.length > 0 ? {
        probabilityProficient: projRows[0].probabilityProficient,
        projectionBand: projRows[0].projectionBand,
        confidence: projRows[0].confidence,
        projectedFinalPercent: projRows[0].projectedFinalPercent,
        explanationJSON: projRows[0].explanationJSON,
      } : null;

      const growthTrend = windowScores
        .filter(ws => ws.scaledPercent !== null)
        .map(ws => ({ windowId: ws.windowId, windowName: ws.windowName, scaledPercent: ws.scaledPercent }));

      res.json({
        student: { id: scholarRow.id, name: scholarRow.name, grade: scholarRow.grade },
        windowScores,
        masteryMap,
        projection,
        growthTrend,
      });
    } catch (error: any) {
      await logInsightEvent(req.teacherId || null, req.userRole || "unknown", "error", { endpoint: "student-detail", error: error.message });
      res.status(500).json({ error: "Failed to fetch student details" });
    }
  });

  // 8. POST /api/educap/analytics/projections/recompute (admin only)
  app.post("/api/educap/analytics/projections/recompute", authenticateInsightUser, async (req: any, res: Response) => {
    try {
      if (req.userRole !== "admin") {
        return res.status(403).json({ error: "Admin only" });
      }

      const { grade, subject } = req.body;
      if (!grade || !subject) {
        return res.status(400).json({ error: "grade and subject are required" });
      }

      const studentIds = await getScopedStudentIds({ grades: [grade] });
      if (studentIds.length === 0) {
        return res.json({ message: "No students found", count: 0 });
      }

      const windows = await db.select().from(insightAssessmentWindows)
        .orderBy(insightAssessmentWindows.orderIndex);

      if (windows.length < 2) {
        return res.json({ message: "Need at least 2 windows", count: 0 });
      }

      const fromWindow = windows[0];
      const toWindow = windows[windows.length - 1];

      const [fromResults, toResults, masteryRows] = await Promise.all([
        db.select().from(insightStudentResults).where(and(
          inArray(insightStudentResults.scholarId, studentIds),
          eq(insightStudentResults.windowId, fromWindow.id),
          eq(insightStudentResults.subject, subject)
        )),
        db.select().from(insightStudentResults).where(and(
          inArray(insightStudentResults.scholarId, studentIds),
          eq(insightStudentResults.windowId, toWindow.id),
          eq(insightStudentResults.subject, subject)
        )),
        db.select().from(insightStandardMastery).where(and(
          inArray(insightStandardMastery.scholarId, studentIds),
          eq(insightStandardMastery.windowId, toWindow.id),
          eq(insightStandardMastery.subject, subject)
        )),
      ]);

      const fromMap = new Map(fromResults.map(r => [r.scholarId, r]));
      const toMap = new Map(toResults.map(r => [r.scholarId, r]));

      const masteryByStudent: Record<string, number[]> = {};
      for (const m of masteryRows) {
        if (!masteryByStudent[m.scholarId]) masteryByStudent[m.scholarId] = [];
        masteryByStudent[m.scholarId].push(m.masteryScore || 0);
      }

      const daysBetween = fromWindow.startDate && toWindow.startDate
        ? Math.max(1, Math.round((toWindow.startDate.getTime() - fromWindow.startDate.getTime()) / (1000 * 60 * 60 * 24)))
        : 90;
      const daysUntilFinal = 180 - daysBetween;

      let count = 0;
      for (const sid of studentIds) {
        const fromR = fromMap.get(sid);
        const toR = toMap.get(sid);
        if (!fromR?.scaledPercent || !toR?.scaledPercent) continue;

        const velocity = (toR.scaledPercent - fromR.scaledPercent) / daysBetween;
        const projectedFinal = toR.scaledPercent + velocity * Math.max(0, daysUntilFinal);
        const clampedProjected = Math.max(0, Math.min(100, projectedFinal));

        const masteryScores = masteryByStudent[sid] || [];
        const masteryCoverage = masteryScores.length > 0
          ? masteryScores.reduce((a, b) => a + b, 0) / masteryScores.length
          : toR.scaledPercent;

        const blendedFinal = 0.7 * clampedProjected + 0.3 * masteryCoverage;
        const probability = sigmoid((blendedFinal - 70) / 10);
        const projBand = computeBand(blendedFinal);

        let confidence: string;
        if (probability > 0.8 || probability < 0.2) confidence = "high";
        else if (probability > 0.6 || probability < 0.4) confidence = "medium";
        else confidence = "low";

        const explanationJSON = {
          fromScore: fromR.scaledPercent,
          toScore: toR.scaledPercent,
          velocity: Math.round(velocity * 1000) / 1000,
          daysBetween,
          daysUntilFinal: Math.max(0, daysUntilFinal),
          projectedRaw: Math.round(clampedProjected * 100) / 100,
          masteryCoverage: Math.round(masteryCoverage * 100) / 100,
          blendedFinal: Math.round(blendedFinal * 100) / 100,
          formula: "blended = 0.7*projected + 0.3*masteryCoverage; prob = sigmoid((blended-70)/10)",
        };

        await db.insert(insightProjections).values({
          scholarId: sid,
          subject,
          gradeLevel: grade,
          fromWindowId: fromWindow.id,
          toWindowId: toWindow.id,
          probabilityProficient: Math.round(probability * 1000) / 1000,
          projectionBand: projBand,
          confidence,
          projectedFinalPercent: Math.round(blendedFinal * 100) / 100,
          explanationJSON,
        });
        count++;
      }

      await logInsightEvent(null, "admin", "projections_recomputed", { grade, subject, count });

      res.json({ message: "Projections recomputed", count });
    } catch (error: any) {
      await logInsightEvent(null, "admin", "error", { endpoint: "projections/recompute", error: error.message });
      res.status(500).json({ error: "Failed to recompute projections" });
    }
  });

  // 9. GET /api/educap/analytics/health (public - no auth required for diagnostics)
  app.get("/api/educap/analytics/health", async (req: any, res: Response) => {
    try {
      const [windowCount] = await db.select({ count: sql<number>`count(*)` }).from(insightAssessmentWindows);
      const [resultCount] = await db.select({ count: sql<number>`count(*)` }).from(insightStudentResults);
      const [masteryCount] = await db.select({ count: sql<number>`count(*)` }).from(insightStandardMastery);
      const [projectionCount] = await db.select({ count: sql<number>`count(*)` }).from(insightProjections);
      const [eventCount] = await db.select({ count: sql<number>`count(*)` }).from(insightEvents);
      const [scholarCount] = await db.select({ count: sql<number>`count(*)` }).from(scholars);

      res.json({
        status: "ok",
        environment: process.env.NODE_ENV || "development",
        dbCounts: {
          windows: Number(windowCount.count),
          results: Number(resultCount.count),
          mastery: Number(masteryCount.count),
          projections: Number(projectionCount.count),
          events: Number(eventCount.count),
          scholars: Number(scholarCount.count),
        },
        tenant: "BHSA",
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      res.status(500).json({ status: "error", error: error.message });
    }
  });

  // 10. GET /api/educap/analytics/grade-ladder (admin only)
  app.get("/api/educap/analytics/grade-ladder", authenticateInsightUser, async (req: any, res: Response) => {
    try {
      if (req.userRole !== "admin") {
        return res.status(403).json({ error: "Admin only" });
      }

      const subject = req.query.subject as string;
      const fromWindowId = req.query.fromWindow ? parseInt(req.query.fromWindow as string) : undefined;
      const toWindowId = req.query.toWindow ? parseInt(req.query.toWindow as string) : undefined;

      const grades = [6, 7, 8];
      const ladder: any[] = [];

      for (const grade of grades) {
        const gradeStudents = await getScopedStudentIds({ grades: [grade] });
        if (gradeStudents.length === 0) {
          ladder.push({
            grade, proficiency: 0, growth: 0, offTrackPct: 0,
            completion: 0, leverageStandards: [], totalStudents: 0,
          });
          continue;
        }

        let proficiency = 0, offTrackPct = 0, growth = 0, completion = 0;
        const leverageStandards: any[] = [];

        if (subject && toWindowId && fromWindowId) {
          const toResults = await db.select().from(insightStudentResults).where(and(
            inArray(insightStudentResults.scholarId, gradeStudents),
            eq(insightStudentResults.windowId, toWindowId),
            eq(insightStudentResults.subject, subject)
          ));

          const fromResults = await db.select().from(insightStudentResults).where(and(
            inArray(insightStudentResults.scholarId, gradeStudents),
            eq(insightStudentResults.windowId, fromWindowId),
            eq(insightStudentResults.subject, subject)
          ));

          const completed = toResults.length;
          completion = gradeStudents.length > 0 ? Math.round((completed / gradeStudents.length) * 100) : 0;

          const proCount = toResults.filter(r => computeBand(r.scaledPercent) === "PRO").length;
          proficiency = completed > 0 ? Math.round((proCount / completed) * 100) : 0;

          const offTrackCount = toResults.filter(r => {
            const b = computeBand(r.scaledPercent);
            return b === "HR" || b === "DEV";
          }).length;
          offTrackPct = completed > 0 ? Math.round((offTrackCount / completed) * 100) : 0;

          const fromMap = new Map(fromResults.map(r => [r.scholarId, r.scaledPercent]));
          const deltas: number[] = [];
          for (const tr of toResults) {
            const fs = fromMap.get(tr.scholarId);
            if (fs !== undefined && fs !== null && tr.scaledPercent !== null) {
              deltas.push(tr.scaledPercent - fs);
            }
          }
          growth = Math.round(median(deltas) * 100) / 100;
        }

        ladder.push({
          grade, proficiency, growth, offTrackPct,
          completion, leverageStandards, totalStudents: gradeStudents.length,
        });
      }

      res.json({ ladder });
    } catch (error: any) {
      await logInsightEvent(null, "admin", "error", { endpoint: "grade-ladder", error: error.message });
      res.status(500).json({ error: "Failed to fetch grade ladder" });
    }
  });

  // 11. GET /api/educap/analytics/teacher-impact (admin only)
  app.get("/api/educap/analytics/teacher-impact", authenticateInsightUser, async (req: any, res: Response) => {
    try {
      if (req.userRole !== "admin") {
        return res.status(403).json({ error: "Admin only" });
      }

      const gradeFilter = req.query.grade ? parseInt(req.query.grade as string) : undefined;
      const subject = req.query.subject as string;
      const fromWindowId = req.query.fromWindow ? parseInt(req.query.fromWindow as string) : undefined;
      const toWindowId = req.query.toWindow ? parseInt(req.query.toWindow as string) : undefined;

      const teacherConditions: any[] = [];
      if (gradeFilter) {
        const gradeStr = `${gradeFilter}th Grade`;
        teacherConditions.push(eq(teacherAuth.gradeRole, gradeStr));
      }

      const teacherRows = await db.select().from(teacherAuth)
        .where(teacherConditions.length > 0 ? and(...teacherConditions) : undefined);

      const impact: any[] = [];

      for (const teacher of teacherRows) {
        const teacherStudents = await db.select({ id: scholars.id }).from(scholars)
          .where(eq(scholars.teacherId, teacher.id));
        const studentIds = teacherStudents.map(s => s.id);

        if (studentIds.length === 0) {
          impact.push({
            teacherId: teacher.id, teacherName: teacher.name, subject: teacher.subject,
            proficient: 0, growth: 0, offTrackPct: 0, standardsCoverage: 0, completion: 0,
            studentCount: 0,
          });
          continue;
        }

        let proficient = 0, growthVal = 0, offTrackPct = 0, standardsCoverage = 0, completionVal = 0;

        if (subject && toWindowId && fromWindowId) {
          const [toResults, fromResults, masteryRows] = await Promise.all([
            db.select().from(insightStudentResults).where(and(
              inArray(insightStudentResults.scholarId, studentIds),
              eq(insightStudentResults.windowId, toWindowId),
              eq(insightStudentResults.subject, subject)
            )),
            db.select().from(insightStudentResults).where(and(
              inArray(insightStudentResults.scholarId, studentIds),
              eq(insightStudentResults.windowId, fromWindowId),
              eq(insightStudentResults.subject, subject)
            )),
            db.select().from(insightStandardMastery).where(and(
              inArray(insightStandardMastery.scholarId, studentIds),
              eq(insightStandardMastery.windowId, toWindowId),
              eq(insightStandardMastery.subject, subject)
            )),
          ]);

          const completed = toResults.length;
          completionVal = studentIds.length > 0 ? Math.round((completed / studentIds.length) * 100) : 0;

          const proCount = toResults.filter(r => computeBand(r.scaledPercent) === "PRO").length;
          proficient = completed > 0 ? Math.round((proCount / completed) * 100) : 0;

          const offTrackCount = toResults.filter(r => {
            const b = computeBand(r.scaledPercent);
            return b === "HR" || b === "DEV";
          }).length;
          offTrackPct = completed > 0 ? Math.round((offTrackCount / completed) * 100) : 0;

          const fromMap = new Map(fromResults.map(r => [r.scholarId, r.scaledPercent]));
          const deltas: number[] = [];
          for (const tr of toResults) {
            const fs = fromMap.get(tr.scholarId);
            if (fs !== undefined && fs !== null && tr.scaledPercent !== null) {
              deltas.push(tr.scaledPercent - fs);
            }
          }
          growthVal = Math.round(median(deltas) * 100) / 100;

          const uniqueStandards = new Set(masteryRows.map(m => m.standardId));
          const totalStandards = await db.select({ count: sql<number>`count(*)` }).from(acapStandards)
            .where(eq(acapStandards.isActive, true));
          const totalStdCount = Number(totalStandards[0]?.count || 1);
          standardsCoverage = Math.round((uniqueStandards.size / totalStdCount) * 100);
        }

        impact.push({
          teacherId: teacher.id, teacherName: teacher.name, subject: teacher.subject,
          proficient, growth: growthVal, offTrackPct, standardsCoverage, completion: completionVal,
          studentCount: studentIds.length,
        });
      }

      res.json({ teachers: impact });
    } catch (error: any) {
      await logInsightEvent(null, "admin", "error", { endpoint: "teacher-impact", error: error.message });
      res.status(500).json({ error: "Failed to fetch teacher impact" });
    }
  });

  // 12. POST /api/educap/analytics/client-error
  app.post("/api/educap/analytics/client-error", async (req: Request, res: Response) => {
    try {
      const { message, stack, url, userAgent, userId, role } = req.body;
      await db.insert(insightEvents).values({
        userId: userId || "anonymous",
        role: role || "client",
        eventType: "client_error",
        payloadJSON: {
          message: message || "Unknown error",
          stack: stack || null,
          url: url || null,
          userAgent: userAgent || null,
          timestamp: new Date().toISOString(),
        },
      });
      res.json({ ok: true });
    } catch (error: any) {
      console.error("[InsightStack] Failed to log client error:", error.message);
      res.status(500).json({ error: "Failed to log error" });
    }
  });

  console.log("[InsightStack] Analytics routes registered");
}
