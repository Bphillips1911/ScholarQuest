import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { 
  Trophy, 
  Star, 
  Award, 
  Target, 
  ArrowLeft, 
  Crown,
  Zap,
  BookOpen,
  Users,
  TrendingUp,
  Gift
} from 'lucide-react';
import { isStudentAuthenticated, clearStudentAuth, maintainStudentSession, isTeacherViewing } from '@/lib/studentAuth';

interface StudentData {
  id: string;
  name: string;
  username?: string;
  gradeLevel?: number;
}

interface AchievementData {
  id: string;
  title: string;
  description: string;
  icon: string;
  points: number;
  category: string;
  unlocked: boolean;
  unlockedAt?: string;
  progress?: number;
  maxProgress?: number;
}

export default function StudentAchievements() {
  const [, setLocation] = useLocation();
  const [studentData, setStudentData] = useState<StudentData | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    // Allow access if student is authenticated OR if teacher is viewing
    if (!isStudentAuthenticated() && !isTeacherViewing()) {
      clearStudentAuth();
      setLocation("/student-login");
      return;
    }
    
    if (isTeacherViewing()) {
      // For teacher viewing mode, get student data from URL parameters
      const urlParams = new URLSearchParams(window.location.search);
      const studentId = urlParams.get('studentId');
      const studentName = urlParams.get('studentName') || 'Student';
      
      if (studentId) {
        setStudentData({
          id: studentId,
          name: studentName,
          username: studentName.toLowerCase().replace(' ', ''),
          gradeLevel: 7 // Default grade for teacher viewing
        });
      }
    } else {
      // Normal student authentication flow
      maintainStudentSession();
      
      const student = localStorage.getItem("studentData");
      if (student) {
        try {
          setStudentData(JSON.parse(student));
        } catch (error) {
          console.error("Error parsing student data:", error);
          clearStudentAuth();
          setLocation("/student-login");
        }
      }
    }
  }, [setLocation]);

  // Fetch student's achievement data
  const { data: achievementData, isLoading } = useQuery({
    queryKey: ['/api/achievements/student', studentData?.id],
    enabled: !!studentData?.id,
  });

  // Fetch student's points data
  const { data: pointsData } = useQuery({
    queryKey: ['/api/student/profile'],
    enabled: !!studentData,
  });

  if (!studentData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Mock achievement data for now (replace with real data from API)
  const mockAchievements: AchievementData[] = [
    {
      id: '1',
      title: 'Point Pioneer',
      description: 'Earn your first 50 points',
      icon: '🏆',
      points: 10,
      category: 'points',
      unlocked: true,
      unlockedAt: '2025-09-01',
      progress: 50,
      maxProgress: 50
    },
    {
      id: '2',
      title: 'Academic Ace',
      description: 'Earn 100 academic points',
      icon: '📚',
      points: 25,
      category: 'academic',
      unlocked: false,
      progress: 75,
      maxProgress: 100
    },
    {
      id: '3',
      title: 'Attendance Champion',
      description: 'Perfect attendance for a month',
      icon: '📅',
      points: 50,
      category: 'attendance',
      unlocked: false,
      progress: 20,
      maxProgress: 30
    },
    {
      id: '4',
      title: 'Behavior Superstar',
      description: 'Earn 200 behavior points',
      icon: '⭐',
      points: 30,
      category: 'behavior',
      unlocked: true,
      unlockedAt: '2025-08-30',
      progress: 200,
      maxProgress: 200
    },
    {
      id: '5',
      title: 'House Hero',
      description: 'Help your house win a weekly competition',
      icon: '🏠',
      points: 40,
      category: 'house',
      unlocked: false,
      progress: 0,
      maxProgress: 1
    },
    {
      id: '6',
      title: 'MUSTANG Master',
      description: 'Display all MUSTANG traits in a week',
      icon: '🐎',
      points: 60,
      category: 'character',
      unlocked: false,
      progress: 5,
      maxProgress: 7
    }
  ];

  const achievements = achievementData || mockAchievements;
  const categories = [
    { id: 'all', name: 'All', icon: Trophy },
    { id: 'points', name: 'Points', icon: Star },
    { id: 'academic', name: 'Academic', icon: BookOpen },
    { id: 'attendance', name: 'Attendance', icon: Target },
    { id: 'behavior', name: 'Behavior', icon: Award },
    { id: 'house', name: 'House', icon: Users },
    { id: 'character', name: 'Character', icon: Crown }
  ];

  const filteredAchievements = selectedCategory === 'all' 
    ? achievements 
    : achievements.filter(a => a.category === selectedCategory);

  const unlockedCount = achievements.filter(a => a.unlocked).length;
  const totalPoints = achievements.filter(a => a.unlocked).reduce((sum, a) => sum + a.points, 0);
  const overallProgress = (unlockedCount / achievements.length) * 100;

  const getProgressColor = (progress: number, maxProgress: number) => {
    const percentage = (progress / maxProgress) * 100;
    if (percentage >= 100) return 'bg-green-500';
    if (percentage >= 75) return 'bg-blue-500';
    if (percentage >= 50) return 'bg-yellow-500';
    return 'bg-gray-400';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={() => setLocation('/student-dashboard')}
                className="flex items-center space-x-2"
                data-testid="button-back"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Dashboard</span>
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Achievement Playground</h1>
                <p className="text-gray-600">Track your progress and unlock rewards</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="secondary" className="flex items-center space-x-1">
                <Trophy className="h-4 w-4" />
                <span>{unlockedCount}/{achievements.length} Unlocked</span>
              </Badge>
              <Badge variant="secondary" className="flex items-center space-x-1">
                <Gift className="h-4 w-4" />
                <span>{totalPoints} Points Earned</span>
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                <span>Overall Progress</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Achievements</span>
                  <span>{unlockedCount}/{achievements.length}</span>
                </div>
                <Progress value={overallProgress} className="h-2" />
                <p className="text-xs text-gray-600">{Math.round(overallProgress)}% Complete</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center space-x-2">
                <Zap className="h-5 w-5 text-yellow-600" />
                <span>Level & XP</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-2xl font-bold">Level {Math.floor(totalPoints / 100) + 1}</span>
                  <span className="text-sm text-gray-600">{totalPoints} XP</span>
                </div>
                <Progress value={(totalPoints % 100)} className="h-2" />
                <p className="text-xs text-gray-600">{100 - (totalPoints % 100)} XP to next level</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center space-x-2">
                <Star className="h-5 w-5 text-purple-600" />
                <span>Newest Achievement</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {achievements.filter(a => a.unlocked).length > 0 ? (
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-xl">{achievements.filter(a => a.unlocked).slice(-1)[0].icon}</span>
                    <span className="font-medium">{achievements.filter(a => a.unlocked).slice(-1)[0].title}</span>
                  </div>
                  <p className="text-xs text-gray-600">
                    Unlocked {achievements.filter(a => a.unlocked).slice(-1)[0].unlockedAt}
                  </p>
                </div>
              ) : (
                <p className="text-gray-600">No achievements yet. Keep working!</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2 mb-6">
          {categories.map((category) => {
            const IconComponent = category.icon;
            return (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? "default" : "outline"}
                onClick={() => setSelectedCategory(category.id)}
                className="flex items-center space-x-2"
                data-testid={`filter-${category.id}`}
              >
                <IconComponent className="h-4 w-4" />
                <span>{category.name}</span>
              </Button>
            );
          })}
        </div>

        {/* Achievement Grid */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading achievements...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAchievements.map((achievement) => (
              <Card 
                key={achievement.id} 
                className={`relative overflow-hidden transition-all duration-300 hover:shadow-lg ${
                  achievement.unlocked 
                    ? 'border-green-200 bg-gradient-to-br from-green-50 to-emerald-50' 
                    : 'border-gray-200 bg-gradient-to-br from-gray-50 to-slate-50'
                }`}
                data-testid={`achievement-${achievement.id}`}
              >
                {achievement.unlocked && (
                  <div className="absolute top-2 right-2">
                    <Badge variant="default" className="bg-green-600">
                      <Trophy className="h-3 w-3 mr-1" />
                      Unlocked
                    </Badge>
                  </div>
                )}
                
                <CardHeader className="pb-3">
                  <div className="flex items-start space-x-3">
                    <div className={`text-3xl p-2 rounded-full ${
                      achievement.unlocked ? 'bg-green-100' : 'bg-gray-100'
                    }`}>
                      {achievement.icon}
                    </div>
                    <div className="flex-1">
                      <CardTitle className={`text-lg ${
                        achievement.unlocked ? 'text-green-800' : 'text-gray-700'
                      }`}>
                        {achievement.title}
                      </CardTitle>
                      <p className={`text-sm mt-1 ${
                        achievement.unlocked ? 'text-green-600' : 'text-gray-500'
                      }`}>
                        {achievement.description}
                      </p>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3">
                  {achievement.maxProgress && achievement.maxProgress > 1 && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Progress</span>
                        <span>{achievement.progress || 0}/{achievement.maxProgress}</span>
                      </div>
                      <Progress 
                        value={((achievement.progress || 0) / achievement.maxProgress) * 100} 
                        className="h-2"
                      />
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center">
                    <Badge variant="secondary" className="flex items-center space-x-1">
                      <Star className="h-3 w-3" />
                      <span>{achievement.points} XP</span>
                    </Badge>
                    {achievement.unlocked && achievement.unlockedAt && (
                      <span className="text-xs text-gray-500">
                        {new Date(achievement.unlockedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {filteredAchievements.length === 0 && (
          <div className="text-center py-12">
            <Trophy className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No achievements in this category yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}