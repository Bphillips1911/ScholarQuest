import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { 
  Trophy, 
  Star, 
  Medal, 
  Crown, 
  Zap, 
  Target, 
  Share2, 
  Sparkles,
  TrendingUp,
  BarChart3,
  Unlock,
  Lock
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AchievementPlaygroundProps {
  studentId: string;
  className?: string;
}

const iconMap = {
  star: Star,
  trophy: Trophy,
  medal: Medal,
  crown: Crown,
  lightning: Zap,
};

const rarityColors = {
  common: 'from-gray-400 to-gray-600',
  rare: 'from-blue-400 to-blue-600',
  epic: 'from-purple-400 to-purple-600',
  legendary: 'from-yellow-400 to-yellow-600',
};

const rarityBorders = {
  common: 'border-gray-300',
  rare: 'border-blue-300',
  epic: 'border-purple-300',
  legendary: 'border-yellow-300',
};

export function AchievementPlayground({ studentId, className }: AchievementPlaygroundProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showCelebration, setShowCelebration] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get student's achievement playground data
  const { data: playgroundData, refetch } = useQuery({
    queryKey: ['/api/student/playground', studentId],
    enabled: !!studentId
  });

  // Initialize playground mutation
  const initPlaygroundMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest(`/api/student/playground/init/${studentId}`, {
        method: 'POST'
      });
    },
    onSuccess: () => {
      refetch();
      toast({
        title: "Achievement Playground Activated!",
        description: "Your achievements are now ready to unlock!",
      });
    }
  });

  // Update progress mutation
  const updateProgressMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest(`/api/student/playground/update/${studentId}`, {
        method: 'POST'
      });
    },
    onSuccess: (data) => {
      refetch();
      if (data.newAchievements && data.newAchievements.length > 0) {
        // Show celebration for new achievements
        data.newAchievements.forEach((achievement: any) => {
          setShowCelebration(achievement.id);
          setTimeout(() => setShowCelebration(null), 3000);
        });
        
        toast({
          title: "🎉 New Achievement Unlocked!",
          description: `Congratulations! You unlocked ${data.newAchievements.length} new achievement(s)!`,
        });
      }
    }
  });

  // Share achievement mutation
  const shareAchievementMutation = useMutation({
    mutationFn: async (achievementId: string) => {
      return await apiRequest(`/api/student/playground/share/${achievementId}`, {
        method: 'POST'
      });
    },
    onSuccess: () => {
      toast({
        title: "Achievement Shared!",
        description: "Your achievement has been shared with the school community!",
      });
    }
  });

  // Mark celebration shown mutation
  const markCelebrationMutation = useMutation({
    mutationFn: async (achievementId: string) => {
      return await apiRequest(`/api/student/playground/celebration/${achievementId}`, {
        method: 'POST'
      });
    }
  });

  // Auto-update progress every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (playgroundData) {
        updateProgressMutation.mutate();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [playgroundData]);

  if (!playgroundData) {
    return (
      <Card className={className}>
        <CardContent className="p-8 text-center">
          <div className="space-y-4">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center">
              <Trophy className="h-8 w-8 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Welcome to Achievement Playground!</h3>
              <p className="text-muted-foreground mt-2">
                Unlock badges, earn trophies, and track your progress through interactive achievements
              </p>
            </div>
            <Button 
              onClick={() => initPlaygroundMutation.mutate()}
              disabled={initPlaygroundMutation.isPending}
              data-testid="button-init-playground"
            >
              {initPlaygroundMutation.isPending ? (
                <>
                  <Sparkles className="mr-2 h-4 w-4 animate-spin" />
                  Activating...
                </>
              ) : (
                <>
                  <Unlock className="mr-2 h-4 w-4" />
                  Activate Achievement Playground
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { achievements, gamifiedProgress, summary } = playgroundData;
  
  // Filter achievements by category
  const filteredAchievements = achievements.filter((achievement: any) => {
    if (selectedCategory === 'all') return true;
    if (selectedCategory === 'unlocked') return achievement.isUnlocked;
    if (selectedCategory === 'locked') return !achievement.isUnlocked;
    return achievement.achievementType === selectedCategory;
  });

  const categories = [
    { id: 'all', label: 'All', count: achievements.length },
    { id: 'unlocked', label: 'Unlocked', count: summary.unlockedAchievements },
    { id: 'locked', label: 'Locked', count: achievements.length - summary.unlockedAchievements },
    { id: 'badge', label: 'Badges', count: achievements.filter((a: any) => a.achievementType === 'badge').length },
    { id: 'trophy', label: 'Trophies', count: achievements.filter((a: any) => a.achievementType === 'trophy').length },
    { id: 'milestone', label: 'Milestones', count: achievements.filter((a: any) => a.achievementType === 'milestone').length }
  ];

  const AchievementCard = ({ achievement }: { achievement: any }) => {
    const IconComponent = iconMap[achievement.iconType as keyof typeof iconMap] || Star;
    const isUnlocked = achievement.isUnlocked;
    const isCelebrating = showCelebration === achievement.id;
    
    return (
      <Card 
        className={cn(
          "relative overflow-hidden transition-all duration-300 hover:scale-105",
          rarityBorders[achievement.rarity as keyof typeof rarityBorders],
          isUnlocked ? "border-2" : "border opacity-60",
          isCelebrating && "animate-pulse shadow-2xl shadow-yellow-400/50"
        )}
        data-testid={`achievement-${achievement.id}`}
      >
        {/* Rarity Background Gradient */}
        <div className={cn(
          "absolute inset-0 opacity-10 bg-gradient-to-br",
          rarityColors[achievement.rarity as keyof typeof rarityColors]
        )} />
        
        {/* Celebration Sparkles */}
        {isCelebrating && (
          <div className="absolute inset-0 z-10">
            <Sparkles className="absolute top-2 right-2 h-6 w-6 text-yellow-400 animate-bounce" />
            <Sparkles className="absolute bottom-2 left-2 h-4 w-4 text-yellow-400 animate-bounce delay-300" />
          </div>
        )}

        <CardContent className="p-4 relative z-20">
          <div className="space-y-3">
            {/* Achievement Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div 
                  className={cn(
                    "p-2 rounded-full",
                    isUnlocked ? "bg-gradient-to-br text-white" : "bg-gray-200 text-gray-500",
                    isUnlocked && rarityColors[achievement.rarity as keyof typeof rarityColors]
                  )}
                >
                  {isUnlocked ? <IconComponent className="h-5 w-5" /> : <Lock className="h-5 w-5" />}
                </div>
                <Badge 
                  variant={isUnlocked ? "default" : "secondary"}
                  className={cn(
                    isUnlocked && "text-white",
                    isUnlocked && rarityColors[achievement.rarity as keyof typeof rarityColors]
                  )}
                >
                  {achievement.rarity}
                </Badge>
              </div>
              
              {isUnlocked && achievement.canShare && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => shareAchievementMutation.mutate(achievement.id)}
                  data-testid={`button-share-${achievement.id}`}
                >
                  <Share2 className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* Achievement Details */}
            <div>
              <h4 className={cn(
                "font-semibold",
                isUnlocked ? "text-foreground" : "text-muted-foreground"
              )}>
                {achievement.title}
              </h4>
              <p className={cn(
                "text-sm",
                isUnlocked ? "text-muted-foreground" : "text-muted-foreground/60"
              )}>
                {achievement.description}
              </p>
            </div>

            {/* Progress Bar */}
            {!isUnlocked && achievement.progress > 0 && (
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Progress</span>
                  <span>{achievement.progress}%</span>
                </div>
                <Progress value={achievement.progress} className="h-2" />
              </div>
            )}

            {/* Points and Level */}
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 text-yellow-500" />
                <span className={isUnlocked ? "text-foreground" : "text-muted-foreground"}>
                  {achievement.points} points
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Target className="h-4 w-4 text-blue-500" />
                <span className={isUnlocked ? "text-foreground" : "text-muted-foreground"}>
                  Level {achievement.level}
                </span>
              </div>
            </div>

            {/* Unlock Date */}
            {isUnlocked && achievement.unlockedAt && (
              <div className="text-xs text-muted-foreground">
                Unlocked: {new Date(achievement.unlockedAt).toLocaleDateString()}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header with Summary Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Achievement Playground
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{summary.unlockedAchievements}</div>
              <div className="text-sm text-muted-foreground">Unlocked</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{summary.totalPoints}</div>
              <div className="text-sm text-muted-foreground">Total Points</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{summary.totalLevels}</div>
              <div className="text-sm text-muted-foreground">Total Levels</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{summary.completionRate}%</div>
              <div className="text-sm text-muted-foreground">Complete</div>
            </div>
          </div>
          
          <div className="mt-4">
            <Button
              onClick={() => updateProgressMutation.mutate()}
              disabled={updateProgressMutation.isPending}
              variant="outline"
              size="sm"
              data-testid="button-update-progress"
            >
              {updateProgressMutation.isPending ? (
                <>
                  <BarChart3 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <TrendingUp className="mr-2 h-4 w-4" />
                  Check for New Achievements
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        {categories.map((category) => (
          <Button
            key={category.id}
            variant={selectedCategory === category.id ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory(category.id)}
            data-testid={`button-filter-${category.id}`}
          >
            {category.label} ({category.count})
          </Button>
        ))}
      </div>

      {/* Achievements Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredAchievements.map((achievement: any) => (
          <AchievementCard key={achievement.id} achievement={achievement} />
        ))}
      </div>

      {filteredAchievements.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Trophy className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No achievements found</h3>
            <p className="text-muted-foreground">
              {selectedCategory === 'unlocked' 
                ? "Keep earning PBIS points to unlock your first achievements!"
                : "Try a different category or check for new achievements."
              }
            </p>
          </CardContent>
        </Card>
      )}

      {/* Gamified Progress Skills */}
      {gamifiedProgress && gamifiedProgress.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-purple-500" />
              Skill Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {gamifiedProgress.slice(0, 8).map((skill: any) => (
                <div key={skill.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{skill.skillName}</div>
                      <div className="text-sm text-muted-foreground capitalize">
                        {skill.skillCategory} • Level {skill.currentLevel}
                      </div>
                    </div>
                    <Badge variant="outline">{skill.masteryLevel}</Badge>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>XP: {skill.currentXP}</span>
                      <span>Next: {skill.nextLevelXP}</span>
                    </div>
                    <Progress 
                      value={(skill.currentXP / skill.nextLevelXP) * 100} 
                      className="h-2"
                    />
                  </div>
                  {skill.streakDays > 0 && (
                    <div className="flex items-center gap-1 text-xs text-orange-600">
                      <Zap className="h-3 w-3" />
                      {skill.streakDays} day streak
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}