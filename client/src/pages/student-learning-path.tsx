import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useLocation } from "wouter";
import { 
  BookOpen, 
  Target, 
  Trophy, 
  TrendingUp, 
  Star, 
  Calendar,
  Brain,
  Award,
  CheckCircle2,
  Circle,
  ArrowLeft,
  BarChart3,
  Lightbulb,
  Zap,
  Heart,
  Users
} from "lucide-react";
import { isStudentAuthenticated, clearStudentAuth, maintainStudentSession } from "@/lib/studentAuth";
import logoPath from "@assets/_BHSA Mustang 1_1754780382943.png";

interface LearningPath {
  id: string;
  title: string;
  description: string;
  category: 'academic' | 'behavioral' | 'social' | 'creative';
  totalSteps: number;
  completedSteps: number;
  currentStep: string;
  estimatedCompletion: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  skills: string[];
  nextMilestone: string;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  type: 'academic' | 'behavioral' | 'attendance' | 'house';
  earnedAt: string;
  points: number;
  icon: string;
}

interface LearningGoal {
  id: string;
  title: string;
  description: string;
  category: string;
  targetValue: number;
  currentValue: number;
  unit: string;
  deadline: string;
  status: 'active' | 'completed' | 'paused';
}

export default function StudentLearningPath() {
  const [, setLocation] = useLocation();
  const [studentData, setStudentData] = useState<any>(null);
  const [selectedPath, setSelectedPath] = useState<LearningPath | null>(null);

  // Handler functions for Learning Path buttons
  const handleContinueLearning = (path: LearningPath) => {
    // Navigate based on path category to continue learning
    switch (path.category) {
      case 'academic':
        setLocation("/student-skill-tree");
        break;
      case 'behavioral':
        setLocation("/student-mood-tracker");
        break;
      case 'social':
        setLocation("/student-skill-tree");
        break;
      case 'creative':
        setLocation("/student-skill-tree");
        break;
      default:
        setLocation("/student-dashboard");
    }
  };

  const handleViewDetails = (path: LearningPath) => {
    // Show detailed information about the learning path
    alert(`Learning Path: ${path.title}\n\nDescription: ${path.description}\n\nNext Step: ${path.currentStep}\n\nSkills to Develop:\n${path.skills.join(', ')}\n\nNext Milestone: ${path.nextMilestone}`);
  };

  // Authentication check
  useEffect(() => {
    if (!isStudentAuthenticated()) {
      clearStudentAuth();
      setLocation("/student-login");
      return;
    }
    
    maintainStudentSession();
    
    const student = localStorage.getItem("studentData");
    if (student) {
      try {
        setStudentData(JSON.parse(student));
      } catch (error) {
        clearStudentAuth();
        setLocation("/student-login");
      }
    }
  }, [setLocation]);

  // Fetch student profile and academic data
  const { data: profile } = useQuery({
    queryKey: ["/api/student/profile"],
    enabled: !!studentData,
  });

  // Fetch PBIS entries for achievement tracking
  const { data: pbisEntries = [] } = useQuery({
    queryKey: ["/api/pbis-entries", studentData?.id],
    enabled: !!studentData?.id,
  });

  // Fetch progress goals
  const { data: progressGoals = [] } = useQuery({
    queryKey: ["/api/progress/goals/active"],
    enabled: !!studentData,
  });

  // HIGH MILESTONE LEARNING PATHS - Set ambitious goals to motivate scholars
  const ACADEMIC_MILESTONES = [50, 100, 200, 500, 1000];
  const BEHAVIOR_MILESTONES = [30, 75, 150, 300, 600];
  const HOUSE_MILESTONES = [100, 250, 500, 1000, 2000];

  // Generate personalized learning paths based on student data
  const generateLearningPaths = (): LearningPath[] => {
    if (!profile) return [];

    const paths: LearningPath[] = [];
    const academicPoints = profile.academicPoints || 0;
    const behaviorPoints = profile.behaviorPoints || 0;
    const attendancePoints = profile.attendancePoints || 0;
    const totalPoints = academicPoints + behaviorPoints + attendancePoints;

    // Academic Excellence Journey - HIGH MILESTONES
    const getAcademicMilestone = () => {
      const nextMilestone = ACADEMIC_MILESTONES.find(m => m > academicPoints);
      return nextMilestone || 1000;
    };
    
    const academicProgress = Math.min(academicPoints / getAcademicMilestone(), 1);
    const academicSteps = Math.floor(academicProgress * 10);
    
    if (academicPoints < 1000) {
      paths.push({
        id: 'academic-excellence',
        title: 'Academic Excellence Journey',
        description: 'Master core subjects through consistent excellence and achievement',
        category: 'academic',
        totalSteps: 10,
        completedSteps: academicSteps,
        currentStep: academicPoints < 50 ? 'Demonstrate consistent daily performance' : 
                    academicPoints < 200 ? 'Excel in challenging assignments and assessments' :
                    'Lead academic projects and mentor peers',
        estimatedCompletion: academicPoints < 100 ? '3-4 months' : academicPoints < 500 ? '6-8 months' : '1 year',
        difficulty: academicPoints < 100 ? 'beginner' : academicPoints < 500 ? 'intermediate' : 'advanced',
        skills: ['Critical Thinking', 'Research Excellence', 'Academic Leadership', 'Study Mastery'],
        nextMilestone: `Reach ${getAcademicMilestone()} academic points`
      });
    }

    // MUSTANG Character Development - HIGH STANDARDS
    const getBehaviorMilestone = () => {
      const nextMilestone = BEHAVIOR_MILESTONES.find(m => m > behaviorPoints);
      return nextMilestone || 600;
    };
    
    const behaviorProgress = Math.min(behaviorPoints / getBehaviorMilestone(), 1);
    const behaviorSteps = Math.floor(behaviorProgress * 7);
    
    if (behaviorPoints < 600) {
      paths.push({
        id: 'mustang-character',
        title: 'MUSTANG Character Development',
        description: 'Embody all MUSTANG traits and become a character role model',
        category: 'behavioral',
        totalSteps: 7,
        completedSteps: behaviorSteps,
        currentStep: behaviorPoints < 30 ? 'Practice basic MUSTANG traits daily' :
                    behaviorPoints < 150 ? 'Consistently demonstrate character excellence' :
                    'Mentor others in character development',
        estimatedCompletion: behaviorPoints < 75 ? '2-3 months' : behaviorPoints < 300 ? '4-6 months' : '8-12 months',
        difficulty: behaviorPoints < 75 ? 'beginner' : behaviorPoints < 300 ? 'intermediate' : 'advanced',
        skills: ['Character Leadership', 'Integrity', 'Empathy', 'Responsibility', 'School Pride'],
        nextMilestone: `Earn ${getBehaviorMilestone()} behavior points`
      });
    }

    // House Leadership Track - TOTAL CONTRIBUTION
    const getHouseMilestone = () => {
      const nextMilestone = HOUSE_MILESTONES.find(m => m > totalPoints);
      return nextMilestone || 2000;
    };
    
    const houseProgress = Math.min(totalPoints / getHouseMilestone(), 1);
    const houseSteps = Math.floor(houseProgress * 8);
    
    if (totalPoints < 2000) {
      paths.push({
        id: 'house-leadership',
        title: 'House Leadership Track',
        description: 'Become a champion and leader who elevates your entire house',
        category: 'social',
        totalSteps: 8,
        completedSteps: houseSteps,
        currentStep: totalPoints < 100 ? 'Contribute consistently to house success' :
                    totalPoints < 500 ? 'Take initiative in house activities' :
                    'Lead major house initiatives and mentor members',
        estimatedCompletion: totalPoints < 250 ? '4-6 months' : totalPoints < 1000 ? '8-12 months' : '1-2 years',
        difficulty: totalPoints < 250 ? 'beginner' : totalPoints < 1000 ? 'intermediate' : 'advanced',
        skills: ['House Leadership', 'Team Building', 'Mentoring', 'Strategic Thinking', 'Pride & Unity'],
        nextMilestone: `Contribute ${getHouseMilestone()} total points to your house`
      });
    }

    // STEAM Innovation Explorer - CREATIVE EXCELLENCE
    const steamProgress = Math.min(academicPoints / 300, 1);
    const steamSteps = Math.floor(steamProgress * 12);
    
    paths.push({
      id: 'steam-innovation',
      title: 'STEAM Innovation Explorer',
      description: 'Apply science, technology, engineering, arts, and math to solve real-world challenges',
      category: 'creative',
      totalSteps: 12,
      completedSteps: steamSteps,
      currentStep: academicPoints < 75 ? 'Complete foundational STEAM projects' :
                  academicPoints < 200 ? 'Design and build innovative solutions' :
                  'Lead community innovation projects',
      estimatedCompletion: academicPoints < 150 ? '6-8 months' : academicPoints < 400 ? '10-12 months' : '1-2 years',
      difficulty: academicPoints < 150 ? 'beginner' : academicPoints < 400 ? 'intermediate' : 'advanced',
      skills: ['Innovation Design', 'Problem Solving', 'Technical Skills', 'Creative Thinking', 'Project Leadership'],
      nextMilestone: academicPoints < 150 ? 'Complete first innovation project (150 academic points)' :
                    academicPoints < 400 ? 'Lead a community innovation challenge (400 academic points)' :
                    'Achieve STEAM Innovation Master status (750 academic points)'
    });

    return paths;
  };

  // Generate recent achievements from PBIS data
  const generateAchievements = (): Achievement[] => {
    const achievements: Achievement[] = [];
    
    pbisEntries.slice(0, 5).forEach((entry: any, index: number) => {
      achievements.push({
        id: entry.id,
        title: `${entry.mustangTrait} Excellence`,
        description: entry.reason,
        type: entry.category.toLowerCase(),
        earnedAt: entry.createdAt,
        points: entry.points,
        icon: getTraitIcon(entry.mustangTrait)
      });
    });

    return achievements;
  };

  // Convert progress goals to learning goals format
  const convertToLearningGoals = (): LearningGoal[] => {
    return progressGoals.map((goal: any) => ({
      id: goal.id,
      title: goal.title,
      description: goal.description || '',
      category: goal.category,
      targetValue: goal.targetValue,
      currentValue: goal.currentValue || 0,
      unit: 'points',
      deadline: goal.endDate,
      status: goal.status
    }));
  };

  const getTraitIcon = (trait: string): string => {
    const icons: { [key: string]: string } = {
      'M': '🎯', 'U': '💬', 'S': '🏫', 'T': '🤝', 'A': '⭐', 'N': '📝', 'G': '💯'
    };
    return icons[trait] || '🏆';
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'academic': return <BookOpen className="h-5 w-5" />;
      case 'behavioral': return <Heart className="h-5 w-5" />;
      case 'social': return <Users className="h-5 w-5" />;
      case 'creative': return <Lightbulb className="h-5 w-5" />;
      default: return <Star className="h-5 w-5" />;
    }
  };

  const getDifficultyColor = (difficulty: string): string => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-500';
      case 'intermediate': return 'bg-yellow-500';
      case 'advanced': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const learningPaths = generateLearningPaths();
  const achievements = generateAchievements();
  const learningGoals = convertToLearningGoals();

  if (!studentData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                onClick={() => setLocation("/student-dashboard")}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Dashboard</span>
              </Button>
              <img 
                src={logoPath} 
                alt="BHSA Mustangs Logo" 
                className="w-12 h-12 object-contain"
              />
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Learning Path Visualizer</h1>
                <p className="text-gray-600 text-sm">Your Personalized Learning Journey</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome, {studentData.name}!
          </h2>
          <p className="text-gray-600">
            Track your progress and discover new learning opportunities tailored just for you.
          </p>
        </div>

        {/* Quick Access Navigation */}
        <div className="flex justify-center mb-6">
          <Button 
            onClick={() => setLocation("/student-skill-tree")}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 shadow-lg"
          >
            <Star className="h-5 w-5" />
            <span>View Interactive Skill Tree</span>
          </Button>
        </div>

        <Tabs defaultValue="paths" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="paths" className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              Learning Paths
            </TabsTrigger>
            <TabsTrigger value="goals" className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Active Goals
            </TabsTrigger>
            <TabsTrigger value="achievements" className="flex items-center gap-2">
              <Trophy className="h-4 w-4" />
              Achievements
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Analytics
            </TabsTrigger>
          </TabsList>

          {/* Learning Paths */}
          <TabsContent value="paths" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {learningPaths.map((path) => (
                <Card 
                  key={path.id} 
                  className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => setSelectedPath(path)}
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        {getCategoryIcon(path.category)}
                        {path.title}
                      </CardTitle>
                      <Badge className={`${getDifficultyColor(path.difficulty)} text-white`}>
                        {path.difficulty}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-gray-600 text-sm">{path.description}</p>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Progress</span>
                        <span>{path.completedSteps}/{path.totalSteps} steps</span>
                      </div>
                      <Progress 
                        value={(path.completedSteps / path.totalSteps) * 100} 
                        className="h-2"
                      />
                    </div>

                    <div className="text-sm text-gray-600">
                      <p><strong>Current Step:</strong> {path.currentStep}</p>
                      <p><strong>Next Milestone:</strong> {path.nextMilestone}</p>
                      <p><strong>Est. Completion:</strong> {path.estimatedCompletion}</p>
                    </div>

                    <div className="flex flex-wrap gap-1">
                      {path.skills.map((skill) => (
                        <Badge key={skill} variant="secondary" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Active Goals */}
          <TabsContent value="goals" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {learningGoals.map((goal) => (
                <Card key={goal.id}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">{goal.title}</CardTitle>
                    <p className="text-sm text-gray-600">{goal.description}</p>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Progress</span>
                        <span>{goal.currentValue}/{goal.targetValue} {goal.unit}</span>
                      </div>
                      <Progress 
                        value={(goal.currentValue / goal.targetValue) * 100} 
                        className="h-2"
                      />
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <Badge variant={goal.status === 'active' ? 'default' : 'secondary'}>
                        {goal.status}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        Due: {new Date(goal.deadline).toLocaleDateString()}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {learningGoals.length === 0 && (
                <Card className="col-span-full">
                  <CardContent className="text-center py-8">
                    <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-600 mb-2">No Active Goals</h3>
                    <p className="text-gray-500 mb-4">Start setting learning goals to track your progress</p>
                    <Button onClick={() => setLocation("/student-mood-tracker")}>
                      Create Your First Goal
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Achievements */}
          <TabsContent value="achievements" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {achievements.map((achievement) => (
                <Card key={achievement.id} className="border-l-4 border-l-yellow-500">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="text-2xl">{achievement.icon}</div>
                        <div>
                          <h4 className="font-semibold">{achievement.title}</h4>
                          <p className="text-sm text-gray-600">{achievement.description}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="outline">+{achievement.points} pts</Badge>
                            <span className="text-xs text-gray-500">
                              {new Date(achievement.earnedAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {achievements.length === 0 && (
                <Card className="col-span-full">
                  <CardContent className="text-center py-8">
                    <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-600 mb-2">No Achievements Yet</h3>
                    <p className="text-gray-500">Keep working hard to earn your first achievement!</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Analytics */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Overall Progress Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                    Overall Progress
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Academic</span>
                        <span>{profile?.academicPoints || 0} pts</span>
                      </div>
                      <Progress value={Math.max(0, ((profile?.academicPoints || 0) + 50) / 2)} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Behavior</span>
                        <span>{profile?.behaviorPoints || 0} pts</span>
                      </div>
                      <Progress value={(profile?.behaviorPoints || 0)} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Attendance</span>
                        <span>{profile?.attendancePoints || 0} pts</span>
                      </div>
                      <Progress value={(profile?.attendancePoints || 0) * 10} className="h-2" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Learning Streak Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-blue-600" />
                    Learning Streak
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-2">7</div>
                  <p className="text-gray-600">consecutive days</p>
                  <p className="text-sm text-gray-500 mt-2">Keep it up!</p>
                </CardContent>
              </Card>

              {/* Next Milestone Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="h-5 w-5 text-purple-600" />
                    Next Milestone
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <h4 className="font-semibold mb-2">House Champion</h4>
                  <p className="text-sm text-gray-600 mb-3">Earn 50 more points to become a House Champion</p>
                  <Progress value={75} className="h-2" />
                  <p className="text-xs text-gray-500 mt-2">75% complete</p>
                </CardContent>
              </Card>
            </div>

            {/* Detailed Analytics */}
            <Card>
              <CardHeader>
                <CardTitle>Learning Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-3">Strengths</h4>
                    <ul className="space-y-2">
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <span className="text-sm">Consistent behavior points</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <span className="text-sm">Active in house activities</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <span className="text-sm">Regular goal setting</span>
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-3">Growth Areas</h4>
                    <ul className="space-y-2">
                      <li className="flex items-center gap-2">
                        <Circle className="h-4 w-4 text-yellow-600" />
                        <span className="text-sm">Academic point consistency</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Circle className="h-4 w-4 text-yellow-600" />
                        <span className="text-sm">Time management skills</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Circle className="h-4 w-4 text-yellow-600" />
                        <span className="text-sm">Peer collaboration</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Path Detail Modal */}
      {selectedPath && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  {getCategoryIcon(selectedPath.category)}
                  {selectedPath.title}
                </CardTitle>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setSelectedPath(null)}
                >
                  ×
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-gray-600">{selectedPath.description}</p>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progress</span>
                  <span>{selectedPath.completedSteps}/{selectedPath.totalSteps} steps</span>
                </div>
                <Progress 
                  value={(selectedPath.completedSteps / selectedPath.totalSteps) * 100} 
                  className="h-3"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">Details</h4>
                  <ul className="space-y-1 text-sm">
                    <li><strong>Difficulty:</strong> {selectedPath.difficulty}</li>
                    <li><strong>Duration:</strong> {selectedPath.estimatedCompletion}</li>
                    <li><strong>Category:</strong> {selectedPath.category}</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Skills You'll Develop</h4>
                  <div className="flex flex-wrap gap-1">
                    {selectedPath.skills.map((skill) => (
                      <Badge key={skill} variant="secondary" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Current Focus</h4>
                <p className="text-sm text-gray-600 mb-2">{selectedPath.currentStep}</p>
                <Alert>
                  <Lightbulb className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Next Milestone:</strong> {selectedPath.nextMilestone}
                  </AlertDescription>
                </Alert>
              </div>

              <div className="flex gap-2">
                <Button 
                  className="flex-1"
                  onClick={() => handleContinueLearning(selectedPath)}
                >
                  Continue Learning
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => handleViewDetails(selectedPath)}
                >
                  View Details
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}