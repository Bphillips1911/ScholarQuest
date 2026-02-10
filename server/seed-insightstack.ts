import { db } from "./db";
import {
  scholars, acapStandards,
  insightAssessmentWindows, insightStudentResults, insightStandardMastery
} from "@shared/schema";
import { eq, count } from "drizzle-orm";

function getBand(scaledPercent: number): string {
  if (scaledPercent >= 70) return "PRO";
  if (scaledPercent >= 50) return "ON";
  if (scaledPercent >= 30) return "DEV";
  return "HR";
}

function rand(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function biasedBaseline(): number {
  const r = Math.random();
  if (r < 0.3) return rand(15, 35);
  if (r < 0.7) return rand(30, 55);
  return rand(50, 85);
}

function masteryFromScore(score: number): string {
  if (score >= 85) return "mastered";
  if (score >= 70) return "proficient";
  if (score >= 50) return "developing";
  if (score >= 25) return "beginning";
  return "not_started";
}

export async function seedInsightStack(): Promise<void> {
  console.log("INSIGHT SEED: Checking InsightStack data...");

  try {
    const [windowCount] = await db.select({ c: count() }).from(insightAssessmentWindows);
    const [resultCount] = await db.select({ c: count() }).from(insightStudentResults);
    const [masteryCount] = await db.select({ c: count() }).from(insightStandardMastery);

    console.log(`INSIGHT SEED: Current counts - Windows: ${windowCount.c}, Results: ${resultCount.c}, Mastery: ${masteryCount.c}`);

    if (windowCount.c >= 3 && resultCount.c > 0 && masteryCount.c > 0) {
      console.log("INSIGHT SEED: Data already present. Skipping seed.");
      return;
    }

    const allScholars = await db.select({
      id: scholars.id,
      name: scholars.name,
      grade: scholars.grade,
    }).from(scholars);

    if (allScholars.length === 0) {
      console.log("INSIGHT SEED: No scholars found. Skipping seed.");
      return;
    }

    console.log(`INSIGHT SEED: Found ${allScholars.length} scholars.`);

    let baselineWindowId: number;
    let midpointWindowId: number;
    let finalWindowId: number;

    if (windowCount.c < 3) {
      console.log("INSIGHT SEED: Creating assessment windows...");

      const inserted = await db.insert(insightAssessmentWindows).values([
        {
          name: "Baseline",
          orderIndex: 1,
          startDate: new Date("2025-08-15"),
          endDate: new Date("2025-09-15"),
          isActive: false,
        },
        {
          name: "Midpoint",
          orderIndex: 2,
          startDate: new Date("2025-12-01"),
          endDate: new Date("2026-01-15"),
          isActive: true,
        },
        {
          name: "Final",
          orderIndex: 3,
          startDate: new Date("2026-04-15"),
          endDate: new Date("2026-05-15"),
          isActive: false,
        },
      ]).returning({ id: insightAssessmentWindows.id });

      baselineWindowId = inserted[0].id;
      midpointWindowId = inserted[1].id;
      finalWindowId = inserted[2].id;
      console.log(`INSIGHT SEED: Created 3 assessment windows (IDs: ${baselineWindowId}, ${midpointWindowId}, ${finalWindowId})`);
    } else {
      const windows = await db.select({
        id: insightAssessmentWindows.id,
        orderIndex: insightAssessmentWindows.orderIndex,
      }).from(insightAssessmentWindows);
      const sorted = windows.sort((a, b) => a.orderIndex - b.orderIndex);
      baselineWindowId = sorted[0].id;
      midpointWindowId = sorted[1].id;
      finalWindowId = sorted[2].id;
      console.log("INSIGHT SEED: Using existing assessment windows.");
    }

    const allStandards = await db.select({
      id: acapStandards.id,
      code: acapStandards.code,
      gradeLevel: acapStandards.gradeLevel,
      domain: acapStandards.domain,
    }).from(acapStandards).where(eq(acapStandards.isActive, true));

    console.log(`INSIGHT SEED: Found ${allStandards.length} active standards.`);

    const standardsByGrade: Record<number, typeof allStandards> = { 6: [], 7: [], 8: [] };
    for (const s of allStandards) {
      if (standardsByGrade[s.gradeLevel]) {
        standardsByGrade[s.gradeLevel].push(s);
      }
    }

    if (resultCount.c === 0) {
      console.log("INSIGHT SEED: Generating student results...");

      const resultRows: Array<{
        scholarId: string;
        windowId: number;
        subject: string;
        score: number;
        maxScore: number;
        scaledPercent: number;
        band: string;
        timeOnTaskMinutes: number;
        completedAt: Date;
        metadata: Record<string, any>;
      }> = [];

      const subjects = ["ELA", "Math"];
      const maxScore = 100;

      for (const scholar of allScholars) {
        for (const subject of subjects) {
          const baselineScore = biasedBaseline();
          const growth = rand(-5, 25);
          const midpointScore = Math.min(100, Math.max(0, baselineScore + growth));

          resultRows.push({
            scholarId: scholar.id,
            windowId: baselineWindowId,
            subject,
            score: baselineScore,
            maxScore,
            scaledPercent: baselineScore,
            band: getBand(baselineScore),
            timeOnTaskMinutes: rand(30, 60),
            completedAt: new Date("2025-09-10"),
            metadata: { source: "seed", generatedAt: new Date().toISOString() },
          });

          resultRows.push({
            scholarId: scholar.id,
            windowId: midpointWindowId,
            subject,
            score: midpointScore,
            maxScore,
            scaledPercent: midpointScore,
            band: getBand(midpointScore),
            timeOnTaskMinutes: rand(30, 60),
            completedAt: new Date("2026-01-10"),
            metadata: { source: "seed", generatedAt: new Date().toISOString() },
          });
        }
      }

      const batchSize = 100;
      for (let i = 0; i < resultRows.length; i += batchSize) {
        const batch = resultRows.slice(i, i + batchSize);
        await db.insert(insightStudentResults).values(batch);
      }

      console.log(`INSIGHT SEED: Inserted ${resultRows.length} student results.`);
    } else {
      console.log("INSIGHT SEED: Student results already exist. Skipping.");
    }

    if (masteryCount.c === 0) {
      console.log("INSIGHT SEED: Generating standard mastery records...");

      const masteryRows: Array<{
        scholarId: string;
        standardId: number;
        windowId: number;
        subject: string;
        masteryLevel: string;
        masteryScore: number;
      }> = [];

      for (const scholar of allScholars) {
        const gradeStandards = standardsByGrade[scholar.grade] || [];
        if (gradeStandards.length === 0) continue;

        const numStandards = rand(5, Math.min(10, gradeStandards.length));
        const shuffled = [...gradeStandards].sort(() => Math.random() - 0.5);
        const selected = shuffled.slice(0, numStandards);

        for (const std of selected) {
          const baseScore = rand(10, 80);
          const midGrowth = rand(0, 25);
          const midScore = Math.min(100, baseScore + midGrowth);

          masteryRows.push({
            scholarId: scholar.id,
            standardId: std.id,
            windowId: baselineWindowId,
            subject: std.domain === "Math" ? "Math" : "ELA",
            masteryLevel: masteryFromScore(baseScore),
            masteryScore: baseScore,
          });

          masteryRows.push({
            scholarId: scholar.id,
            standardId: std.id,
            windowId: midpointWindowId,
            subject: std.domain === "Math" ? "Math" : "ELA",
            masteryLevel: masteryFromScore(midScore),
            masteryScore: midScore,
          });
        }
      }

      const batchSize = 100;
      for (let i = 0; i < masteryRows.length; i += batchSize) {
        const batch = masteryRows.slice(i, i + batchSize);
        await db.insert(insightStandardMastery).values(batch);
      }

      console.log(`INSIGHT SEED: Inserted ${masteryRows.length} standard mastery records.`);
    } else {
      console.log("INSIGHT SEED: Standard mastery records already exist. Skipping.");
    }

    const [finalWindows] = await db.select({ c: count() }).from(insightAssessmentWindows);
    const [finalResults] = await db.select({ c: count() }).from(insightStudentResults);
    const [finalMastery] = await db.select({ c: count() }).from(insightStandardMastery);
    console.log(`INSIGHT SEED: Final counts - Windows: ${finalWindows.c}, Results: ${finalResults.c}, Mastery: ${finalMastery.c}`);
    console.log("INSIGHT SEED: Complete.");
  } catch (error: any) {
    console.error("INSIGHT SEED: Error during seeding:", error.message);
  }
}
