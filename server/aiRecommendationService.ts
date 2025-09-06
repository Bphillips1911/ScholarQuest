import OpenAI from 'openai';
import { db } from './db';
import { 
  scholars, 
  pbisEntries, 
  reflections,
  aiRecommendations,
  gamifiedProgress,
  type AIRecommendation,
  type Scholar,
  type PbisEntry
} from '@shared/schema';
import { eq, desc, gte, and } from 'drizzle-orm';

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export class AIRecommendationService {
  // Generate personalized recommendations for a student
  async generateRecommendations(studentId: string): Promise<AIRecommendation[]> {
    try {
      console.log(`AI RECOMMENDATIONS: Generating for student ${studentId}`);
      
      // Get student data
      const student = await db.select().from(scholars).where(eq(scholars.id, studentId)).then(rows => rows[0]);
      if (!student) {
        throw new Error('Student not found');
      }

      // Get recent PBIS entries (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const recentPbisEntries = await db.select().from(pbisEntries)
        .where(and(
          eq(pbisEntries.scholarId, studentId),
          gte(pbisEntries.createdAt, thirtyDaysAgo)
        ))
        .orderBy(desc(pbisEntries.createdAt))
        .limit(20);

      // Get recent reflections
      const recentReflections = await db.select().from(reflections)
        .where(and(
          eq(reflections.scholarId, studentId),
          gte(reflections.assignedAt, thirtyDaysAgo)
        ))
        .orderBy(desc(reflections.assignedAt))
        .limit(10);

      // Get current gamified progress (handle missing table gracefully)
      let currentProgress = [];
      try {
        currentProgress = await db.select().from(gamifiedProgress)
          .where(eq(gamifiedProgress.studentId, studentId));
      } catch (error) {
        console.log('Gamified progress table not available, using empty progress data');
        currentProgress = [];
      }

      // Analyze patterns and generate AI recommendations
      const analysisPrompt = this.buildAnalysisPrompt(student, recentPbisEntries, recentReflections, currentProgress);
      
      const response = await openai.chat.completions.create({
        model: "gpt-5",
        messages: [
          {
            role: "system",
            content: "You are an expert educational AI assistant specializing in middle school student development and PBIS (Positive Behavioral Interventions and Supports). Analyze student data and provide actionable, personalized recommendations for academic, behavioral, and social-emotional growth. Respond with JSON format."
          },
          {
            role: "user",
            content: analysisPrompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
      });

      const recommendations = JSON.parse(response.choices[0].message.content || '{"recommendations": []}');
      
      // Store recommendations in database
      const storedRecommendations: AIRecommendation[] = [];
      
      for (const rec of recommendations.recommendations) {
        const stored = await db.insert(aiRecommendations).values({
          studentId,
          recommendationType: rec.type || 'learning_activity',
          priority: rec.priority || 'medium',
          title: rec.title,
          description: rec.description,
          actionItems: rec.actionItems || [],
          targetSkills: rec.targetSkills || [],
          estimatedDuration: rec.estimatedDuration || 30,
          confidence: rec.confidence || 85,
          aiReasoning: rec.reasoning || '',
          status: 'pending'
        }).returning();
        
        storedRecommendations.push(stored[0]);
      }

      console.log(`AI RECOMMENDATIONS: Generated ${storedRecommendations.length} recommendations for student ${studentId}`);
      return storedRecommendations;

    } catch (error) {
      console.error('AI Recommendation Error:', error);
      throw error;
    }
  }

  // Build comprehensive analysis prompt for AI
  private buildAnalysisPrompt(
    student: Scholar,
    pbisEntries: PbisEntry[],
    reflections: any[],
    progress: any[]
  ): string {
    const totalPoints = student.academicPoints + student.attendancePoints + student.behaviorPoints;
    const positiveEntries = pbisEntries.filter(entry => entry.points > 0);
    const negativeEntries = pbisEntries.filter(entry => entry.points < 0);
    
    // Analyze MUSTANG trait patterns
    const traitCounts = pbisEntries.reduce((acc, entry) => {
      acc[entry.mustangTrait] = (acc[entry.mustangTrait] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const strongestTraits = Object.entries(traitCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([trait]) => trait);

    const improvementAreas = Object.entries(traitCounts)
      .sort(([,a], [,b]) => a - b)
      .slice(0, 2)
      .map(([trait]) => trait);

    return `
Analyze this middle school student and provide 3-5 personalized recommendations in JSON format:

Student Profile:
- Name: ${student.name}
- Grade: ${student.grade}
- House: ${student.houseId}
- Total Points: ${totalPoints} (Academic: ${student.academicPoints}, Behavior: ${student.behaviorPoints}, Attendance: ${student.attendancePoints})

Recent Activity (Last 30 Days):
- Positive PBIS Entries: ${positiveEntries.length}
- Negative PBIS Entries: ${negativeEntries.length}
- Behavioral Reflections: ${reflections.length}

MUSTANG Trait Analysis:
- Strongest Traits: ${strongestTraits.join(', ')}
- Improvement Areas: ${improvementAreas.join(', ')}

Recent PBIS Entries:
${pbisEntries.slice(0, 10).map(entry => 
  `- ${entry.points > 0 ? '+' : ''}${entry.points} points: ${entry.reason} (${entry.mustangTrait})`
).join('\n')}

Current Gamified Progress:
${progress.length > 0 ? progress.map(p => 
  `- ${p.skillName}: Level ${p.currentLevel} (${p.currentXP}/${p.nextLevelXP} XP, ${p.streakDays} day streak)`
).join('\n') : '- No gamified progress data available yet'}

Provide recommendations in this JSON format:
{
  "recommendations": [
    {
      "type": "learning_activity|intervention|enrichment|behavioral_support",
      "priority": "low|medium|high|urgent",
      "title": "Brief title",
      "description": "Detailed description",
      "actionItems": ["Action 1", "Action 2"],
      "targetSkills": ["Skill 1", "Skill 2"],
      "estimatedDuration": 30,
      "confidence": 85,
      "reasoning": "Why this recommendation makes sense"
    }
  ]
}

Focus on:
1. Specific, actionable interventions based on data patterns
2. Age-appropriate activities for grade ${student.grade}
3. Building on strongest traits while addressing improvement areas
4. Personalized learning paths that increase engagement
5. PBIS-aligned behavioral support strategies
`;
  }

  // Get all pending recommendations for a student
  async getStudentRecommendations(studentId: string): Promise<AIRecommendation[]> {
    return await db.select().from(aiRecommendations)
      .where(eq(aiRecommendations.studentId, studentId))
      .orderBy(desc(aiRecommendations.createdAt));
  }

  // Update recommendation status
  async updateRecommendationStatus(
    recommendationId: string, 
    status: string, 
    teacherId?: string,
    effectivenessRating?: number
  ): Promise<void> {
    const updateData: any = { status };
    
    if (teacherId) {
      updateData.implementedBy = teacherId;
      updateData.implementedAt = new Date();
    }
    
    if (effectivenessRating) {
      updateData.effectivenessRating = effectivenessRating;
    }

    await db.update(aiRecommendations)
      .set(updateData)
      .where(eq(aiRecommendations.id, recommendationId));
  }

  // Get recommendations by priority
  async getRecommendationsByPriority(priority: 'urgent' | 'high' | 'medium' | 'low'): Promise<AIRecommendation[]> {
    return await db.select().from(aiRecommendations)
      .where(and(
        eq(aiRecommendations.priority, priority),
        eq(aiRecommendations.status, 'pending')
      ))
      .orderBy(desc(aiRecommendations.createdAt));
  }

  // Generate class-wide recommendations for teachers
  async generateClassRecommendations(teacherId: string, gradeLevel: number): Promise<any> {
    try {
      // Get all students for this teacher's grade
      const students = await db.select().from(scholars)
        .where(eq(scholars.grade, gradeLevel))
        .limit(30); // Reasonable limit for analysis

      const classAnalysis = {
        totalStudents: students.length,
        highPerformers: students.filter(s => (s.academicPoints + s.behaviorPoints + s.attendancePoints) > 50).length,
        needsSupport: students.filter(s => (s.academicPoints + s.behaviorPoints + s.attendancePoints) < 20).length,
        recommendations: []
      };

      // Generate AI analysis for class trends
      const classPrompt = `
Analyze this Grade ${gradeLevel} class and provide teaching recommendations:

Class Overview:
- Total Students: ${classAnalysis.totalStudents}
- High Performers: ${classAnalysis.highPerformers}
- Students Needing Support: ${classAnalysis.needsSupport}

Provide class-wide teaching strategies and interventions in JSON format focusing on:
1. Engagement strategies for this grade level
2. Behavioral management techniques
3. Academic enrichment opportunities
4. Support interventions for struggling students
5. House competition ideas

Response format:
{
  "classRecommendations": [
    {
      "category": "engagement|behavior|academic|intervention",
      "title": "Strategy title",
      "description": "Detailed implementation guide",
      "targetGroup": "all|high_performers|struggling|specific",
      "estimatedImpact": "high|medium|low"
    }
  ]
}
`;

      const response = await openai.chat.completions.create({
        model: "gpt-5",
        messages: [
          {
            role: "system",
            content: "You are an expert middle school educator and instructional coach. Provide evidence-based teaching strategies and classroom management techniques."
          },
          {
            role: "user",
            content: classPrompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.6,
      });

      const aiRecommendations = JSON.parse(response.choices[0].message.content || '{"classRecommendations": []}');
      return {
        ...classAnalysis,
        recommendations: aiRecommendations.classRecommendations
      };

    } catch (error) {
      console.error('Class Recommendations Error:', error);
      throw error;
    }
  }
}

export const aiRecommendationService = new AIRecommendationService();