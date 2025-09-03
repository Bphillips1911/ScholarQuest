import { db } from './db';
import { 
  scholars,
  pbisEntries,
  achievementPlayground,
  gamifiedProgress,
  houses,
  type AchievementPlayground,
  type GamifiedProgress,
  type Scholar
} from '@shared/schema';
import { eq, and, gte, desc, count, sql } from 'drizzle-orm';
import { subDays, subWeeks, subMonths } from 'date-fns';

export class AchievementPlaygroundService {
  // Initialize student's achievement playground
  async initializeStudentPlayground(studentId: string): Promise<void> {
    try {
      console.log(`ACHIEVEMENT PLAYGROUND: Initializing for student ${studentId}`);
      
      // Get student data
      const student = await db.select().from(scholars).where(eq(scholars.id, studentId)).then(rows => rows[0]);
      if (!student) {
        throw new Error('Student not found');
      }

      // Define core achievement types
      const coreAchievements = this.getCoreAchievements();
      
      // Create initial achievements for student
      for (const achievement of coreAchievements) {
        await db.insert(achievementPlayground).values({
          studentId,
          achievementType: achievement.type,
          achievementId: achievement.id,
          title: achievement.title,
          description: achievement.description,
          iconType: achievement.iconType,
          iconColor: achievement.iconColor,
          points: achievement.points,
          level: achievement.level,
          rarity: achievement.rarity,
          requirements: achievement.requirements,
          isUnlocked: false,
          progress: 0
        }).onConflictDoNothing(); // Prevent duplicates
      }

      // Initialize gamified progress tracking
      await this.initializeGamifiedProgress(studentId);
      
      console.log(`ACHIEVEMENT PLAYGROUND: Initialized ${coreAchievements.length} achievements for student ${studentId}`);

    } catch (error) {
      console.error('Achievement Playground Init Error:', error);
      throw error;
    }
  }

  // Define core achievements available to all students
  private getCoreAchievements() {
    return [
      // MUSTANG Trait Achievements
      {
        id: 'mustang_motivated_bronze',
        type: 'badge',
        title: 'Motivated Mustang',
        description: 'Earn 5 points for "Make good choices"',
        iconType: 'star',
        iconColor: '#CD7F32',
        points: 10,
        level: 1,
        rarity: 'common',
        requirements: { trait: 'Make good choices', points: 5 }
      },
      {
        id: 'mustang_motivated_silver',
        type: 'badge',
        title: 'Super Motivated',
        description: 'Earn 15 points for "Make good choices"',
        iconType: 'star',
        iconColor: '#C0C0C0',
        points: 25,
        level: 2,
        rarity: 'rare',
        requirements: { trait: 'Make good choices', points: 15 }
      },
      {
        id: 'mustang_motivated_gold',
        type: 'trophy',
        title: 'Motivation Master',
        description: 'Earn 30 points for "Make good choices"',
        iconType: 'trophy',
        iconColor: '#FFD700',
        points: 50,
        level: 3,
        rarity: 'epic',
        requirements: { trait: 'Make good choices', points: 30 }
      },
      
      // Understanding Achievements
      {
        id: 'mustang_understanding_bronze',
        type: 'badge',
        title: 'Kind Communicator',
        description: 'Earn 5 points for "Use kind words"',
        iconType: 'medal',
        iconColor: '#CD7F32',
        points: 10,
        level: 1,
        rarity: 'common',
        requirements: { trait: 'Use kind words', points: 5 }
      },
      {
        id: 'mustang_understanding_silver',
        type: 'badge',
        title: 'Kindness Champion',
        description: 'Earn 15 points for "Use kind words"',
        iconType: 'medal',
        iconColor: '#C0C0C0',
        points: 25,
        level: 2,
        rarity: 'rare',
        requirements: { trait: 'Use kind words', points: 15 }
      },
      
      // School Pride Achievements
      {
        id: 'school_pride_bronze',
        type: 'badge',
        title: 'Proud Mustang',
        description: 'Earn 5 points for "Show school pride"',
        iconType: 'crown',
        iconColor: '#CD7F32',
        points: 10,
        level: 1,
        rarity: 'common',
        requirements: { trait: 'Show school pride', points: 5 }
      },
      
      // Milestone Achievements
      {
        id: 'first_positive',
        type: 'milestone',
        title: 'First Steps',
        description: 'Earn your first positive PBIS point',
        iconType: 'star',
        iconColor: '#4CAF50',
        points: 5,
        level: 1,
        rarity: 'common',
        requirements: { totalPositive: 1 }
      },
      {
        id: 'ten_positive',
        type: 'milestone',
        title: 'Rising Star',
        description: 'Earn 10 positive PBIS points',
        iconType: 'star',
        iconColor: '#FF9800',
        points: 20,
        level: 2,
        rarity: 'rare',
        requirements: { totalPositive: 10 }
      },
      {
        id: 'twenty_five_positive',
        type: 'milestone',
        title: 'Shining Bright',
        description: 'Earn 25 positive PBIS points',
        iconType: 'lightning',
        iconColor: '#9C27B0',
        points: 50,
        level: 3,
        rarity: 'epic',
        requirements: { totalPositive: 25 }
      },
      {
        id: 'fifty_positive',
        type: 'trophy',
        title: 'PBIS Champion',
        description: 'Earn 50 positive PBIS points',
        iconType: 'trophy',
        iconColor: '#FFD700',
        points: 100,
        level: 4,
        rarity: 'legendary',
        requirements: { totalPositive: 50 }
      },
      
      // Streak Achievements
      {
        id: 'three_day_streak',
        type: 'badge',
        title: 'Consistency Starter',
        description: 'Maintain positive behavior for 3 days',
        iconType: 'medal',
        iconColor: '#4CAF50',
        points: 15,
        level: 1,
        rarity: 'common',
        requirements: { streak: 3 }
      },
      {
        id: 'week_streak',
        type: 'badge',
        title: 'Weekly Warrior',
        description: 'Maintain positive behavior for 7 days',
        iconType: 'crown',
        iconColor: '#FF5722',
        points: 30,
        level: 2,
        rarity: 'rare',
        requirements: { streak: 7 }
      },
      {
        id: 'month_streak',
        type: 'trophy',
        title: 'Consistency Champion',
        description: 'Maintain positive behavior for 30 days',
        iconType: 'lightning',
        iconColor: '#E91E63',
        points: 100,
        level: 3,
        rarity: 'legendary',
        requirements: { streak: 30 }
      },
      
      // Special Unlocks
      {
        id: 'house_leader',
        type: 'special_unlock',
        title: 'House Leader',
        description: 'Be in the top 10% of your house',
        iconType: 'crown',
        iconColor: '#FFD700',
        points: 75,
        level: 3,
        rarity: 'epic',
        requirements: { houseRanking: 'top10' }
      },
      {
        id: 'reflection_master',
        type: 'badge',
        title: 'Self-Reflection Expert',
        description: 'Complete 5 behavioral reflections',
        iconType: 'medal',
        iconColor: '#3F51B5',
        points: 40,
        level: 2,
        rarity: 'rare',
        requirements: { reflectionsCompleted: 5 }
      }
    ];
  }

  // Initialize gamified progress tracking
  private async initializeGamifiedProgress(studentId: string): Promise<void> {
    const skillCategories = [
      {
        category: 'academic',
        skills: ['Mathematics', 'Reading', 'Science', 'Social Studies', 'Writing']
      },
      {
        category: 'behavior',
        skills: ['Self-Control', 'Respect', 'Responsibility', 'Kindness', 'Cooperation']
      },
      {
        category: 'leadership',
        skills: ['Communication', 'Problem Solving', 'Teamwork', 'Initiative', 'Mentoring']
      },
      {
        category: 'creativity',
        skills: ['Innovation', 'Artistic Expression', 'Critical Thinking', 'Imagination', 'Design']
      }
    ];

    for (const category of skillCategories) {
      for (const skill of category.skills) {
        await db.insert(gamifiedProgress).values({
          studentId,
          skillCategory: category.category,
          skillName: skill,
          currentLevel: 1,
          currentXP: 0,
          totalXP: 0,
          nextLevelXP: 100,
          streakDays: 0,
          bestStreak: 0,
          masteryLevel: 'novice',
          milestones: []
        }).onConflictDoNothing();
      }
    }
  }

  // Update student progress and check for new achievements
  async updateStudentProgress(studentId: string): Promise<any[]> {
    try {
      console.log(`ACHIEVEMENT PLAYGROUND: Updating progress for student ${studentId}`);
      
      // Get current student data
      const student = await db.select().from(scholars).where(eq(scholars.id, studentId)).then(rows => rows[0]);
      if (!student) return [];

      // Get all PBIS entries for the student
      const allPbisEntries = await db.select().from(pbisEntries)
        .where(eq(pbisEntries.scholarId, studentId))
        .orderBy(desc(pbisEntries.createdAt));

      // Calculate current stats
      const stats = this.calculateStudentStats(allPbisEntries);
      
      // Get unlocked achievements
      const unlockedAchievements = [];
      
      // Check each achievement type
      const achievements = await db.select().from(achievementPlayground)
        .where(eq(achievementPlayground.studentId, studentId));

      for (const achievement of achievements) {
        if (!achievement.isUnlocked) {
          const { unlocked, progress } = this.checkAchievementUnlock(achievement, stats);
          
          if (unlocked) {
            // Unlock the achievement
            await db.update(achievementPlayground)
              .set({
                isUnlocked: true,
                unlockedAt: new Date(),
                progress: 100
              })
              .where(eq(achievementPlayground.id, achievement.id));
            
            unlockedAchievements.push({
              ...achievement,
              isUnlocked: true,
              justUnlocked: true,
              celebrationShown: false
            });
          } else if (progress !== achievement.progress) {
            // Update progress
            await db.update(achievementPlayground)
              .set({ progress })
              .where(eq(achievementPlayground.id, achievement.id));
          }
        }
      }

      // Update gamified progress
      await this.updateGamifiedProgress(studentId, stats);
      
      console.log(`ACHIEVEMENT PLAYGROUND: Unlocked ${unlockedAchievements.length} new achievements for student ${studentId}`);
      return unlockedAchievements;

    } catch (error) {
      console.error('Achievement Progress Update Error:', error);
      throw error;
    }
  }

  // Calculate student statistics
  private calculateStudentStats(pbisEntries: any[]) {
    const positiveEntries = pbisEntries.filter(entry => entry.points > 0);
    const negativeEntries = pbisEntries.filter(entry => entry.points < 0);
    
    const totalPositive = positiveEntries.reduce((sum, entry) => sum + entry.points, 0);
    const totalNegative = Math.abs(negativeEntries.reduce((sum, entry) => sum + entry.points, 0));
    
    // Calculate trait points
    const traitPoints = {};
    pbisEntries.forEach(entry => {
      if (!traitPoints[entry.mustangTrait]) {
        traitPoints[entry.mustangTrait] = 0;
      }
      if (entry.points > 0) {
        traitPoints[entry.mustangTrait] += entry.points;
      }
    });

    // Calculate current streak
    const streak = this.calculateCurrentStreak(pbisEntries);

    return {
      totalPositive,
      totalNegative,
      totalPoints: totalPositive - totalNegative,
      positiveCount: positiveEntries.length,
      negativeCount: negativeEntries.length,
      traitPoints,
      currentStreak: streak,
      reflectionsCompleted: 0 // This would need to be calculated from reflections table
    };
  }

  // Calculate current positive streak
  private calculateCurrentStreak(pbisEntries: any[]): number {
    if (pbisEntries.length === 0) return 0;
    
    let streak = 0;
    const today = new Date();
    
    // Group entries by date
    const entriesByDate = {};
    pbisEntries.forEach(entry => {
      const date = entry.createdAt.toISOString().split('T')[0];
      if (!entriesByDate[date]) {
        entriesByDate[date] = [];
      }
      entriesByDate[date].push(entry);
    });

    // Check consecutive days with positive behavior
    for (let i = 0; i < 30; i++) { // Check last 30 days
      const date = subDays(today, i).toISOString().split('T')[0];
      const dayEntries = entriesByDate[date] || [];
      
      const hasPositive = dayEntries.some(entry => entry.points > 0);
      const hasNegative = dayEntries.some(entry => entry.points < 0);
      
      if (hasPositive && !hasNegative) {
        streak++;
      } else if (hasNegative) {
        break;
      }
      // If no entries for the day, continue the streak (neutral day)
    }
    
    return streak;
  }

  // Check if achievement should be unlocked
  private checkAchievementUnlock(achievement: any, stats: any): { unlocked: boolean; progress: number } {
    const requirements = achievement.requirements;
    
    // MUSTANG trait achievements
    if (requirements.trait && requirements.points) {
      const traitPoints = stats.traitPoints[requirements.trait] || 0;
      const progress = Math.min(100, (traitPoints / requirements.points) * 100);
      return {
        unlocked: traitPoints >= requirements.points,
        progress: Math.round(progress)
      };
    }
    
    // Total positive points achievements
    if (requirements.totalPositive) {
      const progress = Math.min(100, (stats.totalPositive / requirements.totalPositive) * 100);
      return {
        unlocked: stats.totalPositive >= requirements.totalPositive,
        progress: Math.round(progress)
      };
    }
    
    // Streak achievements
    if (requirements.streak) {
      const progress = Math.min(100, (stats.currentStreak / requirements.streak) * 100);
      return {
        unlocked: stats.currentStreak >= requirements.streak,
        progress: Math.round(progress)
      };
    }
    
    // Reflection achievements
    if (requirements.reflectionsCompleted) {
      const progress = Math.min(100, (stats.reflectionsCompleted / requirements.reflectionsCompleted) * 100);
      return {
        unlocked: stats.reflectionsCompleted >= requirements.reflectionsCompleted,
        progress: Math.round(progress)
      };
    }
    
    return { unlocked: false, progress: achievement.progress || 0 };
  }

  // Update gamified progress for skills
  private async updateGamifiedProgress(studentId: string, stats: any): Promise<void> {
    const skillProgress = await db.select().from(gamifiedProgress)
      .where(eq(gamifiedProgress.studentId, studentId));

    for (const skill of skillProgress) {
      let xpGained = 0;
      
      // Calculate XP based on category and recent activity
      switch (skill.skillCategory) {
        case 'academic':
          xpGained = Math.min(50, stats.totalPositive * 2); // Academic points give more XP
          break;
        case 'behavior':
          xpGained = Math.min(30, stats.positiveCount * 3); // Consistent positive behavior
          break;
        case 'leadership':
          xpGained = Math.min(20, stats.currentStreak * 2); // Leadership through consistency
          break;
        case 'creativity':
          xpGained = Math.min(15, stats.totalPoints > 0 ? 10 : 0); // Creative thinking in problem solving
          break;
      }

      if (xpGained > 0) {
        const newTotalXP = skill.totalXP + xpGained;
        const newCurrentXP = skill.currentXP + xpGained;
        
        // Check for level up
        let newLevel = skill.currentLevel;
        let newNextLevelXP = skill.nextLevelXP;
        let newCurrentLevelXP = newCurrentXP;
        
        while (newCurrentLevelXP >= newNextLevelXP) {
          newCurrentLevelXP -= newNextLevelXP;
          newLevel++;
          newNextLevelXP = this.calculateNextLevelXP(newLevel);
        }

        // Update mastery level
        const masteryLevel = this.calculateMasteryLevel(newLevel);
        
        await db.update(gamifiedProgress)
          .set({
            currentLevel: newLevel,
            currentXP: newCurrentLevelXP,
            totalXP: newTotalXP,
            nextLevelXP: newNextLevelXP,
            masteryLevel,
            streakDays: stats.currentStreak,
            bestStreak: Math.max(skill.bestStreak, stats.currentStreak),
            lastActivityAt: new Date(),
            updatedAt: new Date()
          })
          .where(eq(gamifiedProgress.id, skill.id));
      }
    }
  }

  // Calculate XP needed for next level
  private calculateNextLevelXP(level: number): number {
    return Math.floor(100 * Math.pow(1.2, level - 1));
  }

  // Calculate mastery level based on current level
  private calculateMasteryLevel(level: number): string {
    if (level >= 20) return 'master';
    if (level >= 15) return 'expert';
    if (level >= 8) return 'apprentice';
    return 'novice';
  }

  // Get student's achievement playground data
  async getStudentPlayground(studentId: string): Promise<any> {
    const achievements = await db.select().from(achievementPlayground)
      .where(eq(achievementPlayground.studentId, studentId))
      .orderBy(desc(achievementPlayground.level), desc(achievementPlayground.points));

    const progress = await db.select().from(gamifiedProgress)
      .where(eq(gamifiedProgress.studentId, studentId))
      .orderBy(desc(gamifiedProgress.currentLevel));

    // Calculate overall stats
    const unlockedCount = achievements.filter(a => a.isUnlocked).length;
    const totalPoints = achievements.filter(a => a.isUnlocked).reduce((sum, a) => sum + a.points, 0);
    const totalLevels = progress.reduce((sum, p) => sum + p.currentLevel, 0);

    return {
      achievements: achievements.map(a => ({
        ...a,
        canShare: a.isUnlocked && !a.celebrationShown
      })),
      gamifiedProgress: progress,
      summary: {
        unlockedAchievements: unlockedCount,
        totalAchievements: achievements.length,
        totalPoints,
        totalLevels,
        completionRate: Math.round((unlockedCount / achievements.length) * 100)
      }
    };
  }

  // Mark achievement celebration as shown
  async markCelebrationShown(achievementId: string): Promise<void> {
    await db.update(achievementPlayground)
      .set({ celebrationShown: true })
      .where(eq(achievementPlayground.id, achievementId));
  }

  // Share achievement (increment share count)
  async shareAchievement(achievementId: string): Promise<void> {
    await db.update(achievementPlayground)
      .set({ shareCount: sql`${achievementPlayground.shareCount} + 1` })
      .where(eq(achievementPlayground.id, achievementId));
  }

  // Get leaderboard for specific achievement
  async getAchievementLeaderboard(achievementId: string, limit: number = 10): Promise<any[]> {
    const results = await db.select()
      .from(achievementPlayground)
      .innerJoin(scholars, eq(achievementPlayground.studentId, scholars.id))
      .where(and(
        eq(achievementPlayground.achievementId, achievementId),
        eq(achievementPlayground.isUnlocked, true)
      ))
      .orderBy(desc(achievementPlayground.unlockedAt))
      .limit(limit);

    return results.map(([achievement, scholar]) => ({
      studentName: scholar.name,
      grade: scholar.grade,
      house: scholar.houseId,
      unlockedAt: achievement.unlockedAt,
      points: achievement.points
    }));
  }
}

export const achievementPlaygroundService = new AchievementPlaygroundService();