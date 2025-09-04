import { db } from './db';
import { 
  teacherAuth,
  pbisEntries,
  reflections,
  parentTeacherMessages,
  teacherPerformanceMetrics,
  scholars,
  type TeacherPerformanceMetrics,
  type TeacherAuth
} from '@shared/schema';
import { eq, and, gte, lte, count, desc, sql } from 'drizzle-orm';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';

export class TeacherPerformanceService {
  // Calculate and store daily performance metrics for a teacher
  async calculateTeacherMetrics(teacherId: string, date: Date): Promise<TeacherPerformanceMetrics> {
    try {
      console.log(`TEACHER METRICS: Calculating for teacher ${teacherId} on ${format(date, 'yyyy-MM-dd')}`);
      
      const dayStart = startOfDay(date);
      const dayEnd = endOfDay(date);

      // Get teacher info
      const teacher = await db.select().from(teacherAuth).where(eq(teacherAuth.id, teacherId)).then(rows => rows[0]);
      if (!teacher) {
        throw new Error('Teacher not found');
      }

      // Calculate students managed (based on teacher's grade role)
      const gradeFilter = this.getGradeFilter(teacher.gradeRole);
      const studentsManaged = await this.getStudentsForTeacher(teacher.gradeRole);

      // Get PBIS entries for the day
      const pbisEntries = await db.select().from(pbisEntries)
        .innerJoin(scholars, eq(pbisEntries.scholarId, scholars.id))
        .where(and(
          eq(pbisEntries.teacherName, teacher.name),
          gte(pbisEntries.createdAt, dayStart),
          lte(pbisEntries.createdAt, dayEnd)
        ));

      // Calculate interaction metrics
      const positiveInteractions = pbisEntries.filter(([entry]) => entry.points > 0).length;
      const negativeInteractions = pbisEntries.filter(([entry]) => entry.points < 0).length;
      const totalPbisPoints = pbisEntries.reduce((sum, [entry]) => sum + entry.points, 0);

      // Get reflection metrics
      const reflectionsAssigned = await db.select({ count: count() })
        .from(reflections)
        .where(and(
          eq(reflections.assignedBy, teacherId),
          gte(reflections.createdAt, dayStart),
          lte(reflections.createdAt, dayEnd)
        ))
        .then(rows => rows[0].count);

      const reflectionsCompleted = await db.select({ count: count() })
        .from(reflections)
        .where(and(
          eq(reflections.assignedBy, teacherId),
          eq(reflections.status, 'approved'),
          gte(reflections.approvedAt, dayStart),
          lte(reflections.approvedAt, dayEnd)
        ))
        .then(rows => rows[0].count);

      // Get parent communication metrics
      const parentCommunications = await db.select({ count: count() })
        .from(parentTeacherMessages)
        .where(and(
          eq(parentTeacherMessages.teacherId, teacherId),
          gte(parentTeacherMessages.createdAt, dayStart),
          lte(parentTeacherMessages.createdAt, dayEnd)
        ))
        .then(rows => rows[0].count);

      // Calculate response time (average hours to respond to reflections)
      const avgResponseTime = await this.calculateAverageResponseTime(teacherId, dayStart, dayEnd);

      // Calculate engagement and effectiveness scores
      const studentEngagementScore = this.calculateEngagementScore(positiveInteractions, negativeInteractions, reflectionsCompleted);
      const effectivenessRating = this.calculateEffectivenessRating(positiveInteractions, negativeInteractions, parentCommunications, reflectionsCompleted);

      // Store metrics in database
      const metrics = await db.insert(teacherPerformanceMetrics).values({
        teacherId,
        metricDate: date,
        totalStudentsManaged: studentsManaged,
        pbisPointsAwarded: totalPbisPoints,
        positiveInteractions,
        negativeInteractions,
        parentCommunications,
        reflectionsAssigned,
        reflectionsCompleted,
        avgResponseTime,
        studentEngagementScore,
        effectivenessRating
      }).returning();

      console.log(`TEACHER METRICS: Stored metrics for teacher ${teacherId}`);
      return metrics[0];

    } catch (error) {
      console.error('Teacher Metrics Error:', error);
      throw error;
    }
  }

  // Get grade filter based on teacher role
  private getGradeFilter(gradeRole: string): number[] {
    switch (gradeRole) {
      case '6th Grade': return [6];
      case '7th Grade': return [7];
      case '8th Grade': return [8];
      case 'Unified Arts': return [6, 7, 8];
      case 'Administration': return [6, 7, 8];
      case 'Counselor': return [6, 7, 8];
      default: return [];
    }
  }

  // Get students count for teacher based on grade role
  private async getStudentsForTeacher(gradeRole: string): Promise<number> {
    const grades = this.getGradeFilter(gradeRole);
    
    if (grades.length === 0) return 0;

    const result = await db.select({ count: count() })
      .from(scholars)
      .where(
        grades.length === 1 
          ? eq(scholars.grade, grades[0])
          : sql`${scholars.grade} IN (${grades.join(',')})`
      );

    return result[0].count;
  }

  // Calculate average response time for reflections
  private async calculateAverageResponseTime(teacherId: string, dayStart: Date, dayEnd: Date): Promise<number> {
    const reflections = await db.select()
      .from(reflections)
      .where(and(
        eq(reflections.assignedBy, teacherId),
        eq(reflections.status, 'approved'),
        gte(reflections.createdAt, dayStart),
        lte(reflections.approvedAt, dayEnd)
      ));

    if (reflections.length === 0) return 0;

    const totalHours = reflections.reduce((sum, reflection) => {
      const assignedTime = reflection.createdAt.getTime();
      const approvedTime = reflection.approvedAt?.getTime() || assignedTime;
      const hours = (approvedTime - assignedTime) / (1000 * 60 * 60);
      return sum + hours;
    }, 0);

    return Math.round(totalHours / reflections.length);
  }

  // Calculate student engagement score (0-100)
  private calculateEngagementScore(positive: number, negative: number, reflectionsCompleted: number): number {
    const totalInteractions = positive + negative;
    if (totalInteractions === 0) return 50; // Neutral score for no data

    const positiveRatio = positive / totalInteractions;
    const completionBonus = reflectionsCompleted * 5; // 5 points per completed reflection
    
    const baseScore = positiveRatio * 70; // 70% based on positive interactions
    const finalScore = Math.min(100, baseScore + completionBonus + 20); // 20 point baseline
    
    return Math.round(finalScore);
  }

  // Calculate effectiveness rating (0-100)
  private calculateEffectivenessRating(positive: number, negative: number, communications: number, reflectionsCompleted: number): number {
    let score = 50; // Base score

    // Positive interactions boost
    score += Math.min(30, positive * 3);

    // Negative interactions penalty (but not too harsh)
    score -= Math.min(20, negative * 2);

    // Communication bonus
    score += Math.min(15, communications * 2);

    // Reflection completion bonus
    score += Math.min(15, reflectionsCompleted * 3);

    return Math.max(0, Math.min(100, Math.round(score)));
  }

  // Get performance metrics for heatmap visualization
  async getPerformanceHeatmapData(startDate: Date, endDate: Date): Promise<any> {
    try {
      console.log('HEATMAP: Generating teacher performance heatmap data');

      // Get all approved teachers
      const teachers = await db.select().from(teacherAuth).where(eq(teacherAuth.isApproved, true));

      // Get metrics for all teachers in date range
      const metrics = await db.select()
        .from(teacherPerformanceMetrics)
        .innerJoin(teacherAuth, eq(teacherPerformanceMetrics.teacherId, teacherAuth.id))
        .where(and(
          gte(teacherPerformanceMetrics.metricDate, startDate),
          lte(teacherPerformanceMetrics.metricDate, endDate)
        ))
        .orderBy(desc(teacherPerformanceMetrics.metricDate));

      // Organize data by teacher
      const teacherData = teachers.map(teacher => {
        const teacherMetrics = metrics.filter(([metric]) => metric.teacherId === teacher.id);
        
        const avgMetrics = this.calculateAverageMetrics(teacherMetrics.map(([metric]) => metric));
        
        return {
          id: teacher.id,
          name: teacher.name,
          gradeRole: teacher.gradeRole,
          subject: teacher.subject,
          ...avgMetrics,
          dailyMetrics: teacherMetrics.map(([metric]) => ({
            date: format(metric.metricDate, 'yyyy-MM-dd'),
            effectivenessRating: metric.effectivenessRating,
            studentEngagementScore: metric.studentEngagementScore,
            positiveInteractions: metric.positiveInteractions,
            negativeInteractions: metric.negativeInteractions,
            parentCommunications: metric.parentCommunications
          }))
        };
      });

      // Calculate school-wide averages for comparison
      const schoolAverages = this.calculateSchoolAverages(metrics.map(([metric]) => metric));

      return {
        teachers: teacherData,
        schoolAverages,
        dateRange: {
          start: format(startDate, 'yyyy-MM-dd'),
          end: format(endDate, 'yyyy-MM-dd')
        },
        summary: {
          totalTeachers: teachers.length,
          activeTeachers: teacherData.filter(t => t.totalInteractions > 0).length,
          averageEffectiveness: schoolAverages.effectivenessRating,
          totalPBISPoints: teacherData.reduce((sum, t) => sum + t.pbisPointsAwarded, 0),
          totalCommunications: teacherData.reduce((sum, t) => sum + t.parentCommunications, 0),
          averageResponseTime: schoolAverages.responseTime
        }
      };

    } catch (error) {
      console.error('Heatmap Data Error:', error);
      throw error;
    }
  }

  // Calculate average metrics for a teacher
  private calculateAverageMetrics(metrics: TeacherPerformanceMetrics[]) {
    if (metrics.length === 0) {
      return {
        avgEffectivenessRating: 0,
        avgStudentEngagementScore: 0,
        totalPositiveInteractions: 0,
        totalNegativeInteractions: 0,
        totalInteractions: 0,
        totalParentCommunications: 0,
        avgResponseTime: 0
      };
    }

    const totals = metrics.reduce((acc, metric) => ({
      effectivenessRating: acc.effectivenessRating + metric.effectivenessRating,
      studentEngagementScore: acc.studentEngagementScore + metric.studentEngagementScore,
      positiveInteractions: acc.positiveInteractions + metric.positiveInteractions,
      negativeInteractions: acc.negativeInteractions + metric.negativeInteractions,
      parentCommunications: acc.parentCommunications + metric.parentCommunications,
      responseTime: acc.responseTime + metric.avgResponseTime
    }), {
      effectivenessRating: 0,
      studentEngagementScore: 0,
      positiveInteractions: 0,
      negativeInteractions: 0,
      parentCommunications: 0,
      responseTime: 0
    });

    return {
      avgEffectivenessRating: Math.round(totals.effectivenessRating / metrics.length),
      avgStudentEngagementScore: Math.round(totals.studentEngagementScore / metrics.length),
      totalPositiveInteractions: totals.positiveInteractions,
      totalNegativeInteractions: totals.negativeInteractions,
      totalInteractions: totals.positiveInteractions + totals.negativeInteractions,
      totalParentCommunications: totals.parentCommunications,
      avgResponseTime: Math.round(totals.responseTime / metrics.length)
    };
  }

  // Calculate school-wide averages
  private calculateSchoolAverages(metrics: TeacherPerformanceMetrics[]) {
    if (metrics.length === 0) {
      return {
        effectivenessRating: 0,
        studentEngagementScore: 0,
        positiveInteractions: 0,
        negativeInteractions: 0,
        parentCommunications: 0,
        responseTime: 0
      };
    }

    const totals = metrics.reduce((acc, metric) => ({
      effectivenessRating: acc.effectivenessRating + metric.effectivenessRating,
      studentEngagementScore: acc.studentEngagementScore + metric.studentEngagementScore,
      positiveInteractions: acc.positiveInteractions + metric.positiveInteractions,
      negativeInteractions: acc.negativeInteractions + metric.negativeInteractions,
      parentCommunications: acc.parentCommunications + metric.parentCommunications,
      responseTime: acc.responseTime + metric.avgResponseTime
    }), {
      effectivenessRating: 0,
      studentEngagementScore: 0,
      positiveInteractions: 0,
      negativeInteractions: 0,
      parentCommunications: 0,
      responseTime: 0
    });

    return {
      effectivenessRating: Math.round(totals.effectivenessRating / metrics.length),
      studentEngagementScore: Math.round(totals.studentEngagementScore / metrics.length),
      positiveInteractions: Math.round(totals.positiveInteractions / metrics.length),
      negativeInteractions: Math.round(totals.negativeInteractions / metrics.length),
      parentCommunications: Math.round(totals.parentCommunications / metrics.length),
      responseTime: Math.round(totals.responseTime / metrics.length)
    };
  }

  // Calculate metrics for all teachers for a specific date
  async calculateAllTeacherMetrics(date: Date): Promise<void> {
    const teachers = await db.select().from(teacherAuth).where(eq(teacherAuth.isApproved, true));
    
    console.log(`TEACHER METRICS: Calculating for ${teachers.length} teachers on ${format(date, 'yyyy-MM-dd')}`);
    
    for (const teacher of teachers) {
      try {
        await this.calculateTeacherMetrics(teacher.id, date);
      } catch (error) {
        console.error(`Error calculating metrics for teacher ${teacher.id}:`, error);
      }
    }
  }

  // Get top performing teachers
  async getTopPerformers(metric: 'effectiveness' | 'engagement' | 'communication', limit: number = 5): Promise<any[]> {
    const orderField = metric === 'effectiveness' 
      ? teacherPerformanceMetrics.effectivenessRating
      : metric === 'engagement'
      ? teacherPerformanceMetrics.studentEngagementScore
      : teacherPerformanceMetrics.parentCommunications;

    const results = await db.select()
      .from(teacherPerformanceMetrics)
      .innerJoin(teacherAuth, eq(teacherPerformanceMetrics.teacherId, teacherAuth.id))
      .where(gte(teacherPerformanceMetrics.metricDate, subDays(new Date(), 30)))
      .orderBy(desc(orderField))
      .limit(limit);

    return results.map(([metric, teacher]) => ({
      teacherId: teacher.id,
      teacherName: teacher.name,
      gradeRole: teacher.gradeRole,
      subject: teacher.subject,
      score: metric === 'effectiveness' 
        ? metric.effectivenessRating
        : metric === 'engagement'
        ? metric.studentEngagementScore
        : metric.parentCommunications,
      date: format(metric.metricDate, 'yyyy-MM-dd')
    }));
  }
}

export const teacherPerformanceService = new TeacherPerformanceService();