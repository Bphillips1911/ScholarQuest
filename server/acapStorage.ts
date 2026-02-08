import { eq, desc, and, inArray, sql } from "drizzle-orm";
import { db } from "./db";
import {
  acapStandards, acapBlueprints, acapPassages, acapItems,
  acapAssessments, acapAssignments, acapAttempts, acapItemResponses,
  acapMasteryTracking, acapGrowthSnapshots, acapBootcampSessions, acapAuditLog,
  acapProjectionRuns, acapProjectionSnapshots, acapSchoolwideAssessments, acapSchoolwideResults,
  acapImpactRuns, acapImpactLevers, acapGenomeTraits, acapGenomeEvents, acapGenomeRecommendations,
  acapTutorAdaptations, acapAccessCodes,
  type AcapStandard, type AcapBlueprint, type AcapPassage, type AcapItem,
  type AcapAssessment, type AcapAssignment, type AcapAttempt, type AcapItemResponse,
  type AcapMasteryTracking, type AcapGrowthSnapshot, type AcapBootcampSession, type AcapAuditLog,
  type AcapProjectionRun, type AcapProjectionSnapshot, type AcapSchoolwideAssessment, type AcapSchoolwideResult,
  type AcapImpactRun, type AcapImpactLever, type AcapGenomeTrait, type AcapGenomeEvent, type AcapGenomeRecommendation,
  type AcapTutorAdaptation, type AcapAccessCode,
  type InsertAcapStandard, type InsertAcapBlueprint, type InsertAcapPassage, type InsertAcapItem,
  type InsertAcapAssessment, type InsertAcapAssignment, type InsertAcapAttempt, type InsertAcapItemResponse,
  type InsertAcapMasteryTracking, type InsertAcapGrowthSnapshot, type InsertAcapBootcampSession, type InsertAcapAuditLog,
  type InsertAcapProjectionRun, type InsertAcapProjectionSnapshot, type InsertAcapSchoolwideAssessment, type InsertAcapSchoolwideResult,
  type InsertAcapImpactRun, type InsertAcapImpactLever, type InsertAcapGenomeTrait, type InsertAcapGenomeEvent, type InsertAcapGenomeRecommendation,
  type InsertAcapTutorAdaptation, type InsertAcapAccessCode,
} from "@shared/schema";

export const acapStorage = {
  // Standards
  async getStandards(gradeLevel?: number): Promise<AcapStandard[]> {
    if (gradeLevel) {
      return db.select().from(acapStandards).where(and(eq(acapStandards.gradeLevel, gradeLevel), eq(acapStandards.isActive, true)));
    }
    return db.select().from(acapStandards).where(eq(acapStandards.isActive, true));
  },
  async getStandard(id: number): Promise<AcapStandard | undefined> {
    const [s] = await db.select().from(acapStandards).where(eq(acapStandards.id, id));
    return s;
  },
  async getStandardByCode(code: string): Promise<AcapStandard | undefined> {
    const [s] = await db.select().from(acapStandards).where(eq(acapStandards.code, code));
    return s;
  },
  async createStandard(data: InsertAcapStandard): Promise<AcapStandard> {
    const [s] = await db.insert(acapStandards).values(data).returning();
    return s;
  },
  async updateStandard(id: number, data: Partial<InsertAcapStandard>): Promise<AcapStandard> {
    const [s] = await db.update(acapStandards).set(data).where(eq(acapStandards.id, id)).returning();
    return s;
  },

  // Blueprints
  async getBlueprints(gradeLevel?: number): Promise<AcapBlueprint[]> {
    if (gradeLevel) {
      return db.select().from(acapBlueprints).where(and(eq(acapBlueprints.gradeLevel, gradeLevel), eq(acapBlueprints.isActive, true)));
    }
    return db.select().from(acapBlueprints).where(eq(acapBlueprints.isActive, true));
  },
  async getBlueprint(id: number): Promise<AcapBlueprint | undefined> {
    const [b] = await db.select().from(acapBlueprints).where(eq(acapBlueprints.id, id));
    return b;
  },
  async createBlueprint(data: InsertAcapBlueprint): Promise<AcapBlueprint> {
    const [b] = await db.insert(acapBlueprints).values(data).returning();
    return b;
  },
  async updateBlueprint(id: number, data: Partial<InsertAcapBlueprint>): Promise<AcapBlueprint> {
    const [b] = await db.update(acapBlueprints).set(data).where(eq(acapBlueprints.id, id)).returning();
    return b;
  },

  // Passages
  async getPassages(gradeLevel?: number): Promise<AcapPassage[]> {
    if (gradeLevel) {
      return db.select().from(acapPassages).where(eq(acapPassages.gradeLevel, gradeLevel)).orderBy(desc(acapPassages.createdAt));
    }
    return db.select().from(acapPassages).orderBy(desc(acapPassages.createdAt));
  },
  async getPassage(id: number): Promise<AcapPassage | undefined> {
    const [p] = await db.select().from(acapPassages).where(eq(acapPassages.id, id));
    return p;
  },
  async createPassage(data: InsertAcapPassage): Promise<AcapPassage> {
    const [p] = await db.insert(acapPassages).values(data).returning();
    return p;
  },

  // Items
  async getItems(filters?: { standardId?: number; blueprintId?: number; reviewStatus?: string; dokLevel?: number }): Promise<AcapItem[]> {
    let query = db.select().from(acapItems);
    const conditions: any[] = [];
    if (filters?.standardId) conditions.push(eq(acapItems.standardId, filters.standardId));
    if (filters?.blueprintId) conditions.push(eq(acapItems.blueprintId, filters.blueprintId));
    if (filters?.reviewStatus) conditions.push(eq(acapItems.reviewStatus, filters.reviewStatus));
    if (filters?.dokLevel) conditions.push(eq(acapItems.dokLevel, filters.dokLevel));
    if (conditions.length > 0) {
      return db.select().from(acapItems).where(and(...conditions)).orderBy(desc(acapItems.createdAt));
    }
    return db.select().from(acapItems).orderBy(desc(acapItems.createdAt));
  },
  async getItem(id: number): Promise<AcapItem | undefined> {
    const [i] = await db.select().from(acapItems).where(eq(acapItems.id, id));
    return i;
  },
  async createItem(data: InsertAcapItem): Promise<AcapItem> {
    const [i] = await db.insert(acapItems).values(data).returning();
    return i;
  },
  async createItems(data: InsertAcapItem[]): Promise<AcapItem[]> {
    if (data.length === 0) return [];
    return db.insert(acapItems).values(data).returning();
  },
  async updateItem(id: number, data: Partial<InsertAcapItem>): Promise<AcapItem> {
    const [i] = await db.update(acapItems).set(data).where(eq(acapItems.id, id)).returning();
    return i;
  },
  async getItemsByIds(ids: number[]): Promise<AcapItem[]> {
    if (ids.length === 0) return [];
    return db.select().from(acapItems).where(inArray(acapItems.id, ids));
  },

  // Assessments
  async getAssessments(filters?: { gradeLevel?: number; subject?: string; type?: string }): Promise<AcapAssessment[]> {
    const conditions: any[] = [eq(acapAssessments.isActive, true)];
    if (filters?.gradeLevel) conditions.push(eq(acapAssessments.gradeLevel, filters.gradeLevel));
    if (filters?.subject) conditions.push(eq(acapAssessments.subject, filters.subject));
    if (filters?.type) conditions.push(eq(acapAssessments.assessmentType, filters.type));
    return db.select().from(acapAssessments).where(and(...conditions)).orderBy(desc(acapAssessments.createdAt));
  },
  async getAssessment(id: number): Promise<AcapAssessment | undefined> {
    const [a] = await db.select().from(acapAssessments).where(eq(acapAssessments.id, id));
    return a;
  },
  async createAssessment(data: InsertAcapAssessment): Promise<AcapAssessment> {
    const [a] = await db.insert(acapAssessments).values(data).returning();
    return a;
  },
  async updateAssessment(id: number, data: Partial<InsertAcapAssessment>): Promise<AcapAssessment> {
    const [a] = await db.update(acapAssessments).set(data).where(eq(acapAssessments.id, id)).returning();
    return a;
  },

  // Assignments
  async getAssignments(teacherId?: string): Promise<AcapAssignment[]> {
    if (teacherId) {
      return db.select().from(acapAssignments).where(eq(acapAssignments.teacherId, teacherId)).orderBy(desc(acapAssignments.createdAt));
    }
    return db.select().from(acapAssignments).orderBy(desc(acapAssignments.createdAt));
  },
  async getAssignment(id: number): Promise<AcapAssignment | undefined> {
    const [a] = await db.select().from(acapAssignments).where(eq(acapAssignments.id, id));
    return a;
  },
  async createAssignment(data: InsertAcapAssignment): Promise<AcapAssignment> {
    const [a] = await db.insert(acapAssignments).values(data).returning();
    return a;
  },
  async getAssignmentsForScholar(scholarId: string): Promise<AcapAssignment[]> {
    const all = await db.select().from(acapAssignments).where(eq(acapAssignments.status, "active"));
    return all.filter((a) => {
      const targets = a.targetIds as string[];
      return targets.includes(scholarId) || a.targetType === "all";
    });
  },

  // Attempts
  async getAllAttempts(): Promise<AcapAttempt[]> {
    return db.select().from(acapAttempts).orderBy(desc(acapAttempts.startedAt));
  },
  async getAttempts(scholarId: string, assessmentId?: number): Promise<AcapAttempt[]> {
    const conditions: any[] = [eq(acapAttempts.scholarId, scholarId)];
    if (assessmentId) conditions.push(eq(acapAttempts.assessmentId, assessmentId));
    return db.select().from(acapAttempts).where(and(...conditions)).orderBy(desc(acapAttempts.startedAt));
  },
  async getAttempt(id: number): Promise<AcapAttempt | undefined> {
    const [a] = await db.select().from(acapAttempts).where(eq(acapAttempts.id, id));
    return a;
  },
  async createAttempt(data: InsertAcapAttempt): Promise<AcapAttempt> {
    const [a] = await db.insert(acapAttempts).values(data).returning();
    return a;
  },
  async updateAttempt(id: number, data: Partial<AcapAttempt>): Promise<AcapAttempt> {
    const [a] = await db.update(acapAttempts).set(data).where(eq(acapAttempts.id, id)).returning();
    return a;
  },
  async getAttemptsByAssessment(assessmentId: number): Promise<AcapAttempt[]> {
    return db.select().from(acapAttempts).where(eq(acapAttempts.assessmentId, assessmentId));
  },

  // Item Responses
  async getItemResponses(attemptId: number): Promise<AcapItemResponse[]> {
    return db.select().from(acapItemResponses).where(eq(acapItemResponses.attemptId, attemptId)).orderBy(acapItemResponses.sequenceNumber);
  },
  async createItemResponse(data: InsertAcapItemResponse): Promise<AcapItemResponse> {
    const [r] = await db.insert(acapItemResponses).values(data).returning();
    return r;
  },

  // Mastery Tracking
  async getMastery(scholarId: string): Promise<AcapMasteryTracking[]> {
    return db.select().from(acapMasteryTracking).where(eq(acapMasteryTracking.scholarId, scholarId));
  },
  async getMasteryForStandard(scholarId: string, standardId: number): Promise<AcapMasteryTracking | undefined> {
    const [m] = await db.select().from(acapMasteryTracking).where(
      and(eq(acapMasteryTracking.scholarId, scholarId), eq(acapMasteryTracking.standardId, standardId))
    );
    return m;
  },
  async upsertMastery(data: InsertAcapMasteryTracking): Promise<AcapMasteryTracking> {
    const existing = await this.getMasteryForStandard(data.scholarId, data.standardId);
    if (existing) {
      const [m] = await db.update(acapMasteryTracking).set({
        ...data,
        attemptsCount: (existing.attemptsCount || 0) + 1,
        updatedAt: new Date(),
      }).where(eq(acapMasteryTracking.id, existing.id)).returning();
      return m;
    }
    const [m] = await db.insert(acapMasteryTracking).values(data).returning();
    return m;
  },

  // Growth Snapshots
  async getGrowthSnapshots(scholarId: string): Promise<AcapGrowthSnapshot[]> {
    return db.select().from(acapGrowthSnapshots).where(eq(acapGrowthSnapshots.scholarId, scholarId)).orderBy(desc(acapGrowthSnapshots.createdAt));
  },
  async createGrowthSnapshot(data: InsertAcapGrowthSnapshot): Promise<AcapGrowthSnapshot> {
    const [g] = await db.insert(acapGrowthSnapshots).values(data).returning();
    return g;
  },

  // Bootcamp Sessions
  async getBootcampSessions(scholarId: string): Promise<AcapBootcampSession[]> {
    return db.select().from(acapBootcampSessions).where(eq(acapBootcampSessions.scholarId, scholarId)).orderBy(desc(acapBootcampSessions.startedAt));
  },
  async getBootcampSession(id: number): Promise<AcapBootcampSession | undefined> {
    const [s] = await db.select().from(acapBootcampSessions).where(eq(acapBootcampSessions.id, id));
    return s;
  },
  async createBootcampSession(data: InsertAcapBootcampSession): Promise<AcapBootcampSession> {
    const [s] = await db.insert(acapBootcampSessions).values(data).returning();
    return s;
  },
  async updateBootcampSession(id: number, data: Partial<AcapBootcampSession>): Promise<AcapBootcampSession> {
    const [s] = await db.update(acapBootcampSessions).set(data).where(eq(acapBootcampSessions.id, id)).returning();
    return s;
  },
  async getActiveBootcampSession(scholarId: string, standardId: number): Promise<AcapBootcampSession | undefined> {
    const [s] = await db.select().from(acapBootcampSessions).where(
      and(eq(acapBootcampSessions.scholarId, scholarId), eq(acapBootcampSessions.standardId, standardId), eq(acapBootcampSessions.status, "active"))
    );
    return s;
  },

  // Audit Log
  async createAuditEntry(data: InsertAcapAuditLog): Promise<AcapAuditLog> {
    const [a] = await db.insert(acapAuditLog).values(data).returning();
    return a;
  },
  async getAuditLog(limit: number = 100): Promise<AcapAuditLog[]> {
    return db.select().from(acapAuditLog).orderBy(desc(acapAuditLog.createdAt)).limit(limit);
  },

  // Dashboard Stats
  async getTeacherDashboardStats(teacherId: string) {
    const assignments = await this.getAssignments(teacherId);
    const assessments = await db.select().from(acapAssessments).where(eq(acapAssessments.createdBy, teacherId));
    const items = await db.select().from(acapItems);
    const standards = await db.select().from(acapStandards).where(eq(acapStandards.isActive, true));
    return {
      totalAssignments: assignments.length,
      activeAssignments: assignments.filter((a) => a.status === "active").length,
      totalAssessments: assessments.length,
      totalItems: items.length,
      approvedItems: items.filter((i) => i.reviewStatus === "approved").length,
      pendingItems: items.filter((i) => i.reviewStatus === "pending").length,
      totalStandards: standards.length,
    };
  },

  async getAllMastery(): Promise<AcapMasteryTracking[]> {
    return db.select().from(acapMasteryTracking);
  },

  async getScholarDashboardStats(scholarId: string) {
    const mastery = await this.getMastery(scholarId);
    const attempts = await this.getAttempts(scholarId);
    const growth = await this.getGrowthSnapshots(scholarId);
    const sessions = await this.getBootcampSessions(scholarId);
    const masteredCount = mastery.filter((m) => m.masteryLevel === "mastered").length;
    const totalStandards = mastery.length || 1;
    return {
      masteryProgress: Math.round((masteredCount / totalStandards) * 100),
      totalAttempts: attempts.length,
      completedAttempts: attempts.filter((a) => a.status === "completed").length,
      averageScore: attempts.filter((a) => a.percentCorrect != null).reduce((sum, a) => sum + (a.percentCorrect || 0), 0) / (attempts.filter((a) => a.percentCorrect != null).length || 1),
      growthSnapshots: growth.length,
      bootcampSessions: sessions.length,
      masteryLevels: mastery,
    };
  },

  // Projection Runs
  async getProjectionRuns(): Promise<AcapProjectionRun[]> {
    return db.select().from(acapProjectionRuns).orderBy(desc(acapProjectionRuns.createdAt));
  },
  async getProjectionRun(id: number): Promise<AcapProjectionRun | undefined> {
    const [r] = await db.select().from(acapProjectionRuns).where(eq(acapProjectionRuns.id, id));
    return r;
  },
  async createProjectionRun(data: InsertAcapProjectionRun): Promise<AcapProjectionRun> {
    const [r] = await db.insert(acapProjectionRuns).values(data).returning();
    return r;
  },
  async updateProjectionRun(id: number, data: Partial<InsertAcapProjectionRun>): Promise<AcapProjectionRun> {
    const [r] = await db.update(acapProjectionRuns).set(data).where(eq(acapProjectionRuns.id, id)).returning();
    return r;
  },

  // Projection Snapshots
  async getProjectionSnapshots(runId: number): Promise<AcapProjectionSnapshot[]> {
    return db.select().from(acapProjectionSnapshots).where(eq(acapProjectionSnapshots.projectionRunId, runId)).orderBy(desc(acapProjectionSnapshots.createdAt));
  },
  async createProjectionSnapshot(data: InsertAcapProjectionSnapshot): Promise<AcapProjectionSnapshot> {
    const [s] = await db.insert(acapProjectionSnapshots).values(data).returning();
    return s;
  },

  // Schoolwide Assessments
  async getSchoolwideAssessments(): Promise<AcapSchoolwideAssessment[]> {
    return db.select().from(acapSchoolwideAssessments).orderBy(desc(acapSchoolwideAssessments.createdAt));
  },
  async getSchoolwideAssessment(id: number): Promise<AcapSchoolwideAssessment | undefined> {
    const [a] = await db.select().from(acapSchoolwideAssessments).where(eq(acapSchoolwideAssessments.id, id));
    return a;
  },
  async createSchoolwideAssessment(data: InsertAcapSchoolwideAssessment): Promise<AcapSchoolwideAssessment> {
    const [a] = await db.insert(acapSchoolwideAssessments).values(data).returning();
    return a;
  },
  async updateSchoolwideAssessment(id: number, data: Partial<InsertAcapSchoolwideAssessment>): Promise<AcapSchoolwideAssessment> {
    const [a] = await db.update(acapSchoolwideAssessments).set(data).where(eq(acapSchoolwideAssessments.id, id)).returning();
    return a;
  },

  // Schoolwide Results
  async getSchoolwideResults(assessmentId: number): Promise<AcapSchoolwideResult[]> {
    return db.select().from(acapSchoolwideResults).where(eq(acapSchoolwideResults.assessmentId, assessmentId)).orderBy(desc(acapSchoolwideResults.createdAt));
  },
  async createSchoolwideResult(data: InsertAcapSchoolwideResult): Promise<AcapSchoolwideResult> {
    const [r] = await db.insert(acapSchoolwideResults).values(data).returning();
    return r;
  },

  // Impact Simulator
  async getImpactRuns(): Promise<AcapImpactRun[]> {
    return db.select().from(acapImpactRuns).orderBy(desc(acapImpactRuns.createdAt));
  },
  async getImpactRun(id: number): Promise<AcapImpactRun | undefined> {
    const [r] = await db.select().from(acapImpactRuns).where(eq(acapImpactRuns.id, id));
    return r;
  },
  async createImpactRun(data: InsertAcapImpactRun): Promise<AcapImpactRun> {
    const [r] = await db.insert(acapImpactRuns).values(data).returning();
    return r;
  },
  async getImpactLevers(runId: number): Promise<AcapImpactLever[]> {
    return db.select().from(acapImpactLevers).where(eq(acapImpactLevers.runId, runId)).orderBy(desc(acapImpactLevers.estimatedPointGain));
  },
  async createImpactLever(data: InsertAcapImpactLever): Promise<AcapImpactLever> {
    const [l] = await db.insert(acapImpactLevers).values(data).returning();
    return l;
  },

  // Genome Traits
  async getGenomeTraits(scholarId: string, subject?: string): Promise<AcapGenomeTrait[]> {
    if (subject) {
      return db.select().from(acapGenomeTraits).where(and(eq(acapGenomeTraits.scholarId, scholarId), eq(acapGenomeTraits.subject, subject)));
    }
    return db.select().from(acapGenomeTraits).where(eq(acapGenomeTraits.scholarId, scholarId));
  },
  async upsertGenomeTrait(data: InsertAcapGenomeTrait): Promise<AcapGenomeTrait> {
    const existing = await db.select().from(acapGenomeTraits).where(and(
      eq(acapGenomeTraits.scholarId, data.scholarId),
      eq(acapGenomeTraits.traitKey, data.traitKey),
      eq(acapGenomeTraits.subject, data.subject)
    ));
    if (existing.length > 0) {
      const [u] = await db.update(acapGenomeTraits).set({ ...data, updatedAt: new Date() }).where(eq(acapGenomeTraits.id, existing[0].id)).returning();
      return u;
    }
    const [t] = await db.insert(acapGenomeTraits).values(data).returning();
    return t;
  },

  // Genome Events
  async getGenomeEvents(scholarId: string): Promise<AcapGenomeEvent[]> {
    return db.select().from(acapGenomeEvents).where(eq(acapGenomeEvents.scholarId, scholarId)).orderBy(desc(acapGenomeEvents.createdAt));
  },
  async createGenomeEvent(data: InsertAcapGenomeEvent): Promise<AcapGenomeEvent> {
    const [e] = await db.insert(acapGenomeEvents).values(data).returning();
    return e;
  },

  // Genome Recommendations
  async getGenomeRecommendations(scholarId: string, subject?: string): Promise<AcapGenomeRecommendation[]> {
    if (subject) {
      return db.select().from(acapGenomeRecommendations).where(and(
        eq(acapGenomeRecommendations.scholarId, scholarId),
        eq(acapGenomeRecommendations.subject, subject),
        eq(acapGenomeRecommendations.isActive, true)
      )).orderBy(acapGenomeRecommendations.priority);
    }
    return db.select().from(acapGenomeRecommendations).where(and(
      eq(acapGenomeRecommendations.scholarId, scholarId),
      eq(acapGenomeRecommendations.isActive, true)
    )).orderBy(acapGenomeRecommendations.priority);
  },
  async createGenomeRecommendation(data: InsertAcapGenomeRecommendation): Promise<AcapGenomeRecommendation> {
    const [r] = await db.insert(acapGenomeRecommendations).values(data).returning();
    return r;
  },
  async clearGenomeRecommendations(scholarId: string, subject: string): Promise<void> {
    await db.update(acapGenomeRecommendations).set({ isActive: false }).where(and(
      eq(acapGenomeRecommendations.scholarId, scholarId),
      eq(acapGenomeRecommendations.subject, subject)
    ));
  },

  async getTutorAdaptation(scholarId: string, subject: string): Promise<AcapTutorAdaptation | undefined> {
    const [a] = await db.select().from(acapTutorAdaptations).where(and(
      eq(acapTutorAdaptations.scholarId, scholarId),
      eq(acapTutorAdaptations.subject, subject)
    ));
    return a;
  },
  async upsertTutorAdaptation(data: InsertAcapTutorAdaptation): Promise<AcapTutorAdaptation> {
    const existing = await db.select().from(acapTutorAdaptations).where(and(
      eq(acapTutorAdaptations.scholarId, data.scholarId),
      eq(acapTutorAdaptations.subject, data.subject)
    ));
    if (existing.length > 0) {
      const [u] = await db.update(acapTutorAdaptations).set({ ...data, updatedAt: new Date() }).where(eq(acapTutorAdaptations.id, existing[0].id)).returning();
      return u;
    }
    const [a] = await db.insert(acapTutorAdaptations).values(data).returning();
    return a;
  },

  async getAccessCodes(teacherId?: string): Promise<AcapAccessCode[]> {
    if (teacherId) {
      return db.select().from(acapAccessCodes).where(eq(acapAccessCodes.teacherId, teacherId)).orderBy(desc(acapAccessCodes.createdAt));
    }
    return db.select().from(acapAccessCodes).orderBy(desc(acapAccessCodes.createdAt));
  },
  async getAccessCodeByCode(code: string): Promise<AcapAccessCode | undefined> {
    const [c] = await db.select().from(acapAccessCodes).where(eq(acapAccessCodes.code, code));
    return c;
  },
  async createAccessCode(data: InsertAcapAccessCode): Promise<AcapAccessCode> {
    const [c] = await db.insert(acapAccessCodes).values(data).returning();
    return c;
  },
  async deactivateAccessCode(id: number): Promise<AcapAccessCode> {
    const [c] = await db.update(acapAccessCodes).set({ isActive: false }).where(eq(acapAccessCodes.id, id)).returning();
    return c;
  },
};
