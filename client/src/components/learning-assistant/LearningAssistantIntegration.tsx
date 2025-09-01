import { useEffect } from 'react';
import { useAutoTips, useCelebrationTrigger } from './LearningAssistantProvider';

interface LearningAssistantIntegrationProps {
  studentPoints: {
    academic: number;
    behavior: number;
    attendance: number;
  };
  recentActivity?: {
    type: 'points_earned' | 'reflection_completed' | 'achievement_unlocked';
    details: string;
    points?: number;
  }[];
}

export function LearningAssistantIntegration({ 
  studentPoints, 
  recentActivity = [] 
}: LearningAssistantIntegrationProps) {
  const { triggerAutoTip } = useAutoTips();
  const { triggerCelebration } = useCelebrationTrigger();

  useEffect(() => {
    const totalPoints = studentPoints.academic + studentPoints.behavior + studentPoints.attendance;
    
    // Auto-tip triggers based on point levels
    if (totalPoints < 50) {
      triggerAutoTip('low-points');
    } else if (totalPoints >= 500) {
      triggerAutoTip('house-competition');
    }

    // Context-based tips
    if (studentPoints.academic > studentPoints.behavior * 2) {
      triggerAutoTip('behavior');
    } else if (studentPoints.behavior > studentPoints.academic * 2) {
      triggerAutoTip('studying');
    }
  }, [studentPoints, triggerAutoTip]);

  useEffect(() => {
    // Process recent activities for celebrations
    recentActivity.forEach(activity => {
      switch (activity.type) {
        case 'points_earned':
          if (activity.points && activity.points >= 5) {
            triggerCelebration(activity.details, activity.points);
          }
          break;
        case 'reflection_completed':
          triggerCelebration('completing a behavioral reflection');
          break;
        case 'achievement_unlocked':
          triggerCelebration(`unlocking ${activity.details}`);
          break;
      }
    });
  }, [recentActivity, triggerCelebration]);

  // This component doesn't render anything visible
  return null;
}

// Helper hook for triggering learning assistant events
export function useLearningAssistantEvents() {
  const { triggerCelebration } = useCelebrationTrigger();
  const { triggerAutoTip } = useAutoTips();

  const celebratePointsEarned = (category: string, points: number) => {
    triggerCelebration(`earning ${points} ${category} points`, points);
  };

  const celebrateAchievement = (achievement: string) => {
    triggerCelebration(achievement);
  };

  const showContextualTip = (context: string) => {
    triggerAutoTip(context);
  };

  return {
    celebratePointsEarned,
    celebrateAchievement,
    showContextualTip
  };
}