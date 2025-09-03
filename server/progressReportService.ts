import { db } from './db';
import { 
  scholars, 
  pbisEntries,
  reflections,
  progressReports,
  houses,
  type ProgressReport,
  type Scholar,
  type PbisEntry,
  type House
} from '@shared/schema';
import { eq, and, gte, lte, desc, sql } from 'drizzle-orm';
import { format, subDays, subWeeks, subMonths } from 'date-fns';

export class ProgressReportService {
  // Generate comprehensive student progress report
  async generateStudentReport(
    studentId: string, 
    reportType: 'weekly' | 'monthly' | 'semester' | 'custom',
    teacherId: string,
    customDateRange?: { start: Date; end: Date }
  ): Promise<ProgressReport> {
    try {
      console.log(`PROGRESS REPORT: Generating ${reportType} report for student ${studentId}`);
      
      // Get student data
      const student = await db.select().from(scholars).where(eq(scholars.id, studentId)).then(rows => rows[0]);
      if (!student) {
        throw new Error('Student not found');
      }

      // Get student's house
      const house = student.houseId ? 
        await db.select().from(houses).where(eq(houses.id, student.houseId)).then(rows => rows[0]) : null;

      // Calculate date range
      const dateRange = this.calculateDateRange(reportType, customDateRange);
      
      // Get PBIS entries for the period
      const studentPbisEntries = await db.select().from(pbisEntries)
        .where(and(
          eq(pbisEntries.scholarId, studentId),
          gte(pbisEntries.createdAt, dateRange.start),
          lte(pbisEntries.createdAt, dateRange.end)
        ))
        .orderBy(desc(pbisEntries.createdAt));

      // Get behavioral reflections for the period
      const studentReflections = await db.select().from(reflections)
        .where(and(
          eq(reflections.scholarId, studentId),
          gte(reflections.assignedAt, dateRange.start),
          lte(reflections.assignedAt, dateRange.end)
        ))
        .orderBy(desc(reflections.assignedAt));

      // Calculate comprehensive analytics
      const analytics = this.calculateAnalytics(student, studentPbisEntries, studentReflections, house);
      
      // Generate recommendations
      const recommendations = this.generateRecommendations(analytics);

      // Create comprehensive report data
      const reportData = {
        student: {
          id: student.id,
          name: student.name,
          grade: student.grade,
          house: house?.name || 'Unassigned',
          houseColor: house?.color || '#gray'
        },
        period: {
          type: reportType,
          start: format(dateRange.start, 'yyyy-MM-dd'),
          end: format(dateRange.end, 'yyyy-MM-dd'),
          days: Math.ceil((dateRange.end.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24))
        },
        summary: {
          totalPbisPoints: analytics.totalPoints,
          positiveEntries: analytics.positiveEntries,
          negativeEntries: analytics.negativeEntries,
          reflectionsCompleted: analytics.reflectionsCompleted,
          attendanceRate: analytics.attendanceRate,
          improvementTrend: analytics.improvementTrend
        },
        mustangTraits: analytics.mustangTraitBreakdown,
        categoryBreakdown: analytics.categoryBreakdown,
        weeklyTrends: analytics.weeklyTrends,
        achievements: analytics.achievements,
        areasForGrowth: analytics.areasForGrowth,
        teacherNotes: analytics.teacherNotes,
        parentSummary: this.generateParentSummary(analytics),
        charts: {
          pointsOverTime: analytics.pointsOverTime,
          traitDistribution: analytics.traitDistribution,
          behaviorTrends: analytics.behaviorTrends
        }
      };

      // Calculate grades
      const academicGrade = this.calculateAcademicGrade(analytics);
      const behaviorGrade = this.calculateBehaviorGrade(analytics);

      // Store report in database
      const report = await db.insert(progressReports).values({
        studentId,
        reportType,
        generatedBy: teacherId,
        reportData,
        dateRange,
        totalPBISPoints: analytics.totalPoints,
        academicGrade,
        behaviorGrade,
        attendanceRate: analytics.attendanceRate,
        recommendedActions: recommendations
      }).returning();

      console.log(`PROGRESS REPORT: Successfully generated report ${report[0].id} for student ${studentId}`);
      return report[0];

    } catch (error) {
      console.error('Progress Report Error:', error);
      throw error;
    }
  }

  // Calculate date range based on report type
  private calculateDateRange(reportType: string, customRange?: { start: Date; end: Date }) {
    const now = new Date();
    
    if (customRange) {
      return customRange;
    }

    switch (reportType) {
      case 'weekly':
        return {
          start: subWeeks(now, 1),
          end: now
        };
      case 'monthly':
        return {
          start: subMonths(now, 1),
          end: now
        };
      case 'semester':
        return {
          start: subMonths(now, 4), // 4 months for semester
          end: now
        };
      default:
        return {
          start: subWeeks(now, 2),
          end: now
        };
    }
  }

  // Calculate comprehensive analytics
  private calculateAnalytics(student: Scholar, pbisEntries: PbisEntry[], reflections: any[], house: House | null) {
    const totalPoints = pbisEntries.reduce((sum, entry) => sum + entry.points, 0);
    const positiveEntries = pbisEntries.filter(entry => entry.points > 0).length;
    const negativeEntries = pbisEntries.filter(entry => entry.points < 0).length;
    const reflectionsCompleted = reflections.filter(r => r.status === 'approved').length;

    // MUSTANG trait breakdown
    const traitCounts = pbisEntries.reduce((acc, entry) => {
      const trait = entry.mustangTrait;
      if (!acc[trait]) {
        acc[trait] = { positive: 0, negative: 0, total: 0 };
      }
      if (entry.points > 0) {
        acc[trait].positive++;
      } else {
        acc[trait].negative++;
      }
      acc[trait].total += entry.points;
      return acc;
    }, {} as Record<string, any>);

    // Category breakdown
    const categoryBreakdown = pbisEntries.reduce((acc, entry) => {
      const category = entry.category;
      if (!acc[category]) {
        acc[category] = { count: 0, points: 0 };
      }
      acc[category].count++;
      acc[category].points += entry.points;
      return acc;
    }, {} as Record<string, any>);

    // Weekly trends (last 4 weeks)
    const weeklyTrends = this.calculateWeeklyTrends(pbisEntries);

    // Calculate improvement trend
    const recentEntries = pbisEntries.slice(0, 5);
    const olderEntries = pbisEntries.slice(-5);
    const recentAvg = recentEntries.reduce((sum, e) => sum + e.points, 0) / Math.max(recentEntries.length, 1);
    const olderAvg = olderEntries.reduce((sum, e) => sum + e.points, 0) / Math.max(olderEntries.length, 1);
    const improvementTrend = recentAvg > olderAvg ? 'improving' : recentAvg < olderAvg ? 'declining' : 'stable';

    // Identify achievements and growth areas
    const achievements = this.identifyAchievements(traitCounts, categoryBreakdown, positiveEntries);
    const areasForGrowth = this.identifyGrowthAreas(traitCounts, negativeEntries, reflections);

    return {
      totalPoints,
      positiveEntries,
      negativeEntries,
      reflectionsCompleted,
      attendanceRate: Math.max(85, 100 - (negativeEntries * 2)), // Estimate based on behavior
      improvementTrend,
      mustangTraitBreakdown: traitCounts,
      categoryBreakdown,
      weeklyTrends,
      achievements,
      areasForGrowth,
      teacherNotes: this.generateTeacherNotes(totalPoints, positiveEntries, negativeEntries),
      pointsOverTime: this.generatePointsOverTime(pbisEntries),
      traitDistribution: this.generateTraitDistribution(traitCounts),
      behaviorTrends: this.generateBehaviorTrends(pbisEntries)
    };
  }

  // Generate weekly trends
  private calculateWeeklyTrends(pbisEntries: PbisEntry[]) {
    const weeks = [];
    const now = new Date();
    
    for (let i = 3; i >= 0; i--) {
      const weekStart = subWeeks(now, i + 1);
      const weekEnd = subWeeks(now, i);
      
      const weekEntries = pbisEntries.filter(entry => 
        entry.createdAt >= weekStart && entry.createdAt < weekEnd
      );
      
      weeks.push({
        week: `Week ${4 - i}`,
        points: weekEntries.reduce((sum, e) => sum + e.points, 0),
        positive: weekEntries.filter(e => e.points > 0).length,
        negative: weekEntries.filter(e => e.points < 0).length
      });
    }
    
    return weeks;
  }

  // Identify student achievements
  private identifyAchievements(traitCounts: any, categoryBreakdown: any, positiveEntries: number) {
    const achievements = [];
    
    if (positiveEntries >= 10) {
      achievements.push('Consistent Positive Behavior - 10+ positive recognitions');
    }
    
    // Find strongest MUSTANG trait
    const strongestTrait = Object.entries(traitCounts)
      .filter(([_, data]: [string, any]) => data.positive > 0)
      .sort(([_, a]: [string, any], [__, b]: [string, any]) => b.positive - a.positive)[0];
    
    if (strongestTrait) {
      achievements.push(`${strongestTrait[0]} Excellence - Leading MUSTANG trait`);
    }
    
    // Academic achievements
    if (categoryBreakdown.academic?.points > 10) {
      achievements.push('Academic Achievement - Strong performance');
    }
    
    return achievements;
  }

  // Identify areas for growth
  private identifyGrowthAreas(traitCounts: any, negativeEntries: number, reflections: any[]) {
    const growthAreas = [];
    
    if (negativeEntries > 3) {
      growthAreas.push('Behavior Consistency - Focus on positive choices');
    }
    
    // Find weakest MUSTANG trait
    const allTraits = ['Make good choices', 'Use kind words', 'Show school pride', 'Tolerant of others', 'Aim for excellence', 'Need to be responsible', 'Give 100% everyday'];
    const weakestTrait = allTraits.find(trait => !traitCounts[trait] || traitCounts[trait].positive === 0);
    
    if (weakestTrait) {
      growthAreas.push(`${weakestTrait} Development - Opportunity for growth`);
    }
    
    if (reflections.length > 2) {
      growthAreas.push('Self-Regulation - Practice conflict resolution skills');
    }
    
    return growthAreas;
  }

  // Generate chart data for points over time
  private generatePointsOverTime(pbisEntries: PbisEntry[]) {
    const last30Days = subDays(new Date(), 30);
    const dailyPoints = {};
    
    // Initialize all days with 0
    for (let i = 0; i < 30; i++) {
      const date = format(subDays(new Date(), i), 'MM/dd');
      dailyPoints[date] = 0;
    }
    
    // Add actual points
    pbisEntries
      .filter(entry => entry.createdAt >= last30Days)
      .forEach(entry => {
        const date = format(entry.createdAt, 'MM/dd');
        dailyPoints[date] += entry.points;
      });
    
    return Object.entries(dailyPoints)
      .reverse()
      .map(([date, points]) => ({ date, points }));
  }

  // Generate trait distribution chart data
  private generateTraitDistribution(traitCounts: any) {
    return Object.entries(traitCounts).map(([trait, data]: [string, any]) => ({
      trait: trait.substring(0, 20), // Truncate for display
      positive: data.positive,
      negative: data.negative,
      total: data.total
    }));
  }

  // Generate behavior trends
  private generateBehaviorTrends(pbisEntries: PbisEntry[]) {
    const last7Days = [];
    
    for (let i = 6; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dayEntries = pbisEntries.filter(entry => 
        format(entry.createdAt, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
      );
      
      last7Days.push({
        date: format(date, 'EEE'),
        positive: dayEntries.filter(e => e.points > 0).length,
        negative: dayEntries.filter(e => e.points < 0).length
      });
    }
    
    return last7Days;
  }

  // Calculate academic grade
  private calculateAcademicGrade(analytics: any): string {
    const academicPoints = analytics.categoryBreakdown.academic?.points || 0;
    
    if (academicPoints >= 20) return 'A';
    if (academicPoints >= 15) return 'B';
    if (academicPoints >= 10) return 'C';
    if (academicPoints >= 5) return 'D';
    return 'F';
  }

  // Calculate behavior grade
  private calculateBehaviorGrade(analytics: any): string {
    const ratio = analytics.positiveEntries / Math.max(analytics.negativeEntries, 1);
    
    if (ratio >= 5) return 'A';
    if (ratio >= 3) return 'B';
    if (ratio >= 2) return 'C';
    if (ratio >= 1) return 'D';
    return 'F';
  }

  // Generate teacher notes
  private generateTeacherNotes(totalPoints: number, positiveEntries: number, negativeEntries: number): string[] {
    const notes = [];
    
    if (totalPoints > 20) {
      notes.push('Consistently demonstrates positive behavior and academic engagement');
    }
    
    if (positiveEntries > negativeEntries * 3) {
      notes.push('Shows excellent self-regulation and makes positive choices');
    }
    
    if (negativeEntries > positiveEntries) {
      notes.push('Would benefit from additional behavioral support and positive reinforcement');
    }
    
    return notes;
  }

  // Generate parent-friendly summary
  private generateParentSummary(analytics: any): string {
    const trend = analytics.improvementTrend;
    const totalPoints = analytics.totalPoints;
    
    if (trend === 'improving' && totalPoints > 10) {
      return 'Your child is showing excellent progress and positive growth in their behavior and academics. Keep up the great work at home!';
    } else if (trend === 'stable' && totalPoints > 0) {
      return 'Your child is maintaining steady progress. Consider discussing their school goals and celebrating their achievements.';
    } else if (trend === 'declining' || totalPoints < 0) {
      return 'Your child may benefit from additional support. Please consider scheduling a conference to discuss strategies for improvement.';
    } else {
      return 'Your child is developing well. Continue encouraging positive choices and academic effort.';
    }
  }

  // Generate comprehensive recommendations
  private generateRecommendations(analytics: any): string[] {
    const recommendations = [];
    
    if (analytics.positiveEntries < 5) {
      recommendations.push('Increase positive recognition and reinforcement');
    }
    
    if (analytics.negativeEntries > 5) {
      recommendations.push('Implement targeted behavioral intervention strategies');
    }
    
    if (analytics.reflectionsCompleted < analytics.negativeEntries * 0.8) {
      recommendations.push('Focus on completing behavioral reflections');
    }
    
    // Add trait-specific recommendations
    const weakestTrait = Object.entries(analytics.mustangTraitBreakdown)
      .sort(([_, a]: [string, any], [__, b]: [string, any]) => a.total - b.total)[0];
    
    if (weakestTrait) {
      recommendations.push(`Develop ${weakestTrait[0]} skills through targeted activities`);
    }
    
    return recommendations;
  }

  // Get all reports for a student
  async getStudentReports(studentId: string): Promise<ProgressReport[]> {
    return await db.select().from(progressReports)
      .where(eq(progressReports.studentId, studentId))
      .orderBy(desc(progressReports.createdAt));
  }

  // Get recent reports generated by a teacher
  async getTeacherReports(teacherId: string, limit: number = 10): Promise<ProgressReport[]> {
    return await db.select().from(progressReports)
      .where(eq(progressReports.generatedBy, teacherId))
      .orderBy(desc(progressReports.createdAt))
      .limit(limit);
  }
}

export const progressReportService = new ProgressReportService();